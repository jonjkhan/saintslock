import {
  ScreenTimeSelectionSummary,
  ScreenTimeAuthorizationResult,
  ScreenTimeDiagnostics,
  ScreenTimePickerResult,
  ScreenTimeShieldResult,
} from './SaintsLockScreenTime.types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type SaintsLockScreenTimeNativeModule = {
  getDiagnostics(): Promise<ScreenTimeDiagnostics>;
  requestAuthorization(): Promise<ScreenTimeAuthorizationResult>;
  getAuthorizationStatus(): Promise<ScreenTimeAuthorizationResult>;
  presentFamilyActivityPicker(): Promise<ScreenTimePickerResult>;
  applyShield(): Promise<ScreenTimeShieldResult>;
  clearShield(): Promise<ScreenTimeShieldResult>;
  unlockForDuration(seconds: number): Promise<ScreenTimeShieldResult>;
  relockNow(): Promise<ScreenTimeShieldResult>;
};

const expectedMethodNames = [
  'getDiagnostics',
  'requestAuthorization',
  'getAuthorizationStatus',
  'presentFamilyActivityPicker',
  'applyShield',
  'clearShield',
  'unlockForDuration',
  'relockNow',
];

let nativeModule: SaintsLockScreenTimeNativeModule | null = null;
let nativeModuleLoadError: string | null = null;

try {
  nativeModule = requireNativeModule<SaintsLockScreenTimeNativeModule>('SaintsLockScreenTime');
} catch (error) {
  nativeModuleLoadError = error instanceof Error ? error.message : String(error);
  nativeModule = null;
}

const unsupported = (message: string) => ({
  ok: false as const,
  status: 'unsupported' as const,
  message,
});

export function isNativeModuleAvailable() {
  return Platform.OS === 'ios' && nativeModule !== null;
}

export function getNativeModuleDiagnostics() {
  const callableMethodNames = nativeModule
    ? expectedMethodNames.filter(
        (methodName) =>
          typeof nativeModule?.[methodName as keyof SaintsLockScreenTimeNativeModule] ===
          'function'
      )
    : [];

  return {
    moduleName: 'SaintsLockScreenTime',
    nativeModuleExists: nativeModule !== null,
    nativeModuleLoadError,
    expectedMethodNames,
    callableMethodNames,
    exportedMethodNames: nativeModule ? Object.keys(nativeModule) : [],
  };
}

export async function getDiagnostics(): Promise<ScreenTimeDiagnostics> {
  if (!nativeModule) {
    return {
      platform: Platform.OS,
      moduleLoaded: false,
      nativeScreenTimeEnabled: false,
      authorizationStatus: 'unsupported',
      hasFamilyControlsEntitlement: null,
      hasAppGroup: false,
      hasSavedSelection: false,
      selectedApplicationTokenCount: 0,
      selectedCategoryTokenCount: 0,
      selectedWebDomainTokenCount: 0,
      isShieldApplied: false,
      unlockExpiresAt: null,
      lastError: nativeModuleLoadError,
      limitation: 'SaintsLockScreenTime native module was not loaded.',
    };
  }

  return nativeModule.getDiagnostics();
}

export async function requestAuthorization(): Promise<ScreenTimeAuthorizationResult> {
  if (!nativeModule) {
    return unsupported('SaintsLock Screen Time authorization is unavailable in this build.');
  }

  return nativeModule.requestAuthorization();
}

export async function getAuthorizationStatus(): Promise<ScreenTimeAuthorizationResult> {
  if (!nativeModule) {
    return unsupported('SaintsLock Screen Time authorization status is unavailable in this build.');
  }

  return nativeModule.getAuthorizationStatus();
}

export async function presentFamilyActivityPicker(): Promise<ScreenTimePickerResult> {
  if (!nativeModule) {
    return {
      ...unsupported('FamilyActivityPicker is unavailable in this build.'),
      selection: null,
    };
  }

  return nativeModule.presentFamilyActivityPicker();
}

export async function applyShield(): Promise<ScreenTimeShieldResult> {
  if (!nativeModule) {
    return unsupported('Applying a real iOS shield is unavailable in this build.');
  }

  return nativeModule.applyShield();
}

export async function clearShield(): Promise<ScreenTimeShieldResult> {
  if (!nativeModule) {
    return unsupported('Clearing a real iOS shield is unavailable in this build.');
  }

  return nativeModule.clearShield();
}

export async function unlockForDuration(seconds: number): Promise<ScreenTimeShieldResult> {
  if (!nativeModule) {
    return unsupported('Unlocking a real iOS shield is unavailable in this build.');
  }

  return nativeModule.unlockForDuration(seconds);
}

export async function relockNow(): Promise<ScreenTimeShieldResult> {
  if (!nativeModule) {
    return unsupported('Re-applying a real iOS shield is unavailable in this build.');
  }

  return nativeModule.relockNow();
}

export type {
  ScreenTimeAuthorizationResult,
  ScreenTimeDiagnostics,
  ScreenTimePickerResult,
  ScreenTimeSelectionSummary,
  ScreenTimeShieldResult,
  ScreenTimeStubResult,
  ScreenTimeStubStatus,
} from './SaintsLockScreenTime.types';
