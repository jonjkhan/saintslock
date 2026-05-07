import ExpoModulesCore

enum SaintsLockScreenTimeEnvironment {
  static func isDevelopmentFamilyControlsEnabled() -> Bool {
    let value = Bundle.main.object(forInfoDictionaryKey: "SaintsLockEnableDevelopmentFamilyControls")
    return value as? Bool ?? false
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
