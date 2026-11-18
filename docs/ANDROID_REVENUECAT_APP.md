# Android In-App Purchases — App Side (RevenueCat)

**Status:** Implemented in the RN app (Android only). iOS remains StoreKit / `react-native-iap`.

This document describes the **PetMood React Native** Android path for **Google Play** subscriptions via **RevenueCat Purchases**.

Related:

- Backend: `ANDROID_REVENUECAT_BACKEND_PYTHON.md`
- Play Console / what we need from Google: `ANDROID_GOOGLE_PLAY_CONSOLE.md`

iOS (unchanged):

- StoreKit via `react-native-iap`
- Backend is still the **source of truth** for entitlements / quotas (`GET /api/subscriptions/status`)
- Product IDs: `com.petmood.premium.monthly`, `com.petmood.premium.annual`, `com.petmood.family.monthly`, `com.petmood.family.annual`

**Android goal:** same catalog + status model, RevenueCat instead of raw Play Billing UI.

**App config:** public Google SDK key → `src/common/config.ts` → `revenuecat_google_api_key` (`goog_…`).  
**Identity:** `Purchases.logIn(user.uid)` (Firebase uid as RC `app_user_id`).

---

## 1. What we will use

### 1.1 Required: RevenueCat Purchases SDK

Package (React Native): `react-native-purchases` (RevenueCat Purchases).

Use it for:

1. Configuring the Android SDK with a RevenueCat **Google Play API key**
2. Identifying the logged-in PetMood user
3. Fetching offerings / packages (Premium Monthly/Annual, Family Monthly/Annual)
4. Purchasing a package
5. Restoring purchases
6. Reading CustomerInfo / entitlements for UI hints
7. Syncing the result to our Python backend so quotas unlock

### 1.2 Optional but recommended: RevenueCat Renewal Kit

Use Renewal Kit **on top of Purchases** when we want stronger subscription lifecycle UX:

1. Auto-renewal tracking
2. Expiration and cancellation handling
3. Grace period and billing-retry management
4. Keeping subscription status always up to date in the app UI

Renewal Kit does **not** replace our backend. It improves client-side freshness and renewal UX while webhooks keep the server in sync.

---

## 2. Architecture (app)

```
[User taps Subscribe on Android]
        │
        ▼
[RevenueCat Purchases SDK]
  - shows Google Play billing sheet
  - returns CustomerInfo / purchase result
        │
        ▼
[PetMood app]
  - POST verify / sync to our backend (see backend doc)
  - GET /api/subscriptions/status  ← source of truth for quotas
        │
        ▼
[UI unlocks scans / profiles based on quotas]
```

**Rules:**

- Never unlock Premium/Family from RevenueCat alone.
- Always refresh `GET /subscriptions/status` after purchase, restore, app foreground, and Renewal Kit status events.
- Keep iOS on the existing StoreKit path for now (or later migrate iOS to RevenueCat separately).

---

## 3. Product / entitlement mapping (app config)

Keep Google Play product IDs aligned with Apple when possible (same IDs are fine on Play if created that way):

| Plan | Period | Store product ID | Suggested RC entitlement |
|------|--------|------------------|--------------------------|
| Premium | Monthly | `com.petmood.premium.monthly` | `premium` |
| Premium | Annual | `com.petmood.premium.annual` | `premium` |
| Family | Monthly | `com.petmood.family.monthly` | `family` |
| Family | Annual | `com.petmood.family.annual` | `family` |

In RevenueCat dashboard:

- Create one **Offering** (e.g. `default`)
- Attach four **Packages** (monthly/annual × premium/family)
- Attach packages to entitlements `premium` / `family`

App constant updates (suggested):

- Keep `SUBSCRIPTION_PRODUCT_IDS` shared
- Add `REVENUECAT_GOOGLE_API_KEY` (from env / secure config — do **not** commit secrets)
- Optionally add `REVENUECAT_ENTITLEMENTS = { premium: 'premium', family: 'family' }`

---

## 4. App implementation checklist

