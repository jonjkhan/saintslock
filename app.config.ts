import type { ConfigContext, ExpoConfig } from 'expo/config';

const baseConfig = require('./app.json').expo as ExpoConfig;
const enableDevelopmentFamilyControls = ['1', 'true', 'yes'].includes(
  (process.env.SAINTSLOCK_ENABLE_FAMILY_CONTROLS_DEV ?? '').toLowerCase()
);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    saintsLockScreenTime: {
      appGroup: 'group.com.jonathankhan.saintslock',
      enableDevelopmentFamilyControls,
      shieldConfigurationExtensionBundleIdentifier:
        'com.jonathankhan.saintslock.ShieldConfiguration',
      shieldActionExtensionBundleIdentifier:
        'com.jonathankhan.saintslock.ShieldAction',
      deviceActivityMonitorExtensionBundleIdentifier:
        'com.jonathankhan.saintslock.DeviceActivityMonitor',
    },
  },
  plugins: ['./plugins/withSaintsLockScreenTime.js'],
});
