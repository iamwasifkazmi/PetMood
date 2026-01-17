# Troubleshooting: "Missing purchase request configuration" Error

## Error Description

The error "Missing purchase request configuration" appears when trying to purchase a subscription. This typically means the IAP service isn't properly configured or products aren't loaded.

## Common Causes & Solutions

### 1. Products Not Loaded from App Store Connect

**Cause:** The app can't find the subscription products because they're not configured or not available yet.

**Solutions:**

1. **Check App Store Connect:**
   - Go to App Store Connect → Your App → Subscriptions
   - Verify all 4 products are created:
     - `com.petmood.premium.monthly`
     - `com.petmood.premium.annual`
     - `com.petmood.family.monthly`
     - `com.petmood.family.annual`
   - Ensure products are in "Ready to Submit" or "Approved" status

2. **Verify Product IDs Match:**
   - Check `src/constants/subscription.ts`
   - Product IDs must match **exactly** (case-sensitive)
   - No extra spaces or characters

3. **Check Subscription Status:**
   - Products must be submitted with an app version
   - First subscription must be submitted with a new app binary
   - Status should be "Ready to Submit" or "Approved"

### 2. Testing Environment Issues

**Cause:** You're testing in production but products aren't live yet, or sandbox isn't set up.

**Solutions:**

1. **Use Sandbox Testing:**
   - Create sandbox test accounts in App Store Connect
   - Sign out of your Apple ID on the device
   - When purchasing, use the sandbox account
   - Sandbox products are available immediately (no approval needed)

2. **Check Bundle ID:**
   - Ensure bundle ID in Xcode matches App Store Connect
   - Current bundle ID: `com.petmood`
   - Check in `ios/PetMood.xcodeproj` → Build Settings → Product Bundle Identifier

### 3. Products Not Approved Yet

**Cause:** Products are created but not yet approved by Apple.

**Solutions:**

1. **Wait for Approval:**
   - First-time subscriptions need App Review approval
   - Check status in App Store Connect
   - Products show as "Waiting for Review" or "In Review"

2. **Complete Required Metadata:**
   - Add subscription screenshots
   - Add reviewer notes
   - Complete all required fields
   - Submit for review

### 4. Network or Connection Issues

**Cause:** App can't connect to App Store to fetch products.

**Solutions:**

1. **Check Internet Connection:**
   - Ensure device has internet access
   - Try on different network (WiFi vs Cellular)

2. **Check App Store Connection:**
   - Ensure device can access App Store
   - Sign in to App Store on device
   - Try purchasing a free app to test connection

### 5. Code Issues

**Cause:** Products aren't being loaded before purchase attempt.

**Solutions:**

The code has been updated to:
- ✅ Load products before allowing purchases
- ✅ Check if products exist before purchase
- ✅ Show helpful error messages
- ✅ Wait for initialization

**What to Check:**

1. **Check Console Logs:**
   ```bash
   # In Xcode or Metro bundler
   # Look for:
   - "Failed to initialize IAP"
   - "Error fetching products"
   - "Product not available"
   ```

2. **Verify Initialization:**
   - The subscription screen should show "Loading subscription plans..." initially
   - Wait for products to load before tapping purchase
   - Check if `isInitialized` is true

## Step-by-Step Debugging

### Step 1: Check Product Availability

1. Open the subscription screen
2. Wait a few seconds for products to load
3. Check console for any errors
4. If products don't load, check App Store Connect

### Step 2: Verify App Store Connect Setup

1. Go to App Store Connect → Your App → Subscriptions
2. Check "PetMood Subscriptions" group
3. Verify all 4 products exist
4. Check each product's status:
   - Should be "Ready to Submit" or "Approved"
   - Not "Missing Metadata" or "Rejected"

### Step 3: Test with Sandbox

1. Create sandbox test account:
   - App Store Connect → Users and Access → Sandbox Testers
   - Add new tester with email
2. Sign out of Apple ID on device
3. Try purchasing - should prompt for sandbox account
4. Use sandbox account credentials

### Step 4: Check Bundle ID

1. Open Xcode project
2. Select project → Target → General
3. Check "Bundle Identifier" = `com.petmood`
4. Verify it matches App Store Connect

### Step 5: Check Console Logs

Look for these messages:
- ✅ "Purchase successful" - Good!
- ❌ "Failed to initialize IAP" - Check connection
- ❌ "Error fetching products" - Check App Store Connect
- ❌ "Product not available" - Check product IDs

## Quick Fixes

### Fix 1: Restart App
```bash
# Sometimes IAP needs a fresh start
# Kill app completely and restart
```

### Fix 2: Rebuild iOS App
```bash
cd ios
pod install
cd ..
# Then rebuild in Xcode
```

### Fix 3: Clear Derived Data
1. Xcode → Preferences → Locations
2. Click arrow next to Derived Data path
3. Delete all contents
4. Rebuild project

### Fix 4: Check Product IDs
```typescript
// In src/constants/subscription.ts
// Verify these match App Store Connect exactly:
'com.petmood.premium.monthly'
'com.petmood.premium.annual'
'com.petmood.family.monthly'
'com.petmood.family.annual'
```

## Expected Behavior

### When Working Correctly:

1. **Screen Opens:**
   - Shows "Loading subscription plans..." briefly
   - Then shows all 4 plans with prices

2. **Tap Purchase:**
   - iOS purchase dialog appears
   - No error messages
   - Can complete purchase

3. **After Purchase:**
   - Success message appears
   - Subscription status updates
   - Current plan highlighted

### When There's an Issue:

1. **Red Banner:**
   - "Missing purchase request configuration"
   - Or other error message

2. **Products Don't Load:**
   - Plans show but prices might be missing
   - "Loading..." never finishes

3. **Purchase Fails:**
   - Alert appears with error
   - No iOS purchase dialog

## Still Having Issues?

If the error persists:

1. **Check App Store Connect:**
   - Are products created?
   - Are they approved?
   - Status is "Ready to Submit" or "Approved"?

2. **Test with Sandbox:**
   - Create sandbox account
   - Sign out of Apple ID
   - Try purchase

3. **Check Logs:**
   - Xcode console
   - Metro bundler logs
   - Look for specific error codes

4. **Verify Setup:**
   - Bundle ID matches
   - Product IDs match exactly
   - App is signed correctly

## Next Steps

Once products are working:
1. ✅ Test all 4 subscription plans
2. ✅ Test restore purchases
3. ✅ Verify backend receipt verification
4. ✅ Test subscription renewals
5. ✅ Submit for App Review
