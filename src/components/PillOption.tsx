import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

interface PillOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
  disabled?: boolean;
  locked?: boolean;
}

export function PillOption({
  label,
  selected,
  onPress,
  description,
  disabled,
  locked,
}: PillOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
        pressed && !disabled && styles.optionPressed,
      ]}
    >
      <View style={styles.optionHeader}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {locked ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Premium</Text>
          </View>
        ) : null}
      </View>
      {description ? (
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: '48%',
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  optionDisabled: {
    opacity: 0.54,
  },
  optionPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.text,
  },
  description: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionSelected: {
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.background,
    fontFamily: typography.bodyFamily,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

