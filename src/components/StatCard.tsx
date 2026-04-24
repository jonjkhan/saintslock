import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '48%',
    gap: spacing.xs,
    padding: spacing.md,
  },
  value: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 28,
  },
  label: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 18,
  },
});

