import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { BlockerService } from './BlockerService';
import {
  applyShield,
  clearShield,
  getAuthorizationStatus as getScreenTimeAuthorizationStatus,
  isNativeModuleAvailable,
  type ScreenTimePickerResult,
  requestAuthorization,
  presentFamilyActivityPicker,
} from '../../modules/saintslock-screen-time/src';
import { PermissionStatus } from '../types/models';

function isDevelopmentFamilyControlsEnabled() {
  const screenTimeConfig =
    (Constants.expoConfig?.extra?.saintsLockScreenTime as
      | { enableDevelopmentFamilyControls?: boolean }
      | undefined) ?? undefined;

  return Platform.OS === 'ios' && Boolean(screenTimeConfig?.enableDevelopmentFamilyControls);
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
    if (!this.isNativeBlockingAvailable()) {
      return false;
    }

    const result = await requestAuthorization();
    return result.status === 'approved';
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (!this.isNativeBlockingAvailable()) {
      return 'unsupported';
    }

    const result = await getScreenTimeAuthorizationStatus();
    return toPermissionStatus(result.status);
  }

  async setBlockedApps(_apps: string[]) {
    if (!this.isNativeBlockingAvailable()) {
      return;
    }

    await clearShield();
  }

  async temporarilyUnlock(_appId: string, _minutes: number) {
    if (!this.isNativeBlockingAvailable()) {
      return;
    }

    await clearShield();
  }

  async relockExpiredApps() {
    if (!this.isNativeBlockingAvailable()) {
      return;
    }

    await applyShield();
  }

  isNativeBlockingAvailable() {
    return isDevelopmentFamilyControlsEnabled() && isNativeModuleAvailable();
  }
}

export const iosScreenTimeBlockerService = new IOSScreenTimeBlockerService();

export async function runDevelopmentFamilyControlsSetup(): Promise<{
  ok: boolean;
  message: string;
  selection?: ScreenTimePickerResult['selection'];
}> {
  if (!isDevelopmentFamilyControlsEnabled()) {
    return {
      ok: false,
      message: 'Family Controls development support is disabled in this build.',
    };
  }

  if (!isNativeModuleAvailable()) {
    return {
      ok: false,
      message: 'The SaintsLock Screen Time native module is unavailable in this build.',
    };
  }

  const status = await getScreenTimeAuthorizationStatus();
  if (status.status !== 'approved') {
    const authorizationResult = await requestAuthorization();
    if (authorizationResult.status !== 'approved') {
      return {
        ok: false,
        message: authorizationResult.message,
      };
    }
  }

  const pickerResult = await presentFamilyActivityPicker();
  return {
    ok: pickerResult.ok,
    message: pickerResult.message,
    selection: pickerResult.selection,
  };
}

export function shouldShowDevelopmentFamilyControlsSetup() {
  return isDevelopmentFamilyControlsEnabled() && isNativeModuleAvailable();
}