### 4.1 Dependencies

```bash
npm install react-native-purchases
# If using Renewal Kit (when RN support/docs match your RC project):
# follow RevenueCat Renewal Kit install steps for React Native / Android
```

Android native setup:

- Ensure `com.android.billingclient` is available via the RC SDK (no separate Play Billing integration needed in app code)
- Confirm `APPLICATION_ID` / package name is `com.aipetmood`
- Release builds signed with the Play upload key already used for AAB uploads

### 4.2 Initialize SDK (Android only) — security requirements

**Mandatory (client / backend security list):**

1. **User binding:** Always call `Purchases.logIn(db_user_id)` with the **database user id** after login. Do **not** allow anonymous users to subscribe.
2. **Strict verification:** Configure SDK request verification with the strictest available mode. RevenueCat removed public `ENFORCED`; use `ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL` and reject `VERIFICATION_RESULT.FAILED` locally. Access still comes from backend/webhooks only.
3. **Server authority:** Access is granted from backend status/webhooks only — never unlock Premium/Family from client `CustomerInfo` alone.

On app start **after** the PetMood user session exists (db user id known):

1. `Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY, appUserID: dbUserId })`
2. `Purchases.setLogLevel(...)` as needed in debug only
3. Enable enforced verification (RN Purchases API; names may vary slightly by SDK version):

```ts
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ARE_COMPLETED_BY_TYPE,
} from 'react-native-purchases';
// Prefer the SDK's VerificationMode.ENFORCED when configuring Purchases
// (see current react-native-purchases docs for PurchasesConfiguration.entitlementVerificationMode)
```

4. On every successful login / session restore: `await Purchases.logIn(String(dbUserId))`
5. On logout: `await Purchases.logOut()`
6. **Purchase guard:** if there is no `db_user_id` / not logged in → block Subscribe / Restore (show login). Never start a Play purchase while anonymous.

Pseudo-flow:

```ts
if (Platform.OS === 'android') {
  Purchases.configure({
    apiKey: RC_GOOGLE_KEY,
    appUserID: String(dbUserId), // PetMood DB user id (not anonymous)
    // entitlementVerificationMode: ENFORCED  — required
  });
  await Purchases.logIn(String(dbUserId));
}
```

Do **not** call StoreKit/`react-native-iap` initialize on Android.

Identity note: use the **same** `db_user_id` the backend stores and looks up from RevenueCat webhooks (`app_user_id`). If product later standardizes on Firebase `uid`, backend + app must switch together — default for this security list is **DB user id**.

### 4.3 Fetch offerings for the Subscription screen

Replace the current Android “coming soon” / local-only plan cards with RC offerings:

1. `Purchases.getOfferings()`
2. Use `offerings.current` (or a named offering)
3. Map packages → Premium Monthly / Annual / Family Monthly / Annual UI cards
4. Show localized Play prices from RC package `product.priceString`
5. Fall back to `GET /subscriptions/plans` display prices only if offerings fail to load

### 4.4 Purchase flow

1. User selects a package
2. Guard: user must be logged in; if already active on another paid plan, keep current “cancel existing first” UX
3. `Purchases.purchasePackage(pkg)` (or `purchaseStoreProduct`)
4. On success:
   - Read `customerInfo.entitlements.active`
   - Call backend sync/verify endpoint with platform `google` / RevenueCat payload (see backend doc)
   - Force `GET /subscriptions/status`
   - Update Redux (`setSubscriptionStatus`) so scanner/home quotas unlock
5. Handle user cancel quietly (no error toast)
6. Handle already-owned → restore / sync path

Lift these current Android stubs:

- `subscriptionService.initialize` iOS-only gate
- `useSubscription` Android skip
- Subscription screen “Coming soon on Android” alert
- Disabled purchase buttons on Android

### 4.5 Restore purchases

Re-enable Restore on Android (and optionally iOS):

1. `Purchases.restorePurchases()`
2. Backend sync (`POST /subscriptions/restore` and/or Google/RC verify)
3. Force `GET /subscriptions/status`
4. Show success only if backend status is active

