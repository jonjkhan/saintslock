import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_DAILY_STATS,
  DEFAULT_LIFETIME_STATS,
  DEFAULT_SETTINGS,
  DEFAULT_SUBSCRIPTION,
  getPlanLimits,
} from '../constants/options';
import { trackEvent } from '../services/analytics';
import { blockerService, getMockBlockerSnapshot } from '../services/MockBlockerService';
import {
  loadDailyStats,
  loadLifetimeStats,
  loadSettings,
  loadSubscriptionState,
  saveDailyStats,
  saveLifetimeStats,
  saveSettings,
  saveSubscriptionState,
} from '../services/storage';
import {
  configurePurchases,
  purchaseMonthly,
  refreshCustomerInfo,
  restorePurchases,
} from '../services/subscription';
import {
  ActionResult,
  AppLimits,
  DailyStats,
  LifetimeStats,
  MockBlockerSnapshot,
  SubscriptionState,
  UserSettings,
} from '../types/models';
import { normalizeDailyStats, updateLifetimeForCompletion } from '../utils/date';

interface AppContextState {
  isReady: boolean;
  settings: UserSettings;
  dailyStats: DailyStats;
  lifetimeStats: LifetimeStats;
  subscription: SubscriptionState;
  blockerSnapshot: MockBlockerSnapshot;
  selectedDemoApp: string | null;
}

interface AppContextValue {
  state: AppContextState;
  limits: AppLimits;
  usage: {
    ritualsCompletedToday: number;
    bypassesUsedToday: number;
    ritualsRemaining: number | null;
    bypassesRemaining: number;
  };
  isPremium: boolean;
  actions: {
    startOnboarding: () => Promise<void>;
    selectApps: (apps: string[]) => Promise<ActionResult>;
    updateRitualDuration: (seconds: 30 | 60 | 90) => Promise<ActionResult>;
    updateUnlockWindow: (minutes: 5 | 10 | 15 | 30) => Promise<ActionResult>;
    setStrictModeEnabled: (enabled: boolean) => Promise<ActionResult>;
    finishOnboarding: () => Promise<void>;
    completeRitual: (appId: string) => Promise<ActionResult>;
    useBypass: (appId: string) => Promise<ActionResult>;
    purchasePremium: () => Promise<ActionResult>;
    restorePremium: () => Promise<ActionResult>;
    resetTodayStats: () => Promise<void>;
    refreshBlockerSnapshot: () => Promise<void>;
    selectDemoApp: (appId: string) => void;
  };
}

