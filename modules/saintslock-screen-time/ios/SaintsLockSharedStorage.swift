import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif

enum SaintsLockSharedStorage {
  static let appGroupIdentifier = "group.com.jonathankhan.saintslock"
  static let latestSelectionKey = "saintslock.screenTime.latestSelection"
  static let latestEncodedSelectionKey = "saintslock.screenTime.latestEncodedSelection"
  static let isShieldAppliedKey = "saintslock.screenTime.isShieldApplied"
  static let lastErrorKey = "saintslock.screenTime.lastError"
  static let unlockExpiresAtKey = "saintslock.screenTime.unlockExpiresAt"

  static func sharedDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  static func saveLatestSelectionPayload(_ payload: [String: Any]) -> Bool {
    guard let defaults = sharedDefaults() else {
      return false
    }

    let cleanPayload: [String: Any] = [
      "applicationTokenCount": payload["applicationTokenCount"] as? Int ?? 0,
      "categoryTokenCount": payload["categoryTokenCount"] as? Int ?? 0,
      "webDomainTokenCount": payload["webDomainTokenCount"] as? Int ?? 0,
    ]

    defaults.set(cleanPayload, forKey: latestSelectionKey)

    if let encodedSelection = payload["encodedSelection"] as? String {
      defaults.set(encodedSelection, forKey: latestEncodedSelectionKey)
    } else {
      defaults.removeObject(forKey: latestEncodedSelectionKey)
    }

    return true
  }

  static func clearLatestSelection() -> Bool {
    guard let defaults = sharedDefaults() else {
      return false
    }

    defaults.removeObject(forKey: latestSelectionKey)
    defaults.removeObject(forKey: latestEncodedSelectionKey)
    defaults.set(false, forKey: isShieldAppliedKey)
    defaults.removeObject(forKey: unlockExpiresAtKey)
    defaults.removeObject(forKey: lastErrorKey)

    return true
  }

  static func saveShieldApplied(_ isApplied: Bool) {
    sharedDefaults()?.set(isApplied, forKey: isShieldAppliedKey)
  }

  static func isShieldApplied() -> Bool {
    sharedDefaults()?.bool(forKey: isShieldAppliedKey) ?? false
  }

  static func saveLastError(_ message: String?) {
    if let message {
      sharedDefaults()?.set(message, forKey: lastErrorKey)
    } else {
      sharedDefaults()?.removeObject(forKey: lastErrorKey)
    }
  }

  static func lastError() -> String? {
    sharedDefaults()?.string(forKey: lastErrorKey)
  }

  static func saveUnlockExpiration(_ isoString: String?) {
    if let isoString {
      sharedDefaults()?.set(isoString, forKey: unlockExpiresAtKey)
    } else {
      sharedDefaults()?.removeObject(forKey: unlockExpiresAtKey)
    }
  }

  static func unlockExpiration() -> String? {
    sharedDefaults()?.string(forKey: unlockExpiresAtKey)
  }

  #if canImport(FamilyControls)
  @available(iOS 16.0, *)
  static func loadLatestSelection() -> FamilyActivitySelection? {
    guard let encodedSelection = sharedDefaults()?.string(forKey: latestEncodedSelectionKey) else {
      return nil
    }

    return SaintsLockSelectionCodec.decodeSelection(encodedSelection)
  }

  @available(iOS 16.0, *)
  static func latestSelectionSummary() -> [String: Any]? {
    guard let selection = loadLatestSelection() else {
      return nil
    }

    return SaintsLockSelectionCodec.summary(for: selection)
  }
  #endif
}
