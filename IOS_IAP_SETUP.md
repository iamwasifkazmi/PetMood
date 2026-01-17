# iOS In-App Purchase Setup Guide

This document outlines the React Native implementation for iOS In-App Purchases (IAP) for the PetMood app.

## Overview

The app supports two subscription plans:
1. **Premium Plan**
   - Monthly: 7.99€
   - Annual: 79.99€

2. **Family Plan** (optional, +2 pets)
   - Monthly: 9.99€
   - Annual: 99.99€

## Installation Steps

### 1. Install Dependencies

The `react-native-iap` package has been installed. Run:

```bash
cd ios && pod install && cd ..
```

### 2. Configure Product IDs in App Store Connect

You must create the following subscription products in App Store Connect:

1. `com.petmood.premium.monthly` - Auto-renewable subscription (1 month)
2. `com.petmood.premium.annual` - Auto-renewable subscription (1 year)
3. `com.petmood.family.monthly` - Auto-renewable subscription (1 month)
4. `com.petmood.family.annual` - Auto-renewable subscription (1 year)

**Steps:**
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Click "+" to create a new subscription
3. Create a Subscription Group (e.g., "PetMood Subscriptions")
4. Add each product with the exact Product IDs listed above
5. Set pricing for each region
6. Submit for review

### 3. Code Structure

#### Files Created:

1. **`src/constants/subscription.ts`**
   - Defines product IDs and subscription plan configurations
   - Contains helper functions to get product IDs

2. **`src/features/subscription/types.ts`**
   - TypeScript types for subscriptions

3. **`src/features/subscription/subscriptionApiSlice.ts`**
   - RTK Query API slice for backend communication
   - Endpoints: `verifyReceipt`, `getSubscriptionStatus`, `restorePurchases`

4. **`src/features/subscription/subscriptionSlice.ts`**
   - Redux slice for subscription state management

5. **`src/services/subscriptionService.ts`**
   - Core IAP service that handles:
     - Initializing IAP connection
     - Purchasing subscriptions
     - Restoring purchases
     - Receipt verification with backend

6. **`src/hooks/useSubscription.ts`**
   - React hook for easy subscription management in components

## Usage Example

### In a Component:

```typescript
import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../constants/subscription';
import { View, Text, TouchableOpacity } from 'react-native';

const SubscriptionScreen = () => {
  const {
    products,
    subscription,
    isLoading,
    error,
    purchaseSubscription,
    restorePurchases,
  } = useSubscription();

  const handlePurchase = async (productId: string) => {
    try {
      await purchaseSubscription(productId);
      // Purchase will be handled automatically via listeners
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <View>
      <Text>Current Plan: {subscription?.planType || 'None'}</Text>
      
      {SUBSCRIPTION_PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          onPress={() => handlePurchase(plan.productId)}
          disabled={isLoading}
        >
          <Text>{plan.description}</Text>
          <Text>{plan.priceFormatted}</Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity onPress={restorePurchases}>
        <Text>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## How It Works

1. **Initialization**: The `useSubscription` hook automatically initializes IAP when the component mounts (iOS only).

2. **Purchase Flow**:
   - User selects a subscription plan
   - `purchaseSubscription(productId)` is called
   - iOS shows the purchase dialog
   - On success, `purchaseUpdatedListener` receives the purchase
   - Receipt is sent to backend for verification
   - Backend verifies with Apple and returns subscription status
   - Subscription state is updated in Redux

3. **Restore Purchases**:
   - User taps "Restore Purchases"
   - App fetches available purchases from iOS
   - Most recent subscription is verified with backend
   - Subscription status is restored

## Testing

### Sandbox Testing:

1. Create a sandbox test account in App Store Connect
2. Sign out of your Apple ID on the device
3. When prompted during purchase, use the sandbox account
4. Test purchases won't be charged

### Important Notes:

- **Always test in sandbox first** before production
- Product IDs must match exactly between App Store Connect and code
- Receipts must be verified server-side (handled by backend)
- Subscriptions are auto-renewable

## Backend Integration

The app sends receipt data to these endpoints:

- `POST /api/subscriptions/verify-receipt` - Verify purchase receipt
- `GET /api/subscriptions/status` - Get current subscription status
- `POST /api/subscriptions/restore` - Restore purchases

See `BACKEND_IAP_REQUIREMENTS.md` for detailed backend implementation.

## Troubleshooting

### Common Issues:

1. **"No products found"**
   - Check product IDs match App Store Connect
   - Ensure products are approved/available
   - Check bundle identifier matches

2. **"Purchase failed"**
   - Verify user is signed in to App Store
   - Check network connection
   - Ensure backend is running and accessible

3. **"Receipt verification failed"**
   - Check backend logs
   - Verify backend has correct Apple credentials
   - Ensure receipt data is being sent correctly

## Next Steps

1. ✅ Install `react-native-iap`
2. ✅ Create subscription constants and types
3. ✅ Set up Redux slices and API
4. ✅ Create subscription service
5. ✅ Create useSubscription hook
6. ⏳ Configure products in App Store Connect
7. ⏳ Implement backend receipt verification
8. ⏳ Create subscription UI screen
9. ⏳ Test with sandbox accounts
10. ⏳ Submit for App Store review

## Additional Resources

- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
