import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/tokens';

export function HaloGlyph() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.halo} />
      <View style={styles.crossVertical} />
      <View style={styles.crossHorizontal} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  halo: {
    borderColor: `${colors.accent}66`,
    borderRadius: 60,
    borderWidth: 1,
    height: 100,
    position: 'absolute',
    width: 100,
  },
  crossVertical: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 70,
    width: 10,
  },
  crossHorizontal: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 10,
    position: 'absolute',
    width: 52,
  },
});

