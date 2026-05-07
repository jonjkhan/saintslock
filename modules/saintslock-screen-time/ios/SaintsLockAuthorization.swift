import Foundation

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

  func toDictionary() -> [String: Any] {
    [
      "ok": ok,
      "status": status.rawValue,
      "message": message,
    ]
  }
}

enum SaintsLockAuthorization {
  static func requestAuthorization() -> [String: Any] {
    SaintsLockScreenTimeEnvironment.notImplemented(
      "SaintsLock Screen Time authorization is scaffolded but not implemented yet."
    )
  }

  static func getAuthorizationStatus() -> [String: Any] {
    SaintsLockScreenTimeEnvironment.notImplemented(
      "SaintsLock Screen Time authorization status is scaffolded but not implemented yet."
    )
  }
}
