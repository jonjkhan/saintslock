import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { ScreenShell } from '../components/ScreenShell';
import { StatCard } from '../components/StatCard';
import { colors, spacing, typography } from '../theme/tokens';
import { MockBlockerSnapshot } from '../types/models';
import { formatUnlockExpiry } from '../utils/date';
import {
  formatScreenTimeSelectionSummary,
  formatScreenTimeShieldStatus,
  getScreenTimeSelectionCount,
} from '../utils/screenTimeSummary';
import type { ScreenTimeDiagnostics } from '../../modules/saintslock-screen-time/src';

interface HomeScreenProps {
  selectedApps: string[];
  selectedDemoApp: string | null;
  ritualDurationSeconds: number;
  unlockWindowMinutes: number;
  blockerSnapshot: MockBlockerSnapshot;
  completedToday: number;
  currentStreak: number;
  totalRituals: number;
  bypassesUsedToday: number;
  isPremium: boolean;
  bannerMessage?: string | null;
  onSelectDemoApp: (appId: string) => void;
  onStartRitual: () => void;
  onOpenPaywall: () => void;
  onOpenSettings: () => void;
  onTitlePress?: () => void;
  protectedSelectionDiagnostics?: ScreenTimeDiagnostics | null;
}

export function HomeScreen({
  selectedApps,
  selectedDemoApp,
  ritualDurationSeconds,
  unlockWindowMinutes,
  blockerSnapshot,
  completedToday,
  currentStreak,
  totalRituals,
  bypassesUsedToday,
  isPremium,
  bannerMessage,
  onSelectDemoApp,
  onStartRitual,
  onOpenPaywall,
  onOpenSettings,
  onTitlePress,
  protectedSelectionDiagnostics,
}: HomeScreenProps) {
  const activeUnlock = selectedDemoApp
    ? blockerSnapshot.unlockExpirations[selectedDemoApp]
    : undefined;
  const protectedSelectionSummary = formatScreenTimeSelectionSummary(
    protectedSelectionDiagnostics,
    'protected'
  );
  const protectedSelectionCount = getScreenTimeSelectionCount(protectedSelectionDiagnostics);
  const hasNativeProtectedSelection = protectedSelectionCount > 0;
  const ruleSelectionText = hasNativeProtectedSelection
    ? protectedSelectionSummary
    : selectedApps.length > 0
      ? `${selectedApps.length} ${selectedApps.length === 1 ? 'app' : 'apps'} protected`
      : 'No apps protected yet';
  const shieldStatus = formatScreenTimeShieldStatus(
    protectedSelectionDiagnostics,
    Boolean(activeUnlock)
  );

  return (
    <ScreenShell>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Pressable onPress={onTitlePress}>
            <Text style={styles.title}>SaintsLock</Text>
          </Pressable>
          <Text style={styles.subtitle}>Before you scroll, return to God.</Text>
        </View>
        <AppButton label="Settings" onPress={onOpenSettings} variant="ghost" />
      </View>

      {bannerMessage ? (
        <AppCard style={styles.bannerCard}>
          <Text style={styles.bannerText}>{bannerMessage}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={styles.sectionLabel}>Today's Rule</Text>
        <Text style={styles.ruleText}>
          {`${ruleSelectionText} \u00b7 ${ritualDurationSeconds}s pause \u00b7 ${unlockWindowMinutes} min unlock`}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Protected apps</Text>
        <Text style={styles.protectedSummary}>{protectedSelectionSummary}</Text>
        <Text style={styles.helperText}>{shieldStatus}</Text>
        <Text style={styles.trustNote}>
          Apple keeps exact app names private. SaintsLock protects your selected
          Screen Time apps without reading app names.
        </Text>
        {activeUnlock ? (
          <Text style={styles.successText}>
            Protected apps unlocked until {formatUnlockExpiry(activeUnlock)}.
          </Text>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Prayer reset</Text>
        <Text style={styles.helperText}>
          Pause, pray, and return with intention before opening the apps that most
          easily pull your attention away.
        </Text>
        <View style={styles.ctaBlock}>
          <AppButton
            disabled={!selectedDemoApp}
            label="Start Prayer Reset"
            onPress={() => {
              if (selectedDemoApp) {
                onSelectDemoApp(selectedDemoApp);
              }
              onStartRitual();
            }}
          />
        </View>
      </AppCard>

      <View style={styles.statsGrid}>
        <StatCard label="Pauses today" value={completedToday} />
        <StatCard label="Current streak" value={currentStreak} />
        <StatCard label="Total rituals" value={totalRituals} />
        <StatCard label="Bypasses today" value={bypassesUsedToday} />
      </View>

      {!isPremium ? (
        <AppCard>
          <Text style={styles.sectionLabel}>Keep your rule of life going.</Text>
          <Text style={styles.helperText}>
            Premium unlocks unlimited app locks and daily prayer pauses.
          </Text>
          <View style={styles.ctaBlock}>
            <AppButton label="Unlock unlimited app locks" onPress={onOpenPaywall} />
          </View>
        </AppCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 34,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
  },
  bannerCard: {
    backgroundColor: colors.accentSoft,
  },
  bannerText: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  ruleText: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 24,
    lineHeight: 32,
  },
  helperText: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 24,
  },
  protectedSummary: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  trustNote: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  successText: {
    color: colors.success,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ctaBlock: {
    marginTop: spacing.lg,
  },
});
