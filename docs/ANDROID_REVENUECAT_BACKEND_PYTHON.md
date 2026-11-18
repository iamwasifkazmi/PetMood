# Android IAP — Backend (Python) + RevenueCat

**Audience:** PetMood Python backend developers  
**Status:** Android app side is implemented (`react-native-purchases`). iOS stays on StoreKit / existing Apple verify path.  
**Related:** `ANDROID_GOOGLE_PLAY_CONSOLE.md` (Play + RC dashboard) · `ANDROID_REVENUECAT_APP.md` (app)

---

## 0. What you must deliver (backend checklist)

| # | Requirement | Why |
|---|-------------|-----|
| 1 | Accept `POST /api/subscriptions/verify-receipt` with `platform: "google"` | App calls this right after Play purchase / restore |
| 2 | Verify via **RevenueCat REST** (secret key), do **not** trust client `revenuecat_customer_info` alone | Anti-spoofing |
| 3 | Webhook endpoint for RC events (minimum below) | Renewals / cancel / expire when app is closed |
| 4 | Look up user by RevenueCat `app_user_id` = PetMood user id (**Firebase `uid` today**) | Identity binding |
| 5 | Keep `GET /api/subscriptions/status` as **source of truth** for quotas | App never unlocks from RC ClientInfo alone |
| 6 | `POST /restore` re-syncs Google/RC for authenticated user | Restore Purchases button |
| 7 | `POST /cancel` returns Play manage URL (do not cancel billing server-side) | In-app “Cancel” opens Play |
| 8 | Leave Apple `platform` / missing-platform path unchanged | iOS must keep working |

**Mandatory webhook events (security list):**

- `INITIAL_PURCHASE`
- `RENEWAL`
- `CANCELLATION`
- `EXPIRATION`

Also handle when possible: `PRODUCT_CHANGE`, `UNCANCELLATION`, `BILLING_ISSUE`, `TRANSFER`, `SUBSCRIBER_ALIAS`.

---

## 1. Architecture

```
Google Play Billing
        │
        ▼
RevenueCat
  - validates Play purchases
  - tracks renewals, cancels, grace, billing retry
  - webhooks → PetMood API
        │
        ▼
PetMood Python API
  - maps RC → subscription row + quotas
  - GET /subscriptions/status  ← app source of truth
```

**Two sync paths (use both):**

1. **Client verify (fast UX)** — after purchase/restore, app POSTs verify-receipt.  
2. **Webhooks (correct lifecycle)** — RC notifies server even if the app is closed.

---

## 2. Identity (critical)

| Layer | Value |
|-------|--------|
| App RevenueCat `appUserID` | Firebase **`uid`** from profile (`user.uid`) — treated as PetMood db user id for RC |
| Auth to our API | Firebase Bearer ID token (unchanged) |
| Webhook lookup | `event.app_user_id` / `original_app_user_id` → user with that uid |

Rules:

1. Never grant paid access for anonymous RC users.
2. On login the app calls `Purchases.logIn(uid)`; on logout `Purchases.logOut()`.
3. On verify: resolve Bearer → user; ensure `revenuecat_app_user_id` matches that user’s `uid` (or ignore client field and force server uid).
4. If product later switches to a numeric DB PK, **app + webhooks + verify must change together**.

---

## 3. Product / entitlement map

Same product IDs as iOS / Play:

| Product ID | Plan | Period | RC entitlement |
|------------|------|--------|----------------|
| `com.petmood.premium.monthly` | premium | monthly | `premium` |
| `com.petmood.premium.annual` | premium | annual | `premium` |
| `com.petmood.family.monthly` | family | monthly | `family` |
| `com.petmood.family.annual` | family | annual | `family` |

Reject any product id outside this allow-list.

---

## 4. Data model (extend existing subscription)

```text
Subscription
  user_id
  platform                 # 'apple' | 'google'
  product_id
  plan_type                # premium | family
  period                   # monthly | annual
  store_transaction_id
  original_transaction_id
  revenuecat_app_user_id
  entitlement_ids
  is_active
  is_trial
  will_renew
  expires_at
  grace_period_expires_at
  billing_issue_detected_at
  canceled_at
  raw_payload
  updated_at
```

`GET /status` response shape stays the same for the app (`subscription` + `quotas`).

Suggested tiers: `account_trial` | `expired_locked` | `premium` | `family`  
(optional Play intro: reuse `premium_storekit_trial` / `family_storekit_trial` or add `premium_play_trial`).

---

## 5. API contracts (what the Android app sends)

### 5.1 `POST /api/subscriptions/verify-receipt` — Google

**Auth:** Firebase Bearer (required)

**Body the Android app sends today:**

