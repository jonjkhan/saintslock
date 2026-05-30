import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
import {
  formatScreenTimeSelectionSummary,
  formatScreenTimeShieldStatus,
  getScreenTimeSelectionCount,
} from '../utils/screenTimeSummary';
import type { ScreenTimeDiagnostics } from '../../modules/saintslock-screen-time/src';

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
  onOpenNativeScreenTime?: () => void;
  onRemoveProtectedApps?: () => void;
  onRestorePurchases: () => void;
  onOpenCustomerCenter: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
  showNativeScreenTimeSetup?: boolean;
  nativeScreenTimeMessage?: string | null;
  showDebugDiagnostics?: boolean;
  protectedSelectionDiagnostics?: ScreenTimeDiagnostics | null;
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
  onOpenNativeScreenTime,
  onRemoveProtectedApps,
  onRestorePurchases,
  onOpenCustomerCenter,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
  showNativeScreenTimeSetup = false,
  nativeScreenTimeMessage,
  showDebugDiagnostics = false,
  protectedSelectionDiagnostics,
}: SettingsScreenProps) {
  const protectedSelectionCount = getScreenTimeSelectionCount(protectedSelectionDiagnostics);
  const selectionSummary = formatScreenTimeSelectionSummary(
    protectedSelectionDiagnostics,
    'selected'
  );
  const shieldStatus = formatScreenTimeShieldStatus(protectedSelectionDiagnostics, false);
  const nativeSetupButtonLabel =
    protectedSelectionCount > 0 ? 'Change Protected Apps' : 'Choose Protected Apps';

  return (
    <ScreenShell
      title="Settings"
      subtitle="Adjust your current rule without losing today's progress."
    >
      <AppCard>
        <Text style={styles.sectionLabel}>
          {showNativeScreenTimeSetup ? 'Protected Apps' : 'Selected apps'}
        </Text>
        {showNativeScreenTimeSetup ? (
          <View style={styles.nativeSetupBlock}>
            <Text
              style={[
                styles.statusBadge,
                shieldStatus === 'Shielding active' ? styles.activeStatus : styles.pausedStatus,
              ]}
            >
              {shieldStatus}
            </Text>
            <Text style={styles.selectionSummary}>
              {protectedSelectionCount > 0 ? selectionSummary : 'No apps protected yet'}
            </Text>
            <Text style={styles.helperText}>
              Apple keeps exact app names private. SaintsLock protects your selected
              Screen Time apps without reading app names.
            </Text>
            <AppButton
              label={nativeSetupButtonLabel}
              onPress={onOpenNativeScreenTime ?? (() => undefined)}
              variant="secondary"
            />
            {protectedSelectionCount > 0 && onRemoveProtectedApps ? (
              <AppButton
                label="Remove Protected Apps"
                onPress={onRemoveProtectedApps}
                variant="ghost"
              />
            ) : null}
            {showDebugDiagnostics && nativeScreenTimeMessage ? (
              <Text style={styles.statusText}>{nativeScreenTimeMessage}</Text>
            ) : null}
          </View>
        ) : (
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
        )}
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
          Strict Mode is included with Premium.
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
        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.buttonStack}>
          <AppButton label="Manage subscription" onPress={onOpenCustomerCenter} variant="secondary" />
          <AppButton label="Restore purchases" onPress={onRestorePurchases} variant="secondary" />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionLabel}>Legal & Support</Text>
        <View style={styles.linkStack}>
          <Pressable onPress={onOpenPrivacy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={onOpenTerms}>
            <Text style={styles.linkText}>Terms of Use</Text>
          </Pressable>
          <Pressable onPress={onOpenSupport}>
            <Text style={styles.linkText}>Support</Text>
          </Pressable>
        </View>
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
  nativeSetupBlock: {
    gap: spacing.md,
  },
  statusText: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  activeStatus: {
    borderColor: colors.success,
    color: colors.success,
  },
  pausedStatus: {
    borderColor: colors.accent,
    color: colors.accent,
  },
  selectionSummary: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 22,
    lineHeight: 30,
  },
  strictModeRow: {
    marginTop: spacing.lg,
  },
  buttonStack: {
    gap: spacing.md,
  },
  linkStack: {
    gap: spacing.md,
  },
  linkText: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '700',
  },
});
