import { Platform } from 'react-native';

import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { SubscriptionState } from '../types/models';

export type SubscriptionPackageId = 'monthly' | 'yearly' | 'lifetime';

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  message: string;
  customerInfo?: CustomerInfo;
  paywallResult?: PAYWALL_RESULT;
  purchasedPackageId?: SubscriptionPackageId;
}

export interface SubscriptionPackageSummary {
  packageId: SubscriptionPackageId | string;
  packageIdentifier: string;
  packageType: PACKAGE_TYPE;
  productIdentifier: string;
  productTitle: string;
  productDescription: string;
  priceString: string;
}

export interface SubscriptionCatalog {
  currentOfferingId: string | null;
  availablePackages: SubscriptionPackageSummary[];
}

const entitlementId = (process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'premium').trim();
const sharedApiKey = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY;
const appleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? sharedApiKey;
const googleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? sharedApiKey;

const packageIdentifiers = {
  monthly: process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PACKAGE_ID ?? 'monthly',
  yearly: process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PACKAGE_ID ?? 'yearly',
  lifetime: process.env.EXPO_PUBLIC_REVENUECAT_LIFETIME_PACKAGE_ID ?? 'lifetime',
} as const;

const mockPremiumEnabled =
  __DEV__ &&
  ['1', 'true', 'yes'].includes(
    (process.env.EXPO_PUBLIC_ENABLE_MOCK_PREMIUM ?? '').toLowerCase()
  );

const isNativePurchasesPlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export const purchasesConfig = {
  entitlementId,
  appleApiKey,
  googleApiKey,
  sharedApiKey,
  packageIdentifiers,
  supportsNativePurchases: isNativePurchasesPlatform,
  isMockPremiumEnabled: mockPremiumEnabled,
  isConfigured: Boolean(resolveApiKey() || mockPremiumEnabled),
};

function resolveApiKey() {
  if (Platform.OS === 'ios') {
    return appleApiKey ?? null;
  }

  if (Platform.OS === 'android') {
    return googleApiKey ?? null;
  }

  return sharedApiKey ?? null;
}

function hasActivePremiumEntitlement(customerInfo: CustomerInfo) {
  return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined';
}

function toSubscriptionState(customerInfo: CustomerInfo): SubscriptionState {
  return {
    isPremium: hasActivePremiumEntitlement(customerInfo),
    entitlementCheckedAt: new Date().toISOString(),
  };
}

function messageForMissingConfiguration() {
  if (!isNativePurchasesPlatform) {
    return 'RevenueCat native purchases run on iOS and Android. Use a development build to test real purchases.';
  }

  return 'RevenueCat is not configured yet. Set your RevenueCat app-specific API key in Expo env before testing purchases.';
}

function serializeUserInfo(userInfo: unknown) {
  if (!userInfo || typeof userInfo !== 'object') {
    return undefined;
  }

  try {
    return JSON.stringify(userInfo);
  } catch {
    return '[unserializable userInfo]';
  }
}

function getConfigurationValidationMessage() {
  if (!entitlementId) {
    return 'RevenueCat config error: EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID is empty.';
  }

  return null;
}

function getErrorDebugDetails(error: unknown) {
  const revenueCatError = error as Partial<PurchasesError> | undefined;
  const anyError = error as
    | (Partial<PurchasesError> & {
        underlyingErrorMessage?: string;
        userInfo?: unknown;
        readableErrorCode?: string;
      })
    | undefined;

  const userInfoMessage =
    typeof anyError?.userInfo === 'object' && anyError?.userInfo
      ? ((anyError.userInfo as unknown as Record<string, unknown>).underlyingErrorMessage)
      : undefined;
  const underlyingErrorMessage =
    anyError?.underlyingErrorMessage ??
    (typeof userInfoMessage === 'string' ? userInfoMessage : undefined);

  const details = [
    revenueCatError?.code != null ? `code=${String(revenueCatError.code)}` : null,
    anyError?.readableErrorCode ? `readableCode=${anyError.readableErrorCode}` : null,
    revenueCatError?.message ? `message=${revenueCatError.message}` : null,
    underlyingErrorMessage ? `underlyingErrorMessage=${underlyingErrorMessage}` : null,
    anyError?.userCancelled != null ? `userCancelled=${String(anyError.userCancelled)}` : null,
    anyError?.userInfo ? `userInfo=${serializeUserInfo(anyError.userInfo)}` : null,
  ].filter(Boolean);

  return details.join(' | ');
}

