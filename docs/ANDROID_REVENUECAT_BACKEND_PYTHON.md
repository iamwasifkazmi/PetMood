# Android In-App Purchases — Backend (Python) with RevenueCat

This document describes what the **PetMood Python backend** should do to support **Google Play** subscriptions via **RevenueCat**, while keeping the same entitlement/quota model already used for iOS.

Current backend contracts the app already uses:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/subscriptions/plans` | Catalog / display |
| `POST` | `/api/subscriptions/verify-receipt` | Trust purchase after client buy |
| `GET` | `/api/subscriptions/status` | **Source of truth** (active, trial, quotas) |
| `POST` | `/api/subscriptions/restore` | Re-link purchases to user |
| `POST` | `/api/subscriptions/cancel` | Return store manage URL (does not cancel billing) |

iOS today verifies Apple transactions. Android should use **RevenueCat as the Play billing middleware**, with our API remaining the authority for PetMood access.

---

## 1. Recommended backend architecture

```
Google Play Billing
        │
        ▼
RevenueCat
  - validates Play purchases
  - tracks renewals, cancels, grace, billing retry
  - sends webhooks to our backend
        │
        ▼
PetMood Python API
  - maps RC events → user subscription row
  - computes quotas / tiers
  - exposes GET /subscriptions/status to the app
```

**Two sync paths (use both):**

1. **Client-driven sync (fast UX)**  
   After `Purchases.purchasePackage` / `restorePurchases`, app calls our API so unlock is immediate.

2. **Webhook-driven sync (correct lifecycle)**  
   RevenueCat notifies us of renewals, cancellations, expiration, billing issues, product changes — even if the app is closed.

Renewal Kit on the app helps UI freshness; **webhooks** keep the database correct.

---

## 2. Identity linking (critical)

RevenueCat `app_user_id` must equal a stable PetMood user identifier.

Recommended:

- Use Firebase `uid` as RevenueCat `appUserID`
- Store on user: `firebase_uid`, `revenuecat_app_user_id` (same value)

Rules:

1. Never create paid entitlements for anonymous/random ids in production
2. On login, app calls `Purchases.logIn(firebaseUid)` so historical Play purchases attach to the right user
3. Backend webhook handler must look up user by `app_user_id` / `original_app_user_id`

---

## 3. Data model changes (Python)

Extend the existing subscription table / model (names illustrative):

```text
Subscription
  user_id
  platform                 # 'apple' | 'google'
  product_id               # com.petmood.premium.monthly, etc.
  plan_type                # premium | family
  period                   # monthly | annual
  store_transaction_id     # Play order id / RC transaction id when available
  original_transaction_id  # stable subscription id if available
  revenuecat_subscriber_id # optional
  entitlement_ids          # e.g. ["premium"]
  is_active
  is_trial                 # Play intro offer / RC period type
  will_renew               # from RC renewal info
  expires_at
  grace_period_expires_at  # nullable
  billing_issue_detected_at# nullable
  canceled_at              # nullable (user turned off auto-renew)
  raw_payload              # last RC customer info / event JSON (audit)
  updated_at
