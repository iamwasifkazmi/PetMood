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

export interface VerifyReceiptRequest {
  product_id: string;
  transaction_id: string;
  original_transaction_id?: string;
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
