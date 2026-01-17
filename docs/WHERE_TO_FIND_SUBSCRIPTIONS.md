# Where to Find Subscription Plans in the App

## 📍 Location

The subscription plans are accessible from the **Drawer Menu** (hamburger menu).

### How to Access:

1. **Open the Drawer Menu:**
   - Tap the hamburger menu icon (☰) in the top-left corner of the app
   - Or swipe from the left edge of the screen

2. **Navigate to Subscription:**
   - In the drawer menu, you'll see a list of options:
     - Home
     - Settings
     - **Subscription** ← Tap here
     - Support
     - Privacy Policy
     - Delete Account
     - Logout

3. **View Plans:**
   - The Subscription screen will display:
     - Your current subscription status (if any)
     - Premium Plan options (Monthly & Annual)
     - Family Plan options (Monthly & Annual)
     - Restore Purchases button

## 🎨 What You'll See

### Subscription Screen Features:

1. **Current Plan Status:**
   - Shows your active subscription (if any)
   - Displays expiration date

2. **Premium Plans:**
   - Monthly: 7.99€
   - Annual: 79.99€ (Save 17%)

3. **Family Plans:**
   - Monthly: 9.99€
   - Annual: 99.99€ (Save 17%)

4. **Actions:**
   - Tap any plan to purchase
   - "Restore Purchases" button to restore previous subscriptions
   - Current plan is highlighted in green

## 🔄 Alternative Access Points

You can also add a link to the Subscription screen from:

1. **Settings Screen:**
   - Add a "Subscription" button in the Settings screen
   - Navigate to Subscription screen

2. **Home Screen:**
   - Add a banner or card promoting subscriptions
   - Link to Subscription screen

3. **Profile Screen:**
   - Show subscription status
   - Link to Subscription screen for upgrades

## 📱 Navigation Code

To navigate to the Subscription screen programmatically:

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Subscription');
```

## 🎯 User Flow

```
User opens app
  ↓
Taps hamburger menu (☰)
  ↓
Sees "Subscription" option
  ↓
Taps "Subscription"
  ↓
Views all available plans
  ↓
Selects a plan
  ↓
iOS purchase dialog appears
  ↓
Completes purchase
  ↓
Subscription activated
```

## 📝 Notes

- **iOS Only:** Subscriptions are only available on iOS devices
- **Requires Backend:** Make sure your backend receipt verification is set up
- **Testing:** Use sandbox accounts for testing before production
- **Product IDs:** Ensure product IDs in App Store Connect match the code

## 🛠️ Customization

You can customize the subscription screen by editing:
- `src/screens/private/subscription/index.tsx`

To change the navigation location, edit:
- `src/navigation/DrawerNavigator.tsx`
