import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import config from '../common/config';
import {
  getAllProductIds,
  REVENUECAT_ENTITLEMENTS,
} from '../constants/subscription';

/**
 * Android-only RevenueCat Purchases helper.
 *
 * Security (client requirements):
 * 1. Bind with Purchases.logIn(db_user_id) — no anonymous subscribe
 * 2. Strictest available verification: INFORMATIONAL (+ reject FAILED locally)
 *    Note: RevenueCat removed VerificationMode.ENFORCED from public SDKs;
 *    INFORMATIONAL + server verify/webhooks is the supported equivalent.
 * 3. Never unlock Premium/Family from CustomerInfo alone — backend status wins
 */

export type RevenueCatStoreProductLike = {
  productId: string;
  id: string;
  localizedPrice?: string;
  priceString?: string;
};

let configured = false;
let boundAppUserId: string | null = null;

function assertAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('RevenueCat Purchases is only used on Android in this app');
  }
}

function getGoogleApiKey(): string {
  const key = (config.revenuecat_google_api_key || '').trim();
  if (!key || key.startsWith('REPLACE_') || key === 'goog_YOUR_KEY') {
    throw new Error(
      'RevenueCat Google API key is not configured. Set revenuecat_google_api_key in src/common/config.ts',
    );
  }
  return key;
}

/** PetMood DB / profile user id used as RevenueCat app_user_id (currently Firebase uid). */
export function resolveDbUserId(user: { uid?: string | null } | null | undefined): string | null {
  const uid = user?.uid?.trim();
  return uid ? uid : null;
}

function assertCustomerInfoTrusted(customerInfo: CustomerInfo): void {
  const verification = customerInfo.entitlements?.verification;
  if (verification === Purchases.VERIFICATION_RESULT.FAILED) {
    throw new Error(
      'Subscription verification failed. Please try again on a trusted network.',
    );
  }
}

export async function configureRevenueCatAndroid(dbUserId: string): Promise<void> {
  assertAndroid();
  const appUserID = String(dbUserId).trim();
  if (!appUserID) {
    throw new Error('Cannot configure RevenueCat without a logged-in user id');
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  if (!configured) {
    Purchases.configure({
      apiKey: getGoogleApiKey(),
      appUserID,
      // Strictest mode RevenueCat still exposes publicly (ENFORCED was removed).
      entitlementVerificationMode:
        Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
    });
    configured = true;
  }

  const result = await Purchases.logIn(appUserID);
  boundAppUserId = appUserID;
  assertCustomerInfoTrusted(result.customerInfo);
}

export async function logInRevenueCatAndroid(dbUserId: string): Promise<void> {
  assertAndroid();
  const appUserID = String(dbUserId).trim();
  if (!appUserID) {
    throw new Error('Login required before using subscriptions');
  }
  if (!configured) {
    await configureRevenueCatAndroid(appUserID);
    return;
  }
  const result = await Purchases.logIn(appUserID);
  boundAppUserId = appUserID;
  assertCustomerInfoTrusted(result.customerInfo);
}

export async function logOutRevenueCatAndroid(): Promise<void> {
  if (Platform.OS !== 'android' || !configured) {
    boundAppUserId = null;
    return;
  }
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('RevenueCat logOut:', e);
  } finally {
    boundAppUserId = null;
  }
}

export function getBoundRevenueCatAppUserId(): string | null {
  return boundAppUserId;
}

export function requireBoundRevenueCatUser(): string {
  if (!boundAppUserId) {
    throw new Error(
      'Google Play billing is not ready yet. Pull down to refresh, or check that RevenueCat is configured.',
    );
  }
  return boundAppUserId;
}

function collectPackages(offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>): PurchasesPackage[] {
  const current = offerings.current;
  if (current?.availablePackages?.length) {
    return current.availablePackages;
  }
  const all: PurchasesPackage[] = [];
  for (const offering of Object.values(offerings.all || {})) {
    if (offering?.availablePackages?.length) {
      all.push(...offering.availablePackages);
    }
  }
  return all;
}

