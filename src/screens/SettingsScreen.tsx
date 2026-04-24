import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { PillOption } from '../components/PillOption';
import { ScreenShell } from '../components/ScreenShell';
import {
  DISTRACTING_APPS,
  RITUAL_LENGTH_OPTIONS,
  UNLOCK_WINDOW_OPTIONS,
} from '../constants/options';
import { colors, spacing, typography } from '../theme/tokens';
import { RitualDurationSeconds, UnlockWindowMinutes } from '../types/models';

interface SettingsScreenProps {
  isPremium: boolean;
  selectedApps: string[];
  ritualDurationSeconds: RitualDurationSeconds;
  unlockWindowMinutes: UnlockWindowMinutes;
  strictModeEnabled: boolean;
  onBack: () => void;
  onToggleApp: (appName: string) => void;
  onSelectDuration: (duration: RitualDurationSeconds) => void;
  onSelectUnlockWindow: (minutes: UnlockWindowMinutes) => void;
  onToggleStrictMode: (enabled: boolean) => void;
  onRestorePurchases: () => void;
  onResetTodayStats: () => void;
}

export function SettingsScreen({
  isPremium,
  selectedApps,
  ritualDurationSeconds,
  unlockWindowMinutes,
  strictModeEnabled,
  onBack,
  onToggleApp,
  onSelectDuration,
  onSelectUnlockWindow,
  onToggleStrictMode,
  onRestorePurchases,
  onResetTodayStats,
}: SettingsScreenProps) {
  return (
    <ScreenShell
      title="Settings"
      subtitle="Adjust your current rule without losing today's progress."
    >
      <AppCard>
        <Text style={styles.sectionLabel}>Selected apps</Text>
        <View style={styles.optionsGrid}>
          {DISTRACTING_APPS.map((appName) => (
            <PillOption
              key={appName}
              label={appName}
              locked={!isPremium && !selectedApps.includes(appName) && selectedApps.length >= 1}
              onPress={() => onToggleApp(appName)}
              selected={selectedApps.includes(appName)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Ritual length</Text>
        <View style={styles.optionsGrid}>
          {RITUAL_LENGTH_OPTIONS.map((duration) => (
            <PillOption
              key={duration}
              label={`${duration} seconds`}
              locked={!isPremium && duration === 90}
              onPress={() => onSelectDuration(duration)}
              selected={ritualDurationSeconds === duration}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Unlock window</Text>
        <View style={styles.optionsGrid}>
          {UNLOCK_WINDOW_OPTIONS.map((minutes) => (
            <PillOption
              key={minutes}
              label={`${minutes} minutes`}
              locked={!isPremium && minutes === 30}
              onPress={() => onSelectUnlockWindow(minutes)}
              selected={unlockWindowMinutes === minutes}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Strict Mode</Text>
        <Text style={styles.helperText}>
          Strict Mode is a premium-only placeholder for a future no-bypass flow.
        </Text>
        <View style={styles.strictModeRow}>
          <AppButton
            label={strictModeEnabled ? 'Disable Strict Mode' : 'Enable Strict Mode'}
            onPress={() => onToggleStrictMode(!strictModeEnabled)}
            variant={strictModeEnabled ? 'danger' : 'secondary'}
          />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Helpers</Text>
        <View style={styles.buttonStack}>
          <AppButton label="Restore purchases" onPress={onRestorePurchases} variant="secondary" />
          <AppButton label="Reset today's stats" onPress={onResetTodayStats} variant="ghost" />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Legal</Text>
        <Text style={styles.helperText}>Privacy Policy placeholder</Text>
        <Text style={styles.helperText}>Terms of Use placeholder</Text>
      </AppCard>

      <AppButton label="Back to Home" onPress={onBack} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  helperText: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 22,
  },
  strictModeRow: {
    marginTop: spacing.lg,
  },
  buttonStack: {
    gap: spacing.md,
  },
});
