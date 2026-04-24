import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { PillOption } from '../components/PillOption';
import { ScreenShell } from '../components/ScreenShell';
import { RITUAL_LENGTH_OPTIONS } from '../constants/options';
import { RitualDurationSeconds } from '../types/models';

interface RitualLengthScreenProps {
  isPremium: boolean;
  selectedDuration: RitualDurationSeconds;
  onSelect: (duration: RitualDurationSeconds) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function RitualLengthScreen({
  isPremium,
  selectedDuration,
  onSelect,
  onBack,
  onContinue,
}: RitualLengthScreenProps) {
  return (
    <ScreenShell
      title="How long should your pause be?"
      subtitle="A little stillness goes a long way."
    >
      <View style={styles.optionsGrid}>
        {RITUAL_LENGTH_OPTIONS.map((duration) => (
          <PillOption
            key={duration}
            description={duration === 90 ? 'Premium length' : undefined}
            label={`${duration} seconds`}
            locked={!isPremium && duration === 90}
            onPress={() => onSelect(duration)}
            selected={selectedDuration === duration}
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

