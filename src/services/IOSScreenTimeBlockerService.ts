import { Platform } from 'react-native';

import type { BlockerService } from './BlockerService';
import {
  applyShield,
  clearShield,
  getAuthorizationStatus as getScreenTimeAuthorizationStatus,
  requestAuthorization,
} from '../../modules/saintslock-screen-time/src';
import { PermissionStatus } from '../types/models';

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
    if (Platform.OS !== 'ios') {
      return false;
    }

    const result = await requestAuthorization();
    return result.status === 'approved';
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (Platform.OS !== 'ios') {
      return 'unsupported';
    }

    const result = await getScreenTimeAuthorizationStatus();
    return toPermissionStatus(result.status);
  }

  async setBlockedApps(_apps: string[]) {
    if (Platform.OS !== 'ios') {
      return;
    }

    await clearShield();
  }

  async temporarilyUnlock(_appId: string, _minutes: number) {
    if (Platform.OS !== 'ios') {
      return;
    }

    await clearShield();
  }

  async relockExpiredApps() {
    if (Platform.OS !== 'ios') {
      return;
    }

    await applyShield();
  }

  isNativeBlockingAvailable() {
    return false;
  }
}

export const iosScreenTimeBlockerService = new IOSScreenTimeBlockerService();
