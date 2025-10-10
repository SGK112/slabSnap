# cutStone App - Color Palette Guide
## Surprise Granite Branding - Navy Blue & Amber Orange

### Official Color System
Located in: `/src/utils/colors.ts`

#### Primary - Navy Blue (Surprise Granite Brand)
- `colors.primary[900]` - `#0a1628` - Darkest navy
- `colors.primary[800]` - `#132844` 
- `colors.primary[700]` - `#1e3a5f` - **Logo/Headers**
- `colors.primary[600]` - `#2a4d7c` - **Main Buttons**
- `colors.primary[500]` - `#375f99` - Main navy

#### Accent - Amber Orange (Surprise Granite Brand)
- `colors.accent[100]` - `#ffedd5` - Very light orange bg
- `colors.accent[200]` - `#fed7aa` - Light orange bg
- `colors.accent[300]` - `#fdba74`
- `colors.accent[400]` - `#fb923c`
- `colors.accent[500]` - `#f97316` - **PRIMARY ACCENT** (Amber Orange)
- `colors.accent[600]` - `#ea580c` - Darker orange

#### Backgrounds
- `colors.background.primary` - `#ffffff` - Main background
- `colors.background.secondary` - `#fafaf9` - Secondary surface
- `colors.background.tertiary` - `#f5f5f4` - Input fields, cards

#### Text
- `colors.text.primary` - `#1a1a1a` - Main text
- `colors.text.secondary` - `#57534e` - Secondary text  
- `colors.text.tertiary` - `#78716c` - Tertiary text/labels
- `colors.text.quaternary` - `#a8a29e` - Placeholder text

#### Borders
- `colors.border.light` - `#f5f5f4`
- `colors.border.main` - `#e7e5e4` - Standard borders
- `colors.border.dark` - `#d6d3d1`

#### Neutrals (Grays)
- `colors.neutral[50-800]` - Full gray scale for various uses

---

## Usage Guidelines

### Buttons
✅ **Primary Actions**: Use `colors.primary[600]` (navy blue)
- Login, Sign Up, Submit, Save buttons
- Example: `backgroundColor: colors.primary[600]`

✅ **Accent/Highlighted**: Use `colors.accent[500]` (amber orange)
- Important CTAs, featured items, active states
- Tab bar active icons
- Example: `color: colors.accent[500]`

❌ **DO NOT USE**: Old terracotta color `#c2794a` or yellow `#fbbf24`

### Icons  
✅ **Active/Selected**: Use `colors.accent[500]` (yellow/gold)
✅ **Inactive**: Use `colors.neutral[300]` or `colors.text.secondary`
✅ **Standard**: Use `colors.text.secondary`

### Cards & Surfaces
✅ **Background**: Use `colors.background.primary` (white)
✅ **Borders**: Use `colors.border.main` (#e7e5e4)
✅ **Secondary cards**: Use `colors.background.secondary`

### Forms & Inputs
✅ **Background**: Use `colors.background.tertiary` (#f5f5f4)
✅ **Border**: Use `colors.border.main`
✅ **Text**: Use `colors.text.primary`
✅ **Placeholder**: Use `colors.neutral[300]`
✅ **Labels**: Use `colors.text.tertiary`

### Typography
✅ **Headers/Titles**: Use `colors.primary[700]` (navy) or `colors.text.primary`
✅ **Body text**: Use `colors.text.primary`
✅ **Captions/Meta**: Use `colors.text.tertiary`
✅ **Links**: Use `colors.primary[600]` (navy blue)

---

## ✅ Updated Screens (Consistent Branding)

1. **LandingScreen** - Uses navy blue buttons, yellow accent ready
2. **LoginScreen** - Uses navy blue primary, color system throughout
3. **HomeScreen** - Replaced old terracotta (#c2794a) with yellow/gold accent
4. **ProfileScreen** - Uses colors.accent[500] for highlights
5. **Tab Navigator** - Yellow/gold active tabs

---

## 🎨 Color Replacements Made

| Old Color | Old Name | New Color | New Name |
|-----------|----------|-----------|----------|
| `#c2794a` | Terracotta | `colors.accent[500]` (#f97316) | Amber Orange |
| `#0f172a` | Slate Gray | `colors.primary[600-700]` | Navy Blue |
| `#6b7f5e` | Sage Olive | `colors.accent[500]` | Amber Orange |
| `#fbbf24` | Yellow/Gold | `colors.accent[500]` | Amber Orange |

---

## Quick Reference - Common Patterns

### Button Styles
```typescript
// Primary button
backgroundColor: colors.primary[600]
color: '#ffffff'

// Accent button  
backgroundColor: colors.accent[500]
color: colors.text.primary

// Secondary button
backgroundColor: colors.background.tertiary
color: colors.text.primary
```

### Card Styles
```typescript
backgroundColor: colors.background.primary
borderColor: colors.border.main
borderWidth: 1
```

### Input Styles
```typescript
backgroundColor: colors.background.tertiary
borderColor: colors.border.main
color: colors.text.primary
placeholderTextColor: colors.neutral[300]
```

### Icon Colors
```typescript
// Active icon
color: colors.accent[500]

// Inactive icon
color: colors.neutral[400]

// Standard icon
color: colors.text.secondary
```

---

## Style Constants Helper
Use `/src/utils/styleConstants.ts` for pre-configured style objects:

```typescript
import { styleConstants } from '../utils/styleConstants';

// Backgrounds
styleConstants.bg.primary
styleConstants.bg.input

// Buttons
styleConstants.button.primary.bg
styleConstants.button.accent.bg

// Brand
styleConstants.brand.navy
styleConstants.brand.yellow
```

---

## Maintaining Consistency

When adding new screens or components:

1. ✅ Import colors: `import { colors } from '../utils/colors'`
2. ✅ Use color constants, NOT hardcoded hex values
3. ✅ Primary buttons = Navy blue (`colors.primary[600]`)
4. ✅ Accents/highlights = Amber orange (`colors.accent[500]`)
5. ✅ Active states = Amber orange
6. ❌ Never use the old terracotta `#c2794a`
7. ❌ Never use the old sage olive `#6b7f5e`
8. ❌ Never use the old yellow/gold `#fbbf24`

---

**Last Updated**: Current Session
**Brand**: cutStone by Surprise Granite  
**Color Scheme**: Navy Blue & Amber Orange (Light Theme)
