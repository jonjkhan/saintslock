import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DAILY_STATS,
  DEFAULT_LIFETIME_STATS,
  DEFAULT_SETTINGS,
  DEFAULT_SUBSCRIPTION,
} from '../constants/options';
import {
  DailyStats,
  LifetimeStats,
  MockBlockerSnapshot,
  SubscriptionState,
  UserSettings,
} from '../types/models';

const STORAGE_KEYS = {
  settings: 'saintslock:user-settings',
  dailyStats: 'saintslock:daily-stats',
  lifetimeStats: 'saintslock:lifetime-stats',
  subscription: 'saintslock:subscription',
  blockerSnapshot: 'saintslock:blocker-snapshot',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return { ...fallback, ...JSON.parse(rawValue) } as T;
  } catch (error) {
    console.warn(`[storage] Failed to read ${key}`, error);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] Failed to write ${key}`, error);
    throw error;
  }
}

export const loadSettings = () => readJson<UserSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

export const saveSettings = (settings: UserSettings) =>
  writeJson(STORAGE_KEYS.settings, settings);

export const loadDailyStats = () =>
  readJson<DailyStats>(STORAGE_KEYS.dailyStats, DEFAULT_DAILY_STATS());

export const saveDailyStats = (dailyStats: DailyStats) =>
  writeJson(STORAGE_KEYS.dailyStats, dailyStats);

export const loadLifetimeStats = () =>
  readJson<LifetimeStats>(STORAGE_KEYS.lifetimeStats, DEFAULT_LIFETIME_STATS);

export const saveLifetimeStats = (lifetimeStats: LifetimeStats) =>
  writeJson(STORAGE_KEYS.lifetimeStats, lifetimeStats);

export const loadSubscriptionState = () =>
  readJson<SubscriptionState>(STORAGE_KEYS.subscription, DEFAULT_SUBSCRIPTION);

export const saveSubscriptionState = (subscription: SubscriptionState) =>
  writeJson(STORAGE_KEYS.subscription, subscription);

export const loadBlockerSnapshot = () =>
  readJson<MockBlockerSnapshot>(STORAGE_KEYS.blockerSnapshot, {
    blockedApps: [],
    unlockExpirations: {},
  });

export const saveBlockerSnapshot = (snapshot: MockBlockerSnapshot) =>
  writeJson(STORAGE_KEYS.blockerSnapshot, snapshot);

