import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme/tokens';

export function PaywallFeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.marker}>+</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  marker: {
    color: colors.accent,
    fontFamily: typography.headingFamily,
    fontSize: 22,
    width: 14,
  },
  text: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
});