const initialState: AppContextState = {
  isReady: false,
  settings: DEFAULT_SETTINGS,
  dailyStats: DEFAULT_DAILY_STATS(),
  lifetimeStats: DEFAULT_LIFETIME_STATS,
  subscription: DEFAULT_SUBSCRIPTION,
  blockerSnapshot: {
    blockedApps: [],
    unlockExpirations: {},
  },
  selectedDemoApp: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppContextState>(initialState);
  const stateRef = useRef<AppContextState>(initialState);

  const commitState = (nextState: AppContextState) => {
    stateRef.current = nextState;
    setState(nextState);
  };

  const syncBlockerSnapshot = async () => {
    const snapshot = await getMockBlockerSnapshot();
    const current = stateRef.current;
    commitState({
      ...current,
      blockerSnapshot: snapshot,
    });
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      await configurePurchases();

      const [settings, dailyStats, lifetimeStats, subscription] = await Promise.all([
        loadSettings(),
        loadDailyStats(),
        loadLifetimeStats(),
        loadSubscriptionState(),
      ]);

      const nextSubscription = await refreshCustomerInfo(subscription);
      const nextDailyStats = normalizeDailyStats(dailyStats);

      await blockerService.setBlockedApps(settings.selectedApps);
      const blockerSnapshot = await getMockBlockerSnapshot();

      if (!mounted) {
        return;
      }

      commitState({
        isReady: true,
        settings,
        dailyStats: nextDailyStats,
        lifetimeStats,
        subscription: nextSubscription,
        blockerSnapshot,
        selectedDemoApp: settings.selectedApps[0] ?? null,
      });
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    void saveSettings(state.settings).catch(() => undefined);
  }, [state.isReady, state.settings]);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    void saveDailyStats(state.dailyStats).catch(() => undefined);
  }, [state.isReady, state.dailyStats]);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    void saveLifetimeStats(state.lifetimeStats).catch(() => undefined);
  }, [state.isReady, state.lifetimeStats]);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    void saveSubscriptionState(state.subscription).catch(() => undefined);
  }, [state.isReady, state.subscription]);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    const normalized = normalizeDailyStats(state.dailyStats);
    if (normalized.dateKey !== state.dailyStats.dateKey) {
      commitState({
        ...stateRef.current,
        dailyStats: normalized,
      });
    }
  }, [state.isReady, state.dailyStats.dateKey]);

  const isPremium = state.subscription.isPremium;
  const limits = getPlanLimits(isPremium);
  const usage = {
    ritualsCompletedToday: state.dailyStats.completedRituals,
    bypassesUsedToday: state.dailyStats.bypassesUsed,
    ritualsRemaining: isPremium
      ? null
      : Math.max(0, limits.maxDailyRituals - state.dailyStats.completedRituals),
    bypassesRemaining: Math.max(0, limits.maxDailyBypasses - state.dailyStats.bypassesUsed),
  };

  const actions = {
    startOnboarding: async () => {
      await trackEvent('onboarding_started');
    },
    selectApps: async (apps: string[]): Promise<ActionResult> => {
      const uniqueApps = Array.from(new Set(apps));
      const current = stateRef.current;
      const planLimits = getPlanLimits(current.subscription.isPremium);

      if (uniqueApps.length > planLimits.maxSelectedApps) {
        return {
          ok: false,
          reason: 'paywall',
          message: 'Premium unlocks unlimited app locks.',
        };
      }

      commitState({
        ...current,
        settings: {
          ...current.settings,
          selectedApps: uniqueApps,
        },
        selectedDemoApp: uniqueApps.includes(current.selectedDemoApp ?? '')
          ? current.selectedDemoApp
          : uniqueApps[0] ?? null,
      });
      await blockerService.setBlockedApps(uniqueApps);
      await syncBlockerSnapshot();
      await trackEvent('app_selected', {
        selectedCount: uniqueApps.length,
      });
      await trackEvent('settings_updated', {
        field: 'selectedApps',
        selectedCount: uniqueApps.length,
      });

      return { ok: true };
    },
    updateRitualDuration: async (seconds: 30 | 60 | 90): Promise<ActionResult> => {
      const current = stateRef.current;
      const planLimits = getPlanLimits(current.subscription.isPremium);

      if (!planLimits.allowedDurations.includes(seconds)) {
        return {
          ok: false,
          reason: 'paywall',
          message: 'Premium unlocks the 90 second ritual.',
        };
      }

      commitState({
        ...current,
        settings: {
          ...current.settings,
          ritualDurationSeconds: seconds,
        },
      });
      await trackEvent('settings_updated', {
        field: 'ritualDurationSeconds',
        value: seconds,
      });

      return { ok: true };
    },
    updateUnlockWindow: async (
      minutes: 5 | 10 | 15 | 30
    ): Promise<ActionResult> => {
      const current = stateRef.current;
      const planLimits = getPlanLimits(current.subscription.isPremium);

      if (!planLimits.allowedUnlockWindows.includes(minutes)) {
        return {
          ok: false,
          reason: 'paywall',
          message: 'Premium unlocks the 30 minute window.',
        };
      }

      commitState({
        ...current,
        settings: {
          ...current.settings,
          unlockWindowMinutes: minutes,
        },
      });
      await trackEvent('settings_updated', {
        field: 'unlockWindowMinutes',
        value: minutes,
      });

      return { ok: true };
    },
    setStrictModeEnabled: async (enabled: boolean): Promise<ActionResult> => {
      const current = stateRef.current;
      if (enabled && !current.subscription.isPremium) {
        return {
          ok: false,
          reason: 'paywall',
          message: 'Strict Mode is part of Premium.',
        };
      }

      commitState({
        ...current,
        settings: {
          ...current.settings,
          strictModeEnabled: enabled,
        },
      });
      await trackEvent('settings_updated', {
        field: 'strictModeEnabled',
        value: enabled,
      });

      return { ok: true };
    },
    finishOnboarding: async () => {
      const current = stateRef.current;
      commitState({
        ...current,
        settings: {
          ...current.settings,
          hasCompletedOnboarding: true,
        },
      });
      await trackEvent('onboarding_completed', {
        selectedCount: current.settings.selectedApps.length,
      });
    },
    completeRitual: async (appId: string): Promise<ActionResult> => {
      const current = stateRef.current;
      const normalizedDaily = normalizeDailyStats(current.dailyStats);
      const planLimits = getPlanLimits(current.subscription.isPremium);

      if (normalizedDaily.completedRituals >= planLimits.maxDailyRituals) {
        commitState({
          ...current,
          dailyStats: normalizedDaily,
        });
        return {
          ok: false,
          reason: 'paywall',
          message:
            'Keep your rule of life going. Premium unlocks unlimited app locks and daily prayer pauses.',
        };
      }

      const nextDaily = {
        ...normalizedDaily,
        completedRituals: normalizedDaily.completedRituals + 1,
      };
      const nextLifetime = updateLifetimeForCompletion(
        current.lifetimeStats,
        nextDaily.dateKey
      );

      commitState({
        ...current,
        dailyStats: nextDaily,
        lifetimeStats: nextLifetime,
      });

      await blockerService.temporarilyUnlock(appId, current.settings.unlockWindowMinutes);
      await syncBlockerSnapshot();
      await trackEvent('ritual_completed', {
        appId,
        unlockWindowMinutes: current.settings.unlockWindowMinutes,
        ritualDurationSeconds: current.settings.ritualDurationSeconds,
      });

      return {
        ok: true,
        message: `Unlocked for ${current.settings.unlockWindowMinutes} minutes. Go with peace.`,
      };
    },
    useBypass: async (appId: string): Promise<ActionResult> => {
      const current = stateRef.current;
      const normalizedDaily = normalizeDailyStats(current.dailyStats);
      const planLimits = getPlanLimits(current.subscription.isPremium);

      if (normalizedDaily.bypassesUsed >= planLimits.maxDailyBypasses) {
        commitState({
          ...current,
          dailyStats: normalizedDaily,
        });

        return current.subscription.isPremium
          ? {
              ok: false,
              reason: 'limit',
              message: "You have used today's bypasses.",
            }
          : {
              ok: false,
              reason: 'paywall',
              message: 'Premium offers more room when you genuinely need a bypass.',
            };
      }

      const nextDaily = {
        ...normalizedDaily,
        bypassesUsed: normalizedDaily.bypassesUsed + 1,
      };

      commitState({
        ...current,
        dailyStats: nextDaily,
      });

      await blockerService.temporarilyUnlock(appId, current.settings.unlockWindowMinutes);
      await syncBlockerSnapshot();
      await trackEvent('bypass_used', {
        appId,
        bypassesUsedToday: nextDaily.bypassesUsed,
      });

      return {
        ok: true,
        message: 'Bypassed. Come back when you can.',
      };
    },
    purchasePremium: async (): Promise<ActionResult> => {
      await trackEvent('purchase_started');
      const result = await purchaseMonthly();

      if (!result.success) {
        return {
          ok: false,
          reason: 'config',
          message: result.message,
        };
      }

      const current = stateRef.current;
      commitState({
        ...current,
        subscription: {
          isPremium: result.isPremium,
          entitlementCheckedAt: new Date().toISOString(),
        },
      });
      await trackEvent('purchase_completed');

      return {
        ok: true,
        message: result.message,
      };
    },
    restorePremium: async (): Promise<ActionResult> => {
      await trackEvent('restore_purchases_pressed');
      const result = await restorePurchases();

      if (!result.success) {
        return {
          ok: false,
          reason: 'config',
          message: result.message,
        };
      }

      const current = stateRef.current;
      commitState({
        ...current,
        subscription: {
          isPremium: result.isPremium,
          entitlementCheckedAt: new Date().toISOString(),
        },
      });

      return {
        ok: true,
        message: result.message,
      };
    },
    resetTodayStats: async () => {
      const current = stateRef.current;
      commitState({
        ...current,
        dailyStats: DEFAULT_DAILY_STATS(),
      });
    },
    refreshBlockerSnapshot: async () => {
      await syncBlockerSnapshot();
    },
    selectDemoApp: (appId: string) => {
      const current = stateRef.current;
      commitState({
        ...current,
        selectedDemoApp: appId,
      });
    },
  };

  return (
    <AppContext.Provider value={{ state, limits, usage, isPremium, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}
