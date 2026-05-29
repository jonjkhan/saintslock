import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { BlockerService } from './BlockerService';
import { loadBlockerSnapshot, saveBlockerSnapshot } from './storage';
import {
  applyShield,
  clearShield,
  getAuthorizationStatus as getScreenTimeAuthorizationStatus,
  getNativeModuleDiagnostics,
  isNativeModuleAvailable,
  type ScreenTimePickerResult,
  requestAuthorization,
  presentFamilyActivityPicker,
} from '../../modules/saintslock-screen-time/src';
import { PermissionStatus } from '../types/models';

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

function getExpoExtra() {
  const constants = Constants as typeof Constants & {
    manifest?: { extra?: Record<string, unknown> };
    manifest2?: { extra?: Record<string, unknown> };
  };

  return (
    constants.expoConfig?.extra ??
    constants.manifest?.extra ??
    constants.manifest2?.extra ??
    {}
  ) as Record<string, unknown>;
}

export function isNativeScreenTimeEnabled() {
  const extra = getExpoExtra();
  const screenTimeConfig = (extra.saintsLockScreenTime ?? {}) as {
    enableNativeScreenTime?: boolean | string;
    enableDevelopmentFamilyControls?: boolean | string;
  };

  return parseRuntimeBoolean(
    extra.enableScreenTime ??
      screenTimeConfig.enableNativeScreenTime ??
      screenTimeConfig.enableDevelopmentFamilyControls ??
      process.env.EXPO_PUBLIC_SAINTSLOCK_ENABLE_SCREEN_TIME
  );
}

export function shouldUseNativeScreenTime() {
  return Platform.OS === 'ios' && isNativeScreenTimeEnabled();
}

function logNativeUnavailable(context: string) {
  const diagnostics = getScreenTimeDiagnostics();
  console.error(`[screen-time] ${context}: native module unavailable`, diagnostics);
}

export function getScreenTimeDiagnostics() {
  const extra = getExpoExtra();
  const screenTimeConfig = (extra.saintsLockScreenTime ?? {}) as Record<string, unknown>;
  const nativeDiagnostics = getNativeModuleDiagnostics();

  return {
    platform: Platform.OS,
    enableScreenTime: isNativeScreenTimeEnabled(),
    shouldUseNativeScreenTime: shouldUseNativeScreenTime(),
    extraEnableScreenTime: extra.enableScreenTime,
    extraSaintsLockScreenTime: screenTimeConfig,
    nativeModuleExists: nativeDiagnostics.nativeModuleExists,
    nativeModuleLoadError: nativeDiagnostics.nativeModuleLoadError,
    nativeModuleName: nativeDiagnostics.moduleName,
    exportedMethodNames: nativeDiagnostics.exportedMethodNames,
    expectedMethodNames: nativeDiagnostics.expectedMethodNames,
  };
}

