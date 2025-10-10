# Simple Remnant Animation - V3

## Complete Redesign

Replaced the complex multi-layer visualization with a **simple, clear slide animation** that shows the remnant cutting process.

## Animation Sequence

### Timeline:
1. **0-0.8s**: Full slab slides in from LEFT
2. **1.5-2.2s**: 2-3 square cutouts slide to RIGHT and fade out
3. **2.7-3.5s**: Remaining remnant pieces pull apart slightly

### What Users See:
1. ✅ **Slab enters** - Gray/beige stone rectangle slides from left
2. ✅ **Cutouts leave** - White squares (the pieces cut for countertops) slide right and disappear
3. ✅ **Remnants separate** - Orange pieces (what's left) pull apart to show they're separate

## Visual Design

### Full Slab:
- **Color**: Beige stone (secondary[300])
- **Texture**: Subtle overlay
- **Border**: 2px solid
- **Size**: 250×150px

### Cutout Pieces (that slide away):
- **Color**: White (background.primary)
- **Border**: 2px navy blue (primary[600])
- **Count**: 3 squares
- **Sizes**: 70×60, 60×60, 50×45
- **Action**: Slide right 300px + fade to 0

### Remnant Pieces (that pull apart):
- **Color**: Amber orange (accent[500])
- **Opacity**: 70%
- **Count**: 3 pieces
- **Action**: Separate by 15px in different directions
  - Piece 1: Move up-left
  - Piece 2: Move down
  - Piece 3: Stay mostly in place

## Technical Implementation

**Animation Values (16 total)**:
- `slabTranslateX`, `slabOpacity` - Slab slide in
- `cutout1/2/3TranslateX`, `cutout1/2/3Opacity` - Cutouts slide out
- `remnant1/2/3TranslateX`, `remnant1/2/3TranslateY` - Remnants separate

**Easing**:
- Slide in: `Easing.out(Easing.cubic)` - Smooth deceleration
- Slide out: `Easing.in(Easing.cubic)` - Smooth acceleration
- Pull apart: Spring physics (damping: 10)

**Performance**:
- All animations on UI thread (Reanimated v3)
- Total time: 3.5s
- No complex layers or shadows
- Clean, simple rendering

## Key Differences from V2

| Aspect | V2 (Complex) | V3 (Simple) |
|--------|--------------|-------------|
| Layers | 10+ texture layers | 1 simple texture |
| Animations | 10 shared values | 16 simple values |
| Effects | Glows, shadows, labels | Clean slides only |
| Size labels | Yes | No |
| Step text | Yes | No |
| Icons | Yes | No |
| Complexity | High | Low |
| Clarity | Medium | HIGH ✅ |

## User Experience

**Goal**: Instantly understand "remnants are leftover pieces"

**Method**: 
1. Show full slab
2. Remove cutout pieces (slide away)
3. Separate what's left

**Result**: Clear, simple, educational - no clutter!
