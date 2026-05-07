import Foundation

enum SaintsLockSelectionCodec {
  static func encodeSelectionPlaceholder() -> [String: Any] {
    [
      "apps": [],
      "categories": [],
      "webDomains": [],
    ]
  }
}
