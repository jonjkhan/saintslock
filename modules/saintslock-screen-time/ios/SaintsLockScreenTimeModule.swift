import ExpoModulesCore

enum SaintsLockScreenTimeEnvironment {
  static func isNativeScreenTimeEnabled() -> Bool {
    let value = Bundle.main.object(forInfoDictionaryKey: "SaintsLockEnableNativeScreenTime")
    if let boolValue = value as? Bool {
      return boolValue
    }

    let legacyValue = Bundle.main.object(forInfoDictionaryKey: "SaintsLockEnableDevelopmentFamilyControls")
    return legacyValue as? Bool ?? false
  }

  static func isDevelopmentFamilyControlsEnabled() -> Bool {
    isNativeScreenTimeEnabled()
  }

  static func unsupported(_ message: String) -> [String: Any] {
    SaintsLockScreenTimeResult(
      ok: false,
      status: .unsupported,
      message: message
    ).toDictionary()
  }

  static func notImplemented(_ message: String) -> [String: Any] {
    SaintsLockScreenTimeResult(
      ok: false,
      status: .notImplemented,
      message: message
    ).toDictionary()
  }

  static func unavailableForCurrentBuild(_ message: String) -> [String: Any] {
    unsupported(message)
  }

  static func nativeScreenTimeDisabledResult() -> [String: Any] {
    unavailableForCurrentBuild("Native Screen Time support is disabled in this build.")
  }

  static func requiresIOS16(_ feature: String) -> [String: Any] {
    unsupported("\(feature) requires iOS 16 or later.")
  }

  static func requiresSelection() -> [String: Any] {
    SaintsLockScreenTimeResult(
      ok: false,
      status: .notDetermined,
      message: "Choose apps with Screen Time before applying SaintsLock shielding."
    ).toDictionary(extra: ["selection": NSNull()])
  }

  static func shieldResult(
    ok: Bool,
    status: SaintsLockScreenTimeStatus,
    message: String,
    selection: [String: Any]? = nil
  ) -> [String: Any] {
    SaintsLockScreenTimeResult(
      ok: ok,
      status: status,
      message: message
    ).toDictionary(extra: ["selection": selection ?? NSNull()])
  }
}

public class SaintsLockScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SaintsLockScreenTime")

    AsyncFunction("requestAuthorization") { () async -> [String: Any] in
      await SaintsLockAuthorization.requestAuthorization()
    }

    AsyncFunction("getAuthorizationStatus") { () async -> [String: Any] in
      await SaintsLockAuthorization.getAuthorizationStatus()
    }

    AsyncFunction("presentFamilyActivityPicker") { () async -> [String: Any] in
      await SaintsLockFamilyActivityPicker.presentPicker()
    }

    AsyncFunction("applyShield") { () async -> [String: Any] in
      SaintsLockManagedSettingsController.applyShield()
    }

    AsyncFunction("clearShield") { () async -> [String: Any] in
      SaintsLockManagedSettingsController.clearShield()
    }
  }
}
