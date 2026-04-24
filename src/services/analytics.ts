type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'app_selected'
  | 'ritual_started'
  | 'ritual_completed'
  | 'bypass_used'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_completed'
  | 'restore_purchases_pressed'
  | 'settings_updated';

type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

// TODO: If PostHog is installed later, initialize it here and forward events.
// Keeping this wrapper stable now prevents analytics vendor details from leaking
// across the app.
export async function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
) {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, properties ?? {});
  }
}

