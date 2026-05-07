import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '../components/ScreenShell';
import { useAppContext } from '../context/AppContext';
import { trackEvent } from '../services/analytics';
import { colors, spacing, typography } from '../theme/tokens';
import { RitualContentItem } from '../types/models';
import { pickRandomRitualContent } from '../utils/ritual';
import { AppSelectionScreen } from '../screens/AppSelectionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LockRitualScreen } from '../screens/LockRitualScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { RitualLengthScreen } from '../screens/RitualLengthScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { UnlockWindowScreen } from '../screens/UnlockWindowScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

type ScreenName =
  | 'loading'
  | 'welcome'
  | 'appSelection'
  | 'ritualLength'
  | 'unlockWindow'
  | 'home'
  | 'ritual'
  | 'settings';

interface PaywallState {
  headline: string;
  feedbackMessage?: string | null;
}

export function SaintsLockApp() {
  const { state, isPremium, usage, actions } = useAppContext();
  const [screen, setScreen] = useState<ScreenName>('loading');
  const [paywall, setPaywall] = useState<PaywallState | null>(null);
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [homeBannerMessage, setHomeBannerMessage] = useState<string | null>(null);
  const [ritualSession, setRitualSession] = useState<{
    appId: string;
    contentItem: RitualContentItem;
  } | null>(null);
  const [lastContentId, setLastContentId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    if (!state.settings.hasCompletedOnboarding) {
      if (screen === 'loading') {
        setScreen('welcome');
      }
      return;
    }

    if (screen === 'loading' || screen === 'welcome' || screen === 'appSelection') {
      setScreen('home');
    }
  }, [screen, state.isReady, state.settings.hasCompletedOnboarding]);

  useEffect(() => {
    if (screen === 'home') {
      void actions.refreshBlockerSnapshot();
    }
  }, [screen]);

  const openPaywall = async (headline: string, feedbackMessage?: string | null) => {
    await trackEvent('paywall_viewed', {
      headline,
    });
    setPaywall({
      headline,
      feedbackMessage,
    });
  };

  const handleToggleApp = async (appName: string) => {
    const nextApps = state.settings.selectedApps.includes(appName)
      ? state.settings.selectedApps.filter((currentApp) => currentApp !== appName)
      : [...state.settings.selectedApps, appName];
    const result = await actions.selectApps(nextApps);

    if (!result.ok && result.reason === 'paywall') {
      await openPaywall(
        'Keep your rule of life going.',
        result.message ?? 'Premium unlocks unlimited app locks and daily prayer pauses.'
      );
    }
  };

  const handleSelectDuration = async (duration: 30 | 60 | 90) => {
    const result = await actions.updateRitualDuration(duration);

    if (!result.ok && result.reason === 'paywall') {
      await openPaywall('Keep your rule of life going.', result.message);
    }
  };

  const handleSelectUnlockWindow = async (minutes: 5 | 10 | 15 | 30) => {
    const result = await actions.updateUnlockWindow(minutes);

    if (!result.ok && result.reason === 'paywall') {
      await openPaywall('Keep your rule of life going.', result.message);
    }
  };

  const handleStartRitual = async () => {
    if (!state.selectedDemoApp) {
      return;
    }

    if (!isPremium && usage.ritualsRemaining === 0) {
      await openPaywall(
        'Keep your rule of life going.',
        'Premium unlocks unlimited app locks and daily prayer pauses.'
      );
      return;
    }

    const contentItem = pickRandomRitualContent(lastContentId);
    setLastContentId(contentItem.id);
    setRitualSession({
      appId: state.selectedDemoApp,
      contentItem,
    });
    setHomeBannerMessage(null);
    setScreen('ritual');
    await trackEvent('ritual_started', {
      appId: state.selectedDemoApp,
    });
  };

  const handleCompleteRitual = async () => {
    if (!ritualSession) {
      return { ok: false };
    }

    const result = await actions.completeRitual(ritualSession.appId);
    if (!result.ok && result.reason === 'paywall') {
      await openPaywall('Keep your rule of life going.', result.message);
      return { ok: false };
    }

    setHomeBannerMessage(result.message ?? 'Unlocked. Go with peace.');
    return result;
  };

  const handleBypass = async () => {
    if (!ritualSession) {
      return { ok: false };
    }

    if (!isPremium && usage.bypassesRemaining === 0) {
      await openPaywall(
        'Keep your rule of life going.',
        'Premium offers more room when you genuinely need a bypass.'
      );
      return { ok: false };
    }

    const result = await actions.useBypass(ritualSession.appId);
    if (!result.ok && result.reason === 'paywall') {
      await openPaywall('Keep your rule of life going.', result.message);
      return { ok: false };
    }

    setHomeBannerMessage(result.message ?? null);
    return result;
  };

  const handleCloseRitual = () => {
    setRitualSession(null);
    setScreen('home');
  };

  const handleStartPremium = async () => {
    setPaywallLoading(true);
    const result = await actions.purchasePremium();
    setPaywallLoading(false);

    if (result.ok) {
      setHomeBannerMessage(result.message ?? 'Premium unlocked.');
      setPaywall(null);
      return;
    }

    setPaywall((currentPaywall) =>
      currentPaywall
        ? {
            ...currentPaywall,
            feedbackMessage: result.message,
          }
        : currentPaywall
    );
  };

  const handleRestore = async () => {
    setPaywallLoading(true);
    const result = await actions.restorePremium();
    setPaywallLoading(false);

    if (result.ok) {
      setHomeBannerMessage(result.message ?? 'Purchases restored.');
      setPaywall(null);
      return;
    }

    setPaywall((currentPaywall) =>
      currentPaywall
        ? {
            ...currentPaywall,
            feedbackMessage: result.message,
          }
        : currentPaywall
    );
  };

  const handleRestoreFromSettings = async () => {
    const result = await actions.restorePremium();
    setHomeBannerMessage(result.message ?? 'Restore finished.');
    setScreen('home');
  };

  const handleOpenCustomerCenter = async () => {
    const result = await actions.openCustomerCenter();
    if (!result.ok) {
      setHomeBannerMessage(result.message ?? 'Customer Center is unavailable.');
    }
  };

  if (!state.isReady) {
    return (
      <ScreenShell>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingTitle}>Preparing your rule</Text>
          <Text style={styles.loadingSubtitle}>
            Loading settings, stats, and demo blocking state.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <>
      {screen === 'welcome' ? (
        <WelcomeScreen
          onBegin={async () => {
            await actions.startOnboarding();
            setScreen('appSelection');
          }}
        />
      ) : null}

      {screen === 'appSelection' ? (
        <AppSelectionScreen
          isPremium={isPremium}
          onContinue={() => setScreen('ritualLength')}
          onToggleApp={handleToggleApp}
          selectedApps={state.settings.selectedApps}
        />
      ) : null}

      {screen === 'ritualLength' ? (
        <RitualLengthScreen
          isPremium={isPremium}
          onBack={() => setScreen('appSelection')}
          onContinue={() => setScreen('unlockWindow')}
          onSelect={handleSelectDuration}
          selectedDuration={state.settings.ritualDurationSeconds}
        />
      ) : null}

      {screen === 'unlockWindow' ? (
        <UnlockWindowScreen
          isPremium={isPremium}
          onBack={() => setScreen('ritualLength')}
          onContinue={async () => {
            await actions.finishOnboarding();
            setHomeBannerMessage('Your first rule is ready.');
            setScreen('home');
          }}
          onSelect={handleSelectUnlockWindow}
          selectedMinutes={state.settings.unlockWindowMinutes}
        />
      ) : null}

      {screen === 'home' ? (
        <HomeScreen
          bannerMessage={homeBannerMessage}
          blockerSnapshot={state.blockerSnapshot}
          bypassesUsedToday={state.dailyStats.bypassesUsed}
          completedToday={state.dailyStats.completedRituals}
          currentStreak={state.lifetimeStats.currentStreak}
          isPremium={isPremium}
          onOpenPaywall={() =>
            void openPaywall(
              'Keep your rule of life going.',
              'Premium unlocks unlimited app locks and daily prayer pauses.'
            )
          }
          onOpenSettings={() => setScreen('settings')}
          onSelectDemoApp={actions.selectDemoApp}
          onStartRitual={() => void handleStartRitual()}
          ritualDurationSeconds={state.settings.ritualDurationSeconds}
          selectedApps={state.settings.selectedApps}
          selectedDemoApp={state.selectedDemoApp}
          totalRituals={state.lifetimeStats.totalRituals}
          unlockWindowMinutes={state.settings.unlockWindowMinutes}
        />
      ) : null}

      {screen === 'ritual' && ritualSession ? (
        <LockRitualScreen
          canBypass={usage.bypassesRemaining > 0}
          contentItem={ritualSession.contentItem}
          durationSeconds={state.settings.ritualDurationSeconds}
          onBypass={handleBypass}
          onExit={handleCloseRitual}
          onReady={handleCompleteRitual}
          targetApp={ritualSession.appId}
        />
      ) : null}

      {screen === 'settings' ? (
        <SettingsScreen
          isPremium={isPremium}
          onBack={() => setScreen('home')}
          onOpenCustomerCenter={() => void handleOpenCustomerCenter()}
          onResetTodayStats={() => {
            void actions.resetTodayStats();
            setHomeBannerMessage("Today's stats were reset.");
            setScreen('home');
          }}
          onRestorePurchases={() => void handleRestoreFromSettings()}
          onSelectDuration={handleSelectDuration}
          onSelectUnlockWindow={handleSelectUnlockWindow}
          onToggleApp={handleToggleApp}
          onToggleStrictMode={async (enabled) => {
            const result = await actions.setStrictModeEnabled(enabled);
            if (!result.ok && result.reason === 'paywall') {
              await openPaywall('Keep your rule of life going.', result.message);
            }
          }}
          ritualDurationSeconds={state.settings.ritualDurationSeconds}
          selectedApps={state.settings.selectedApps}
          strictModeEnabled={state.settings.strictModeEnabled}
          unlockWindowMinutes={state.settings.unlockWindowMinutes}
        />
      ) : null}

      <PaywallScreen
        feedbackMessage={paywall?.feedbackMessage}
        headline={paywall?.headline ?? 'Keep your rule of life going.'}
        loading={paywallLoading}
        onClose={() => setPaywall(null)}
        onRestore={() => void handleRestore()}
        onStartPremium={() => void handleStartPremium()}
        visible={Boolean(paywall)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  loadingTitle: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 30,
  },
  loadingSubtitle: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
