# Orange Slab With Holes - Final Design

## The Concept

Show an ORANGE slab with 3 square cutouts that slide away, leaving the slab with visible holes (the remnant).

## Animation (2.3 seconds)

### 1. **0-0.8s**: Orange slab slides in from LEFT
```
┌─────────────────┐
│                 │
│  Orange Slab    │
│                 │
└─────────────────┘
```

### 2. **1.5-2.3s**: 3 white square cutouts slide RIGHT + fade away
```
┌─────────────────┐
│ □ □             │  →→→ (cutouts slide away)
│ □               │
└─────────────────┘
```

### 3. **Final Result**: Orange slab with 3 holes visible
```
┌─────────────────┐
│ ⬜ ⬜            │  (holes where cutouts were)
│ ⬜              │
└─────────────────┘
```

## Visual Design

### Orange Slab (stays):
- **Color**: Amber orange (accent[500])
- **Border**: 2px darker orange (accent[600])
- **Size**: 240×160px
- **Stays visible** throughout

### White Cutouts (leave):
- **Color**: White (background.primary)
- **Border**: 2px gray (neutral[400])
- **Count**: 3 squares (60×60px each)
- **Positions**: 
  - Top left (20, 20)
  - Top middle (90, 20)
  - Bottom left (20, 90)

## How It Works

The cutouts are WHITE rectangles on TOP of the orange slab. When they slide away, they reveal the white background BEHIND the slab, creating the appearance of "holes."

## Code Structure

```jsx
<Animated orangeSlab (slides in, stays)>
  <Animated cutouts (slide away)>
    <cutout1 (white square) />
    <cutout2 (white square) />
    <cutout3 (white square) />
  </Animated>
</Animated>
```

## Animation Values

- `slabTranslateX`: Slide in slab from left
- `cutoutsTranslateX`: Slide cutouts to right
- `cutoutsOpacity`: Fade out cutouts

## Message

**Before**: Full orange slab
**After**: Orange slab with holes (the remnant after cutting)

This clearly shows: "This is what's left after we cut pieces out for countertops!"

Perfect visual representation of a stone remnant! 🎯
