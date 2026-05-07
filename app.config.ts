import type { ConfigContext, ExpoConfig } from 'expo/config';

const baseConfig = require('./app.json').expo as ExpoConfig;
// Keep this off for EAS cloud builds. Internal/development EAS iOS builds use Ad Hoc
// provisioning, which cannot carry Family Controls (Development). Use a local Mac/Xcode
// development build for Family Controls testing until Apple approves Distribution.
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