function logRevenueCatError(context: string, error: unknown) {
  const details = getErrorDebugDetails(error);
  console.warn(`[subscription] ${context}`, details || error);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  const revenueCatError = error as Partial<PurchasesError> | undefined;

  if (
    revenueCatError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    revenueCatError?.userCancelled
  ) {
    return 'Purchase cancelled.';
  }

  const details = getErrorDebugDetails(error);

  return details ? `${fallbackMessage} ${details}` : revenueCatError?.message ?? fallbackMessage;
}

async function ensureConfigured() {
  if (mockPremiumEnabled) {
    return false;
  }

  if (!isNativePurchasesPlatform) {
    return false;
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return false;
  }

  const alreadyConfigured = await Purchases.isConfigured().catch(() => false);
  if (!alreadyConfigured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({
      apiKey,
      shouldShowInAppMessagesAutomatically: true,
    });
  }

  return true;
}

function normalizePackageId(aPackage: PurchasesPackage): SubscriptionPackageId | string {
  if (
    aPackage.identifier === packageIdentifiers.monthly ||
    aPackage.packageType === PACKAGE_TYPE.MONTHLY
  ) {
    return 'monthly';
  }

  if (
    aPackage.identifier === packageIdentifiers.yearly ||
    aPackage.identifier === 'annual' ||
    aPackage.packageType === PACKAGE_TYPE.ANNUAL
  ) {
    return 'yearly';
  }

  if (
    aPackage.identifier === packageIdentifiers.lifetime ||
    aPackage.packageType === PACKAGE_TYPE.LIFETIME
  ) {
    return 'lifetime';
  }

  return aPackage.identifier;
}

function mapPackageSummary(aPackage: PurchasesPackage): SubscriptionPackageSummary {
  return {
    packageId: normalizePackageId(aPackage),
    packageIdentifier: aPackage.identifier,
    packageType: aPackage.packageType,
    productIdentifier: aPackage.product.identifier,
    productTitle: aPackage.product.title,
    productDescription: aPackage.product.description,
    priceString: aPackage.product.priceString,
  };
}

function resolvePackage(
  offering: PurchasesOffering,
  packageId: SubscriptionPackageId
): PurchasesPackage | null {
  if (packageId === 'monthly') {
    return (
      offering.monthly ??
      offering.availablePackages.find(
        (aPackage) =>
          aPackage.identifier === packageIdentifiers.monthly ||
          aPackage.packageType === PACKAGE_TYPE.MONTHLY
      ) ??
      null
    );
  }

  if (packageId === 'yearly') {
    return (
      offering.annual ??
      offering.availablePackages.find(
        (aPackage) =>
          aPackage.identifier === packageIdentifiers.yearly ||
          aPackage.identifier === 'annual' ||
          aPackage.packageType === PACKAGE_TYPE.ANNUAL
      ) ??
      null
    );
  }

  return (
    offering.lifetime ??
    offering.availablePackages.find(
      (aPackage) =>
        aPackage.identifier === packageIdentifiers.lifetime ||
        aPackage.packageType === PACKAGE_TYPE.LIFETIME
    ) ??
    null
  );
}

export async function configurePurchases() {
  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    console.warn(`[subscription] ${configurationIssue}`);
  }

  const configured = await ensureConfigured();

  return {
    ...purchasesConfig,
    isConfigured: configured || mockPremiumEnabled,
  };
}

