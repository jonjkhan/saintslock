import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif
#if canImport(ManagedSettings)
import ManagedSettings
#endif

enum SaintsLockManagedSettingsController {
  private static var relockWorkItem: DispatchWorkItem?

  static func applyShield() -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled() else {
      return SaintsLockScreenTimeEnvironment.nativeScreenTimeDisabledResult()
    }

    #if canImport(FamilyControls) && canImport(ManagedSettings)
    guard #available(iOS 16.0, *) else {
      return SaintsLockScreenTimeEnvironment.requiresIOS16("ManagedSettings shielding")
    }

    guard let selection = SaintsLockSharedStorage.loadLatestSelection() else {
      return SaintsLockScreenTimeEnvironment.requiresSelection()
    }

    let selectedTokenCount =
      selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
    guard selectedTokenCount > 0 else {
      return SaintsLockScreenTimeEnvironment.requiresSelection()
    }

    let store = ManagedSettingsStore()
    store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
    if selection.categoryTokens.isEmpty {
      store.shield.applicationCategories = nil
    } else {
      store.shield.applicationCategories = .specific(selection.categoryTokens)
    }
    store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

    SaintsLockSharedStorage.saveShieldApplied(true)
    SaintsLockSharedStorage.saveUnlockExpiration(nil)
    SaintsLockSharedStorage.saveLastError(nil)

    return SaintsLockScreenTimeEnvironment.shieldResult(
      ok: true,
      status: .approved,
      message: "SaintsLock shielding is active.",
      selection: SaintsLockSelectionCodec.summary(for: selection)
    )
    #else
    return SaintsLockScreenTimeEnvironment.unsupported(
      "ManagedSettings is unavailable in this native build."
    )
    #endif
  }

  static func clearShield() -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled() else {
      return SaintsLockScreenTimeEnvironment.nativeScreenTimeDisabledResult()
    }

    #if canImport(ManagedSettings)
    guard #available(iOS 16.0, *) else {
      return SaintsLockScreenTimeEnvironment.requiresIOS16("ManagedSettings shielding")
    }

    let store = ManagedSettingsStore()
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil

    SaintsLockSharedStorage.saveShieldApplied(false)
    SaintsLockSharedStorage.saveLastError(nil)

    return SaintsLockScreenTimeEnvironment.shieldResult(
      ok: true,
      status: .approved,
      message: "SaintsLock shielding is temporarily cleared.",
      selection: nil
    )
    #else
    return SaintsLockScreenTimeEnvironment.unsupported(
      "ManagedSettings is unavailable in this native build."
    )
    #endif
  }

  static func clearProtectedSelection() -> [String: Any] {
    relockWorkItem?.cancel()
    relockWorkItem = nil

    let clearResult = clearShield()
    guard clearResult["ok"] as? Bool == true else {
      return clearResult
    }

    guard SaintsLockSharedStorage.clearLatestSelection() else {
      let message = "SaintsLock could not clear the saved Screen Time selection."
      SaintsLockSharedStorage.saveLastError(message)
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .unsupported,
        message: message
      ).toDictionary(extra: ["selection": SaintsLockSelectionCodec.emptySummary()])
    }

    return SaintsLockScreenTimeEnvironment.shieldResult(
      ok: true,
      status: .approved,
      message: "Protected apps removed.",
      selection: SaintsLockSelectionCodec.emptySummary()
    )
  }

  static func unlockForDuration(seconds: Double) -> [String: Any] {
    guard seconds > 0 else {
      let message = "Unlock duration must be greater than zero seconds."
      SaintsLockSharedStorage.saveLastError(message)
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .unsupported,
        message: message
      ).toDictionary(extra: ["limitation": SaintsLockDiagnostics.timerLimitation])
    }

    let clearResult = clearShield()
    guard clearResult["ok"] as? Bool == true else {
      return clearResult
    }

    relockWorkItem?.cancel()

    let expiresAt = Date().addingTimeInterval(seconds)
    let expiresAtString = ISO8601DateFormatter().string(from: expiresAt)
    SaintsLockSharedStorage.saveUnlockExpiration(expiresAtString)

    let workItem = DispatchWorkItem {
      let result = applyShield()
      if result["ok"] as? Bool != true {
        SaintsLockSharedStorage.saveLastError(result["message"] as? String)
      }
    }

    relockWorkItem = workItem
    DispatchQueue.main.asyncAfter(
      deadline: .now() + .milliseconds(Int(seconds * 1000)),
      execute: workItem
    )

    return SaintsLockScreenTimeEnvironment.shieldResult(
      ok: true,
      status: .approved,
      message: "SaintsLock shielding is cleared until \(expiresAtString).",
      selection: nil
    ).merging(
      [
        "unlockExpiresAt": expiresAtString,
        "limitation": SaintsLockDiagnostics.timerLimitation,
      ],
      uniquingKeysWith: { current, _ in current }
    )
  }

  static func relockNow() -> [String: Any] {
    relockWorkItem?.cancel()
    relockWorkItem = nil
    return applyShield()
  }
}
