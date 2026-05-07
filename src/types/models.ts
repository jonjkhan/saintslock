export type RitualDurationSeconds = 30 | 60 | 90;
export type UnlockWindowMinutes = 5 | 10 | 15 | 30;
export type RitualContentType = 'scripture' | 'prayer' | 'reflection';
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'notDetermined'
  | 'unsupported';

export interface UserSettings {
  selectedApps: string[];
  ritualDurationSeconds: RitualDurationSeconds;
  unlockWindowMinutes: UnlockWindowMinutes;
  strictModeEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface DailyStats {
  dateKey: string;
  completedRituals: number;
  bypassesUsed: number;
}

export interface LifetimeStats {
  totalRituals: number;
  currentStreak: number;
  lastCompletedDateKey: string | null;
}

export interface SubscriptionState {
  isPremium: boolean;
  entitlementCheckedAt: string | null;
}

export interface RitualContentItem {
  id: string;
  type: RitualContentType;
  title: string;
  text: string;
  reference?: string;
  attribution?: string;
}

export interface MockBlockerSnapshot {
  blockedApps: string[];
  unlockExpirations: Record<string, string>;
}

export interface AppLimits {
  maxSelectedApps: number;
  maxDailyRituals: number;
  maxDailyBypasses: number;
  allowedDurations: RitualDurationSeconds[];
  allowedUnlockWindows: UnlockWindowMinutes[];
}

export interface ActionResult {
  ok: boolean;
  reason?: 'paywall' | 'limit' | 'config' | 'validation';
  message?: string;
}