export function registerCustomerInfoListener(
  onCustomerInfoUpdated: (subscription: SubscriptionState, customerInfo: CustomerInfo) => void
) {
  if (!isNativePurchasesPlatform || mockPremiumEnabled) {
    return () => undefined;
  }

  const listener = (customerInfo: CustomerInfo) => {
    onCustomerInfoUpdated(toSubscriptionState(customerInfo), customerInfo);
  };

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
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

  const configured = await ensureConfigured();
  if (!configured) {
    return {
      ...existingState,
      entitlementCheckedAt: new Date().toISOString(),
    };
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    console.warn(`[subscription] ${configurationIssue}`);
    return {
      ...existingState,
      entitlementCheckedAt: new Date().toISOString(),
    };
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return toSubscriptionState(customerInfo);
  } catch (error) {
    logRevenueCatError('Failed to refresh customer info', error);
    return {
      ...existingState,
      entitlementCheckedAt: new Date().toISOString(),
    };
  }
}

export const isPremium = (subscription: SubscriptionState) => subscription.isPremium;

export async function getSubscriptionCatalog(): Promise<SubscriptionCatalog | null> {
  const configured = await ensureConfigured();
  if (!configured) {
    return null;
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    console.warn(`[subscription] ${configurationIssue}`);
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    return {
      currentOfferingId: currentOffering?.identifier ?? null,
      availablePackages: currentOffering?.availablePackages.map(mapPackageSummary) ?? [],
    };
  } catch (error) {
    logRevenueCatError('Failed to fetch offerings', error);
    return null;
  }
}

export async function purchasePackageById(
  packageId: SubscriptionPackageId
): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: `Mock ${packageId} purchase completed for development.`,
      purchasedPackageId: packageId,
    };
  }

  const configured = await ensureConfigured();
  if (!configured) {
    return {
      success: false,
      isPremium: false,
      message: messageForMissingConfiguration(),
    };
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    return {
      success: false,
      isPremium: false,
      message: configurationIssue,
      purchasedPackageId: packageId,
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering) {
      return {
        success: false,
        isPremium: false,
        message:
          'No current RevenueCat offering was found. Create an offering with monthly, yearly, and lifetime packages in the dashboard.',
      };
    }

    const selectedPackage = resolvePackage(currentOffering, packageId);
    if (!selectedPackage) {
      return {
        success: false,
        isPremium: false,
        message: `The ${packageId} package was not found in the current offering.`,
      };
    }

    const purchaseResult = await Purchases.purchasePackage(selectedPackage);
    const premiumUnlocked = hasActivePremiumEntitlement(purchaseResult.customerInfo);

    return {
      success: premiumUnlocked,
      isPremium: premiumUnlocked,
      message: premiumUnlocked
        ? `Purchased ${packageId} and unlocked SaintsLock Premium.`
        : `Purchased ${packageId}, but the ${entitlementId} entitlement is not active yet.`,
      customerInfo: purchaseResult.customerInfo,
      purchasedPackageId: packageId,
    };
  } catch (error) {
    logRevenueCatError(`Unable to purchase the ${packageId} package`, error);
    return {
      success: false,
      isPremium: false,
      message: getErrorMessage(error, `Unable to purchase the ${packageId} package.`),
      purchasedPackageId: packageId,
    };
  }
}

export async function purchaseMonthly(): Promise<PurchaseResult> {
  return purchasePackageById('monthly');
}

