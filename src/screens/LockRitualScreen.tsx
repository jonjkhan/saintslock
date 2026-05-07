import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { ProgressTimer } from '../components/ProgressTimer';
import { ScreenShell } from '../components/ScreenShell';
import { colors, spacing, typography } from '../theme/tokens';
import { RitualContentItem } from '../types/models';

interface LockRitualScreenProps {
  targetApp: string;
  durationSeconds: number;
  contentItem: RitualContentItem;
  canBypass: boolean;
  onReady: () => Promise<{ ok: boolean; message?: string }>;
  onBypass: () => Promise<{ ok: boolean; message?: string }>;
  onExit: () => void;
}

export function LockRitualScreen({
  targetApp,
  durationSeconds,
  contentItem,
  canBypass,
  onReady,
  onBypass,
  onExit,
}: LockRitualScreenProps) {
  const [timerComplete, setTimerComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSuccessfulExit = (message?: string) => {
    setSuccessMessage(message ?? 'Go with peace.');
    timeoutRef.current = setTimeout(() => {
      onExit();
    }, 1400);
  };

  const handleReadyPress = async () => {
    setProcessing(true);
    const result = await onReady();
    setProcessing(false);

    if (result.ok) {
      handleSuccessfulExit(result.message);
    }
  };

  const handleBypassPress = async () => {
    setProcessing(true);
    const result = await onBypass();
    setProcessing(false);

    if (result.ok) {
      handleSuccessfulExit(result.message);
    }
  };

  return (
    <ScreenShell>
      <View style={styles.headerBlock}>
        <Text style={styles.targetLabel}>Simulating {targetApp}</Text>
        <Text style={styles.title}>Pause.</Text>
      </View>

      <AppCard>
        <Text style={styles.contentType}>
          {contentItem.type === 'scripture' ? 'Scripture' : contentItem.title}
        </Text>
        <Text style={styles.contentText}>
          {contentItem.type === 'scripture' ? `"${contentItem.text}"` : contentItem.text}
        </Text>
        {contentItem.reference ? (
          <Text style={styles.attribution}>- {contentItem.reference}</Text>
        ) : contentItem.attribution ? (
          <Text style={styles.attribution}>{contentItem.attribution}</Text>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.instruction}>
          Take a breath. Make the sign of the cross, or simply pray quietly.
        </Text>
        <ProgressTimer durationSeconds={durationSeconds} onComplete={() => setTimerComplete(true)} />
      </AppCard>

      <AppCard>
        {successMessage ? (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ) : (
          <>
            <AppButton
              disabled={!timerComplete}
              label="I'm ready"
              loading={processing}
              onPress={handleReadyPress}
            />
            <View style={styles.bypassRow}>
              <AppButton
                label={canBypass ? 'I need this now' : 'Bypasses used today'}
                onPress={handleBypassPress}
                variant="ghost"
              />
              <Text style={styles.bypassHelper}>
                {canBypass
                  ? "Use today's bypass without shame."
                  : 'Premium gives more flexibility when you need it.'}
              </Text>
            </View>
          </>
        )}
      </AppCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
  },
  targetLabel: {
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
    fontSize: 44,
  },
  contentType: {
    color: colors.accent,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  contentText: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 26,
    lineHeight: 36,
  },
  attribution: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  instruction: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  bypassRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  bypassHelper: {
    color: colors.mutedText,
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.success,
    fontFamily: typography.headingFamily,
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
});
