import { AppLimits, RitualDurationSeconds, UnlockWindowMinutes, UserSettings } from '../types/models';
import { todayDateKey } from '../utils/date';

export const DISTRACTING_APPS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Snapchat',
  'Reddit',
  'X',
  'Browser',
  'Other',
];

export const RITUAL_LENGTH_OPTIONS: RitualDurationSeconds[] = [30, 60, 90];
export const UNLOCK_WINDOW_OPTIONS: UnlockWindowMinutes[] = [5, 10, 15, 30];

export const FREE_LIMITS: AppLimits = {
  maxSelectedApps: 1,
  maxDailyRituals: 3,
  maxDailyBypasses: 1,
  allowedDurations: [30, 60],
  allowedUnlockWindows: [5, 10, 15],
};

export const PREMIUM_LIMITS: AppLimits = {
  maxSelectedApps: Number.MAX_SAFE_INTEGER,
  maxDailyRituals: Number.MAX_SAFE_INTEGER,
  maxDailyBypasses: 3,
  allowedDurations: [30, 60, 90],
  allowedUnlockWindows: [5, 10, 15, 30],
};

export const DEFAULT_SETTINGS: UserSettings = {
  selectedApps: [],
  ritualDurationSeconds: 30,
  unlockWindowMinutes: 10,
  strictModeEnabled: false,
  hasCompletedOnboarding: false,
};

export const DEFAULT_DAILY_STATS = () => ({
  dateKey: todayDateKey(),
  completedRituals: 0,
  bypassesUsed: 0,
});

export const DEFAULT_LIFETIME_STATS = {
  totalRituals: 0,
  currentStreak: 0,
  lastCompletedDateKey: null,
};

export const DEFAULT_SUBSCRIPTION = {
  isPremium: false,
  entitlementCheckedAt: null,
};

export const getPlanLimits = (isPremium: boolean) =>
  isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

