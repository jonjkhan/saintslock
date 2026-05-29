import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif

enum SaintsLockSharedStorage {
  static let appGroupIdentifier = "group.com.jonathankhan.saintslock"
  static let latestSelectionKey = "saintslock.screenTime.latestSelection"
  static let latestEncodedSelectionKey = "saintslock.screenTime.latestEncodedSelection"

  static func sharedDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  static func saveLatestSelectionPayload(_ payload: [String: Any]) {
    sharedDefaults()?.set(payload, forKey: latestSelectionKey)

    if let encodedSelection = payload["encodedSelection"] as? String {
      sharedDefaults()?.set(encodedSelection, forKey: latestEncodedSelectionKey)
    }
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
