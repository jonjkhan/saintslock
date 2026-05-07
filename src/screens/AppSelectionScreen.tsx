import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { PillOption } from '../components/PillOption';
import { ScreenShell } from '../components/ScreenShell';
import { DISTRACTING_APPS } from '../constants/options';
import { colors, spacing, typography } from '../theme/tokens';

interface AppSelectionScreenProps {
  selectedApps: string[];
  isPremium: boolean;
  onToggleApp: (appName: string) => void;
  onContinue: () => void;
}

export function AppSelectionScreen({
  selectedApps,
  isPremium,
  onToggleApp,
  onContinue,
}: AppSelectionScreenProps) {
  return (
    <ScreenShell
      title="Choose the apps you want SaintsLock to interrupt."
      subtitle="Choose where SaintsLock should place a short prayerful pause before access."
    >
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

      <Text style={styles.helperText}>
        Free includes one app lock. Premium unlocks unlimited app locks.
      </Text>

      <AppButton
        disabled={selectedApps.length === 0}
        label="Continue"
        onPress={onContinue}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
});
