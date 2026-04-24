import { Platform } from 'react-native';

export const colors = {
  background: '#12100d',
  card: '#1c1814',
  cardElevated: '#25201a',
  border: '#40362a',
  text: '#f3ebda',
  mutedText: '#b9ae9a',
  accent: '#b99a58',
  accentSoft: '#4f4028',
  danger: '#8f6458',
  success: '#6f8d67',
  overlay: 'rgba(10, 8, 6, 0.82)',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const typography = {
  headingFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  bodyFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 6,
  },
};

