import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif

enum SaintsLockDiagnostics {
  static let timerLimitation =
    "Timed re-lock uses a main-app timer until a DeviceActivityMonitor extension is implemented."

  @MainActor
  static func getDiagnostics() async -> [String: Any] {
    let selectionSummary = latestSelectionSummary()
    let applicationTokenCount = selectionSummary["applicationTokenCount"] as? Int ?? 0
    let categoryTokenCount = selectionSummary["categoryTokenCount"] as? Int ?? 0
    let webDomainTokenCount = selectionSummary["webDomainTokenCount"] as? Int ?? 0
    let hasSavedSelection =
      applicationTokenCount + categoryTokenCount + webDomainTokenCount > 0

    return [
      "platform": "ios",
      "moduleLoaded": true,
      "nativeScreenTimeEnabled": SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled(),
      "authorizationStatus": authorizationStatus().rawValue,
      "hasFamilyControlsEntitlement": SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled(),
      "hasAppGroup": SaintsLockSharedStorage.sharedDefaults() != nil,
      "hasSavedSelection": hasSavedSelection,
      "selectedApplicationTokenCount": applicationTokenCount,
      "selectedCategoryTokenCount": categoryTokenCount,
      "selectedWebDomainTokenCount": webDomainTokenCount,
      "isShieldApplied": SaintsLockSharedStorage.isShieldApplied(),
      "unlockExpiresAt": SaintsLockSharedStorage.unlockExpiration() ?? NSNull(),
      "lastError": SaintsLockSharedStorage.lastError() ?? NSNull(),
      "limitation": timerLimitation,
    ]
  }

  @MainActor
  private static func authorizationStatus() -> SaintsLockScreenTimeStatus {
    #if canImport(FamilyControls)
    if #available(iOS 16.0, *) {
      return SaintsLockAuthorization.mapStatus(AuthorizationCenter.shared.authorizationStatus)
    }
    #endif

    return .unsupported
  }

  private static func latestSelectionSummary() -> [String: Any] {
    #if canImport(FamilyControls)
    if #available(iOS 16.0, *), let summary = SaintsLockSharedStorage.latestSelectionSummary() {
      return summary
    }
    #endif

    return SaintsLockSelectionCodec.emptySummary()
  }
}
