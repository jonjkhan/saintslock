import type { ConfigContext, ExpoConfig } from 'expo/config';

const baseConfig = require('./app.json').expo as ExpoConfig;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    saintsLockScreenTime: {
      appGroup: 'group.com.jonathankhan.saintslock',
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
