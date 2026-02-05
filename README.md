# REMODELY.AI Mobile App

React Native / Expo marketplace app for remodeling materials, vendor connections, and project management.

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SGK112/remodely-app)

## Local Development

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Build for web
npm run web
```

## Build for Production

### iOS/Android (EAS Build)
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Web (Static Export)
```bash
npx expo export --platform web --output-dir dist
```

## Features

- Material marketplace (1400+ products)
- Vendor directory with map
- Quote request system
- Measurement tools
- Style quiz onboarding
- Multi-tenant white-label support

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- Zustand (state management)
- React Navigation
- Stripe (payments)
