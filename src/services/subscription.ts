import { SubscriptionState } from '../types/models';

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  message: string;
}

const sdkKey = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY;
const monthlyProductId =
  process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID ?? process.env.SAINTSLOCK_MONTHLY;
const mockPremiumEnabled =
  __DEV__ &&
  ['1', 'true', 'yes'].includes(
    (process.env.EXPO_PUBLIC_ENABLE_MOCK_PREMIUM ?? '').toLowerCase()
  );

export const purchasesConfig = {
  sdkKey,
  monthlyProductId,
  isConfigured: Boolean(sdkKey && monthlyProductId),
  isMockPremiumEnabled: mockPremiumEnabled,
};

// TODO: When react-native-purchases is installed, wire the SDK here:
// 1. Configure Purchases with EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY.
// 2. Fetch offerings and match the `premium` entitlement.
// 3. Replace the mock branches below with live customer info reads.
export async function configurePurchases() {
  return purchasesConfig;
}

export async function refreshCustomerInfo(
  existingState: SubscriptionState
): Promise<SubscriptionState> {
  if (mockPremiumEnabled) {
    return {
      isPremium: true,
      entitlementCheckedAt: new Date().toISOString(),
    };
  }

  return {
    ...existingState,
    entitlementCheckedAt: new Date().toISOString(),
  };
}

export const isPremium = (subscription: SubscriptionState) => subscription.isPremium;

export async function purchaseMonthly(): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: 'Mock premium enabled for development.',
    };
  }

  if (!purchasesConfig.isConfigured) {
    return {
      success: false,
      isPremium: false,
      message:
        'RevenueCat is not configured in this build yet. Add the public SDK key and monthly product ID to enable purchases.',
    };
  }

  return {
    success: false,
    isPremium: false,
    message:
      'RevenueCat environment variables are present, but the react-native-purchases package still needs to be installed and wired.',
  };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: 'Mock purchases restored in development.',
    };
  }

  if (!purchasesConfig.isConfigured) {
    return {
      success: false,
      isPremium: false,
      message: 'No purchases to restore in this build yet.',
    };
  }

  return {
    success: false,
    isPremium: false,
    message:
      'Restore is ready for wiring, but RevenueCat SDK installation is still pending.',
  };
}

