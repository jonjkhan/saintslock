import {
  ScreenTimeSelectionSummary,
  ScreenTimeAuthorizationResult,
  ScreenTimePickerResult,
  ScreenTimeShieldResult,
} from './SaintsLockScreenTime.types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type SaintsLockScreenTimeNativeModule = {
  requestAuthorization(): Promise<ScreenTimeAuthorizationResult>;
  getAuthorizationStatus(): Promise<ScreenTimeAuthorizationResult>;
  presentFamilyActivityPicker(): Promise<ScreenTimePickerResult>;
  applyShield(): Promise<ScreenTimeShieldResult>;
  clearShield(): Promise<ScreenTimeShieldResult>;
};

let nativeModule: SaintsLockScreenTimeNativeModule | null = null;

try {
  nativeModule = requireNativeModule<SaintsLockScreenTimeNativeModule>('SaintsLockScreenTime');
} catch {
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

export type {
  ScreenTimeAuthorizationResult,
  ScreenTimePickerResult,
  ScreenTimeSelectionSummary,
  ScreenTimeShieldResult,
  ScreenTimeStubResult,
  ScreenTimeStubStatus,
} from './SaintsLockScreenTime.types';
