# Translation System Enhancement Plan

## Current State
- ✅ Translation files exist (en.ts, es.ts)
- ✅ Translation store works correctly
- ✅ Language switcher in Profile works
- ❌ Only 2 screens use translations (Landing, Profile)
- ❌ Most screens have hardcoded English text

## Screens That Need Translation

### High Priority (Main User Flow)
1. **HomeScreen** - Browse listings
2. **ListingDetailScreen** - View item details
3. **CreateListingScreen** - Post new item
4. **LoginScreen** - Sign in
5. **SignupScreen** - Create account

### Medium Priority
6. **MapScreen** - Vendor map
7. **JobBoardScreen** - Browse jobs
8. **ChatScreen** - AI assistant
9. **MessagesScreen** - User messages

### Low Priority (Already Done or Less Critical)
10. **ProfileScreen** - ✅ Already translated
11. **LandingScreen** - ✅ Already translated

## Implementation Strategy

### Step 1: Add Missing Translation Keys
Add translations for:
- Stone types (Granite, Marble, Quartzite, Quartz)
- Filter options (All, Recent, Price Low/High, Popular)
- View modes (Large, Grid, Compact)
- Action buttons (Save, Cancel, Submit, etc.)
- Form labels
- Error messages
- Success messages

### Step 2: Update Screens
For each screen:
1. Import `useLanguageStore`
2. Get translations: `const { translations: t } = useLanguageStore();`
3. Replace all hardcoded strings with `t.section.key`

### Step 3: Test Language Switching
- Switch to Spanish in Profile
- Navigate through app
- Verify all text changes

## Example Implementation

### Before (Hardcoded):
```typescript
<Text>Search stone remnants...</Text>
<Text>All</Text>
<Text>Granite</Text>
```

### After (Translated):
```typescript
const { translations: t } = useLanguageStore();

<Text>{t.home.searchPlaceholder}</Text>
<Text>{t.home.all}</Text>
<Text>{t.home.granite}</Text>
```

## Translation Keys Needed

### For HomeScreen:
```typescript
home: {
  searchPlaceholder: 'Search stone remnants...',
  all: 'All',
  granite: 'Granite',
  marble: 'Marble',
  quartzite: 'Quartzite',
  quartz: 'Quartz',
  recent: 'Recent',
  priceLow: 'Price: Low to High',
  priceHigh: 'Price: High to Low',
  popular: 'Popular',
  noListings: 'No listings found',
  largeView: 'Large View',
  gridView: 'Grid View',
  compactView: 'Compact View',
}
```

### Spanish Translations:
```typescript
home: {
  searchPlaceholder: 'Buscar restos de piedra...',
  all: 'Todos',
  granite: 'Granito',
  marble: 'Mármol',
  quartzite: 'Cuarcita',
  quartz: 'Cuarzo',
  recent: 'Reciente',
  priceLow: 'Precio: Menor a Mayor',
  priceHigh: 'Precio: Mayor a Menor',
  popular: 'Popular',
  noListings: 'No se encontraron anuncios',
  largeView: 'Vista Grande',
  gridView: 'Vista de Cuadrícula',
  compactView: 'Vista Compacta',
}
```

## Files to Modify

1. `/src/utils/i18n/en.ts` - Add missing keys
2. `/src/utils/i18n/es.ts` - Add Spanish translations
3. `/src/screens/HomeScreen.tsx` - Implement translations
4. `/src/screens/ListingDetailScreen.tsx` - Implement translations
5. `/src/screens/CreateListingScreen.tsx` - Implement translations
6. `/src/screens/MapScreen.tsx` - Implement translations

## Benefits After Implementation

1. **True Bilingual App** - Full English/Spanish support
2. **Better UX** - Spanish speakers can use app comfortably
3. **Scalable** - Easy to add more languages later
4. **Professional** - Shows attention to detail
5. **Market Expansion** - Reach Spanish-speaking markets

## Testing Checklist

- [ ] All screens show English by default
- [ ] Language switcher in Profile works
- [ ] All text changes to Spanish when switched
- [ ] No hardcoded English text remains
- [ ] Buttons and labels translate correctly
- [ ] Error messages translate
- [ ] Form placeholders translate
- [ ] No missing translation keys
- [ ] Stone types translate correctly
- [ ] Currency symbols stay correct ($)

## Priority Order

1. **First:** Add translation keys to en.ts and es.ts
2. **Second:** Update HomeScreen (most used)
3. **Third:** Update ListingDetailScreen
4. **Fourth:** Update CreateListingScreen
5. **Fifth:** Update remaining screens

## Estimated Impact

- **Current:** ~15% of app text is translated
- **After implementation:** ~95% of app text will be translated
- **User experience:** Dramatically improved for Spanish speakers

This will transform the app from "English with minimal Spanish" to "Fully bilingual professional app"!
