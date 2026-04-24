import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
}

export function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.text : colors.background} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as const]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: colors.background,
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.text,
  },
  dangerLabel: {
    color: colors.text,
  },
});