export function formatScreenTimeDiagnostics() {
  const diagnostics = getScreenTimeDiagnostics();
  return [
    `Platform.OS: ${diagnostics.platform}`,
    `enableScreenTime: ${String(diagnostics.enableScreenTime)}`,
    `shouldUseNativeScreenTime: ${String(diagnostics.shouldUseNativeScreenTime)}`,
    `nativeModuleExists: ${String(diagnostics.nativeModuleExists)}`,
    `nativeModuleName: ${diagnostics.nativeModuleName}`,
    `exportedMethodNames: ${
      diagnostics.exportedMethodNames.length > 0
        ? diagnostics.exportedMethodNames.join(', ')
        : '(none enumerable)'
    }`,
    `expectedMethodNames: ${diagnostics.expectedMethodNames.join(', ')}`,
    diagnostics.nativeModuleLoadError
      ? `nativeModuleLoadError: ${diagnostics.nativeModuleLoadError}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
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

export class IOSScreenTimeBlockerService implements BlockerService {
  async requestPermissions() {
    if (!shouldUseNativeScreenTime()) {
      return false;
    }

    if (!isNativeModuleAvailable()) {
      logNativeUnavailable('requestPermissions');
      return false;
    }

    const result = await requestAuthorization();
    return result.status === 'approved';
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!shouldUseNativeScreenTime()) {
      return 'unsupported';
    }

    if (!isNativeModuleAvailable()) {
      logNativeUnavailable('getPermissionStatus');
      return 'unsupported';
    }

    const result = await getScreenTimeAuthorizationStatus();
    return toPermissionStatus(result.status);
  }

  async setBlockedApps(_apps: string[]) {
    if (!shouldUseNativeScreenTime()) {
      return;
    }

    if (!isNativeModuleAvailable()) {
      logNativeUnavailable('setBlockedApps');
      return;
    }

    const currentSnapshot = await loadBlockerSnapshot();
    await saveBlockerSnapshot({
      ...currentSnapshot,
      blockedApps: _apps,
    });
    await applyShield();
  }

  async temporarilyUnlock(appId: string, minutes: number) {
    if (!shouldUseNativeScreenTime()) {
      return;
    }

    if (!isNativeModuleAvailable()) {
      logNativeUnavailable('temporarilyUnlock');
      return;
    }

    const currentSnapshot = await loadBlockerSnapshot();
    const expiry = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    await saveBlockerSnapshot({
      ...currentSnapshot,
      unlockExpirations: {
        ...currentSnapshot.unlockExpirations,
        [appId]: expiry,
      },
    });

    await clearShield();
    scheduleRelock(minutes);
  }

  async relockExpiredApps() {
    if (!shouldUseNativeScreenTime()) {
      return;
    }

    if (!isNativeModuleAvailable()) {
      logNativeUnavailable('relockExpiredApps');
      return;
    }

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

    if (Object.keys(activeExpirations).length > 0) {
      await clearShield();
      scheduleRelockForEarliestExpiry(activeExpirations);
      return;
    }

    await applyShield();
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

export async function runNativeScreenTimeSetup(): Promise<{
  ok: boolean;
  message: string;
  selection?: ScreenTimePickerResult['selection'];
  diagnostics: ReturnType<typeof getScreenTimeDiagnostics>;
}> {
  const initialDiagnostics = getScreenTimeDiagnostics();
  console.log('[screen-time] setup pressed', initialDiagnostics);

  if (!shouldUseNativeScreenTime()) {
    return {
      ok: false,
      message: 'Native Screen Time support is disabled in this build.',
      diagnostics: initialDiagnostics,
    };
  }

  if (!isNativeModuleAvailable()) {
    return {
      ok: false,
      message: 'The SaintsLock Screen Time native module is unavailable in this build.',
      diagnostics: getScreenTimeDiagnostics(),
    };
  }

  console.log('[screen-time] calling getAuthorizationStatus()');
  const status = await getScreenTimeAuthorizationStatus();
  console.log('[screen-time] getAuthorizationStatus() result', status);
  if (status.status !== 'approved') {
    console.log('[screen-time] calling requestAuthorization()');
    const authorizationResult = await requestAuthorization();
    console.log('[screen-time] requestAuthorization() result', authorizationResult);
    if (authorizationResult.status !== 'approved') {
      return {
        ok: false,
        message: authorizationResult.message,
        diagnostics: getScreenTimeDiagnostics(),
      };
    }
  }

  console.log('[screen-time] calling presentFamilyActivityPicker()');
  const pickerResult = await presentFamilyActivityPicker();
  console.log('[screen-time] presentFamilyActivityPicker() result', pickerResult);
  if (pickerResult.ok) {
    console.log('[screen-time] calling applyShield()');
    const shieldResult = await applyShield();
    console.log('[screen-time] applyShield() result', shieldResult);
    if (!shieldResult.ok) {
      return {
        ok: false,
        message: shieldResult.message,
        selection: pickerResult.selection,
        diagnostics: getScreenTimeDiagnostics(),
      };
    }
  }

  return {
    ok: pickerResult.ok,
    message: pickerResult.message,
    selection: pickerResult.selection,
    diagnostics: getScreenTimeDiagnostics(),
  };
}

export const runDevelopmentFamilyControlsSetup = runNativeScreenTimeSetup;

export function shouldShowNativeScreenTimeSetup() {
  return Platform.OS === 'ios' && isNativeScreenTimeEnabled();
}

export const shouldShowDevelopmentFamilyControlsSetup = shouldShowNativeScreenTimeSetup;
