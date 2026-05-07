import ExpoModulesCore

enum SaintsLockScreenTimeEnvironment {
  static func notImplemented(_ message: String) -> [String: Any] {
    if #available(iOS 15.0, *) {
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .notImplemented,
        message: message
      ).toDictionary()
    }

    return SaintsLockScreenTimeResult(
      ok: false,
      status: .unsupported,
      message: "Screen Time APIs require iOS 15 or later."
    ).toDictionary()
  }
}

public class SaintsLockScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SaintsLockScreenTime")

    AsyncFunction("requestAuthorization") {
      SaintsLockAuthorization.requestAuthorization()
    }

    AsyncFunction("getAuthorizationStatus") {
      SaintsLockAuthorization.getAuthorizationStatus()
    }

    AsyncFunction("presentFamilyActivityPicker") {
      SaintsLockFamilyActivityPicker.presentPicker()
    }

    AsyncFunction("applyShield") {
      SaintsLockManagedSettingsController.applyShield()
    }

    AsyncFunction("clearShield") {
      SaintsLockManagedSettingsController.clearShield()
    }
  }
}
