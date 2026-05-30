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
    guard SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled() else {
      return authorizationPayload(
        success: false,
        status: .unsupported,
        message: "Native Screen Time support is disabled in this build."
      )
    }

    #if canImport(FamilyControls)
    guard #available(iOS 16.0, *) else {
      return authorizationPayload(
        success: false,
        status: .unsupported,
        message: "Family Controls authorization requires iOS 16 or later."
      )
    }

    do {
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      let status = mapStatus(AuthorizationCenter.shared.authorizationStatus)
      let didApprove = status == .approved
      let message = didApprove
        ? "Family Controls authorization approved."
        : "Family Controls authorization \(status.rawValue)."

      if didApprove {
        SaintsLockSharedStorage.saveLastError(nil)
      } else {
        SaintsLockSharedStorage.saveLastError(message)
      }

      return authorizationPayload(
        success: didApprove,
        status: status,
        message: message
      )
    } catch {
      let fallbackStatus = mapStatus(AuthorizationCenter.shared.authorizationStatus)
      let message = "Family Controls authorization failed: \(error.localizedDescription)"
      SaintsLockSharedStorage.saveLastError(message)

      return authorizationPayload(
        success: false,
        status: fallbackStatus,
        message: message,
        error: error.localizedDescription
      )
    }
    #else
    return authorizationPayload(
      success: false,
      status: .unsupported,
      message: "Family Controls is unavailable in this native build."
    )
    #endif
  }

  @MainActor
  static func getAuthorizationStatus() async -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled() else {
      return SaintsLockScreenTimeEnvironment.nativeScreenTimeDisabledResult()
    }

    #if canImport(FamilyControls)
    guard #available(iOS 16.0, *) else {
      return SaintsLockScreenTimeEnvironment.unsupported(
        "Family Controls authorization requires iOS 16 or later."
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
  @available(iOS 16.0, *)
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
  @available(iOS 16.0, *)
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
    let payload = authorizationPayload(
      success: false,
      status: fallbackStatus,
      message: "Family Controls authorization failed: \(error.localizedDescription)",
      error: error.localizedDescription
    )

    SaintsLockSharedStorage.saveLastError(payload["message"] as? String)
    return payload
  }

  private static func authorizationPayload(
    success: Bool,
    status: SaintsLockScreenTimeStatus,
    message: String,
    error: String? = nil
  ) -> [String: Any] {
    var payload: [String: Any] = [
      "success": success,
      "ok": success,
      "authorizationStatus": status.rawValue,
      "status": status.rawValue,
      "message": message,
    ]

    if let error {
      payload["error"] = error
    }

    return payload
  }
}
