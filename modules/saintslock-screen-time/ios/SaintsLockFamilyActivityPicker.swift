import Foundation
#if canImport(FamilyControls)
import FamilyControls
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif
#if canImport(UIKit)
import UIKit
#endif

enum SaintsLockFamilyActivityPicker {
  @MainActor
  static func presentPicker() async -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isNativeScreenTimeEnabled() else {
      return unavailableResult("Native Screen Time support is disabled in this build.")
    }

    #if canImport(FamilyControls) && canImport(SwiftUI) && canImport(UIKit)
    guard #available(iOS 16.0, *) else {
      return unavailableResult("FamilyActivityPicker requires iOS 16 or later.")
    }

    let status = AuthorizationCenter.shared.authorizationStatus
    if status != .approved {
      return result(
        ok: false,
        status: SaintsLockAuthorization.mapStatus(status),
        message: "Approve Family Controls before opening the app picker.",
        selection: nil
      )
    }

    guard let presenter = topViewController() else {
      let message = "SaintsLock could not find a view controller to present FamilyActivityPicker."
      SaintsLockSharedStorage.saveLastError(message)
      return result(ok: false, status: .unsupported, message: message, selection: nil)
    }

    guard presenter.viewIfLoaded?.window != nil else {
      let message = "SaintsLock cannot present FamilyActivityPicker until the app window is active."
      SaintsLockSharedStorage.saveLastError(message)
      return result(ok: false, status: .unsupported, message: message, selection: nil)
    }

    guard !(presenter is UIAlertController) else {
      let message = "Close the current alert, then tap Set up app blocking again."
      SaintsLockSharedStorage.saveLastError(message)
      return result(ok: false, status: .unsupported, message: message, selection: nil)
    }

    return await presentPicker(from: presenter)
    #else
    return unavailableResult("FamilyActivityPicker is unavailable in this native build.")
    #endif
  }

  static func unavailableResult(_ message: String) -> [String: Any] {
    return result(
      ok: false,
      status: .unsupported,
      message: message,
      selection: nil
    )
  }

  static func result(
    ok: Bool,
    status: SaintsLockScreenTimeStatus,
    message: String,
    selection: [String: Any]?,
    cancelled: Bool = false,
    error: String? = nil
  ) -> [String: Any] {
    let selectedApplicationTokenCount = selection?["applicationTokenCount"] as? Int ?? 0
    let selectedCategoryTokenCount = selection?["categoryTokenCount"] as? Int ?? 0
    let selectedWebDomainTokenCount = selection?["webDomainTokenCount"] as? Int ?? 0
    let hasSavedSelection =
      selectedApplicationTokenCount + selectedCategoryTokenCount + selectedWebDomainTokenCount > 0

    var payload = SaintsLockScreenTimeResult(
      ok: ok,
      status: status,
      message: message
    ).toDictionary(extra: [
      "success": ok,
      "cancelled": cancelled,
      "hasSavedSelection": hasSavedSelection,
      "selectedApplicationTokenCount": selectedApplicationTokenCount,
      "selectedCategoryTokenCount": selectedCategoryTokenCount,
      "selectedWebDomainTokenCount": selectedWebDomainTokenCount,
      "selection": selection ?? NSNull(),
    ])

    if let error {
      payload["error"] = error
    }

    if ok {
      SaintsLockSharedStorage.saveLastError(nil)
    } else if !cancelled {
      SaintsLockSharedStorage.saveLastError(message)
    }

    return payload
  }
}

#if canImport(FamilyControls) && canImport(SwiftUI) && canImport(UIKit)
@available(iOS 16.0, *)
private extension SaintsLockFamilyActivityPicker {
  static var activeCoordinator: PickerCoordinator? {
    get { PickerCoordinatorStorage.shared.coordinator }
    set { PickerCoordinatorStorage.shared.coordinator = newValue }
  }

  @MainActor
  static func topViewController(
    from viewController: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first(where: \.isKeyWindow)?
      .rootViewController
  ) -> UIViewController? {
    if let navigationController = viewController as? UINavigationController {
      return topViewController(from: navigationController.visibleViewController)
    }

    if let tabBarController = viewController as? UITabBarController {
      return topViewController(from: tabBarController.selectedViewController)
    }

    if let presentedViewController = viewController?.presentedViewController {
      return topViewController(from: presentedViewController)
    }

    return viewController
  }

