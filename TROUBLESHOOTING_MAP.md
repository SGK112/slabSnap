# Map Not Showing Arizona Vendors - Troubleshooting Guide

## Issue
The map is not displaying SURPRISE GRANITE and other Arizona vendors.

## Root Cause
**AsyncStorage Cache**: The vendor data is persisted with Zustand, and old cached data may be preventing new vendors from loading.

---

## ✅ Solution 1: Force App Reload (Recommended)

### On iOS/Android Device:
1. **Force close the app completely**
   - iOS: Swipe up from bottom, swipe app away
   - Android: Recent apps button, swipe away

2. **Clear app data** (if force close doesn't work)
   - iOS: Settings → General → iPhone Storage → SlabSnap → Delete App → Reinstall
   - Android: Settings → Apps → SlabSnap → Storage → Clear Data

3. **Reopen the app**
   - Vendors will reload fresh from vendorStore.ts

### Expected Result:
- Map opens centered on **Surprise, AZ** (33.6369°N, 112.3652°W)
- **12 vendor markers** appear:
  - 6 in Arizona (Phoenix metro area)
  - 6 in California (Bay Area)

---

## ✅ Solution 2: Development Environment

### If running in development mode:

```bash
# Terminal 1: Clear Metro bundler cache
cd /home/user/workspace
npx react-native start --reset-cache

# Terminal 2: Reinstall on device
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## ✅ Solution 3: Manual Cache Clear (Advanced)

Add this temporary button to MapScreen for debugging:

```tsx
// Add at top of MapScreen component
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this function
const clearVendorCache = async () => {
  await AsyncStorage.removeItem('vendor-storage');
  await AsyncStorage.removeItem('listings-storage');
  console.log('Cache cleared! Reload the app.');
  // Force reload
  loadMockVendors();
  loadMockData();
};

// Add button in header
<Pressable onPress={clearVendorCache} style={{...}}>
  <Text>Clear Cache</Text>
</Pressable>
```

---

## 🔍 Verification Steps

After clearing cache, verify:

### 1. Check Console Logs
You should see:
```
[MapScreen] Loaded 12 vendors
[MapScreen] First vendor: SURPRISE GRANITE Surprise
[MapScreen] Arizona vendors: 6
  - SURPRISE GRANITE at Surprise
  - MSI Surfaces - Phoenix at Phoenix
  - Cosentino Phoenix at Phoenix
  - Arizona Tile - Phoenix at Phoenix
  - Cactus Stone & Tile at Phoenix
  - Architectural Surfaces at Phoenix
```

### 2. Check Map View
- **Center**: Should be on Surprise, AZ (not San Francisco)
- **Zoom**: Wider view showing Phoenix metro area
- **Markers**: Should see 12 total markers

### 3. Arizona Vendors (Red/Purple/Orange markers):
- 🔴 **v0: SURPRISE GRANITE** - Surprise, AZ (Red fabricator marker)
- 🟣 **v1: MSI Surfaces** - Phoenix, AZ (Purple supplier marker)
- 🟣 **v2: Cosentino** - Phoenix, AZ (Purple supplier marker)
- 🟠 **v3: Arizona Tile** - Phoenix, AZ (Orange tile store marker)
- 🟣 **v4: Cactus Stone** - Phoenix, AZ (Purple supplier marker)
- 🟣 **v5: Architectural Surfaces** - Phoenix, AZ (Purple supplier marker)

### 4. Tap SURPRISE GRANITE Marker
Should show card with:
- Name: "SURPRISE GRANITE"
- Type: "Fabricator" (red badge)
- Address: "11560 N. Dysart Rd."
- City: "Surprise, AZ 85379"
- Phone: "(623) 537-5100"
- Rating: 4.9⭐ (342 reviews)
- Verified badge ✓

---

## 🛠️ Technical Details

### Data Version Control
The vendorStore now has version 2 with migration:

```typescript
{
  name: "vendor-storage",
  storage: createJSONStorage(() => AsyncStorage),
  version: 2,
  migrate: (persistedState: any, version: number) => {
    if (version < 2 || (persistedState && persistedState.dataVersion < 2)) {
      // Clear old data, force reload
      return {
        vendors: [],
        favoriteVendorIds: [],
        dataVersion: 2,
      };
    }
    return persistedState;
  },
}
```

### Force Reload in MapScreen
```typescript
useEffect(() => {
  // Always reload vendors (no condition)
  loadMockVendors();
  
  if (listings.length === 0) {
    loadMockData();
  }
  getUserLocation();
}, []);
```

---

## 📊 Expected Data

### Vendor Store Contents (mockVendors array):
```javascript
[
  { id: "v0", name: "SURPRISE GRANITE", state: "AZ", city: "Surprise" },
  { id: "v1", name: "MSI Surfaces - Phoenix", state: "AZ", city: "Phoenix" },
  { id: "v2", name: "Cosentino Phoenix", state: "AZ", city: "Phoenix" },
  { id: "v3", name: "Arizona Tile - Phoenix", state: "AZ", city: "Phoenix" },
  { id: "v4", name: "Cactus Stone & Tile", state: "AZ", city: "Phoenix" },
  { id: "v5", name: "Architectural Surfaces", state: "AZ", city: "Phoenix" },
  { id: "v6", name: "Premier Stone Fabricators", state: "CA", city: "San Francisco" },
  { id: "v7", name: "Bay Area Tile & Stone", state: "CA", city: "San Francisco" },
  { id: "v8", name: "Elite Countertop Solutions", state: "CA", city: "Oakland" },
  { id: "v9", name: "Granite & Marble Warehouse", state: "CA", city: "San Jose" },
  { id: "v10", name: "Modern Home Remodeling", state: "CA", city: "Palo Alto" },
  { id: "v11", name: "Precision Stone Installers", state: "CA", city: "Berkeley" }
]
```

### Map Initial Region:
```typescript
{
  latitude: 33.6369,    // SURPRISE GRANITE location
  longitude: -112.3652,  // SURPRISE GRANITE location
  latitudeDelta: 2.5,    // Wide zoom for Phoenix metro
  longitudeDelta: 2.5
}
```

---

## 🚨 If Still Not Working

1. **Check file saved**: Ensure vendorStore.ts changes were saved
2. **Check imports**: Verify MapScreen imports useVendorStore correctly
3. **Check permissions**: Ensure location permissions granted (for "My Location")
4. **Check network**: Vendor images load from Unsplash (requires internet)
5. **Check React Native version**: Should be 0.76.7

### Files to Verify:
- ✅ `src/state/vendorStore.ts` - Has 12 vendors (v0-v11), version 2
- ✅ `src/screens/MapScreen.tsx` - Calls loadMockVendors() unconditionally
- ✅ `src/nav/RootNavigator.tsx` - Map tab registered

---

## 📱 Contact Developer

If issue persists after trying all solutions:

1. Check console logs for errors
2. Take screenshot of map view
3. Note device type (iOS/Android)
4. Note if running dev or production build

---

**Last Updated**: October 3, 2025
**Version**: 2.0
**Status**: Vendors added, cache migration implemented