```json
{
  "platform": "google",
  "product_id": "com.petmood.premium.monthly",
  "transaction_id": "<string from RC / Play>",
  "revenuecat_app_user_id": "<firebase uid>",
  "entitlement_ids": ["premium"],
  "revenuecat_customer_info": { }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `platform` | yes | `"google"` for Android |
| `product_id` | yes | Must be allow-listed |
| `transaction_id` | yes | Opaque string; may be RC/Play id or fallback sync id |
| `revenuecat_app_user_id` | yes | Must match authenticated user’s uid |
| `entitlement_ids` | recommended | Hint only — re-check via RC REST |
| `revenuecat_customer_info` | optional | Hint only — **re-fetch server-side** |

**Apple path unchanged** when `platform` is missing or `"apple"` (transaction_id + optional `signed_transaction_jws`).

**Server steps for Google:**

1. Authenticate Firebase Bearer → PetMood user (`uid`).
2. Confirm `revenuecat_app_user_id == user.uid` (or overwrite with server uid).
3. `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` with **secret** API key.
4. Confirm active entitlement `premium` or `family` and matching product.
5. Upsert subscription `platform=google`, recompute quotas.
6. Return same shape as iOS:

```json
{
  "success": true,
  "subscription": {
    "plan_type": "premium",
    "period": "monthly",
    "expires_at": "2026-12-01T00:00:00Z",
    "is_active": true
  }
}
```

### 5.2 `GET /api/subscriptions/status`

No contract change. Internally merge Apple + Google + account trial. Prefer active paid over free trial. Honor grace if product policy says so.

### 5.3 `POST /api/subscriptions/restore`

Auth: Firebase Bearer.

1. Resolve user uid.
2. Fetch RC subscriber for that `app_user_id`.
3. Attach active entitlements; return updated subscriptions/quotas (or empty if none).
4. App then re-fetches `GET /status`.

### 5.4 `POST /api/subscriptions/cancel`

Do **not** cancel Play billing. Return:

```json
{
  "success": true,
  "platform": "google",
  "canCancelDirectlyFromBackend": false,
  "manageSubscriptionUrl": "https://play.google.com/store/account/subscriptions?sku=com.petmood.premium.monthly&package=com.aipetmood",
  "message": "Manage or cancel in Google Play"
}
```

Fallback if product unknown:

`https://play.google.com/store/account/subscriptions`

### 5.5 `GET /api/subscriptions/plans` (optional enhancement)

Include Google rows:

```json
{
  "product_id": "com.petmood.premium.monthly",
  "plan_type": "premium",
  "period": "monthly",
  "platform": "google",
  "price_display": "€7.99"
}
```

App prefers live Play/RC prices when available; backend prices are fallback.

---

## 6. RevenueCat webhooks

### 6.1 Endpoint

`POST /api/subscriptions/webhooks/revenuecat`

- **No** Firebase user token
- Verify shared secret (Authorization header / RC webhook auth)
- Idempotent by event `id` / transaction id
- Always return `2xx` for duplicates after no-op

### 6.2 Event handling

| Event | Backend action |
|-------|----------------|
| `INITIAL_PURCHASE` | Activate plan, set `expires_at`, clear `expired_locked` |
| `RENEWAL` | Extend `expires_at`, `will_renew=true`, clear billing issue |
| `CANCELLATION` | `will_renew=false`, **keep access until** `expires_at` |
| `EXPIRATION` | Deactivate paid access → trial / `expired_locked` rules |
| `PRODUCT_CHANGE` | Update product / plan / period |
| `UNCANCELLATION` | `will_renew=true` |
| `BILLING_ISSUE` | Flag; honor grace end if present |
| `TRANSFER` / `SUBSCRIBER_ALIAS` | Merge identities carefully |

### 6.3 Handler sketch

```python
@router.post("/subscriptions/webhooks/revenuecat")
def revenuecat_webhook(request, authorization: str = Header(None)):
    assert authorization == settings.REVENUECAT_WEBHOOK_SECRET
    event = parse_event(request.json())
    user = find_user_by_uid(event.app_user_id)  # RC app_user_id == Firebase uid
    if not user:
        return {"ok": True}  # log unknown; avoid endless retries if intentional
    apply_revenuecat_event(user, event)
    return {"ok": True}
```

---

## 7. Env / secrets (server only)

| Env var | Where | Notes |
|---------|--------|--------|
| `REVENUECAT_SECRET_API_KEY` | Backend | Server-only; never in the mobile app |
| `REVENUECAT_WEBHOOK_SECRET` | Backend | Matches RC webhook auth |
| `REVENUECAT_GOOGLE_APP_ID` | Backend (optional) | If your RC REST calls need it |

Mobile app only has the **public** Google SDK key (`goog_…`) in `src/common/config.ts`.

---

## 8. Security checklist

- [ ] Webhooks: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
- [ ] `app_user_id` = Firebase `uid` (current app binding)
- [ ] Trust RC secret API + webhooks, not client CustomerInfo alone
- [ ] Bind verify to authenticated Firebase user
- [ ] Allow-list product ids `com.petmood.*`
- [ ] Idempotent webhooks; store raw payloads
- [ ] Log `platform` (`google` vs `apple`) on every activation
- [ ] Do not delete historical rows; mark expired

---

## 9. Testing plan (backend)

1. License-tester purchase → client verify → `GET /status` active  
2. Webhook `INITIAL_PURCHASE` alone → status active  
3. `RENEWAL` extends `expires_at`  
4. `CANCELLATION` keeps access until period end  
5. `EXPIRATION` → locked / trial rules  
6. Restore after reinstall, same Firebase user  
7. User A purchase cannot activate User B  
8. Apple path still works after Google changes  

---

## 10. Definition of done (backend)

- [ ] `verify-receipt` accepts `platform=google` and validates via RevenueCat REST  
- [ ] Webhook secured + idempotent for the four mandatory events  
- [ ] `GET /status` reflects Google entitlements + quotas  
- [ ] `restore` re-attaches RC subscriber to user  
- [ ] `cancel` returns Play manage URL  
- [ ] Apple path intact  

---

## 11. What backend needs from others

| From | Needed |
|------|--------|
| **RevenueCat dashboard** | Secret API key, webhook URL + shared secret, entitlements `premium` / `family` |
| **Google Play** (via mobile/ops) | Service account linked to RC so Play purchases validate (see Play Console doc) |
| **App team** | Confirm `app_user_id` stays Firebase `uid`; public `goog_` key already in app config when ready |

---

## 12. Related docs

- Google Play Console + what we need from Play: `ANDROID_GOOGLE_PLAY_CONSOLE.md`  
- App implementation: `ANDROID_REVENUECAT_APP.md`  
- Apple verify notes: `IAP_VERIFY_RECEIPT_AND_BACKEND.md`  
