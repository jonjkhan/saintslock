import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

interface ProgressTimerProps {
  durationSeconds: number;
  onComplete?: () => void;
}

export function ProgressTimer({ durationSeconds, onComplete }: ProgressTimerProps) {
  const [remainingMs, setRemainingMs] = useState(durationSeconds * 1000);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startedAt = Date.now();
    hasCompletedRef.current = false;
    setRemainingMs(durationSeconds * 1000);

    const interval = setInterval(() => {
      const nextRemaining = Math.max(
        0,
        durationSeconds * 1000 - (Date.now() - startedAt)
      );
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [durationSeconds]);

  const progress = 1 - remainingMs / (durationSeconds * 1000);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = `${remainingSeconds % 60}`.padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
      <Text style={styles.timeLabel}>
        {minutes}:{seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  track: {
    backgroundColor: colors.cardElevated,
    borderRadius: radius.pill,
    height: 10,
    overflow: 'hidden',
  },
  progress: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: '100%',
  },
  timeLabel: {
    color: colors.text,
    fontFamily: typography.headingFamily,
    fontSize: 42,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
