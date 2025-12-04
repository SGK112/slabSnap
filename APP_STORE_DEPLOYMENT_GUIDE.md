# 🏪 App Store Deployment Guide for SlabSnap

## 📋 **Overview**

This guide covers publishing your SlabSnap app to both:
- 🍎 **iOS App Store** (via App Store Connect)
- 🤖 **Google Play Store** (via Google Play Console)

Your app is currently configured as:
- **Bundle ID**: `com.surprisegranite.slabsnap`
- **App Name**: SlabSnap  
- **Tagline**: "Powered by Surprise Granite"

## 🛠️ **Prerequisites**

### Required Accounts:
1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com
   - Required for iOS App Store

2. **Google Play Console Account** ($25 one-time)
   - Sign up: https://play.google.com/console
   - Required for Google Play Store

3. **Expo EAS Account** (Free/Paid tiers)
   - Sign up: https://expo.dev
   - Required for building native apps

### Required Tools:
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

## 🍎 **iOS App Store Deployment**

### Step 1: Prepare App Store Connect

1. **Create App in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Click "+" to create new app
   - Fill out app information:
     ```
     Name: SlabSnap
     Bundle ID: com.surprisegranite.slabsnap
     SKU: slabsnap-ios
     Primary Language: English
     ```

2. **App Information**:
   ```
   Category: Business
   Secondary Category: Productivity
   Content Rights: No, it does not contain third-party content
   Age Rating: 4+ (No Objectionable Content)
   ```

3. **Pricing & Availability**:
   ```
   Price: Free (with in-app purchases for ad credits)
   Availability: All territories
   ```

### Step 2: Configure EAS for iOS

Create `eas.json` in your project root:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": "versionCode"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 3: Update app.json for iOS

```json
{
  "expo": {
    "name": "SlabSnap",
    "slug": "slabsnap",
    "version": "1.0.0",
    "scheme": "slabsnap",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.surprisegranite.slabsnap",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "SlabSnap needs camera access to photograph stone remnants",
        "NSLocationWhenInUseUsageDescription": "SlabSnap uses location to show nearby vendors and listings",
        "NSPhotoLibraryUsageDescription": "SlabSnap needs photo library access to select images for listings"
      }
    },
    "android": {
      "package": "com.surprisegranite.slabsnap",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-image-picker"
    ]
  }
}
```

### Step 4: Build for iOS

```bash
# Build production iOS app
eas build --platform ios --profile production

# This will:
# 1. Upload your code to EAS servers
# 2. Install dependencies  
# 3. Generate iOS build
# 4. Provide download link
```

### Step 5: Upload to App Store Connect

```bash
# Automatic upload (recommended)
eas submit --platform ios --profile production

# Manual upload alternative:
# 1. Download .ipa file from EAS
# 2. Use Transporter app to upload
# 3. Or use Xcode Organizer
```

### Step 6: App Store Listing

#### Required Screenshots (per device):
- **iPhone 6.7"** (iPhone 15 Pro Max): 2-10 screenshots
- **iPhone 6.5"** (iPhone 14 Plus): 2-10 screenshots  
- **iPhone 5.5"** (iPhone 8 Plus): 2-10 screenshots
- **iPad Pro 12.9"**: 2-10 screenshots
- **iPad Pro 11"**: 2-10 screenshots

#### App Store Description:
```
SlabSnap - The Stone Remnant Marketplace

Find and sell granite, marble, quartz, and quartzite remnants in your area. Perfect for countertops, backsplashes, and smaller projects.

🔍 DISCOVER STONE REMNANTS
• Browse local granite and stone remnants
• Filter by material type, size, and location
• View high-quality photos and measurements
• Connect directly with sellers

🏪 VENDOR NETWORK  
• Find verified stone fabricators and suppliers
• View ratings, reviews, and contact information
• Get directions to local stone yards
• Discover new vendors in your area

📱 EASY LISTING
• Photograph remnants with our measurement tools
• AI-powered stone identification
• Set your price and availability
• Manage all listings in one place

💼 FOR BUSINESSES
• Advertise your stone business
• Reach thousands of local customers
• Promote special offers and inventory
• Build your reputation in the community

Powered by Surprise Granite - Arizona's Premier Stone Fabricator

Perfect for contractors, DIY enthusiasts, interior designers, and homeowners looking for affordable stone solutions.
```

