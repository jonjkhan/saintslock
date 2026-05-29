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
  static func encodedSelectionBase64(_ selection: FamilyActivitySelection) -> String? {
    do {
      let encoded = try PropertyListEncoder().encode(selection)
      return encoded.base64EncodedString()
    } catch {
      return nil
    }
  }

  @available(iOS 16.0, *)
  static func decodeSelection(_ encodedSelection: String) -> FamilyActivitySelection? {
    guard let data = Data(base64Encoded: encodedSelection) else {
      return nil
    }

    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  @available(iOS 16.0, *)
  static func summary(for selection: FamilyActivitySelection) -> [String: Any] {
    let encodedSelection = encodedSelectionBase64(selection)

    return [
      "applicationTokenCount": selection.applicationTokens.count,
      "categoryTokenCount": selection.categoryTokens.count,
      "webDomainTokenCount": selection.webDomainTokens.count,
      "encodedSelection": encodedSelection ?? NSNull(),
    ]
  }

  @available(iOS 16.0, *)
  static func encodeSelection(_ selection: FamilyActivitySelection) -> [String: Any] {
    summary(for: selection)
  }
  #endif
}
