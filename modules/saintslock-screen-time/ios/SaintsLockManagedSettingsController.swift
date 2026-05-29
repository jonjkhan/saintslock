import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif
#if canImport(ManagedSettings)
import ManagedSettings
#endif

enum SaintsLockManagedSettingsController {
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

    let store = ManagedSettingsStore()
    store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
    if selection.categoryTokens.isEmpty {
      store.shield.applicationCategories = nil
    } else {
      store.shield.applicationCategories = .specific(selection.categoryTokens)
    }
    store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

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
}
