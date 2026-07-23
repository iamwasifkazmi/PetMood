/**
 * Subscription Types
 */

export type SubscriptionTier = 'none' | 'trial' | 'family' | 'premium';

/** Backend-enforced limits from GET /api/subscriptions/status */
export interface SubscriptionQuotas {
  tier: SubscriptionTier;
  /** Cap on pet profiles; null = unlimited */
  maxProfiles: number | null;
  profilesUsed: number;
  /** Remaining profiles that can be created; 0 = at cap */
  profilesRemaining: number | null;
  scansAllowed: boolean;
  scansPerDay: number;
  scansUsedToday: number;
  /** Remaining scans today; null = unlimited */
  scansRemainingToday: number | null;
  requiresSubscription: boolean;
  /** When daily scan counter resets (UTC midnight ISO) */
  resetsAt: string | null;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planType: 'premium' | 'family' | null;
  period: 'monthly' | 'annual' | null;
  expiresAt: string | null;
  productId: string | null;
  /** From GET /api/subscriptions/status — backend is source of truth */
  isTrial: boolean;
  /** Total trial days when on trial; null if not on trial or unknown */
  trialDays: number | null;
  /** Remaining full trial days, derived by backend from expires_at */
  trialDaysLeft: number | null;
  /** Maps API `subscription.status`, e.g. active, expired, canceled, trialing */
  backendStatus: string | null;
  /** Top-level `access_active` from GET /subscriptions/status */
  accessActive?: boolean | null;
  /** Top-level `reason`, e.g. expired_or_not_renewed */
  accessReason?: string | null;
}

export interface SubscriptionStatusResponse {
  subscription: SubscriptionStatus | null;
  quotas: SubscriptionQuotas;
  accessActive?: boolean | null;
  accessReason?: string | null;
}

// Backend subscription format (from API)
export interface BackendSubscription {
  plan_type: 'premium' | 'family';
  period: 'monthly' | 'annual';
  expires_at: string;
  is_active: boolean;
  product_id?: string;
}

export interface PurchaseReceipt {
  transactionReceipt: string;
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
}

/**
 * POST /api/subscriptions/verify-receipt
 *
 * The app does not send legacy base64 `receipt-data`. It sends Apple transaction
 * identifiers plus, when available, the StoreKit 2 JWS from the purchase
 * (`purchaseToken` on iOS in react-native-iap — same unified field name).
 */
export interface VerifyReceiptRequest {
  /** App Store subscription / IAP product id (e.g. com.petmood.premium.monthly) */
  product_id: string;
  /** Current transaction id from StoreKit (string) */
  transaction_id: string;
  /** Subscription family id; stable across renewals (recommended when present) */
  original_transaction_id?: string;
  /**
   * StoreKit 2 signed transaction JWS (optional but recommended).
   * On iOS this is taken from `purchase.purchaseToken` in react-native-iap.
   * Backend may verify this JWS directly or rely on `transaction_id` + App Store Server API.
   */
  signed_transaction_jws?: string;
}

export interface VerifyReceiptResponse {
  success: boolean;
  subscription?: {
    plan_type: 'premium' | 'family';
    period: 'monthly' | 'annual';
    expires_at: string;
    is_active: boolean;
  };
  message?: string;
}

export interface PlanLimitTier {
  maxProfiles: number | null;
  scansPerDay: number | null;
}

export interface SubscriptionPlan {
  product_id: string;
  name: string;
  plan_type: 'premium' | 'family';
  period: 'monthly' | 'annual';
  platform: 'apple';
  price_display: string;
  trial_offer?: {
    enabled?: boolean;
    days?: number;
  };
  limits?: {
    paid?: PlanLimitTier;
    trial?: PlanLimitTier;
  };
}

export interface PlansResponse {
  plans: SubscriptionPlan[];
}

export interface RestorePurchasesResponse {
  subscriptions: SubscriptionStatus[];
  quotas?: SubscriptionQuotas;
}

/** POST /api/subscriptions/cancel */
export interface CancelSubscriptionResponse {
  success: boolean;
  platform?: string;
  canCancelDirectlyFromBackend?: boolean;
  message?: string;
  manageSubscriptionUrl: string;
}

/** Backend error `code` values for quota / paywall routing */
export type SubscriptionErrorCode =
  | 'subscription_required'
  | 'profile_limit_reached';
