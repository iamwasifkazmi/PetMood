# iOS IAP: verify-receipt payload and backend verification (A–Z)

This document is the **source of truth** for how the PetMood React Native app talks to the API after an in-app purchase, and what the **backend** must implement to verify subscriptions with Apple.

Related app code:

- `src/features/subscription/subscriptionApiSlice.ts` — HTTP routes
- `src/features/subscription/types.ts` — `VerifyReceiptRequest` / `VerifyReceiptResponse`
- `src/services/subscriptionService.ts` — builds the payload from StoreKit / `react-native-iap`

---

## 1. What the app does (client flow)

1. User buys a subscription in the **App Store** (StoreKit). The app uses `react-native-iap` (`requestPurchase`, listeners).
2. On success, the app receives a **`Purchase`** object.
3. The app **does not** send the old-style base64 **app receipt blob** (`receipt-data`) to your API for the primary flow. It sends:
   - `product_id`
   - `transaction_id`
   - optionally `original_transaction_id`
   - optionally `signed_transaction_jws` (StoreKit 2 **signed transaction JWS**, from `purchase.purchaseToken` on iOS in `react-native-iap`)
4. The backend must **verify with Apple** (never trust the client alone) and then **persist** subscription state for the authenticated user.

---

## 2. Endpoint: verify receipt

| Item | Value |
|------|--------|
| Method | `POST` |
| Path | `/api/subscriptions/verify-receipt` |
| Full URL (production example) | `https://pet-emotion-detection.onrender.com/api/subscriptions/verify-receipt` |
| Auth | `Authorization: Bearer <Firebase ID token>` (user must be logged in) |
| Content-Type | `application/json` |

### 2.1 Request body (JSON)

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| `product_id` | string | **Yes** | App Store product id, e.g. `com.petmood.premium.monthly` |
| `transaction_id` | string | **Yes** | Current StoreKit transaction id |
| `original_transaction_id` | string | No | Stable id for the subscription group (recommended for renewals) |
| `signed_transaction_jws` | string | No | StoreKit 2 **JWS** for the transaction. Sent when iOS exposes it on `purchase.purchaseToken`. Backend may decode/verify this **or** use `transaction_id` with App Store Server API. |

**Minimal example (always valid for the app):**

```json
{
  "product_id": "com.petmood.premium.monthly",
  "transaction_id": "1000001234567890"
}
```

**Full example (when JWS is available):**

```json
{
  "product_id": "com.petmood.premium.monthly",
  "transaction_id": "1000001234567890",
  "original_transaction_id": "1000001234567890",
  "signed_transaction_jws": "eyJhbGciOiJFUzI1NiIs..."
}
```

### 2.2 Success response (JSON)

Aligned with `VerifyReceiptResponse` in the app:

```json
{
  "success": true,
  "subscription": {
    "plan_type": "premium",
    "period": "monthly",
    "expires_at": "2026-02-12T17:20:00Z",
    "is_active": true
  }
}
```

### 2.3 Error response (JSON)

```json
{
  "success": false,
  "message": "Human-readable reason"
}
```

---

## 3. What the backend must do to “verify” (Apple)

You have two complementary approaches. Production backends often use **both**: JWS for immediate trust, App Store Server API for authoritative server-side checks and renewals.

### 3.1 Prerequisites (Apple)

1. **App Store Connect API key** (`.p8`), **Key ID**, **Issuer ID** — used to mint JWTs for **App Store Server API**.
2. **Bundle ID** of the iOS app (must match the app that owns the transactions).
3. Decide **Sandbox vs Production**:
   - Sandbox: `https://api.storekit-sandbox.itunes.apple.com`
   - Production: `https://api.storekit.itunes.apple.com`  
   On `401` with wrong environment, many implementations **retry** the other host (Apple’s documented pattern).

See also in this repo: `docs/APP_STORE_CONNECT_API_KEY_GUIDE.md`.

### 3.2 Option A — Verify `signed_transaction_jws` (StoreKit 2 JWS)

If the client sends `signed_transaction_jws`:

1. Parse the JWS (three base64url segments).
2. Verify the signature using **Apple’s root certificates** and the **X.509 chain** embedded in the JWS header (Apple documents this under “Verifying a transaction” / JWS validation).
3. Decode the payload; confirm:
   - `bundleId` matches your app
   - `productId` matches `product_id` from the request (or your mapping)
   - Transaction state is valid for granting access (e.g. subscription active or in grace period as per your rules)
4. Extract expiry / renewal fields from the decoded transaction and renewal info as needed.

Use this for fast validation when the JWS is present.

### 3.3 Option B — App Store Server API using `transaction_id`

If you only have `transaction_id` (or in addition to JWS):

1. Generate a **JWT** for App Store Server API (ES256, `aud`: `appstoreconnect-v1`).
2. Call **Get Transaction Info** (or related endpoints) with the `transaction_id`:
   - `GET /inApps/v1/transactions/{transactionId}`
3. The response includes signed transaction information; verify and parse per Apple’s docs.
4. Map `product_id` to your internal `plan_type` / `period` (same mapping as `/subscriptions/plans` / `PRODUCT_MAPPING` on the server).

### 3.4 Legacy `verifyReceipt` (receipt blob)

The older **verifyReceipt** HTTP API with base64 `receipt-data` is **not** what this app sends by default. You may still support it for older clients or tools, but **PetMood’s current client uses transaction id + optional JWS**, not the blob, for this endpoint.

---

## 4. After verification: persist and tie to the user

1. Authenticate the request (**Firebase** token → resolve user id).
2. Store at least: `user_id`, `product_id`, `transaction_id`, `original_transaction_id` (if any), `expires_at`, `is_active`, environment (sandbox/production) if you need it.
3. Return the `subscription` object in the shape the app expects (snake_case from API; the app normalizes some fields where configured).

---

## 5. Other subscription endpoints (same API family)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/subscriptions/plans` | List plans (often public) |
| `GET` | `/api/subscriptions/status` | Current subscription for logged-in user |
| `POST` | `/api/subscriptions/restore` | Restore / resync (body often `{}`) |
| `POST` | `/api/subscriptions/webhook` | App Store Server Notifications v2 (Apple → your server) |

Configure **App Store Server Notifications** in App Store Connect to point to your webhook so renewals, cancellations, and refunds update **Firestore/DB** even when the app is closed.

---

## 6. Testing checklist

1. **Sandbox** Apple ID in Settings → App Store on device.
2. Buy subscription → confirm `verify-receipt` returns `success: true` and DB updates.
3. **Restore** → confirm `status` / `restore` reflect stored state.
4. Trigger a **server notification** (or use Apple’s testing tools) and confirm webhook updates entitlement.

---

## 7. Document history

- **Verify-receipt contract** matches `VerifyReceiptRequest` in `src/features/subscription/types.ts`.
- **`signed_transaction_jws`** is sent from `subscriptionService` when `purchase.store === 'apple'` and `purchaseToken` is set on the purchase.

For a shorter backend-only checklist, see `docs/BACKEND_IAP_REQUIREMENTS.md` (kept in sync with this file).
