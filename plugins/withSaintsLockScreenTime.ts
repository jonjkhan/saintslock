import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

const APP_GROUP = 'group.com.jonathankhan.saintslock';

const withSaintsLockScreenTime: ConfigPlugin = (config) => {
  config = withEntitlementsPlist(config, (configWithEntitlements) => {
    const existingGroups =
      configWithEntitlements.modResults['com.apple.security.application-groups'];

    const normalizedGroups = Array.isArray(existingGroups)
      ? existingGroups.filter((value): value is string => typeof value === 'string')
      : [];

    if (!normalizedGroups.includes(APP_GROUP)) {
      normalizedGroups.push(APP_GROUP);
    }

    configWithEntitlements.modResults['com.apple.security.application-groups'] =
      normalizedGroups;

    return configWithEntitlements;
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

export default withSaintsLockScreenTime;
