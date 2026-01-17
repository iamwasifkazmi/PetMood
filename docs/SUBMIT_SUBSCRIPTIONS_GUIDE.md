# Guide: Submitting Subscriptions with App Review

## ✅ Step 1: Verify Product IDs Match

First, verify that the Product IDs in your App Store Connect subscriptions match exactly with your code:

**Expected Product IDs (from code):**
- `com.petmood.premium.monthly`
- `com.petmood.premium.annual`
- `com.petmood.family.monthly`
- `com.petmood.family.annual`

**Action:** 
1. Go to App Store Connect → Your App → Subscriptions
2. Click on "PetMood Subscriptions" group
3. Verify each of the 4 subscriptions has the exact Product ID listed above
4. If they don't match, either:
   - Update the Product IDs in App Store Connect to match the code, OR
   - Update the code in `src/constants/subscription.ts` to match App Store Connect

## ✅ Step 2: Prepare Your App Version

Your current app version is **1.4.0** (Build 7). You need to:

1. **Create a new app version** (if 1.4.0 is already submitted, create 1.5.0):
   - Go to App Store Connect → Your App → App Store tab
   - Click "+ Version or Platform" if needed
   - Enter new version number (e.g., 1.5.0)

2. **Build and upload your app binary:**
   ```bash
   # Build for release
   cd ios
   xcodebuild -workspace PetMood.xcworkspace \
     -scheme PetMood \
     -configuration Release \
     -archivePath build/PetMood.xcarchive \
     archive
   
   # Or use Xcode:
   # Product → Archive → Distribute App → App Store Connect
   ```

## ✅ Step 3: Add Subscriptions to App Version

**Important:** According to Apple's banner, your first subscription must be submitted with a new app version.

1. **Go to your app version page:**
   - App Store Connect → Your App → App Store tab
   - Select your version (e.g., 1.5.0)

2. **Navigate to In-App Purchases section:**
   - Scroll down to find "In-App Purchases and Subscriptions" section
   - Click "Manage" or "+" button

3. **Add all 4 subscriptions:**
   - Select each subscription from "PetMood Subscriptions" group:
     - Premium Monthly
     - Premium Annual
     - Family Monthly
     - Family Annual
   - Click "Add" for each one

## ✅ Step 4: Complete App Version Information

Before submitting, make sure you have:

1. **App Information:**
   - Screenshots (required)
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)

2. **Version Information:**
   - What's New in This Version (release notes)
   - App Review Information (if needed)

3. **Build Selection:**
   - Select the uploaded build that includes your IAP code

## ✅ Step 5: Submit for Review

1. **Review all information:**
   - Double-check that all 4 subscriptions are added to the version
   - Verify the build is selected
   - Complete all required fields

2. **Submit:**
   - Click "Submit for Review" button
   - Apple will review both your app and subscriptions together

## ✅ Step 6: After First Submission

Once your first submission with subscriptions is approved:

- ✅ Future subscriptions can be submitted directly from the Subscriptions section
- ✅ You won't need to submit a new app version for subscription changes
- ✅ You can add/edit subscriptions independently

## 📋 Checklist Before Submission

- [ ] All 4 subscriptions created in App Store Connect
- [ ] Product IDs match exactly between code and App Store Connect
- [ ] Subscription group "PetMood Subscriptions" created
- [ ] New app version created (if needed)
- [ ] App binary built and uploaded with IAP code
- [ ] All 4 subscriptions added to the app version
- [ ] App version information completed
- [ ] Build selected in version page
- [ ] Ready to submit for review

## 🔍 Verifying Product IDs in App Store Connect

To check your Product IDs:

1. Go to: App Store Connect → Your App → Subscriptions
2. Click on "PetMood Subscriptions" group
3. Click on each subscription to view details
4. The Product ID is shown in the subscription details
5. Compare with the IDs in `src/constants/subscription.ts`

## ⚠️ Important Notes

1. **First Time:** Your first subscription submission MUST be with a new app version
2. **Product IDs:** Must match exactly (case-sensitive)
3. **Testing:** Test with sandbox accounts before submitting
4. **Backend:** Make sure your backend receipt verification is ready
5. **Review Time:** Apple typically reviews in 24-48 hours

## 🐛 Troubleshooting

**Issue: "Subscriptions not showing in version page"**
- Make sure subscriptions are in "Ready to Submit" status
- Check that subscription group is properly configured

**Issue: "Product ID mismatch"**
- Update either App Store Connect or code to match
- Product IDs are case-sensitive

**Issue: "Can't add subscriptions to version"**
- Ensure subscriptions are in "Ready to Submit" status
- Check that you're on the correct version page

## 📞 Next Steps After Approval

Once approved:
1. Test subscriptions with real purchases (sandbox)
2. Monitor subscription analytics in App Store Connect
3. Set up backend webhooks for subscription events (optional but recommended)
4. Monitor for any subscription-related issues
