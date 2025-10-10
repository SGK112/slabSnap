# Remnant Visualization Feature

## What Was Changed

Replaced the decorative diamond animation on the LandingScreen with an **educational remnant visualization** that shows users what stone remnants actually are.

## The Visualization

### What It Shows:
1. **Full Stone Slab** - A rectangular piece of stone (200x140px)
2. **Cutout Shapes** - Dashed outlines showing where countertops were cut:
   - Main L-shaped countertop section
   - Small island/backsplash cutout
3. **Remnant Pieces** - Highlighted leftover pieces (pulsing amber overlay):
   - Top right corner piece
   - Bottom left strip
   - Small corner fragment

### Animation Sequence:
1. **0-0.8s**: Full slab fades in
2. **1.0-1.6s**: Cutout lines appear (showing what was removed)
3. **1.8s+**: Remnant pieces pulse (amber highlight fading between 30%-100% opacity)

### Visual Design:
- **Slab**: Light gray with subtle texture
- **Cutouts**: Dashed navy blue borders (showing the countertop shapes)
- **Remnants**: Amber orange overlay (pulsing to draw attention)
- **Label**: "Remnants" badge at bottom

## Educational Value

This visualization immediately communicates:
- ✅ What remnants are (leftover pieces)
- ✅ Where they come from (full slabs)
- ✅ Why they're valuable (usable stone at lower cost)
- ✅ The app's purpose (marketplace for these pieces)

## Technical Implementation

**File**: `/src/screens/LandingScreen.tsx`

**Animations**: React Native Reanimated v3
- `slabOpacity`: Fade in full slab
- `cutoutOpacity`: Fade in cutout lines
- `remnantHighlight`: Pulsing highlight effect

**Styling**: 
- Stone slab: `colors.neutral[200]` + `colors.neutral[300]` texture
- Cutouts: `colors.primary[600]` dashed borders
- Remnants: `colors.accent[400]` & `colors.accent[500]` overlays
- Label: `colors.primary[600]` badge

## User Experience

Users landing on the app now see a **clear visual explanation** of the marketplace concept before even reading text. The animation draws the eye and teaches the core concept in ~2 seconds.
