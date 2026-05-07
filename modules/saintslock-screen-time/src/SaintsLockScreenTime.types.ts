export type ScreenTimeStubStatus =
  | 'unsupported'
  | 'notImplemented'
  | 'notDetermined'
  | 'approved'
  | 'denied';

export interface ScreenTimeStubResult {
  ok: false;
  status: ScreenTimeStubStatus;
  message: string;
}

export interface ScreenTimeAuthorizationResult extends ScreenTimeStubResult {}

export interface ScreenTimePickerResult extends ScreenTimeStubResult {
  selection: null;
}

export interface ScreenTimeShieldResult extends ScreenTimeStubResult {}
