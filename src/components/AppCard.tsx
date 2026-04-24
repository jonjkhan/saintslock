import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme/tokens';

export function AppCard({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
});

