import {
  ScreenTimeAuthorizationResult,
  ScreenTimePickerResult,
  ScreenTimeShieldResult,
} from './SaintsLockScreenTime.types';

const unsupported = (message: string) => ({
  ok: false as const,
  status: 'unsupported' as const,
  message,
});

export async function requestAuthorization(): Promise<ScreenTimeAuthorizationResult> {
  return unsupported('SaintsLock Screen Time authorization is not implemented in Phase 1.');
}

export async function getAuthorizationStatus(): Promise<ScreenTimeAuthorizationResult> {
  return unsupported('SaintsLock Screen Time authorization status is not implemented in Phase 1.');
}

export async function presentFamilyActivityPicker(): Promise<ScreenTimePickerResult> {
  return {
    ...unsupported('FamilyActivityPicker is not implemented in Phase 1.'),
    selection: null,
  };
}

export async function applyShield(): Promise<ScreenTimeShieldResult> {
  return unsupported('Applying a real iOS shield is not implemented in Phase 1.');
}

export async function clearShield(): Promise<ScreenTimeShieldResult> {
  return unsupported('Clearing a real iOS shield is not implemented in Phase 1.');
}

export type {
  ScreenTimeAuthorizationResult,
  ScreenTimePickerResult,
  ScreenTimeShieldResult,
  ScreenTimeStubResult,
  ScreenTimeStubStatus,
} from './SaintsLockScreenTime.types';
