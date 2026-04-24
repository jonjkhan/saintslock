import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { PaywallFeatureRow } from '../components/PaywallFeatureRow';
import { ScreenShell } from '../components/ScreenShell';
import { colors, spacing, typography } from '../theme/tokens';

interface PaywallScreenProps {
  visible: boolean;
  headline: string;
  feedbackMessage?: string | null;
  loading: boolean;
  onStartPremium: () => void;
  onRestore: () => void;
  onClose: () => void;
}

export function PaywallScreen({
  visible,
  headline,
  feedbackMessage,
  loading,
  onStartPremium,
  onRestore,
  onClose,
}: PaywallScreenProps) {
  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <ScreenShell>
        <View style={styles.header}>
          <Text style={styles.planName}>SaintsLock Premium</Text>
          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.subtitle}>
            Premium unlocks unlimited app locks and daily prayer pauses.
          </Text>
        </View>

        <AppCard>
          <Text style={styles.price}>$4.99/month</Text>
          <View style={styles.features}>
            <PaywallFeatureRow text="Unlimited blocked apps" />
            <PaywallFeatureRow text="Unlimited daily prayer unlocks" />
            <PaywallFeatureRow text="Longer and customizable ritual lengths" />
            <PaywallFeatureRow text="Strict Mode" />
            <PaywallFeatureRow text="Weekly spiritual discipline report" />
            <PaywallFeatureRow text="More prayers, psalms, and patristic reflections" />
          </View>
        </AppCard>

        {feedbackMessage ? (
          <AppCard style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </AppCard>
        ) : null}

        <View style={styles.actions}>
          <AppButton label="Start Premium" loading={loading} onPress={onStartPremium} />
          <AppButton label="Restore Purchase" onPress={onRestore} variant="secondary" />
          <AppButton label="Not now" onPress={onClose} variant="ghost" />
        </View>
      </ScreenShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  planName: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 38,
    lineHeight: 44,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 24,
  },
  price: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 30,
    marginBottom: spacing.lg,
  },
  features: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  feedbackCard: {
    backgroundColor: colors.cardElevated,
  },
  feedbackText: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    lineHeight: 22,
  },
});

