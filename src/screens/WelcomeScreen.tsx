import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { HaloGlyph } from '../components/HaloGlyph';
import { ScreenShell } from '../components/ScreenShell';
import { colors, spacing, typography } from '../theme/tokens';

export function WelcomeScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <ScreenShell>
      <View style={styles.container}>
        <HaloGlyph />
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>SaintsLock</Text>
          <Text style={styles.title}>Before you scroll, return to God.</Text>
          <Text style={styles.description}>
            SaintsLock helps you pause, pray, and reset before opening the apps
            that pull you away.
          </Text>
          <Text style={styles.rule}>A simple rule of life for your phone.</Text>
        </View>
        <AppButton label="Begin" onPress={onBegin} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl,
  },
  copyBlock: {
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 42,
    lineHeight: 48,
  },
  description: {
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 17,
    lineHeight: 26,
  },
  rule: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 24,
  },
});