export async function getRevenueCatStoreProducts(): Promise<RevenueCatStoreProductLike[]> {
  assertAndroid();
  requireBoundRevenueCatUser();
  const offerings = await Purchases.getOfferings();
  const packages = collectPackages(offerings);
  const allowed = new Set(getAllProductIds());
  const byId = new Map<string, RevenueCatStoreProductLike>();

  for (const pkg of packages) {
    const productId = pkg.product?.identifier;
    if (!productId || !allowed.has(productId)) {
      continue;
    }
    const price =
      pkg.product.priceString ||
      (pkg.product as { localizedPriceString?: string }).localizedPriceString ||
      undefined;
    byId.set(productId, {
      productId,
      id: productId,
      localizedPrice: price,
      priceString: price,
    });
  }

  return Array.from(byId.values());
}

function findPackageForProductId(
  packages: PurchasesPackage[],
  productId: string,
): PurchasesPackage | undefined {
  return packages.find(p => p.product?.identifier === productId);
}

export type RevenueCatPurchaseSyncPayload = {
  platform: 'google';
  product_id: string;
  transaction_id: string;
  revenuecat_app_user_id: string;
  entitlement_ids: string[];
  revenuecat_customer_info: CustomerInfo;
};

export async function purchaseRevenueCatPackage(
  productId: string,
): Promise<RevenueCatPurchaseSyncPayload> {
  assertAndroid();
  const appUserId = requireBoundRevenueCatUser();

  const offerings = await Purchases.getOfferings();
  const packages = collectPackages(offerings);
  const pkg = findPackageForProductId(packages, productId);
  if (!pkg) {
    throw new Error(
      'This plan is not available from Google Play yet. Pull down to refresh or try again later.',
    );
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  assertCustomerInfoTrusted(customerInfo);

  const active = customerInfo.entitlements?.active || {};
  const entitlementIds = Object.keys(active);
  const txn =
    customerInfo.nonSubscriptionTransactions?.[0]?.transactionIdentifier ||
    active[REVENUECAT_ENTITLEMENTS.premium]?.latestPurchaseDate ||
    active[REVENUECAT_ENTITLEMENTS.family]?.latestPurchaseDate ||
    `${appUserId}:${productId}:${Date.now()}`;

  return {
    platform: 'google',
    product_id: productId,
    transaction_id: String(txn),
    revenuecat_app_user_id: appUserId,
    entitlement_ids: entitlementIds,
    revenuecat_customer_info: customerInfo,
  };
}

export async function restoreRevenueCatPurchases(): Promise<RevenueCatPurchaseSyncPayload | null> {
  assertAndroid();
  const appUserId = requireBoundRevenueCatUser();
  const customerInfo = await Purchases.restorePurchases();
  assertCustomerInfoTrusted(customerInfo);

  const active = customerInfo.entitlements?.active || {};
  const entitlementIds = Object.keys(active);
  if (entitlementIds.length === 0) {
    return null;
  }

  const productId =
    active[REVENUECAT_ENTITLEMENTS.family]?.productIdentifier ||
    active[REVENUECAT_ENTITLEMENTS.premium]?.productIdentifier ||
    entitlementIds[0];

  return {
    platform: 'google',
    product_id: productId,
    transaction_id: `${appUserId}:restore:${Date.now()}`,
    revenuecat_app_user_id: appUserId,
    entitlement_ids: entitlementIds,
    revenuecat_customer_info: customerInfo,
  };
}

export function isRevenueCatUserCancelledError(error: unknown): boolean {
  const e = error as { userCancelled?: boolean; code?: string | number; message?: string };
  if (e?.userCancelled) {
    return true;
  }
  const msg = String(e?.message || '').toLowerCase();
  return msg.includes('cancel') && !msg.includes('network');
}
