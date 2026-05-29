const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.jonathankhan.saintslock';
const withSaintsLockScreenTime = (config) => {
  const enableNativeScreenTime = Boolean(
    config.extra?.saintsLockScreenTime?.enableNativeScreenTime ||
      config.extra?.saintsLockScreenTime?.enableDevelopmentFamilyControls
  );

  config = withEntitlementsPlist(config, (configWithEntitlements) => {
    const existingGroups =
      configWithEntitlements.modResults['com.apple.security.application-groups'];

    const normalizedGroups = Array.isArray(existingGroups)
      ? existingGroups.filter((value) => typeof value === 'string')
      : [];

    if (!normalizedGroups.includes(APP_GROUP)) {
      normalizedGroups.push(APP_GROUP);
    }

    configWithEntitlements.modResults['com.apple.security.application-groups'] =
      normalizedGroups;

    if (enableNativeScreenTime) {
      configWithEntitlements.modResults['com.apple.developer.family-controls'] = true;
      configWithEntitlements.modResults[
        'com.apple.developer.family-controls.app-and-website-usage'
      ] = true;
    } else {
      delete configWithEntitlements.modResults['com.apple.developer.family-controls'];
      delete configWithEntitlements.modResults[
        'com.apple.developer.family-controls.app-and-website-usage'
      ];
    }

    return configWithEntitlements;
  });

  config = withInfoPlist(config, (configWithInfoPlist) => {
    configWithInfoPlist.modResults.SaintsLockEnableDevelopmentFamilyControls =
      enableNativeScreenTime;
    configWithInfoPlist.modResults.SaintsLockEnableNativeScreenTime = enableNativeScreenTime;

    return configWithInfoPlist;
  });

  /*
   * Development-signing note
   * - EAS cloud internal/development iOS builds are Ad Hoc signed.
   * - Keep Screen Time disabled for Ad Hoc profiles.
   * - Enable Screen Time only for TestFlight/App Store profiles that include
   *   Family Controls Distribution and App and Website Usage.
   *
   * TODO Phase 2+
   * - Add Screen Time-related extension targets in project.pbxproj before
   *   declaring them in extra.eas.build.experimental.ios.appExtensions:
   *   - ShieldConfiguration
   *   - ShieldAction
   *   - DeviceActivityMonitor
   * - EAS appExtensions entries must only reference targets that this plugin
   *   actually creates; otherwise EAS fails while assigning provisioning profiles.
   * - For now, SaintsLock uses main-app FamilyControls + ManagedSettings only.
   */

  return config;
};

module.exports = withSaintsLockScreenTime;
