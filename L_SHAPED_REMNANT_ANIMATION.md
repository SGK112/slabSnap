# L-Shaped Cutout Animation - Final Design

## Concept

Show a realistic countertop cutting process:
1. Full stone slab appears
2. L-shaped countertop is cut out (typical kitchen configuration)
3. Cutout slides away
4. Remnants that are left over pulse/highlight

## The Animation (3.5 seconds)

### Timeline:
1. **0-0.7s**: Gray slab slides in from LEFT →
2. **1.0-1.4s**: White L-shaped cutout appears (borders show cut lines)
3. **1.8-2.5s**: L-shaped cutout slides RIGHT and fades away →→→
4. **2.8s+**: Orange remnants pulse (60%-100% opacity) ✨

## Visual Layout

```
┌─────────────────────────────────┐
│ Full Slab (260×160)             │
│  ┌────────┐                     │
│  │        │    ┌─────────┐      │
│  │   L    │    │Remnant 1│      │ ← Top right
│  │        ├────┤         │      │
│  │  Shape │    └─────────┘      │
│  │        │                     │
│  └────────┴──────┐              │
│  [Rem 2] [Rem 3] │              │ ← Bottom strips
└─────────────────────────────────┘
```

## L-Shaped Cutout

**Vertical part**: 100×120px (left side)
**Horizontal part**: 120×60px (bottom right)
**Color**: White with navy blue 2px border
**Purpose**: Represents kitchen counter configuration

## Remnants (What's Left)

1. **Top right corner** (110×50px)
2. **Bottom left strip** (90×10px)
3. **Bottom right strip** (110×10px)

**Color**: Amber orange (accent[500])
**Animation**: Pulsing 60%-100% opacity
**Purpose**: Shows usable leftover pieces

## Animation Steps

### Step 1: Slab Entry
- Slides from -300px to 0px
- Duration: 700ms
- Easing: out(ease)

### Step 2: Show Cutout
- Opacity 0 → 1
- Duration: 400ms
- Pause at 1.0s

### Step 3: Remove Cutout
- Slides right to 350px
- Opacity 1 → 0
- Duration: 700ms + 600ms fade
- Start at 1.8s

### Step 4: Highlight Remnants
- Pulsing opacity 60%-100%
- Duration: 600ms per cycle
- Infinite loop
- Start at 2.8s

## Why L-Shape?

✅ **Realistic**: Most common kitchen counter configuration
✅ **Clear**: Easy to see what was cut vs. what remains
✅ **Educational**: Shows actual use case for remnants

## Code Structure

**Animation Values**: 4
- `slabTranslateX` - Slide in
- `cutoutOpacity` - Show/hide cutout
- `cutoutTranslateX` - Slide out cutout
- `remnantsHighlight` - Pulsing highlight

**Components**:
- Full slab (gray background)
- L-shaped cutout (2 rectangles)
- 3 remnant pieces (orange)

## User Understanding

**Before animation**: "What are remnants?"
**After animation**: "Oh! They're the pieces left after cutting countertops!"

**Clarity**: ⭐⭐⭐⭐⭐ (Perfect - shows real-world scenario)
