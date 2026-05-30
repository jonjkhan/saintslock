export type ScreenTimeStubStatus =
  | 'unsupported'
  | 'notImplemented'
  | 'notDetermined'
  | 'approved'
  | 'denied';

export interface ScreenTimeStubResult {
  ok: boolean;
  status: ScreenTimeStubStatus;
  message: string;
}

export interface ScreenTimeAuthorizationResult extends ScreenTimeStubResult {
  success?: boolean;
  authorizationStatus?: ScreenTimeStubStatus;
  error?: string;
}

export interface ScreenTimeSelectionSummary {
  applicationTokenCount: number;
  categoryTokenCount: number;
  webDomainTokenCount: number;
}

export interface ScreenTimePickerOptions {
  allowUnlimited: boolean;
  maxSelectionCount: number;
}

export interface ScreenTimePickerResult extends ScreenTimeStubResult {
  success?: boolean;
  cancelled?: boolean;
  hasSavedSelection?: boolean;
  selectedApplicationTokenCount?: number;
  selectedCategoryTokenCount?: number;
  selectedWebDomainTokenCount?: number;
  error?: string;
  selection: ScreenTimeSelectionSummary | null;
}

export interface ScreenTimeShieldResult extends ScreenTimeStubResult {
  selection?: ScreenTimeSelectionSummary | null;
  unlockExpiresAt?: string | null;
  limitation?: string | null;
}

export interface ScreenTimeDiagnostics {
  platform: string;
  moduleLoaded: boolean;
  nativeScreenTimeEnabled: boolean;
  authorizationStatus: ScreenTimeStubStatus;
  hasFamilyControlsEntitlement: boolean | null;
  hasAppGroup: boolean;
  hasSavedSelection: boolean;
  selectedApplicationTokenCount: number;
  selectedCategoryTokenCount: number;
  selectedWebDomainTokenCount: number;
  isShieldApplied: boolean;
  unlockExpiresAt?: string | null;
  lastError?: string | null;
  limitation?: string | null;
}
