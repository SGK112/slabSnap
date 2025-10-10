# Cookie Sheet With Holes - Final Design

## Perfect Analogy

Like a cookie sheet after cookies are cut out - the sheet (slab) has holes where the cookies (cutouts) were removed.

## The Design

### Orange Slab (Cookie Sheet):
Built from 5 separate pieces to create holes:
1. **Top strip** - Full width border
2. **Left column** - Left edge
3. **Right side** - Large right section
4. **Bottom strip** - Full width border
5. **Middle piece** - Small section between holes

This creates **3 visible holes** (empty spaces) where cutouts will be.

### Cutouts (Cookies):
3 lighter orange squares that sit IN the holes:
- **Cutout 1**: 60×60px (top left hole)
- **Cutout 2**: 70×60px (top middle hole)
- **Cutout 3**: 70×70px (bottom middle hole)

## Animation (2.3 seconds)

### 1. **0-0.8s**: Slab + Cutouts slide in together
```
┌─────────────────────┐
│ ██ ██               │  (slab + cutouts together)
│    ██               │
└─────────────────────┘
```

### 2. **1.5-2.3s**: Cutouts slide away →→→
```
┌─────────────────────┐
│ ⬜ ⬜               │  (holes visible!)
│    ⬜               │
└─────────────────────┘
```

### 3. **Final Result**: Cookie sheet with holes
The orange slab remains with 3 empty spaces showing where pieces were cut.

## Visual Layout

```
┌──────────────────────────┐  ← Top strip
│ [Hole1] [Hole2]  [Right]│  ← Holes + Right section
│ [Left]  [Hole3]  [Right]│  ← Left + Hole + Right
│ [Middle][Hole3]  [Right]│  ← Middle piece
└──────────────────────────┘  ← Bottom strip
```

## Why This Works

✅ **Actual holes**: Not white rectangles on top - real empty spaces
✅ **Cookie analogy**: Everyone understands cookie cutters
✅ **Clear remnant**: Shows the leftover material with gaps
✅ **Realistic**: This is how real stone remnants look

## Color Scheme

- **Slab pieces**: Dark orange (accent[500])
- **Cutouts**: Lighter orange (accent[300]) with border
- **Holes**: Empty space (background shows through)

## Code Structure

```jsx
<Container>
  {/* Orange slab pieces */}
  <Animated (slides in)>
    <slabTop />
    <slabLeft />
    <slabRight />
    <slabBottom />
    <slabMiddle />
  </Animated>
  
  {/* Cutout pieces */}
  <Animated (slides away)>
    <cutout1 />
    <cutout2 />
    <cutout3 />
  </Animated>
</Container>
```

Perfect cookie sheet analogy! 🍪
