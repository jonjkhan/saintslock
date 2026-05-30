import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  applyShield,
  clearShield,
  getAuthorizationStatus as getScreenTimeAuthorizationStatus,
  getDiagnostics as getNativeScreenTimeDiagnostics,
  getNativeModuleDiagnostics,
  isNativeModuleAvailable,
  presentFamilyActivityPicker,
  relockNow,
  requestAuthorization,
  type ScreenTimeDiagnostics,
  type ScreenTimePickerResult,
  unlockForDuration,
} from '../../modules/saintslock-screen-time/src';
import type { BlockerService } from './BlockerService';
import { loadBlockerSnapshot, saveBlockerSnapshot } from './storage';
import { PermissionStatus } from '../types/models';

type RuntimeExtra = Record<string, unknown> & {
  enableScreenTime?: boolean | string;
  forceMockBlocker?: boolean | string;
  saintsLockScreenTime?: {
    enableNativeScreenTime?: boolean | string;
    enableDevelopmentFamilyControls?: boolean | string;
  };
};

type ScreenTimeSetupResult = {
  ok: boolean;
  message: string;
  nextStep?: 'chooseApps';
  selection?: ScreenTimePickerResult['selection'];
  diagnostics: Awaited<ReturnType<typeof getScreenTimeDiagnostics>>;
};

let relockTimer: ReturnType<typeof setTimeout> | null = null;

function parseRuntimeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
  }

  return false;
}

function getExpoExtra(): RuntimeExtra {
  const constants = Constants as typeof Constants & {
    manifest?: { extra?: RuntimeExtra };
    manifest2?: { extra?: RuntimeExtra };
  };

  return (
    constants.expoConfig?.extra ??
    constants.manifest?.extra ??
    constants.manifest2?.extra ??
    {}
  ) as RuntimeExtra;
}

export function isNativeScreenTimeEnabled() {
  const extra = getExpoExtra();

  return parseRuntimeBoolean(
    extra.enableScreenTime ??
      extra.saintsLockScreenTime?.enableNativeScreenTime ??
      extra.saintsLockScreenTime?.enableDevelopmentFamilyControls ??
      process.env.EXPO_PUBLIC_SAINTSLOCK_ENABLE_SCREEN_TIME
  );
}

export function isMockBlockerForced() {
  const extra = getExpoExtra();

  return parseRuntimeBoolean(
    extra.forceMockBlocker ?? process.env.EXPO_PUBLIC_SAINTSLOCK_FORCE_MOCK_BLOCKER
  );
}

export function shouldUseNativeScreenTime() {
  return Platform.OS === 'ios' && isNativeScreenTimeEnabled() && !isMockBlockerForced();
}

function toPermissionStatus(status: string): PermissionStatus {
  if (status === 'approved') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  if (status === 'notDetermined') {
    return 'notDetermined';
  }

  return 'unsupported';
}

