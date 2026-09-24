# Android In-App Purchases — Google Play Console Setup

This document is the **Google Play Console** checklist for PetMood Android subscriptions that will be sold through **RevenueCat Purchases** (and optionally tracked in-app with **RevenueCat Renewal Kit**).

App package name: `com.aipetmood`  
Existing product ID scheme (match iOS where possible):

| Product ID | Plan |
|------------|------|
| `com.petmood.premium.monthly` | Premium monthly |
| `com.petmood.premium.annual` | Premium annual |
| `com.petmood.family.monthly` | Family monthly |
| `com.petmood.family.annual` | Family annual |

Related docs:

- App: `ANDROID_REVENUECAT_APP.md`
- Backend: `ANDROID_REVENUECAT_BACKEND_PYTHON.md`

---

## 1. What Google Play Console is responsible for

In Play Console you will:

1. Publish the app on a testing track (Internal / Closed / Open) so Billing works
2. Create the subscription products and base plans
3. Configure free trials / offers (if required)
4. Set up a **Google Play service account** for RevenueCat to validate purchases
5. Add license testers
6. Link Privacy Policy / app content declarations required for billing apps
7. Upload signed AABs (`versionCode` must increase each upload)

RevenueCat then reads Play and exposes offerings to the app. PetMood backend listens to RevenueCat webhooks for renewals/cancellations.

You do **not** implement raw Play Billing Library purchase UI in app code if RevenueCat Purchases is used.

---

## 2. Prerequisites before creating subscriptions

Complete these first (Play blocks real IAP testing otherwise):

1. **App created** in Play Console with application id `com.aipetmood`
2. **Signing**
   - Upload key / app signing by Google Play configured
   - Same keystore used for release AABs already built for PetMood
3. At least one **AAB uploaded** to Internal testing (or higher)
4. **Store listing** draft with:
   - App name, short/full description
   - Screenshots
   - Privacy policy URL (`https://petmood.care/privacy-policy` or current URL)
5. **Pricing & distribution** countries selected
6. **Declarations** completed as prompted (Data safety, Advertising ID, Financial features if asked, etc.)

Subscriptions often stay “Inactive” / non-purchasable until the app is on a track and billing permissions are ready.

---

## 3. Create the subscription products

Play Console → **Monetize** → **Products** → **Subscriptions** → **Create subscription**

Create **four** subscriptions (or one subscription with multiple base plans — either model works; pick one and stay consistent with RevenueCat packaging).

### 3.1 Recommended simple model (four subscription products)

For each product ID below, create a subscription:

#### Premium Monthly
- Product ID: `com.petmood.premium.monthly`
- Name: `PetMood Premium Monthly`
- Description: clear benefits (scans, profiles — match store listing)
- Base plan: monthly auto-renewing
- Price: align with iOS display intent (e.g. €7.99) per country

#### Premium Annual
- Product ID: `com.petmood.premium.annual`
- Name: `PetMood Premium Annual`
- Base plan: yearly auto-renewing
- Price: e.g. €79.99

#### Family Monthly
- Product ID: `com.petmood.family.monthly`
- Name: `PetMood Family Monthly`
- Base plan: monthly
- Price: e.g. €9.99

#### Family Annual
- Product ID: `com.petmood.family.annual`
- Name: `PetMood Family Annual`
- Base plan: yearly
- Price: e.g. €99.99

### 3.2 Base plan settings (each)

For every base plan:

1. Renewal type: **Auto-renewing**
2. Billing period: 1 month or 1 year
3. Grace period: enable (recommended; e.g. 7 days where available) so billing retry can recover access
4. Account hold / resubscribe settings: follow Play defaults unless product asks otherwise
5. Activate the base plan

### 3.3 Free trial / introductory offer (optional but likely wanted)

If PetMood should offer a **Play billing trial** (separate from the backend `account_trial` without card):

1. Add an offer on the base plan (e.g. 7-day free trial)
2. Set eligibility (new subscribers)
3. Mirror disclosure copy in the Android Subscription screen

**Important product distinction:**

- **Account trial** = PetMood backend trial (no Google charge)
- **Play intro trial** = Google/RevenueCat trial after user starts a Play subscription

Document which one marketing means, and map both correctly in backend tiers.

---

## 4. Connect Google Play to RevenueCat

RevenueCat needs Play Developer API access.

### 4.1 Create a Google Cloud service account

