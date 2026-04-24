import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { PillOption } from '../components/PillOption';
import { ScreenShell } from '../components/ScreenShell';
import { StatCard } from '../components/StatCard';
import { colors, spacing, typography } from '../theme/tokens';
import { MockBlockerSnapshot } from '../types/models';
import { formatUnlockExpiry } from '../utils/date';

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
}: HomeScreenProps) {
  const activeUnlock = selectedDemoApp
    ? blockerSnapshot.unlockExpirations[selectedDemoApp]
    : undefined;

  return (
    <ScreenShell>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>SaintsLock</Text>
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
          {selectedApps.length > 0
            ? `${selectedApps.join(' · ')} · ${ritualDurationSeconds}s pause · ${unlockWindowMinutes} min unlock`
            : 'Choose an app to begin your first rule.'}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Demo target</Text>
        {selectedApps.length > 0 ? (
          <View style={styles.optionsGrid}>
            {selectedApps.map((appName) => (
              <PillOption
                key={appName}
                label={appName}
                onPress={() => onSelectDemoApp(appName)}
                selected={selectedDemoApp === appName}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            No distracting apps selected yet. Open Settings to choose one.
          </Text>
        )}
        {activeUnlock ? (
          <Text style={styles.successText}>
            {selectedDemoApp} unlocked until {formatUnlockExpiry(activeUnlock)}.
          </Text>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Demo lock ritual</Text>
        <Text style={styles.helperText}>
          Native blocking is not wired yet in this build. This polished in-app ritual
          simulates the unlock loop honestly.
        </Text>
        <View style={styles.ctaBlock}>
          <AppButton
            disabled={!selectedDemoApp}
            label="Start Demo Lock Ritual"
            onPress={onStartRitual}
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
  successText: {
    color: colors.success,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
