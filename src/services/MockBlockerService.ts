import { Platform } from 'react-native';

import { BlockerService } from './BlockerService';
import { loadBlockerSnapshot, saveBlockerSnapshot } from './storage';
import { PermissionStatus } from '../types/models';

export class MockBlockerService implements BlockerService {
  async requestPermissions() {
    return false;
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    return Platform.OS === 'web' ? 'unsupported' : 'unsupported';
  }

  async setBlockedApps(apps: string[]) {
    const currentSnapshot = await loadBlockerSnapshot();
    await saveBlockerSnapshot({
      ...currentSnapshot,
      blockedApps: apps,
    });
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
  }

  async relockExpiredApps() {
    const currentSnapshot = await loadBlockerSnapshot();
    const now = Date.now();

    const nextExpirations = Object.fromEntries(
      Object.entries(currentSnapshot.unlockExpirations).filter(([, expiry]) => {
        return new Date(expiry).getTime() > now;
      })
    );

    await saveBlockerSnapshot({
      ...currentSnapshot,
      unlockExpirations: nextExpirations,
    });
  }

  isNativeBlockingAvailable() {
    return false;
  }
}

export const blockerService = new MockBlockerService();

export const getMockBlockerSnapshot = async () => {
  await blockerService.relockExpiredApps();
  return loadBlockerSnapshot();
};

/*
Future native implementation notes

iOS TODO
- FamilyControls authorization flow for app/category selection.
- ManagedSettings shield configuration for blocked apps.
- DeviceActivity monitoring to detect and schedule enforcement.
- ShieldAction extension to route unlock attempts back into SaintsLock.
- App Group shared storage between app, shield extension, and monitoring extension.

Android TODO
- Usage Access permission for foreground package detection.
- Accessibility Service or a foreground service to detect blocked app launches.
- Overlay or blocking activity that presents the ritual before continuing.
- Package name mapping and unlock expiry checks tied to selected apps.
*/
