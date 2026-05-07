const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.jonathankhan.saintslock';

const withSaintsLockScreenTime = (config) => {
  const enableDevelopmentFamilyControls = Boolean(
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

    if (enableDevelopmentFamilyControls) {
      configWithEntitlements.modResults['com.apple.developer.family-controls'] = true;
    } else {
      delete configWithEntitlements.modResults['com.apple.developer.family-controls'];
    }

    return configWithEntitlements;
  });

  config = withInfoPlist(config, (configWithInfoPlist) => {
    configWithInfoPlist.modResults.SaintsLockEnableDevelopmentFamilyControls =
      enableDevelopmentFamilyControls;

    return configWithInfoPlist;
  });

  /*
   * TODO Phase 2+
   * - Add Screen Time-related extension targets:
   *   - ShieldConfiguration
   *   - ShieldAction
   *   - DeviceActivityMonitor
   * - Add FamilyControls entitlement after Apple approval and native implementation work begin.
   * - Wire App Group + extension entitlements for every new target.
   * - Update the Xcode project via config plugin once extension sources exist.
   */

  return config;
};

module.exports = withSaintsLockScreenTime;
