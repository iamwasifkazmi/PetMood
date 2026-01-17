# Detailed Guide: Creating App Store Connect API Key

This guide walks you through creating an API key in App Store Connect for backend receipt verification.

## Overview

You need an App Store Connect API key to verify iOS receipts server-side using Apple's App Store Server API. This is more secure and recommended than the legacy receipt validation.

## Step-by-Step Instructions

### Step 1: Access App Store Connect

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account credentials
   - Make sure you have **Admin** or **App Manager** role (not just Developer)

### Step 2: Navigate to Users and Access

1. **Click on your profile/account** in the top right corner
2. **Select "Users and Access"** from the dropdown menu
   - Alternatively, go directly to: https://appstoreconnect.apple.com/access/users

### Step 3: Go to Keys Section

1. **Click on the "Keys" tab** at the top of the page
   - You'll see tabs: "Users", "Access", "Keys", "Integrations"
   - Click on **"Keys"**

### Step 4: Create a New API Key

1. **Click the "+" button** (or "Generate API Key" button) in the top left
2. **Fill in the key details:**
   - **Key Name:** Enter a descriptive name (e.g., "PetMood Receipt Verification" or "IAP Backend Key")
   - **Access:** Select **"App Manager"** or **"Admin"** (depending on your needs)
     - **App Manager:** Can manage apps and in-app purchases
     - **Admin:** Full access (recommended for backend operations)
3. **Click "Generate"**

### Step 5: Download the Key File

**⚠️ IMPORTANT: You can only download the key file ONCE!**

1. **After generating, a dialog will appear** with:
   - Key ID (a 10-character string, e.g., `ABC123DEFG`)
   - Issuer ID (a UUID, e.g., `12345678-1234-1234-1234-123456789012`)
   - Download button for the `.p8` key file

2. **Click "Download API Key"** immediately
   - The file will be named: `AuthKey_[KEY_ID].p8`
   - Example: `AuthKey_ABC123DEFG.p8`

3. **Save the file securely:**
   - Store it in a secure location on your computer
   - **DO NOT** commit this file to Git or share it publicly
   - This is a private key - treat it like a password!

### Step 6: Note Your Credentials

You need to save these three pieces of information:

1. **Key ID:**
   - Format: 10 characters (letters and numbers)
   - Example: `ABC123DEFG`
   - Where to find: Shown in the dialog after key creation, or in the Keys list

2. **Issuer ID:**
   - Format: UUID (36 characters with hyphens)
   - Example: `12345678-1234-1234-1234-123456789012`
   - Where to find: 
     - Shown in the dialog after key creation
     - Also visible at the top of the Keys page (same for all keys)

3. **Key File (.p8):**
   - The downloaded file: `AuthKey_[KEY_ID].p8`
   - Contains the private key for signing JWT tokens

### Step 7: Verify Key Information

1. **Go back to the Keys tab** in App Store Connect
2. **You'll see your key listed** with:
   - Key name
   - Key ID
   - Access level
   - Status (should be "Active")
   - Expiration date (keys don't expire, but can be revoked)

### Step 8: Revoke Access (If Needed)

If you ever need to revoke a key:
1. Go to Keys tab
2. Find your key
3. Click on it
4. Click "Revoke" button
5. **Warning:** Once revoked, you cannot use it again and must create a new key

## Visual Guide

```
App Store Connect
  └── Your Profile (top right)
      └── Users and Access
          └── Keys Tab
              └── + (Generate API Key)
                  └── Enter Name & Access Level
                      └── Generate
                          └── Download .p8 file
                              └── Note Key ID & Issuer ID
```

## What You'll Have After Completion

After completing these steps, you should have:

1. ✅ **Key ID:** `ABC123DEFG` (10 characters)
2. ✅ **Issuer ID:** `12345678-1234-1234-1234-123456789012` (UUID)
3. ✅ **Key File:** `AuthKey_ABC123DEFG.p8` (downloaded and saved securely)

## Security Best Practices

1. **Never commit the .p8 file to Git:**
   ```bash
   # Add to .gitignore
   echo "*.p8" >> .gitignore
   echo "AuthKey_*.p8" >> .gitignore
   ```

2. **Store credentials securely:**
   - Use environment variables in your backend
   - Use a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
   - Never hardcode in your code

3. **Limit access:**
   - Only give the key to backend developers who need it
   - Use the minimum access level required (App Manager vs Admin)

4. **Rotate keys periodically:**
   - Create new keys every 6-12 months
   - Revoke old keys after confirming new ones work

## Backend Configuration

Once you have the credentials, configure your backend:

### Environment Variables

```bash
# .env file (DO NOT commit to Git!)
APPLE_KEY_ID=ABC123DEFG
APPLE_ISSUER_ID=12345678-1234-1234-1234-123456789012
APPLE_KEY_PATH=/path/to/AuthKey_ABC123DEFG.p8
```

### Python Example

```python
import os

# Load from environment variables
APPLE_KEY_ID = os.getenv('APPLE_KEY_ID')
APPLE_ISSUER_ID = os.getenv('APPLE_ISSUER_ID')
APPLE_KEY_PATH = os.getenv('APPLE_KEY_PATH')

# Or load directly (less secure)
with open(APPLE_KEY_PATH, 'r') as f:
    private_key = f.read()
```

## Troubleshooting

### Issue: "Can't see Keys tab"
- **Solution:** You need Admin or Account Holder role. Contact your team admin.

### Issue: "Download button disappeared"
- **Solution:** You can only download once. If you lost the file:
  1. Revoke the old key
  2. Create a new key
  3. Download immediately

### Issue: "Key not working"
- **Check:**
  - Key ID is correct (10 characters, no spaces)
  - Issuer ID is correct (UUID format)
  - Key file path is correct
  - Key file hasn't been corrupted
  - Key hasn't been revoked

### Issue: "Permission denied"
- **Solution:** Ensure the key has "App Manager" or "Admin" access level

## Next Steps

After creating the API key:

1. ✅ Save the credentials securely
2. ✅ Configure your backend with the credentials
3. ✅ Test receipt verification (see `BACKEND_IAP_REQUIREMENTS.md`)
4. ✅ Set up environment variables in production
5. ✅ Add .p8 files to .gitignore

## Additional Resources

- [Apple's Official Guide](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)
- [App Store Server API Documentation](https://developer.apple.com/documentation/appstoreserverapi)
- [JWT Token Generation Guide](https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests)

## Quick Reference

**Where to find Issuer ID:**
- Top of the Keys page in App Store Connect
- Same for all keys in your account

**Where to find Key ID:**
- In the key details after creation
- In the Keys list table
- In the downloaded filename: `AuthKey_[KEY_ID].p8`

**Key File:**
- Only downloadable once
- Format: `AuthKey_[KEY_ID].p8`
- Contains private key (keep secure!)
