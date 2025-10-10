# Clean & Simple Remnant Animation - Final

## Ultra-Simplified Design

Stripped down to the absolute essentials - clean, clear, and instantly understandable.

## The Animation (2.8 seconds total)

1. **0-0.7s**: Gray slab slides in from left →
2. **1.2-1.9s**: White cutouts slide right and fade →→→
3. **2.2-2.8s**: Orange remnants spread apart ⬅️ ➡️

## Visual Design

### Slab (background):
- **Color**: Light gray (neutral[200])
- **Border**: 1px thin line
- **Size**: 240×140px
- **Style**: Clean, flat rectangle

### Cutouts (white pieces that leave):
- **Color**: White (background.primary)
- **Border**: 1.5px gray
- **Count**: 2 large squares
- **Animation**: Slide right together + fade out

### Remnants (orange pieces that stay):
- **Color**: Amber (accent[400])
- **Count**: 3 thin pieces
- **Animation**: Subtle spread (12px max)

## Key Simplifications

| Removed | Why |
|---------|-----|
| Stone texture overlay | Too busy |
| Multiple opacity layers | Confusing |
| Complex cutout shapes | Unclear |
| Size labels | Clutter |
| Glows & shadows | Distracting |
| 3rd cutout | Redundant |

## What Remains (literally!)

✅ **Simple shapes** - Rectangles only
✅ **Clear motion** - Slide in → slide out → spread
✅ **3 colors** - Gray slab, white cuts, orange remnants
✅ **Minimal borders** - Thin, clean lines
✅ **Short timing** - 2.8 seconds

## Animation Code Simplified

**Before**: 16 shared values, complex timing
**Now**: 4 shared values, grouped cutouts

```
slabTranslateX      → Slide in
cutoutsTranslateX   → Slide out (all together)
cutoutsOpacity      → Fade out
remnantsSpread      → Spread apart (0 to 1)
```

## User Experience

**Message**: "Remnants = what's left after cutting"

**Method**: 
1. Show whole slab
2. Cut pieces leave
3. Leftovers separate

**Clarity**: ⭐⭐⭐⭐⭐ (5/5 - crystal clear)

## Technical Specs

- **Container**: 240×140px
- **Animation timing**: 700ms per step
- **Easing**: Simple in/out curves
- **Spread distance**: 12px (subtle)
- **Total elements**: 6 (slab + 2 cutouts + 3 remnants)
- **Performance**: Smooth 60fps on UI thread
