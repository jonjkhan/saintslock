import Foundation

enum SaintsLockSharedStorage {
  static let appGroupIdentifier = "group.com.jonathankhan.saintslock"
  static let latestSelectionKey = "saintslock.screenTime.latestSelection"

  static func sharedDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  static func saveLatestSelectionPayload(_ payload: [String: Any]) {
    sharedDefaults()?.set(payload, forKey: latestSelectionKey)
  }
}