function buildNativeUnavailableMessage() {
  const nativeDiagnostics = getNativeModuleDiagnostics();
  return [
    'Native Screen Time module is unavailable in this build.',
    nativeDiagnostics.nativeModuleLoadError
      ? `Native module load error: ${nativeDiagnostics.nativeModuleLoadError}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function ensureNativeModuleLoaded() {
  if (!isNativeModuleAvailable()) {
    const message = buildNativeUnavailableMessage();
    console.error('[screen-time] native module unavailable', getNativeModuleDiagnostics());
    throw new Error(message);
  }
}

function assertNativeResult(
  result: { ok: boolean; message: string },
  methodName: string
) {
  if (!result.ok) {
    throw new Error(`${methodName} failed: ${result.message}`);
  }
}

export async function getScreenTimeDiagnostics(includeNative = true) {
  const extra = getExpoExtra();
  const moduleDiagnostics = getNativeModuleDiagnostics();
  let nativeDiagnostics: ScreenTimeDiagnostics | null = null;
  let nativeDiagnosticsError: string | null = null;

  if (includeNative && isNativeModuleAvailable()) {
    try {
      nativeDiagnostics = await getNativeScreenTimeDiagnostics();
    } catch (error) {
      nativeDiagnosticsError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    platform: Platform.OS,
    enableScreenTime: isNativeScreenTimeEnabled(),
    forceMockBlocker: isMockBlockerForced(),
    shouldUseNativeScreenTime: shouldUseNativeScreenTime(),
    extraEnableScreenTime: extra.enableScreenTime,
    extraForceMockBlocker: extra.forceMockBlocker,
    extraSaintsLockScreenTime: extra.saintsLockScreenTime ?? {},
    nativeModuleExists: moduleDiagnostics.nativeModuleExists,
    nativeModuleLoadError: moduleDiagnostics.nativeModuleLoadError,
    nativeModuleName: moduleDiagnostics.moduleName,
    exportedMethodNames: moduleDiagnostics.exportedMethodNames,
    callableMethodNames: moduleDiagnostics.callableMethodNames,
    expectedMethodNames: moduleDiagnostics.expectedMethodNames,
    nativeDiagnostics,
    nativeDiagnosticsError,
  };
}

export async function formatScreenTimeDiagnostics() {
  const diagnostics = await getScreenTimeDiagnostics();
  return formatScreenTimeDiagnosticsSnapshot(diagnostics);
}

export function formatScreenTimeDiagnosticsSnapshot(
  diagnostics: Awaited<ReturnType<typeof getScreenTimeDiagnostics>>
) {
  const native = diagnostics.nativeDiagnostics;

  return [
    `Platform.OS: ${diagnostics.platform}`,
    `enableScreenTime: ${String(diagnostics.enableScreenTime)}`,
    `forceMockBlocker: ${String(diagnostics.forceMockBlocker)}`,
    `shouldUseNativeScreenTime: ${String(diagnostics.shouldUseNativeScreenTime)}`,
    `nativeModuleExists: ${String(diagnostics.nativeModuleExists)}`,
    `nativeModuleName: ${diagnostics.nativeModuleName}`,
    `callableMethodNames: ${
      diagnostics.callableMethodNames.length > 0
        ? diagnostics.callableMethodNames.join(', ')
        : '(none)'
    }`,
    `authorizationStatus: ${native?.authorizationStatus ?? '(native unavailable)'}`,
    `hasAppGroup: ${String(native?.hasAppGroup ?? false)}`,
    `hasSavedSelection: ${String(native?.hasSavedSelection ?? false)}`,
    `selectedApplicationTokenCount: ${native?.selectedApplicationTokenCount ?? 0}`,
    `selectedCategoryTokenCount: ${native?.selectedCategoryTokenCount ?? 0}`,
    `selectedWebDomainTokenCount: ${native?.selectedWebDomainTokenCount ?? 0}`,
    `isShieldApplied: ${String(native?.isShieldApplied ?? false)}`,
    native?.unlockExpiresAt ? `unlockExpiresAt: ${native.unlockExpiresAt}` : null,
    native?.lastError ? `lastError: ${native.lastError}` : null,
    diagnostics.nativeModuleLoadError
      ? `nativeModuleLoadError: ${diagnostics.nativeModuleLoadError}`
      : null,
    diagnostics.nativeDiagnosticsError
      ? `nativeDiagnosticsError: ${diagnostics.nativeDiagnosticsError}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export class IOSScreenTimeBlockerService implements BlockerService {
  async requestPermissions() {
    if (!shouldUseNativeScreenTime()) {
      return false;
    }

    ensureNativeModuleLoaded();
    const result = await requestAuthorization();
    return result.status === 'approved';
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!shouldUseNativeScreenTime()) {
      return 'unsupported';
    }

    ensureNativeModuleLoaded();
    const result = await getScreenTimeAuthorizationStatus();
    return toPermissionStatus(result.status);
  }

  async setBlockedApps(apps: string[]) {
    const currentSnapshot = await loadBlockerSnapshot();
    await saveBlockerSnapshot({
      ...currentSnapshot,
      blockedApps: apps,
    });

    if (!shouldUseNativeScreenTime()) {
      return;
    }

    ensureNativeModuleLoaded();
    const diagnostics = await getNativeScreenTimeDiagnostics();
    if (!diagnostics.hasSavedSelection) {
      console.warn('[screen-time] setBlockedApps skipped applyShield: no native selection');
      return;
    }

    const result = await applyShield();
    assertNativeResult(result, 'applyShield');
  }

  async temporarilyUnlock(appId: string, minutes: number) {
    const currentSnapshot = await loadBlockerSnapshot();
    const expiry = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    await saveBlockerSnapshot({
      ...currentSnapshot,
      unlockExpirations: {
        ...currentSnapshot.unlockExpirations,
        [appId]: expiry,
      },
    });

    if (!shouldUseNativeScreenTime()) {
      return;
    }

    ensureNativeModuleLoaded();
    const result = await unlockForDuration(minutes * 60);
    assertNativeResult(result, 'unlockForDuration');
    scheduleRelock(minutes);
  }

  async relockExpiredApps() {
    const currentSnapshot = await loadBlockerSnapshot();
    const now = Date.now();
    const activeExpirations = Object.fromEntries(
      Object.entries(currentSnapshot.unlockExpirations).filter(([, expiry]) => {
        return new Date(expiry).getTime() > now;
      })
    );

    await saveBlockerSnapshot({
      ...currentSnapshot,
      unlockExpirations: activeExpirations,
    });

    if (!shouldUseNativeScreenTime()) {
      return;
    }

    ensureNativeModuleLoaded();

    if (Object.keys(activeExpirations).length > 0) {
      const result = await clearShield();
      assertNativeResult(result, 'clearShield');
      scheduleRelockForEarliestExpiry(activeExpirations);
      return;
    }

    const diagnostics = await getNativeScreenTimeDiagnostics();
    if (!diagnostics.hasSavedSelection) {
      return;
    }

    const result = await relockNow();
    assertNativeResult(result, 'relockNow');
  }

  isNativeBlockingAvailable() {
    return shouldUseNativeScreenTime() && isNativeModuleAvailable();
  }
}

export const iosScreenTimeBlockerService = new IOSScreenTimeBlockerService();

function scheduleRelock(minutes: number) {
  if (relockTimer) {
    clearTimeout(relockTimer);
  }

  relockTimer = setTimeout(() => {
    void iosScreenTimeBlockerService.relockExpiredApps();
  }, minutes * 60 * 1000);
}

function scheduleRelockForEarliestExpiry(expirations: Record<string, string>) {
  const earliestExpiry = Math.min(
    ...Object.values(expirations).map((expiry) => new Date(expiry).getTime())
  );
  const delay = Math.max(0, earliestExpiry - Date.now());

  if (relockTimer) {
    clearTimeout(relockTimer);
  }

  relockTimer = setTimeout(() => {
    void iosScreenTimeBlockerService.relockExpiredApps();
  }, delay);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function setupNativeScreenTimeBlocking(): Promise<ScreenTimeSetupResult> {
  console.log('[screen-time] setup pressed', await getScreenTimeDiagnostics());

  if (!shouldUseNativeScreenTime()) {
    return {
      ok: false,
      message: 'Native Screen Time support is disabled or mock blocker is forced.',
      diagnostics: await getScreenTimeDiagnostics(),
    };
  }

  if (!isNativeModuleAvailable()) {
    return {
      ok: false,
      message: buildNativeUnavailableMessage(),
      diagnostics: await getScreenTimeDiagnostics(),
    };
  }

  try {
    console.log('[screen-time] calling getDiagnostics()');
    const beforeDiagnostics = await getNativeScreenTimeDiagnostics();
    console.log('[screen-time] getDiagnostics() result', beforeDiagnostics);

    if (beforeDiagnostics.authorizationStatus !== 'approved') {
      console.log('[screen-time] calling requestAuthorization()');
      const authorizationResult = await requestAuthorization();
      console.log('[screen-time] requestAuthorization() result', authorizationResult);

      const authorizationStatus =
        authorizationResult.authorizationStatus ?? authorizationResult.status;

      if (authorizationStatus !== 'approved') {
        return {
          ok: false,
          message: authorizationResult.message,
          diagnostics: {
            ...(await getScreenTimeDiagnostics(false)),
            nativeDiagnostics: null,
            nativeDiagnosticsError: authorizationResult.error ?? null,
          },
        };
      }

      return {
        ok: false,
        nextStep: 'chooseApps',
        message:
          'Screen Time access is approved. Tap Set up app blocking again to choose apps.',
        diagnostics: {
          ...(await getScreenTimeDiagnostics(false)),
          nativeDiagnostics: {
            ...beforeDiagnostics,
            authorizationStatus: 'approved',
            lastError: null,
          },
        },
      };
    }

    await delay(700);
    console.log('[screen-time] calling presentFamilyActivityPicker()');
    const pickerResult = await presentFamilyActivityPicker();
    console.log('[screen-time] presentFamilyActivityPicker() result', pickerResult);

    if (!pickerResult.ok) {
      return {
        ok: false,
        message: pickerResult.message,
        selection: pickerResult.selection,
        diagnostics: await getScreenTimeDiagnostics(),
      };
    }

    console.log('[screen-time] calling applyShield()');
    const shieldResult = await applyShield();
    console.log('[screen-time] applyShield() result', shieldResult);

    if (!shieldResult.ok) {
      return {
        ok: false,
        message: shieldResult.message,
        selection: pickerResult.selection,
        diagnostics: await getScreenTimeDiagnostics(),
      };
    }

    return {
      ok: true,
      message: shieldResult.message,
      selection: pickerResult.selection,
      diagnostics: await getScreenTimeDiagnostics(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[screen-time] native setup failed', error);

    return {
      ok: false,
      message,
      diagnostics: await getScreenTimeDiagnostics(),
    };
  }
}

export const runNativeScreenTimeSetup = setupNativeScreenTimeBlocking;
export const runDevelopmentFamilyControlsSetup = setupNativeScreenTimeBlocking;

export function shouldShowNativeScreenTimeSetup() {
  return Platform.OS === 'ios' && isNativeScreenTimeEnabled();
}

export const shouldShowDevelopmentFamilyControlsSetup = shouldShowNativeScreenTimeSetup;
