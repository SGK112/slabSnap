# 📱 Testing Guide for SlabSnap App

## 🧪 **Testing Strategy Overview**

Your SlabSnap app needs to be tested on:
1. **Development** - Local development server
2. **Simulators** - iOS Simulator & Android Emulator  
3. **Physical Devices** - Real phones/tablets
4. **Beta Testing** - TestFlight (iOS) & Internal Testing (Android)

## 🔧 **Development Testing (Current Setup)**

### What's Already Working:
```bash
# Your current commands
bun run start        # Start Expo dev server
bun run ios         # Open in iOS simulator
bun run android     # Open in Android emulator
bun run web         # Open in web browser (limited functionality)
```

### Testing Features:
- ✅ **Navigation** - All tabs and screens
- ✅ **Mock Data** - Listings, vendors, jobs
- ✅ **Authentication** - Mock login/signup
- ✅ **State Management** - Zustand stores
- ❌ **Maps** - Needs Google Maps API key
- ❌ **Payments** - Needs Stripe integration
- ❌ **Camera** - Only works on physical devices

## 📱 **iOS Simulator Testing**

### Setup iOS Simulator:
1. **Install Xcode** (Mac only):
   ```bash
   # Install from Mac App Store or
   xcode-select --install
   ```

2. **Start iOS Simulator**:
   ```bash
   cd /Users/homepc/slabSnap
   bun run ios
   ```

3. **Multiple Device Testing**:
   ```bash
   # Open specific devices
   npx expo run:ios --device="iPhone 15 Pro"
   npx expo run:ios --device="iPad Pro 12.9-inch"
   ```

### iOS Testing Checklist:
- [ ] All screens render correctly
- [ ] Navigation works smoothly  
- [ ] Camera permissions (simulator limitations)
- [ ] Touch interactions and gestures
- [ ] Safe area handling (notch, home indicator)
- [ ] Keyboard behavior
- [ ] Different screen sizes (iPhone SE to iPhone 15 Pro Max)

## 🤖 **Android Emulator Testing**

### Setup Android Emulator:
1. **Install Android Studio**:
   - Download from https://developer.android.com/studio
   - Install SDK and create virtual devices

2. **Start Android Emulator**:
   ```bash
   cd /Users/homepc/slabSnap
   bun run android
   ```

3. **Multiple Device Testing**:
   ```bash
   # List available devices
   emulator -list-avds
   
   # Start specific device
   emulator -avd Pixel_7_API_34
   ```

### Android Testing Checklist:
- [ ] All screens render correctly
- [ ] Back button behavior
- [ ] Hardware back button
- [ ] Permission requests
- [ ] Different screen sizes and densities
- [ ] Keyboard behavior
- [ ] Status bar and navigation bar

## 📲 **Physical Device Testing**

### iOS Physical Device:
1. **Development Build**:
   ```bash
   # Create development build
   eas build --profile development --platform ios
   
   # Install on device via TestFlight or Xcode
   ```

2. **Expo Go App** (Limitations):
   ```bash
   # Start dev server
   bun run start
   
   # Scan QR code with Expo Go app
   # NOTE: Some native modules won't work
   ```

### Android Physical Device:
1. **Development Build**:
   ```bash
   # Create development build
   eas build --profile development --platform android
   
   # Install APK on device
   ```

2. **Expo Go App** (Limitations):
   ```bash
   # Same process as iOS
   # Limited native module support
   ```

### Physical Device Benefits:
- ✅ **Real camera functionality**
- ✅ **Actual GPS/location services**
- ✅ **Real performance testing**
- ✅ **Touch/haptic feedback**
- ✅ **Network conditions testing**
- ✅ **Battery usage monitoring**

## 🧪 **Feature-Specific Testing**

### Maps Testing:
```bash
# Requires Google Maps API key
# Test on physical device for GPS
```
**Test Cases:**
- [ ] Map loads and displays
- [ ] User location detection
- [ ] Vendor markers display
- [ ] Tap markers to view details
- [ ] Search functionality
- [ ] Directions integration

### Camera Testing:
```bash
# Only works on physical devices
```
**Test Cases:**
- [ ] Camera permission request
- [ ] Photo capture
- [ ] Gallery access
- [ ] Image compression/resizing
- [ ] Multiple photo selection