1. Google Cloud Console → create/select project linked to Play
2. Create **Service account**
3. Create a JSON key (store securely; backend/RevenueCat only — **never** in the mobile app)
4. In Play Console → **Users and permissions** → **Invite user**
5. Invite the service account email
6. Grant permissions needed for financial / subscription management (RevenueCat docs list the exact roles; typically includes access to view financial data / manage orders & subscriptions as required by RC)

### 4.2 In RevenueCat dashboard

1. Create / open PetMood project
2. Add Android app with package `com.aipetmood`
3. Upload / paste the Play service account JSON (per RC UI)
4. Add the four Play products
5. Create entitlements:
   - `premium` ← premium monthly + annual products
   - `family` ← family monthly + annual products
6. Create offering `default` with four packages
7. Copy the **Google SDK API key** (public) into the app config
8. Copy the **Secret API key** into Python backend env
9. Configure **Webhooks** → PetMood `POST /api/subscriptions/webhooks/revenuecat` + shared secret

### 4.3 Renewal Kit (optional)

In RevenueCat:

1. Enable Renewal Kit for the project/app if available for your plan
2. Ensure webhook events for renewals, expiration, billing issues are enabled
3. App listens for Renewal Kit updates (see app doc); Play Console itself needs no special “Renewal Kit” switch beyond correct products + grace period

---

## 5. License testing

Play Console → **Settings** → **License testing** (path may vary slightly):

1. Add Gmail accounts for QA / developers
2. Those accounts must:
   - Be logged into Play Store on the test device
   - Install the app from the **testing track** (not a random sideload for full billing flows)
3. Use test payment methods / license-tester behavior as provided by Google

Also add the same testers to Internal testing track email lists.

---

## 6. Testing tracks & AAB uploads

1. Build signed AAB (`bundleRelease`) with incremented `versionCode` / `versionName`
2. Upload to **Internal testing** first
3. Promote later to Closed / Open / Production
4. Testers opt in via the track link
5. Wait for processing before expecting products to appear in RevenueCat/app

Current app versioning reference (update when you ship):

- Example already used: `versionName 1.1`, `versionCode 2`

Each new Play upload needs a **higher `versionCode`**.

---

## 7. Store policy / listing requirements for subscriptions

Before production release, confirm:

1. Privacy policy URL is live and linked in Play Console
2. In-app Subscription screen shows:
   - Clear plan name / length / price
   - Auto-renew disclosure
   - How to cancel (Play subscriptions)
   - Links to Privacy Policy / Terms / EULA as required
3. App does not bypass Play Billing for digital subscriptions
4. Restore Purchases is available
5. Data safety form accurately declares purchase / account data collection

---

## 8. Cancellation & customer support (Play side)

Users cancel in:

**Play Store → Payments & subscriptions → Subscriptions → PetMood**

Support should know:

1. PetMood app “Cancel” only opens manage URL; it does not cancel server-side billing
2. Access normally continues until period end (`CANCELLATION` ≠ immediate `EXPIRATION`)
3. Refunds are handled in Play Console Order management (and then RC/webhook should expire entitlement)

---

## 9. Checklist (Play Console)

- [ ] App `com.aipetmood` created and signing configured
- [ ] AAB on Internal testing (or higher)
- [ ] Four subscription product IDs created and activated
- [ ] Prices set for target countries
- [ ] Trial/intro offers configured (if required)
- [ ] Grace period enabled (recommended)
- [ ] Service account linked to Play + RevenueCat
- [ ] License testers added
- [ ] Privacy policy + data safety completed
- [ ] RevenueCat sees products / offerings
- [ ] Test purchase succeeds on a real device from the testing track

---

## 10. Common failures

| Symptom | Likely cause |
|---------|----------------|
| Products missing in app | AAB not on track, products inactive, wrong package name, RC not synced |
| Purchase fails immediately | App not installed from Play track, tester account missing, billing country |
| RC cannot validate | Service account permissions / JSON not linked |
| Backend never unlocks | Webhook URL/secret wrong, or client verify not calling Google path |
| iOS works, Android does not | Expected until RC Android path ships; Play products alone are not enough |

---

## 11. Handoff summary

| Layer | Tool | Job |
|-------|------|-----|
| Google Play Console | Products, prices, trials, testers, AAB | Sell & bill subscriptions |
| RevenueCat Purchases | SDK + dashboard | Purchase/restore UX + validation |
| RevenueCat Renewal Kit | Client add-on | Renew/expire/grace UX freshness |
| PetMood Python API | verify + webhooks + status | Quotas / access source of truth |
| PetMood RN app | Android RC integration | Buy, restore, show plans, refresh status |
