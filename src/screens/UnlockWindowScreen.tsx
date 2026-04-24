import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { PillOption } from '../components/PillOption';
import { ScreenShell } from '../components/ScreenShell';
import { UNLOCK_WINDOW_OPTIONS } from '../constants/options';
import { UnlockWindowMinutes } from '../types/models';

interface UnlockWindowScreenProps {
  isPremium: boolean;
  selectedMinutes: UnlockWindowMinutes;
  onSelect: (minutes: UnlockWindowMinutes) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function UnlockWindowScreen({
  isPremium,
  selectedMinutes,
  onSelect,
  onBack,
  onContinue,
}: UnlockWindowScreenProps) {
  return (
    <ScreenShell
      title="After you complete a ritual, how long should the app stay open?"
      subtitle="This unlock window is used for the demo blocking flow."
    >
      <View style={styles.optionsGrid}>
        {UNLOCK_WINDOW_OPTIONS.map((minutes) => (
          <PillOption
            key={minutes}
            description={minutes === 30 ? 'Premium window' : undefined}
            label={`${minutes} minutes`}
            locked={!isPremium && minutes === 30}
            onPress={() => onSelect(minutes)}
            selected={selectedMinutes === minutes}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton label="Back" onPress={onBack} variant="ghost" />
        <AppButton label="Continue" onPress={onContinue} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