### 4.6 Cancel / manage subscription

Google Play cannot be cancelled inside the app the same way Apple cannot.

App should:

1. Call existing `POST /subscriptions/cancel` (backend returns a manage URL when possible)
2. Fallback open:

   `https://play.google.com/store/account/subscriptions?sku=<productId>&package=com.aipetmood`

   or generic:

   `https://play.google.com/store/account/subscriptions`

3. After returning to app, refresh status

### 4.7 Keep status fresh (with or without Renewal Kit)

**Without Renewal Kit (minimum):**

- Existing `SubscriptionEntitlementSync` on app foreground
- Refresh after purchase/restore
- Pull-to-refresh on Subscription screen

**With Renewal Kit (recommended):**

Listen / subscribe for:

1. Auto-renewal success / failure
2. Expiration
3. Cancellation (user turned off renew)
4. Billing retry / grace period
5. Entitlement regained after successful retry

On each meaningful event:

1. Update local “subscription health” UI (badge: Active / Grace / Expired)
2. Call backend status refresh (or rely on RC webhook → then `GET status`)
3. Do not invent quotas client-side

### 4.8 Account trial vs paid Play subscription

Keep current product rules:

- Backend `account_trial` / `expired_locked` still drive free trial **without** Play billing
- Play/RevenueCat purchases unlock `premium` / `family` (and any Play introductory offer trials mapped as storekit-equivalent tiers if backend adds `premium_play_trial` / similar)
- App continues to read quotas from status for scan/profile limits

---

## 5. Suggested code touch points

| File | Change |
|------|--------|
| `src/services/subscriptionService.ts` | Add Android RevenueCat path; keep iOS StoreKit path |
| `src/hooks/useSubscription.ts` | Init RC on Android; purchase/restore via RC |
| `src/screens/private/subscription/index.tsx` | Remove Android coming-soon; show RC packages; restore button |
| `src/constants/subscription.ts` | Entitlement ids + RC key placeholder docs |
| `src/features/subscription/types.ts` | Extend verify payload with `platform: 'google' \| 'apple'` and RC fields |
| `src/features/subscription/subscriptionApiSlice.ts` | Same endpoints; optional new sync body |
| `src/features/subscription/SubscriptionEntitlementSync.tsx` | Also refresh after RC / Renewal Kit events |
| Config | Add RevenueCat Google API key (secure) |

---

## 6. Security / QA notes (app)

1. RevenueCat **public** SDK key is OK in the app; never put Google Play **service account private keys** in the app.
2. Always send Firebase Bearer token on backend sync calls.
3. **`Purchases.logIn(db_user_id)`** on login; no anonymous subscribe.
4. **`ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL`** + reject `FAILED` (ENFORCED removed by RevenueCat; this is the supported strict path).
5. Test with **license testers** on Internal testing track before production.
6. Verify: purchase → status active → scan allowed; cancel in Play → eventually status expires; restore on reinstall after login.
7. Confirm Family vs Premium entitlement mapping cannot be spoofed by client (backend must validate via RC + webhooks).

---

## 7. Definition of done (app)

- [ ] `Purchases.logIn(db_user_id)` on login; subscribe blocked when logged out
- [ ] `VerificationMode.ENFORCED` enabled on Android
- [ ] Android can load live Play prices via RevenueCat offerings
- [ ] User can purchase Premium/Family monthly/annual
- [ ] Restore works after reinstall for the same Google account + PetMood login
- [ ] Backend status unlocks quotas after purchase
- [ ] Manage/cancel opens Play subscriptions
- [ ] Renewal Kit (if enabled) updates UI for renew / expire / grace / billing retry
- [ ] iOS existing StoreKit flow still works unchanged

---

## 8. Out of scope for this app doc

- Creating products in Play Console → see `ANDROID_GOOGLE_PLAY_CONSOLE.md`
- Webhooks, verify APIs, Python models → see `ANDROID_REVENUECAT_BACKEND_PYTHON.md`