```

Quota computation should continue to return the existing shape consumed by the app:

- `tier`
- `maxProfiles` / `profilesUsed` / `profilesRemaining`
- `scansAllowed` / `scansPerDay` / `scansUsedToday` / `scansRemainingToday`
- `requiresSubscription`
- `resetsAt`

Suggested Google tiers (mirror Apple naming where useful):

| Situation | `tier` example |
|-----------|----------------|
| No paid sub, account trial active | `account_trial` |
| Trial ended, no paid sub | `expired_locked` |
| Active Premium | `premium` |
| Active Family | `family` |
| Play intro offer on Premium | `premium_play_trial` (or reuse `premium_storekit_trial` if you want one name) |
| Play intro offer on Family | `family_play_trial` |

Pick one naming scheme and keep `GET /status` stable for the app.

---

## 4. API changes

### 4.1 Extend `POST /api/subscriptions/verify-receipt`

Keep the path for app compatibility; make it multi-platform.

**Request (suggested):**

```json
{
  "platform": "google",
  "product_id": "com.petmood.premium.monthly",
  "revenuecat_app_user_id": "firebaseUidHere",
  "revenuecat_customer_info": { },
  "entitlement_ids": ["premium"],
  "transaction_id": "GPA.1234-5678-9012-34567",
  "purchase_token": "optional-if-you-still-want-raw-play-token"
}
```

Notes:

- For Android + RevenueCat, prefer verifying via **RevenueCat REST API** (server-side) using the `app_user_id`, not trusting the client JSON alone.
- `platform: "apple"` keeps the existing Apple JWS / transaction verification path.

**Server steps for `platform=google`:**

1. Authenticate Firebase Bearer → resolve PetMood user
2. Confirm `revenuecat_app_user_id` matches that user (or force the known uid)
3. Call RevenueCat REST: get subscriber / customer info for that app user id
4. Confirm active entitlement (`premium` or `family`) and product id
5. Upsert subscription row (`platform=google`)
6. Recompute quotas
7. Return `{ success, subscription }` same shape as iOS

### 4.2 Keep `GET /api/subscriptions/status` as source of truth

No change to response contract if possible. Internally:

- Merge account-level trial with paid Google/Apple subscription
- Prefer paid active entitlement over free trial
- Include grace period: decide product policy (usually keep access until grace ends)

### 4.3 `POST /api/subscriptions/restore`

For Google:

1. Optionally accept RC customer info from client
2. Always re-fetch RevenueCat subscriber server-side
3. Attach found active entitlements to the authenticated user
4. Return updated status / subscription

### 4.4 `POST /api/subscriptions/cancel`

Do **not** cancel Play billing in backend (impossible the way merchants expect).

Return:

```json
{
  "success": true,
  "manageSubscriptionUrl": "https://play.google.com/store/account/subscriptions?sku=com.petmood.premium.monthly&package=com.aipetmood"
}
```

If product id unknown, return the generic Play subscriptions URL.

### 4.5 `GET /api/subscriptions/plans`

Extend plans to include Google:

```json
{
  "product_id": "com.petmood.premium.monthly",
  "plan_type": "premium",
  "period": "monthly",
  "platform": "google",
  "price_display": "€7.99"
}
```

App can still prefer live RevenueCat/Play localized price when available.

---

## 5. RevenueCat webhooks (Python)

### 5.1 Endpoint

Create e.g.:

`POST /api/subscriptions/webhooks/revenuecat`

- No Firebase user token
- Verify RevenueCat **Authorization** shared secret header
- Idempotent by `id` / `event_timestamp` / store transaction id

### 5.2 Events to handle

At minimum:

| Event | Backend action |
|-------|----------------|
| `INITIAL_PURCHASE` | Activate plan, set expires_at, clear expired_locked |
| `RENEWAL` | Extend expires_at, mark will_renew=true, clear billing issue |
| `PRODUCT_CHANGE` | Update product_id / plan_type / period |
| `CANCELLATION` | Set will_renew=false, keep access until expires_at |
| `UNCANCELLATION` | Set will_renew=true |
| `EXPIRATION` | Deactivate paid access; fall back to account trial rules / expired_locked |
| `BILLING_ISSUE` | Flag billing issue; honor grace if RC provides grace period end |
| `SUBSCRIBER_ALIAS` | Merge identities if needed |
| `TRANSFER` | Move entitlement between app user ids carefully |

Renewal Kit on the client covers UX for many of these; webhook handling is still required so scanner quotas stay correct when the app is killed.

### 5.3 Example handler outline (FastAPI / Django style)

```python
@router.post("/subscriptions/webhooks/revenuecat")
def revenuecat_webhook(request, authorization: str = Header(None)):
    assert authorization == settings.REVENUECAT_WEBHOOK_SECRET
    event = parse_event(request.json())
    user = find_user_by_rc_app_user_id(event.app_user_id)
    if not user:
        # log + 200 to avoid endless retries only if you intentionally ignore unknowns
        return {"ok": True}

    apply_revenuecat_event(user, event)  # upsert subscription + quotas
    return {"ok": True}
```

Always return `2xx` for duplicate/old events after no-op.

---

## 6. Server-side RevenueCat REST usage

Configure:

- `REVENUECAT_SECRET_API_KEY` (server only)
- `REVENUECAT_WEBHOOK_SECRET`
- `REVENUECAT_GOOGLE_APP_ID` / project id as needed

Use secret key to:

1. `GET /v1/subscribers/{app_user_id}` after client verify/restore
2. Optionally grant/revoke promotional entitlements (support tools) — optional

Never expose the secret key to the mobile app.

---

## 7. Quotas & business rules (unchanged product intent)

Keep existing PetMood rules unless product changes them:

| Tier | Profiles | Scans |
|------|----------|-------|
| Account trial | per current backend rule (e.g. 2) | e.g. 7/day |
| Expired / locked | blocked or limited | scans blocked |
| Premium paid | per backend rule | unlimited (if that remains policy) |
| Family paid | higher profile cap | per backend rule |

Google purchases should only change tier when RevenueCat shows an **active** entitlement (or valid grace policy you choose).

---

## 8. Security checklist (backend)

1. Trust **RevenueCat secret API + webhooks**, not client-only payloads
2. Bind purchases to authenticated Firebase user
3. Reject product ids outside the allow-list (`com.petmood.*`)
4. Store raw event payloads for support disputes
5. Make webhook processing idempotent
6. Do not delete historical subscription rows; mark expired
7. Log platform (`google` vs `apple`) for every activation

---

## 9. Testing plan (backend)

1. Sandbox / license tester purchase → client verify → status active
2. Webhook `INITIAL_PURCHASE` alone (no client call) → status active
3. `RENEWAL` extends `expires_at`
4. `CANCELLATION` keeps access until period end
5. `EXPIRATION` moves user to `expired_locked` / trial rules
6. `BILLING_ISSUE` + grace → access policy matches product decision
7. Restore after reinstall with same Firebase user
8. User A purchase cannot activate User B

---

## 10. Definition of done (backend)

- [ ] `verify-receipt` accepts `platform=google` and validates via RevenueCat
- [ ] Webhook endpoint secured and idempotent
- [ ] `GET /status` reflects Google entitlements + quotas
- [ ] `restore` re-attaches RC subscriber to user
- [ ] `cancel` returns Play manage URL
- [ ] `plans` can return Google products
- [ ] Apple path remains intact

---

## 11. Related docs

- App implementation: `ANDROID_REVENUECAT_APP.md`
- Google Play Console setup: `ANDROID_GOOGLE_PLAY_CONSOLE.md`
- Existing Apple verify notes: `IAP_VERIFY_RECEIPT_AND_BACKEND.md`
