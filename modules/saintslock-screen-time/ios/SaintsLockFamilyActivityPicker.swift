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
  static func presentPicker() async -> [String: Any] {
    guard SaintsLockScreenTimeEnvironment.isDevelopmentFamilyControlsEnabled() else {
      return unavailableResult(
        "Family Controls development support is disabled in this build."
      )
    }

    #if canImport(FamilyControls) && canImport(SwiftUI) && canImport(UIKit)
    guard #available(iOS 16.0, *) else {
      return unavailableResult("FamilyActivityPicker requires iOS 16 or later.")
    }

    let statusCheck = await MainActor.run { () -> [String: Any]? in
      let status = AuthorizationCenter.shared.authorizationStatus
      if status != .approved {
        return SaintsLockScreenTimeResult(
          ok: false,
          status: SaintsLockAuthorization.mapStatus(status),
          message: "Approve Family Controls before opening the app picker."
        ).toDictionary(extra: ["selection": NSNull()])
      }

      return nil
    }

    if let statusCheck {
      return statusCheck
    }

    guard let presenter = await MainActor.run(body: { topViewController() }) else {
      return SaintsLockScreenTimeResult(
        ok: false,
        status: .unsupported,
        message: "SaintsLock could not find a view controller to present FamilyActivityPicker."
      ).toDictionary(extra: ["selection": NSNull()])
    }

    return await presentPicker(from: presenter)
    #else
    return unavailableResult("FamilyActivityPicker is unavailable in this native build.")
    #endif
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

  static func presentPicker(from presenter: UIViewController) async -> [String: Any] {
    await withCheckedContinuation { continuation in
      let coordinator = PickerCoordinator(continuation: continuation)
      let hostingController = UIHostingController(
        rootView: FamilyActivityPickerBridgeView(coordinator: coordinator)
      )

      hostingController.modalPresentationStyle = .fullScreen
      hostingController.view.backgroundColor = .clear

      coordinator.hostingController = hostingController
      activeCoordinator = coordinator

      presenter.present(hostingController, animated: true)
    }
  }

  static func unavailableResult(_ message: String) -> [String: Any] {
    SaintsLockScreenTimeEnvironment.unsupported(message).merging(
      ["selection": NSNull()],
      uniquingKeysWith: { current, _ in current }
    )
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
  @Published var isPresented = true

  weak var hostingController: UIViewController?

  private let continuation: CheckedContinuation<[String: Any], Never>
  private var hasCompleted = false

  init(continuation: CheckedContinuation<[String: Any], Never>) {
    self.continuation = continuation
  }

  func complete() {
    guard !hasCompleted else {
      return
    }

    hasCompleted = true

    let selectionPayload = SaintsLockSelectionCodec.encodeSelection(selection)
    SaintsLockSharedStorage.saveLatestSelectionPayload(selectionPayload)

    let message: String
    if selection.applicationTokenCount + selection.categoryTokenCount + selection.webDomainTokenCount > 0 {
      message = "FamilyActivityPicker completed and returned a selection."
    } else {
      message = "FamilyActivityPicker closed without any selected apps or categories."
    }

    continuation.resume(
      returning: SaintsLockScreenTimeResult(
        ok: true,
        status: .approved,
        message: message
      ).toDictionary(extra: ["selection": selectionPayload])
    )

    hostingController?.dismiss(animated: true)
    SaintsLockFamilyActivityPicker.activeCoordinator = nil
  }
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerBridgeView: View {
  @ObservedObject var coordinator: PickerCoordinator

  var body: some View {
    Color.clear
      .ignoresSafeArea()
      .familyActivityPicker(
        isPresented: $coordinator.isPresented,
        selection: $coordinator.selection
      )
      .onChange(of: coordinator.isPresented) { isPresented in
        if !isPresented {
          coordinator.complete()
        }
      }
  }
}
#endif
