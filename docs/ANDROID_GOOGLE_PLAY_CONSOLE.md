# Android IAP — Google Play Console (+ RevenueCat dashboard)

**Audience:** whoever owns Play Console / merchant / store listing  
**Package:** `com.aipetmood`  
**Related:** Backend `ANDROID_REVENUECAT_BACKEND_PYTHON.md` · App `ANDROID_REVENUECAT_APP.md`

Android billing in the app uses **RevenueCat Purchases** (not raw Play Billing UI). Play still owns products, prices, testers, and the AAB. RevenueCat + our backend unlock access.

---

## 0. What we need from Google Play (short list)

Give the mobile + backend teams these items. Until they exist, Android subscribe cannot go live.

### A. Play Console / merchant

| # | Item | Notes |
|---|------|--------|
| 1 | **Merchant / payments profile** linked to the developer account | Needed for paid subscriptions. Account owner may need Admin / financial permission |
| 2 | App **`com.aipetmood`** with **Free** download price (not paid APK) | Money comes from subscriptions, not a paid download |
| 3 | **Signed AAB** on **Internal testing** (or higher) | Billing only works for installs from a Play track |
| 4 | **Store listing** draft complete | Name, short/full description, icon, feature graphic 1024×500, ≥2 screenshots, privacy URL |
| 5 | **Countries / distribution** selected | Pricing & availability |
| 6 | Declarations done | Data safety, content rating, target audience, etc. (as already started) |

### B. Subscription products (create in Play)

Create these **exact** product IDs (must match iOS / app / RevenueCat):

| Product ID | Name (suggestion) | Period | Target price (align with iOS) |
|------------|-------------------|--------|-------------------------------|
| `com.petmood.premium.monthly` | AIPetMood Premium Monthly | 1 month | ~€7.99 / $7.99 |
| `com.petmood.premium.annual` | AIPetMood Premium Annual | 1 year | ~€79.99 / $79.99 |
| `com.petmood.family.monthly` | AIPetMood Family Monthly | 1 month | ~€9.99 / $9.99 |
| `com.petmood.family.annual` | AIPetMood Family Annual | 1 year | ~€99.99 / $99.99 |

For each base plan:

- Auto-renewing  
- Activate the base plan  
- Grace period recommended (e.g. 7 days)  
- Optional: **7-day free trial** intro offer (Play billing trial ≠ backend `account_trial`)

Path: Play Console → **Monetize** → **Products** → **Subscriptions**.

### C. Service account for RevenueCat (required)

RevenueCat must read Play purchases:

1. Google Cloud → Service account → JSON key  
2. Play Console → **Users and permissions** → invite service account email  
3. Grant roles RevenueCat docs require (financial / view app info / manage orders & subscriptions as listed by RC)  
4. Upload that JSON in **RevenueCat** → Android app → Google Play credentials  

**Never** put this JSON in the mobile app or git.

### D. License testers

| # | Item |
|---|------|
| 1 | Add QA/dev Gmail accounts under Play **License testing** |
| 2 | Add same emails to **Internal testing** track testers |
| 3 | Testers install **from the track link**, signed into that Google account on device |

### E. Hand to app + backend after Play/RC setup

| Deliverable | Who uses it |
|-------------|-------------|
| RevenueCat **public Google SDK key** (`goog_…`) | App → `src/common/config.ts` → `revenuecat_google_api_key` |
| RevenueCat **secret API key** | Backend env `REVENUECAT_SECRET_API_KEY` |
| Webhook URL + shared secret | Backend `POST /api/subscriptions/webhooks/revenuecat` |
| Confirmation products appear under RC offering `default` | App load prices / purchase |

---

## 1. What Play Console is responsible for

1. Testing track + AAB uploads (`versionCode` must increase each upload)  
2. Subscription products + prices + trials/offers  
3. Service account for RevenueCat  
4. License testers  
5. Privacy policy / listing / content declarations  
6. Merchant account for billing  

You do **not** build Play Billing UI in app code — RevenueCat does that.

---

## 2. Prerequisites before subscriptions work

1. App created with application id `com.aipetmood`  
2. App signing by Google Play / upload key configured  
3. At least one AAB on Internal testing (or higher)  
4. Store listing draft:  
   - App name, short/full description  
   - Screenshots + feature graphic  
   - Privacy: `https://petmood.care/privacy-policy`  
5. Pricing & distribution countries  
6. Merchant account linked (unlocks subscription pricing)  
7. Declarations (Data safety, etc.)

Subscriptions often stay inactive until the app is on a track and payments are set up.

---

## 3. Create the four subscriptions

Play Console → **Monetize** → **Products** → **Subscriptions** → **Create subscription**

### 3.1 Products

Use the IDs in section **0.B**. One subscription product per ID (or one subscription with multiple base plans — stay consistent with how you map packages in RevenueCat).

### 3.2 Base plan settings

1. Renewal: **Auto-renewing**  
2. Period: 1 month or 1 year  
3. Grace period: enable (recommended)  
4. Activate base plan  

### 3.3 Free trial (optional)

