import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif

enum SaintsLockScreenTimeStatus: String {
  case unsupported
  case notImplemented
  case notDetermined
  case approved
  case denied
}

struct SaintsLockScreenTimeResult {
  let ok: Bool
  let status: SaintsLockScreenTimeStatus
  let message: String

  func toDictionary(extra: [String: Any] = [:]) -> [String: Any] {
    var payload: [String: Any] = [
      "ok": ok,
      "status": status.rawValue,
      "message": message,
    ]

    extra.forEach { payload[$0.key] = $0.value }
    return payload
  }
}

enum SaintsLockAuthorization {
  @MainActor
  static func requestAuthorization() async -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isDevelopmentFamilyControlsEnabled() else {
      return SaintsLockScreenTimeEnvironment.unavailableForCurrentBuild(
        "Family Controls development support is disabled in this build."
      )
    }

    #if canImport(FamilyControls)
    guard #available(iOS 15.0, *) else {
      return SaintsLockScreenTimeEnvironment.unsupported(
        "Family Controls authorization requires iOS 15 or later."
      )
    }

    do {
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return result(
        for: AuthorizationCenter.shared.authorizationStatus,
        messagePrefix: "Family Controls authorization"
      )
    } catch {
      return errorResult(
        error,
        fallbackStatus: mapStatus(AuthorizationCenter.shared.authorizationStatus)
      )
    }
    #else
    return SaintsLockScreenTimeEnvironment.unsupported(
      "Family Controls is unavailable in this native build."
    )
    #endif
  }

  @MainActor
  static func getAuthorizationStatus() async -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isDevelopmentFamilyControlsEnabled() else {
      return SaintsLockScreenTimeEnvironment.unavailableForCurrentBuild(
        "Family Controls development support is disabled in this build."
      )
    }

    #if canImport(FamilyControls)
    guard #available(iOS 15.0, *) else {
      return SaintsLockScreenTimeEnvironment.unsupported(
        "Family Controls authorization requires iOS 15 or later."
      )
    }

    return result(
      for: AuthorizationCenter.shared.authorizationStatus,
      messagePrefix: "Family Controls authorization status"
    )
    #else
    return SaintsLockScreenTimeEnvironment.unsupported(
      "Family Controls is unavailable in this native build."
    )
    #endif
  }

  #if canImport(FamilyControls)
  @available(iOS 15.0, *)
  static func mapStatus(_ status: AuthorizationStatus) -> SaintsLockScreenTimeStatus {
    switch status {
    case .approved:
      return .approved
    case .denied:
      return .denied
    case .notDetermined:
      return .notDetermined
    @unknown default:
      return .unsupported
    }
  }
  #endif

  #if canImport(FamilyControls)
  @available(iOS 15.0, *)
  private static func result(
    for status: AuthorizationStatus,
    messagePrefix: String
  ) -> [String: Any] {
    let mappedStatus = mapStatus(status)

    switch mappedStatus {
    case .approved:
      return SaintsLockScreenTimeResult(
        ok: true,
        status: .approved,
        message: "\(messagePrefix) approved."
      ).toDictionary()
    case .denied:
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .denied,
        message: "\(messagePrefix) denied."
      ).toDictionary()
    case .notDetermined:
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .notDetermined,
        message: "\(messagePrefix) has not been requested yet."
      ).toDictionary()
    default:
      return SaintsLockScreenTimeEnvironment.unsupported(
        "Family Controls authorization is unavailable."
      )
    }
  }
  #endif

  private static func errorResult(
    _ error: Error,
    fallbackStatus: SaintsLockScreenTimeStatus
  ) -> [String: Any] {
    SaintsLockScreenTimeResult(
      ok: false,
      status: fallbackStatus,
      message: "Family Controls authorization failed: \(error.localizedDescription)"
    ).toDictionary()
  }
}
