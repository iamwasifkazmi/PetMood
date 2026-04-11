/**
 * Introductory free trial length (must match App Store Connect subscription offer).
 * Used in-app for disclosure copy only; billing is determined by Apple.
 */
export const SUBSCRIPTION_TRIAL_DAYS = 7;

/**
 * In-app limit: tries (scans) per day during the free-trial period (disclosure + enforce in app if needed).
 */
export const SUBSCRIPTION_TRIAL_TRIES_PER_DAY = 7;

/**
 * Subscription Product IDs for iOS In-App Purchases
 * These must match the product IDs configured in App Store Connect
 */
export const SUBSCRIPTION_PRODUCT_IDS = {
  // Premium Plan
  PREMIUM_MONTHLY: 'com.petmood.premium.monthly',
  PREMIUM_ANNUAL: 'com.petmood.premium.annual',
  
  // Family Plan (optional, +2 pets)
  FAMILY_MONTHLY: 'com.petmood.family.monthly',
  FAMILY_ANNUAL: 'com.petmood.family.annual',
} as const;

/**
 * Subscription Plan Types
 */
export type SubscriptionPlanType = 'premium' | 'family';
export type SubscriptionPeriod = 'monthly' | 'annual';

/**
 * Subscription Plan Configuration
 */
export interface SubscriptionPlan {
  id: string;
  type: SubscriptionPlanType;
  period: SubscriptionPeriod;
  /** Apple 3.1.2: show subscription length clearly (e.g. 1 month, 1 year) */
  durationLabel: string;
  price: number;
  priceFormatted: string;
  productId: string;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium_monthly',
    type: 'premium',
    period: 'monthly',
    durationLabel: '1 month',
    price: 7.99,
    priceFormatted: '7.99€',
    productId: SUBSCRIPTION_PRODUCT_IDS.PREMIUM_MONTHLY,
    description: 'Premium Plan - Monthly',
  },
  {
    id: 'premium_annual',
    type: 'premium',
    period: 'annual',
    durationLabel: '1 year',
    price: 79.99,
    priceFormatted: '79.99€',
    productId: SUBSCRIPTION_PRODUCT_IDS.PREMIUM_ANNUAL,
    description: 'Premium Plan - Annual',
  },
  {
    id: 'family_monthly',
    type: 'family',
    period: 'monthly',
    durationLabel: '1 month',
    price: 9.99,
    priceFormatted: '9.99€',
    productId: SUBSCRIPTION_PRODUCT_IDS.FAMILY_MONTHLY,
    description: 'Family Plan (optional, +2 pets) - Monthly',
  },
  {
    id: 'family_annual',
    type: 'family',
    period: 'annual',
    durationLabel: '1 year',
    price: 99.99,
    priceFormatted: '99.99€',
    productId: SUBSCRIPTION_PRODUCT_IDS.FAMILY_ANNUAL,
    description: 'Family Plan (optional, +2 pets) - Annual',
  },
];

/**
 * Get all product IDs as an array
 */
export const getAllProductIds = (): string[] => {
  return Object.values(SUBSCRIPTION_PRODUCT_IDS);
};

/**
 * Get product ID by plan type and period
 */
export const getProductId = (
  type: SubscriptionPlanType,
  period: SubscriptionPeriod,
): string => {
  const plan = SUBSCRIPTION_PLANS.find(
    p => p.type === type && p.period === period,
  );
  return plan?.productId || '';
};
