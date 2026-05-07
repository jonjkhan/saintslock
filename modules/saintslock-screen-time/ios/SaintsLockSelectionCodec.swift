import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif

enum SaintsLockSelectionCodec {
  static func encodeSelectionPlaceholder() -> [String: Any] {
    [
      "applicationTokenCount": 0,
      "categoryTokenCount": 0,
      "webDomainTokenCount": 0,
      "encodedSelection": NSNull(),
    ]
  }

  #if canImport(FamilyControls)
  @available(iOS 16.0, *)
  static func encodeSelection(_ selection: FamilyActivitySelection) -> [String: Any] {
    let encodedSelection: String?

    do {
      let encoded = try PropertyListEncoder().encode(selection)
      encodedSelection = encoded.base64EncodedString()
    } catch {
      encodedSelection = nil
    }

    return [
      "applicationTokenCount": selection.applicationTokens.count,
      "categoryTokenCount": selection.categoryTokens.count,
      "webDomainTokenCount": selection.webDomainTokens.count,
      "encodedSelection": encodedSelection ?? NSNull(),
    ]
  }
  #endif
}