  @MainActor
  static func presentPicker(from presenter: UIViewController) async -> [String: Any] {
    return await withCheckedContinuation { continuation in
      let coordinator = PickerCoordinator(continuation: continuation)
      let hostingController = UIHostingController(
        rootView: FamilyActivityPickerHostView(coordinator: coordinator)
      )

      hostingController.modalPresentationStyle = .fullScreen
      hostingController.isModalInPresentation = true

      coordinator.hostingController = hostingController
      activeCoordinator = coordinator

      presenter.present(hostingController, animated: true) {
        coordinator.didPresent()
      }
    }
  }

}

@available(iOS 16.0, *)
private final class PickerCoordinatorStorage {
  static let shared = PickerCoordinatorStorage()
  var coordinator: PickerCoordinator?
}

@available(iOS 16.0, *)
private final class PickerCoordinator: ObservableObject {
  @Published var selection = FamilyActivitySelection()
  @Published var didAppear = false

  weak var hostingController: UIViewController?

  private let continuation: CheckedContinuation<[String: Any], Never>
  private var hasCompleted = false

  init(continuation: CheckedContinuation<[String: Any], Never>) {
    self.continuation = continuation
  }

  var selectedTokenCount: Int {
    return selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
  }

  var hasSelection: Bool {
    return selectedTokenCount > 0
  }

  func didPresent() {
    didAppear = true
  }

  func complete() {
    guard !hasCompleted else {
      return
    }

    guard hasSelection else {
      finish(
        returning: SaintsLockFamilyActivityPicker.result(
          ok: false,
          status: .notDetermined,
          message: "No apps selected yet.",
          selection: nil
        )
      )
      return
    }

    guard let storagePayload = SaintsLockSelectionCodec.storagePayload(for: selection) else {
      finish(
        returning: SaintsLockFamilyActivityPicker.result(
          ok: false,
          status: .unsupported,
          message: "SaintsLock could not encode the Screen Time selection.",
          selection: nil
        )
      )
      return
    }

    guard SaintsLockSharedStorage.saveLatestSelectionPayload(storagePayload) else {
      finish(
        returning: SaintsLockFamilyActivityPicker.result(
          ok: false,
          status: .unsupported,
          message: "SaintsLock could not save the Screen Time selection to App Group storage.",
          selection: nil
        )
      )
      return
    }

    let publicSelection = SaintsLockSelectionCodec.summary(for: selection)
    finish(
      returning: SaintsLockFamilyActivityPicker.result(
        ok: true,
        status: .approved,
        message: "FamilyActivityPicker completed and saved your selection.",
        selection: publicSelection
      )
    )
  }

  func cancel() {
    guard !hasCompleted else {
      return
    }

    finish(
      returning: SaintsLockFamilyActivityPicker.result(
        ok: false,
        status: .notDetermined,
        message: "FamilyActivityPicker was cancelled.",
        selection: nil,
        cancelled: true
      )
    )
  }

  private func finish(returning payload: [String: Any]) {
    guard !hasCompleted else {
      return
    }

    hasCompleted = true
    let controller = hostingController

    let resolve = {
      self.continuation.resume(returning: payload)
      SaintsLockFamilyActivityPicker.activeCoordinator = nil
    }

    if controller?.presentingViewController != nil {
      controller?.dismiss(animated: true) {
        resolve()
      }
    } else {
      resolve()
    }
  }
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerHostView: View {
  @ObservedObject var coordinator: PickerCoordinator

  var body: some View {
    NavigationView {
      VStack(spacing: 16) {
        Text("Choose Apps")
          .font(.title2.weight(.semibold))
          .padding(.top, 12)

        Text("Select the apps, categories, or web domains SaintsLock should shield.")
          .font(.subheadline)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
          .padding(.horizontal, 20)

        FamilyActivityPicker(selection: $coordinator.selection)
      }
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            coordinator.cancel()
          }
        }

        ToolbarItem(placement: .confirmationAction) {
          Button("Done") {
            coordinator.complete()
          }
          .disabled(!coordinator.hasSelection)
        }
      }
    }
  }
}
#endif
