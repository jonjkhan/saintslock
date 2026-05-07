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

export interface ScreenTimeAuthorizationResult extends ScreenTimeStubResult {}

export interface ScreenTimeSelectionSummary {
  applicationTokenCount: number;
  categoryTokenCount: number;
  webDomainTokenCount: number;
  encodedSelection?: string | null;
}

export interface ScreenTimePickerResult extends ScreenTimeStubResult {
  selection: ScreenTimeSelectionSummary | null;
}

export interface ScreenTimeShieldResult extends ScreenTimeStubResult {}
