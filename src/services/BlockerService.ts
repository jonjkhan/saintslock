import { PermissionStatus } from '../types/models';

export interface BlockerService {
  requestPermissions(): Promise<boolean>;
  getPermissionStatus(): Promise<PermissionStatus>;
  setBlockedApps(apps: string[]): Promise<void>;
  temporarilyUnlock(appId: string, minutes: number): Promise<void>;
  relockExpiredApps(): Promise<void>;
  isNativeBlockingAvailable(): boolean;
}