export async function presentPremiumPaywall(): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: 'Mock premium paywall completed for development.',
      paywallResult: PAYWALL_RESULT.PURCHASED,
    };
  }

  const configured = await ensureConfigured();
  if (!configured) {
    return {
      success: false,
      isPremium: false,
      message: messageForMissingConfiguration(),
    };
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    return {
      success: false,
      isPremium: false,
      message: configurationIssue,
    };
  }

  try {
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: entitlementId,
      displayCloseButton: true,
    });

    if (
      paywallResult === PAYWALL_RESULT.PURCHASED ||
      paywallResult === PAYWALL_RESULT.RESTORED
    ) {
      const customerInfo = await Purchases.getCustomerInfo();
      const premiumUnlocked = hasActivePremiumEntitlement(customerInfo);

      return {
        success: premiumUnlocked,
        isPremium: premiumUnlocked,
        message: premiumUnlocked
          ? 'SaintsLock Premium unlocked.'
          : `Paywall completed, but the ${entitlementId} entitlement is not active yet.`,
        customerInfo,
        paywallResult,
      };
    }

    if (paywallResult === PAYWALL_RESULT.NOT_PRESENTED) {
      const customerInfo = await Purchases.getCustomerInfo().catch(() => undefined);
      const premiumUnlocked = customerInfo ? hasActivePremiumEntitlement(customerInfo) : false;

      return {
        success: premiumUnlocked,
        isPremium: premiumUnlocked,
        message: premiumUnlocked
          ? 'SaintsLock Premium is already active.'
          : 'RevenueCat did not present a paywall. Check that your current offering and paywall are configured in the dashboard.',
        customerInfo,
        paywallResult,
      };
    }

    if (paywallResult === PAYWALL_RESULT.CANCELLED) {
      return {
        success: false,
        isPremium: false,
        message: 'Purchase cancelled.',
        paywallResult,
      };
    }

    return {
      success: false,
      isPremium: false,
      message: 'RevenueCat paywall could not be presented.',
      paywallResult,
    };
  } catch (error) {
    logRevenueCatError('Unable to present the RevenueCat paywall', error);
    return {
      success: false,
      isPremium: false,
      message: getErrorMessage(error, 'Unable to present the RevenueCat paywall.'),
    };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: 'Mock purchases restored in development.',
    };
  }

  const configured = await ensureConfigured();
  if (!configured) {
    return {
      success: false,
      isPremium: false,
      message: messageForMissingConfiguration(),
    };
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    return {
      success: false,
      isPremium: false,
      message: configurationIssue,
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const premiumUnlocked = hasActivePremiumEntitlement(customerInfo);

    return {
      success: premiumUnlocked,
      isPremium: premiumUnlocked,
      message: premiumUnlocked
        ? 'Purchases restored.'
        : 'No active SaintsLock Premium entitlement was found to restore.',
      customerInfo,
    };
  } catch (error) {
    logRevenueCatError('Unable to restore purchases', error);
    return {
      success: false,
      isPremium: false,
      message: getErrorMessage(error, 'Unable to restore purchases.'),
    };
  }
}

export async function presentCustomerCenter(): Promise<PurchaseResult> {
  if (mockPremiumEnabled) {
    return {
      success: true,
      isPremium: true,
      message: 'Mock Customer Center opened in development.',
    };
  }

  const configured = await ensureConfigured();
  if (!configured) {
    return {
      success: false,
      isPremium: false,
      message: messageForMissingConfiguration(),
    };
  }

  const configurationIssue = getConfigurationValidationMessage();
  if (configurationIssue) {
    return {
      success: false,
      isPremium: false,
      message: configurationIssue,
    };
  }

  try {
    await RevenueCatUI.presentCustomerCenter();
    const customerInfo = await Purchases.getCustomerInfo().catch(() => undefined);
    const premiumUnlocked = customerInfo ? hasActivePremiumEntitlement(customerInfo) : false;

    return {
      success: true,
      isPremium: premiumUnlocked,
      message: 'Customer Center opened.',
      customerInfo,
    };
  } catch (error) {
    logRevenueCatError('Unable to open Customer Center', error);
    return {
      success: false,
      isPremium: false,
      message: getErrorMessage(error, 'Unable to open Customer Center.'),
    };
  }
}