#### Keywords:
```
granite, marble, quartz, quartzite, stone, remnant, countertop, backsplash, fabricator, supplier, contractor, DIY, interior design, slab, tile
```

### Step 7: App Review Process

1. **Submit for Review**:
   - Add app metadata (description, keywords, screenshots)
   - Set pricing (free with in-app purchases)
   - Submit for Apple review

2. **Review Timeline**:
   - Usually 24-48 hours
   - Can take up to 7 days during busy periods

3. **Common Rejection Reasons**:
   - Missing privacy policy
   - App crashes or major bugs
   - Missing required screenshots
   - Incomplete app functionality

## 🤖 **Google Play Store Deployment**

### Step 1: Prepare Google Play Console

1. **Create App in Play Console**:
   - Go to https://play.google.com/console
   - Click "Create app"
   - Fill out app details:
     ```
     App name: SlabSnap
     Default language: English (United States)
     App or game: App
     Free or paid: Free
     ```

2. **Store Settings**:
   ```
   Category: Business
   Tags: productivity, marketplace, construction
   ```

### Step 2: Build for Android

```bash
# Build production Android app
eas build --platform android --profile production

# This generates an AAB (Android App Bundle) file
```

### Step 3: Upload to Google Play

```bash
# Automatic upload
eas submit --platform android --profile production

# Manual upload alternative:
# 1. Download .aab file from EAS
# 2. Upload via Play Console
```

### Step 4: Play Store Listing

#### Required Assets:
- **App icon**: 512 x 512 px
- **Feature graphic**: 1024 x 500 px
- **Screenshots**: 
  - Phone: 2-8 screenshots (320-3840px on longest side)
  - Tablet: 1-8 screenshots (320-3840px on longest side)

#### Play Store Description:
```
SlabSnap - Stone Remnant Marketplace

The premier marketplace for granite, marble, quartz, and quartzite remnants. Connect buyers and sellers in the stone industry.

🏗️ FOR CONTRACTORS & FABRICATORS
• List your remnant inventory quickly
• Reach qualified local buyers
• Manage listings with expiration tracking
• Build your business reputation

🏠 FOR HOMEOWNERS & DESIGNERS
• Find affordable stone for small projects
• Browse verified local suppliers
• View detailed measurements and photos
• Get directions to stone yards

🗺️ VENDOR DIRECTORY
• Discover local stone fabricators
• Read reviews and ratings
• Contact businesses directly
• Find specialized services

📏 SMART TOOLS
• Measurement assistance for remnants
• Stone type identification
• Photo quality guidance
• Inventory management

Whether you're a contractor looking to sell excess inventory or a homeowner searching for the perfect countertop remnant, SlabSnap connects you with Arizona's stone community.

Developed in partnership with Surprise Granite, Arizona's trusted stone fabricator since 2010.
```

#### Keywords:
```
granite, marble, quartz, stone, remnant, countertop, fabricator, contractor, DIY, renovation, backsplash, Arizona, construction, suppliers
```

### Step 5: Content Rating

Complete the content rating questionnaire:
- Target age group: General audiences
- Content: Business/productivity app
- No sensitive content

### Step 6: Privacy Policy & Data Safety

Required information:
```
Privacy Policy URL: https://yourwebsite.com/privacy
Data types collected: Email, location (when using maps)
Data sharing: None
Data security: Encrypted in transit and at rest
```

### Step 7: Release Process

1. **Internal Testing**:
   ```bash
   # Upload to internal testing track
   eas submit --platform android --track internal
   ```

2. **Production Release**:
   ```bash
   # Release to production
   eas submit --platform android --track production
   ```

## 🚀 **Pre-Launch Checklist**

