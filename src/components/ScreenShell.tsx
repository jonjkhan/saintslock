import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../theme/tokens';

interface ScreenShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function ScreenShell({ children, title, subtitle }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    lineHeight: 24,
  },
});
