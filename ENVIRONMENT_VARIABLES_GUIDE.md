# 🔑 Environment Variables & API Keys Guide for SlabSnap

## Current Environment Variables

Your app currently has these API keys in `.env`:

```env
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-proj-anielepohng9eing5Ol6Phex3oin9geg-n0tr3al
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-api03-gu2gohc4sha1Thohpeep7ro9vie1ikai-n0tr3al
EXPO_PUBLIC_VIBECODE_GROK_API_KEY=xai-ahDi8ofei1Em2chaichoac2Beehi8thu-n0tr3al
EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY=UeHoh2oot2IWe6ooW4Oofahd6waebeiw-n0tr3al
EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=elevenlabs-api-key-oa9Shahx4Zi4oof2bei5kee9nee7eeng-n0tr3al
```

## 🗺️ **Required for Maps Functionality**

### Google Maps API Key
Your app uses `react-native-maps` but needs a proper Google Maps API key:

```env
# Replace with your real Google Maps API key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your_real_google_maps_key

# For iOS (same key or separate)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=AIzaSyD...your_ios_key

# For Android (same key or separate)  
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=AIzaSyD...your_android_key
```

**To get Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (for location search)
   - Geocoding API (for address conversion)
4. Create credentials → API Key
5. Restrict the key (recommended for security)

### App Configuration for Maps
Update your `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_MAPS_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_MAPS_KEY"
      }
    }
  }
}
```

## 🔐 **Authentication System**

Your app uses **mock authentication** (no real backend). You have two options:

### Option 1: Keep Mock Auth (Simplest)
Current setup works for demonstration but has limitations:
- Users don't persist between app installs
- No real security
- No password recovery
- No user management

### Option 2: Add Real Authentication

#### Firebase Auth (Recommended)
```bash
bun add firebase @react-native-firebase/app @react-native-firebase/auth
```

Add to `.env`:
```env
# Firebase Config
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Supabase Auth (Alternative)
```bash
bun add @supabase/supabase-js
```

Add to `.env`:
```env
# Supabase Config
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

#### Auth0 (Enterprise)
```bash
bun add react-native-auth0
```

Add to `.env`:
```env
# Auth0 Config  
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_client_id
```

## 💳 **Payment System Environment Variables**

For Stripe integration (as covered in the Stripe guide):

```env
# Stripe Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_publishable_key
STRIPE_SECRET_KEY=sk_test_...your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret

# For production, replace 'test' with 'live' in the keys
```

## 📱 **Push Notifications**

If you want push notifications for messages/listings:

```env
# Expo Push Notifications (Free)
EXPO_PUBLIC_PUSH_TOKEN=ExponentPushToken[...]

# Firebase Cloud Messaging (Alternative)
EXPO_PUBLIC_FCM_SERVER_KEY=AAAA...your_fcm_key
EXPO_PUBLIC_FCM_SENDER_ID=123456789
```

## 🔍 **Optional Services**

### Analytics
```env
# Google Analytics
EXPO_PUBLIC_GA_TRACKING_ID=UA-123456-1

# Mixpanel
EXPO_PUBLIC_MIXPANEL_TOKEN=abc123...
```

### Error Tracking
```env
# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Bugsnag
EXPO_PUBLIC_BUGSNAG_API_KEY=abc123...
```

### Email Service
```env
# SendGrid
SENDGRID_API_KEY=SG....

# Mailgun  
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=your-domain.com
```

## 🔒 **Security Best Practices**

### Environment File Structure
Create separate files for different environments:

```bash
.env.local          # Local development
.env.staging        # Staging environment  
.env.production     # Production environment
```

### Never Commit Secrets
Add to `.gitignore`:
```
.env
.env.local
.env.staging
.env.production
```

### Use EAS Secrets for Production
```bash
# Set secrets for production builds
eas secret:create --scope project --name STRIPE_SECRET_KEY --value sk_live_...
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value AIzaSyD...
```

## 📋 **Environment Variables Checklist**

### Required for Basic Functionality:
- [ ] `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - For maps
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For payments
- [ ] `STRIPE_SECRET_KEY` - For server-side payments

### Required for Real Authentication:
- [ ] Firebase/Supabase/Auth0 keys (choose one)
- [ ] Database connection strings

### Optional but Recommended:
- [ ] `EXPO_PUBLIC_SENTRY_DSN` - Error tracking
- [ ] `EXPO_PUBLIC_GA_TRACKING_ID` - Analytics
- [ ] `SENDGRID_API_KEY` - Email notifications

### For Production:
- [ ] All test keys replaced with live keys
- [ ] Environment variables set in EAS/deployment platform
- [ ] API key restrictions configured
- [ ] Rate limiting enabled

## 🚀 **Quick Setup for Testing**

For immediate testing, you minimally need:

1. **Google Maps API Key** (for map functionality)
2. **Stripe Test Keys** (for payment testing)

Everything else can be added later as you need those features!