### Technical Requirements:
- [ ] App builds successfully on EAS
- [ ] All core features work on physical devices
- [ ] No crashes or major bugs
- [ ] Performance is acceptable
- [ ] Maps work with proper API keys
- [ ] Stripe payments configured (if implemented)
- [ ] Push notifications set up (optional)

### Legal Requirements:
- [ ] Privacy Policy created and linked
- [ ] Terms of Service available
- [ ] Content rating completed
- [ ] Age-appropriate content verified
- [ ] Third-party licenses acknowledged

### Marketing Assets:
- [ ] App icon (multiple sizes)
- [ ] Screenshots for all device types
- [ ] Feature graphics
- [ ] App descriptions written
- [ ] Keywords researched
- [ ] Website or landing page created

### Business Setup:
- [ ] Developer accounts active
- [ ] Payment methods configured
- [ ] Tax information submitted
- [ ] Banking details for revenue (if paid app)
- [ ] Support contact information

## 💰 **Monetization Setup**

### In-App Purchases (for Ad Credits):

#### iOS (App Store Connect):
1. Go to Features → In-App Purchases
2. Create consumable products for each credit package:
   ```
   Product ID: com.surprisegranite.slabsnap.credits.starter
   Reference Name: Starter Package - 100 Credits
   Price: $9.99
   ```

#### Android (Play Console):
1. Go to Monetize → Products → In-app products
2. Create managed products for credit packages
3. Set pricing for each product

### Revenue Sharing:
- **Apple**: 30% commission (15% for small businesses <$1M revenue)
- **Google**: 30% commission (15% for first $1M revenue)

## 📊 **Post-Launch Monitoring**

### Analytics Setup:
```bash
# Add analytics (optional)
bun add @react-native-firebase/analytics
# or
bun add @amplitude/react-native
```

### Key Metrics to Track:
- Daily/Monthly Active Users
- User retention rates
- Crash-free sessions
- In-app purchase conversion
- User ratings and reviews

### App Store Optimization (ASO):
- Monitor keyword rankings
- Track download rates
- Analyze user reviews
- Update screenshots periodically
- Refresh app descriptions

## 🔄 **Updates & Maintenance**

### Regular Updates:
```bash
# Build and submit updates
npm version patch  # Updates version in package.json
eas build --platform all --profile production
eas submit --platform all --profile production
```

### Version Management:
- **iOS**: Auto-increment build number
- **Android**: Auto-increment version code
- Update version string for major releases

### Update Schedule:
- **Bug fixes**: As needed
- **Feature updates**: Monthly/quarterly
- **Security updates**: Immediately when required
- **Platform updates**: When new iOS/Android versions release

## 🆘 **Troubleshooting Common Issues**

### Build Failures:
```bash
# Clear caches and rebuild
eas build:cancel  # Cancel any running builds
eas build --platform ios --profile production --clear-cache
```

### Review Rejections:
- **App Store**: Check App Store Review Guidelines
- **Play Store**: Check Google Play Developer Policy
- Address issues and resubmit

### Performance Issues:
- Use Flipper or React Native Debugger
- Monitor crash reports in respective consoles
- Implement error tracking (Sentry, Bugsnag)

### Common Fixes:
```bash
# Update dependencies
bun update

# Regenerate native code
npx expo prebuild --clean

# Check for known issues
npx expo doctor
```

## 📅 **Timeline Expectations**

### First-Time Launch:
- **Setup**: 1-2 weeks (accounts, assets, testing)
- **Build & Submit**: 1-3 days
- **Review Process**: 1-7 days
- **Total**: 2-4 weeks

### Updates:
- **Minor updates**: 1-3 days
- **Major updates**: 1-2 weeks
- **Emergency fixes**: Same day to 24 hours

### Success Metrics:
- **Downloads**: Track weekly/monthly
- **Ratings**: Aim for 4.0+ average
- **Revenue**: Monitor IAP conversion rates
- **Engagement**: Daily/weekly active users

Your SlabSnap app is well-positioned for success in the stone industry marketplace niche! 🏗️📱