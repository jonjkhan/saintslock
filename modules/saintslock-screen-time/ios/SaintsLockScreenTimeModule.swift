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
    return isNativeScreenTimeEnabled()
  }

  static func unsupported(_ message: String) -> [String: Any] {
    return SaintsLockScreenTimeResult(
      ok: false,
      status: .unsupported,
      message: message
    ).toDictionary()
  }

  static func notImplemented(_ message: String) -> [String: Any] {
    return SaintsLockScreenTimeResult(
      ok: false,
      status: .notImplemented,
      message: message
    ).toDictionary()
  }

  static func unavailableForCurrentBuild(_ message: String) -> [String: Any] {
    return unsupported(message)
  }

  static func nativeScreenTimeDisabledResult() -> [String: Any] {
    let message = "Native Screen Time support is disabled in this build."
    SaintsLockSharedStorage.saveLastError(message)
    return unavailableForCurrentBuild(message)
  }

  static func requiresIOS16(_ feature: String) -> [String: Any] {
    let message = "\(feature) requires iOS 16 or later."
    SaintsLockSharedStorage.saveLastError(message)
    return unsupported(message)
  }

  static func requiresSelection() -> [String: Any] {
    let message = "No apps selected yet."
    SaintsLockSharedStorage.saveLastError(message)
    return SaintsLockScreenTimeResult(
      ok: false,
      status: .notDetermined,
      message: message
    ).toDictionary(extra: ["selection": NSNull()])
  }

  static func shieldResult(
    ok: Bool,
    status: SaintsLockScreenTimeStatus,
    message: String,
    selection: [String: Any]? = nil
  ) -> [String: Any] {
    return SaintsLockScreenTimeResult(
      ok: ok,
      status: status,
      message: message
    ).toDictionary(extra: ["selection": selection ?? NSNull()])
  }
}

public class SaintsLockScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SaintsLockScreenTime")

    AsyncFunction("getDiagnostics") { () async -> [String: Any] in
      return await SaintsLockDiagnostics.getDiagnostics()
    }

    AsyncFunction("requestAuthorization") { () async -> [String: Any] in
      return await SaintsLockAuthorization.requestAuthorization()
    }

    AsyncFunction("getAuthorizationStatus") { () async -> [String: Any] in
      return await SaintsLockAuthorization.getAuthorizationStatus()
    }

    AsyncFunction("presentFamilyActivityPicker") { () async -> [String: Any] in
      return await SaintsLockFamilyActivityPicker.presentPicker()
    }

    AsyncFunction("applyShield") { () async -> [String: Any] in
      return SaintsLockManagedSettingsController.applyShield()
    }

    AsyncFunction("clearShield") { () async -> [String: Any] in
      return SaintsLockManagedSettingsController.clearShield()
    }

    AsyncFunction("unlockForDuration") { (seconds: Double) async -> [String: Any] in
      return SaintsLockManagedSettingsController.unlockForDuration(seconds: seconds)
    }

    AsyncFunction("relockNow") { () async -> [String: Any] in
      return SaintsLockManagedSettingsController.relockNow()
    }
  }
}
