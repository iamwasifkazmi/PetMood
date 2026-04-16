/**
 * Subscription Types
 */

export interface SubscriptionStatus {
  isActive: boolean;
  planType: 'premium' | 'family' | null;
  period: 'monthly' | 'annual' | null;
  expiresAt: string | null;
  productId: string | null;
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

export interface SubscriptionPlan {
  product_id: string;
  name: string;
  plan_type: 'premium' | 'family';
  period: 'monthly' | 'annual';
  platform: 'apple';
  price_display: string;
}

export interface PlansResponse {
  plans: SubscriptionPlan[];
}

export interface RestorePurchasesResponse {
  subscriptions: SubscriptionStatus[];
}
