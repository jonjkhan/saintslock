import type { ConfigContext, ExpoConfig } from 'expo/config';

const baseConfig = require('./app.json').expo as ExpoConfig;
// Keep this off for Ad Hoc/internal builds. Enable it only for App Store/TestFlight
// profiles whose provisioning profiles include Family Controls Distribution.
const enableNativeScreenTime = ['1', 'true', 'yes'].includes(
  (
    process.env.SAINTSLOCK_ENABLE_SCREEN_TIME ??
    process.env.SAINTSLOCK_ENABLE_FAMILY_CONTROLS_DEV ??
    ''
  ).toLowerCase()
);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    enableScreenTime: enableNativeScreenTime,
    saintsLockScreenTime: {
      appGroup: 'group.com.jonathankhan.saintslock',
      enableNativeScreenTime,
      enableDevelopmentFamilyControls: enableNativeScreenTime,
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
