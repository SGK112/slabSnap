# Remnants Only - Minimal Design

## Ultra-Simple Concept

No slab, no cutouts, no animations - just show the **remnant pieces** that are available.

## What You See

3 orange stone pieces arranged to show they're separate leftover pieces:

```
     ┌─────────┐
     │ Piece 1 │  Top right
     └─────────┘

┌────────┐  ┌────────────┐
│Piece 2 │  │  Piece 3   │  Bottom
└────────┘  └────────────┘
```

## Animation

**Simple fade in + scale up**:
- Opacity: 0 → 1 (800ms)
- Scale: 0.8 → 1.0 (spring physics)
- That's it!

## Visual Design

**Color**: Amber orange (accent[500])
**Border**: 2px darker orange (accent[600])
**Border radius**: 6px (rounded corners)

### Piece Sizes:
1. **Top right**: 80×50px
2. **Bottom left**: 70×30px
3. **Bottom right**: 100×30px

## Why This Works

✅ **Immediate clarity**: You see remnants instantly
✅ **No confusion**: No animation story to follow
✅ **Clean & minimal**: Just the product
✅ **Fast**: Appears in 0.8 seconds

## Message

The visual says: "These are stone remnants - individual pieces available for purchase"

Simple. Direct. Clear.

## Code Simplicity

**Before**: Multiple animations, slide-ins, cutouts, timing sequences
**Now**: 
- 2 animation values (opacity, scale)
- 1 spring animation
- 3 rectangles
- Done.

**Total complexity**: Minimal ⭐
**User clarity**: Maximum ⭐⭐⭐⭐⭐