### Authentication Testing:
**Test Cases:**
- [ ] Signup flow
- [ ] Login flow  
- [ ] Form validation
- [ ] Error handling
- [ ] User persistence
- [ ] Logout functionality

### Payment Testing (when Stripe is integrated):
**Test Cases:**
- [ ] Credit package selection
- [ ] Stripe payment sheet
- [ ] Test card numbers
- [ ] Payment success/failure
- [ ] Credit balance updates
- [ ] Receipt/confirmation

## 🔍 **Testing Tools & Debugging**

### React Native Debugger:
```bash
# Install debugging tools
npm install -g react-native-debugger
```

### Flipper (Meta's debugging platform):
```bash
# Install Flipper
# https://fbflipper.com/
```

### Useful Debug Commands:
```bash
# Clear cache and restart
bun run start --clear

# Enable debugging
bun run start --dev-client

# Check logs
npx react-native log-ios     # iOS logs
npx react-native log-android # Android logs
```

### Performance Testing:
- Use React DevTools Profiler
- Monitor memory usage
- Test on older devices
- Check network request performance
- Monitor app startup time

## 📊 **Testing Checklist by Platform**

### iOS Testing:
- [ ] iPhone SE (small screen)
- [ ] iPhone 15 (standard)
- [ ] iPhone 15 Pro Max (large screen)
- [ ] iPad (tablet layout)
- [ ] Different iOS versions (15, 16, 17)
- [ ] Dark mode compatibility
- [ ] Dynamic Type (accessibility)

### Android Testing:
- [ ] Various screen sizes (5", 6", 7")
- [ ] Different Android versions (10, 11, 12, 13, 14)
- [ ] Different manufacturers (Samsung, Google, etc.)
- [ ] Various screen densities
- [ ] Back button behavior
- [ ] Android-specific UI elements

### Performance Testing:
- [ ] App launch time
- [ ] Screen transition smoothness
- [ ] Memory usage
- [ ] Battery consumption
- [ ] Network efficiency
- [ ] Image loading performance

## 🚀 **Pre-Production Testing**

### Internal Testing:
```bash
# Create preview builds
eas build --profile preview --platform all
```

### Beta Testing Setup:

#### iOS TestFlight:
1. Create App Store Connect account
2. Upload build via EAS
3. Add internal testers
4. Distribute via TestFlight

#### Android Internal Testing:
1. Create Google Play Console account
2. Upload AAB via EAS  
3. Create internal testing track
4. Add testers via email

### User Acceptance Testing:
- [ ] Real users test core workflows
- [ ] Gather feedback on usability
- [ ] Test with actual stone industry users
- [ ] Verify business logic accuracy
- [ ] Test customer support flows

## 🐛 **Common Issues & Solutions**

### Map Not Loading:
- Check Google Maps API key
- Verify API is enabled in Google Cloud
- Check network connectivity

### Camera Not Working:
- Test only on physical devices
- Check permissions in device settings
- Verify expo-camera version compatibility

### Build Errors:
```bash
# Clear all caches
rm -rf node_modules
rm bun.lock
bun install

# Clear Expo cache
npx expo prebuild --clean
```

### Performance Issues:
- Enable Hermes engine
- Optimize images
- Implement lazy loading
- Use FlatList for long lists

## 📈 **Testing Automation (Advanced)**

### Detox (E2E Testing):
```bash
# Install Detox for automated testing
npm install -g detox-cli
npm install detox --save-dev
```

### Jest Unit Tests:
```bash
# Run existing tests
bun run test

# Add new test files
# __tests__/components/*.test.tsx
```

### Test Coverage:
```bash
# Generate coverage report
bun run test --coverage
```

## 📋 **Testing Sign-Off Checklist**

Before submitting to app stores:
- [ ] All core features work on iOS simulator
- [ ] All core features work on Android emulator  
- [ ] Tested on multiple physical devices
- [ ] Performance is acceptable
- [ ] No crashes or major bugs
- [ ] All user flows complete successfully
- [ ] Authentication works properly
- [ ] Payment integration functions (if implemented)
- [ ] Maps display correctly (with API key)
- [ ] Camera features work on device
- [ ] App follows platform design guidelines
- [ ] Accessibility features work
- [ ] App works in offline conditions
- [ ] Error handling is graceful