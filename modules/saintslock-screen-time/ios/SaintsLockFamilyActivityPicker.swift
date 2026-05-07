import Foundation

enum SaintsLockFamilyActivityPicker {
  static func presentPicker() -> [String: Any] {
    var result = SaintsLockScreenTimeEnvironment.notImplemented(
      "FamilyActivityPicker is scaffolded but not implemented yet."
    )
    result["selection"] = NSNull()
    return result
  }
}