Add a 7-day intro offer for new subscribers if product wants Play billing trial.

Distinguish:

- **Account trial** = PetMood backend trial (no card)  
- **Play intro trial** = Google charges after trial via Play/RC  

---

## 4. Connect Play → RevenueCat

### 4.1 Service account (see 0.C)

### 4.2 RevenueCat dashboard

1. Project for PetMood  
2. Add Android app package `com.aipetmood`  
3. Attach Play service account JSON  
4. Import / add the four products  
5. Entitlements:  
   - `premium` ← premium monthly + annual  
   - `family` ← family monthly + annual  
6. Offering `default` with four packages  
7. Copy **public** Google SDK key → app config  
8. Copy **secret** key → backend  
9. Webhooks → `POST /api/subscriptions/webhooks/revenuecat` + shared secret  
   - At least: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`

### 4.3 Renewal Kit (optional)

Not required for launch. Webhooks + `GET /status` are enough for access correctness.

---

## 5. License testing

Play Console → **Settings** → **License testing** (path may vary):

1. Add tester Gmails  
2. Device: Play Store signed in as tester  
3. Install from **testing track** (not random sideload)  
4. Same emails on Internal testing list  

---

## 6. Tracks & AAB uploads

1. Signed AAB (`bundleRelease`), bump `versionCode` / `versionName`  
2. Upload **Internal testing** first  
3. Promote later to Closed / Open / Production  
4. Testers use opt-in link  
5. Wait for processing before expecting products in RC/app  

Example reference: `versionName 1.1`, `versionCode 2` — always increase `versionCode`.

---

## 7. Store listing / policy for subscriptions

Before production:

1. Privacy URL live in Play Console  
2. In-app subscription UI shows plan name, length, price, auto-renew, how to cancel  
3. Links: Privacy / Terms / EULA  
4. No bypass of Play Billing for digital subs  
5. **Restore Purchases** available (app has this on Android)  
6. Data safety form accurate for purchases / account data  
7. App price = **Free**; monetize via subscriptions  

Feature graphic asset (if needed): `docs/store-assets/aipetmood-feature-graphic-1024x500.png`

---

## 8. Cancel / support (Play side)

Users cancel in:

**Play Store → Payments & subscriptions → Subscriptions → AIPetMood**

Support notes:

1. App “Cancel” only opens manage URL — does not cancel billing on our server  
2. Access continues until period end (`CANCELLATION` ≠ immediate `EXPIRATION`)  
3. Refunds via Play Order management; webhook/RC should then expire entitlement  

---

## 9. Checklist (Play + RC)

- [ ] Merchant / payments profile linked  
- [ ] App `com.aipetmood` Free + signing OK  
- [ ] AAB on Internal testing (or higher)  
- [ ] Four subscription product IDs created and **activated**  
- [ ] Prices for target countries  
- [ ] Trial/intro offers (if required)  
- [ ] Grace period enabled (recommended)  
- [ ] Service account invited in Play + uploaded to RevenueCat  
- [ ] License testers + track testers added  
- [ ] Privacy + data safety completed  
- [ ] RC entitlements `premium` / `family` + offering `default`  
- [ ] Public `goog_` key → app; secret key + webhook → backend  
- [ ] Test purchase on a real device from the testing track  

---

## 10. Common failures

| Symptom | Likely cause |
|---------|----------------|
| Products missing in app | AAB not on track, products inactive, wrong package, RC not synced |
| Purchase fails immediately | Not installed from Play track, tester missing, billing country |
| RC cannot validate | Service account permissions / JSON not linked |
| Backend never unlocks | Webhook URL/secret wrong, or `verify-receipt` Google path not implemented |
| “You need permission” on Payments | Google account lacks Admin / financial access — ask account owner |
| App pricing wants a paid price | Set app to **Free**; put money on subscription products |

---

## 11. Handoff summary

| Layer | Tool | Job |
|-------|------|-----|
| Google Play Console | Products, prices, trials, testers, AAB, merchant | Sell & bill |
| RevenueCat | SDK + dashboard + webhooks | Purchase UX + validation bridge |
| PetMood Python API | verify + webhooks + status | Quotas / access source of truth |
| PetMood RN app | Android RC only (iOS = StoreKit) | Buy, restore, show plans, refresh status |

---

## 12. Message you can send the client / Play owner

> We need the Play Console side finished so Android subscriptions can go live:
>
> 1. Merchant / payments profile linked (and Admin access if our Google account is blocked on Payments).  
> 2. App kept **Free** to download; create these subscription product IDs with prices:  
>    `com.petmood.premium.monthly`, `com.petmood.premium.annual`,  
>    `com.petmood.family.monthly`, `com.petmood.family.annual`.  
> 3. Signed AAB on Internal testing; add our Gmail accounts as license + track testers.  
> 4. Google Cloud **service account** invited in Play (financial / subscription permissions) and JSON given so we can connect RevenueCat.  
> 5. After RevenueCat is linked: send us the public Google SDK key (`goog_…`) for the app and the secret key + webhook secret for the backend.
