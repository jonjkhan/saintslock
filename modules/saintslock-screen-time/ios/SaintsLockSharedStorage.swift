import Foundation

enum SaintsLockSharedStorage {
  static let appGroupIdentifier = "group.com.jonathankhan.saintslock"

  static func sharedDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }
}
