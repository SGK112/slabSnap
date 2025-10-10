# Animated Diamond Landing Page Feature

## Overview
Added a stunning animated diamond that appears above "cutStone" on the landing page with multiple animation effects: fade in, scale bounce, continuous rotation, vibration, and floating movement.

---

## Animation Sequence

### 1. **Fade In** (0-1 second)
- Diamond opacity goes from 0 to 1
- Duration: 1000ms
- Smooth appearance

### 2. **Scale Bounce** (0-1 second)
- Diamond scales from 0 to 1 with spring physics
- Damping: 8
- Stiffness: 100
- Bouncy entrance effect

### 3. **Continuous Rotation** (starts immediately)
- Rotates 360 degrees repeatedly
- Duration: 3000ms per rotation
- Linear easing for smooth spin
- Never stops (infinite loop)

### 4. **Vibration Effect** (starts at 1 second)
- Shakes left and right rapidly
- Movement: -5px → 5px → -5px → 5px → 0
- Duration: 250ms per cycle
- Repeats infinitely
- Creates energetic, attention-grabbing effect

### 5. **Floating Movement** (starts at 1.5 seconds)
- Moves up and down smoothly
- Range: -10px to +10px
- Duration: 4000ms per cycle (2s up, 2s down)
- Ease in-out for smooth floating
- Repeats infinitely

---

## Visual Design

### Diamond Structure

The diamond is composed of 3 layers:

#### **1. Top Facet (Triangle pointing down)**
```
    /\
   /  \
  /____\
```
- Color: Orange accent (400 shade)
- Represents top part of diamond

#### **2. Bottom Facet (Triangle pointing up)**
```
  \____/
   \  /
    \/
```
- Color: Darker orange accent (500 shade)
- Represents bottom part of diamond

#### **3. Glow Effect**
- Circular glow behind diamond
- Color: Light orange (300 shade)
- Opacity: 30%
- Creates magical luminous effect

### Combined Effect:
```
    ✨
   /\✨
  /  \
 /____\
 \    /
  \  /
   \/
   ✨
```

---

## Technical Implementation

### Using React Native Reanimated v3

```typescript
// Animated values
const rotation = useSharedValue(0);
const opacity = useSharedValue(0);
const scale = useSharedValue(0);
const translateX = useSharedValue(0); // Vibration
const translateY = useSharedValue(0); // Floating

// Combined transform
transform: [
  { translateX: translateX.value },  // Shake
  { translateY: translateY.value },  // Float
  { scale: scale.value },            // Bounce
  { rotate: `${rotation.value}deg` }, // Spin
]
```

### Animation Timeline

```
0.0s: Start
      ├─ Fade in begins (opacity 0→1)
      └─ Scale bounce begins (0→1)
      └─ Rotation begins (continuous)

1.0s: Vibration starts
      └─ Shaking left/right begins

1.5s: Floating starts
      └─ Moving up/down begins

∞:    All animations continue forever
```

---

## Layout Position

```
┌──────────────────────────┐
│                          │
│       [DIAMOND]          │ ← Animated, rotating
│     ✨  💎  ✨          │    spinning, floating
│                          │
│      cutStone            │ ← App name
│  Powered by Surprise     │ ← Tagline
│      Granite             │
│                          │
│   [What are remnants?]   │
│                          │
│      [Explore]           │
│                          │
│   Log in  •  Sign up     │
│                          │
└──────────────────────────┘
```

---

## Styling Details

### Diamond Container
- Width: 120px
- Height: 120px
- Margin bottom: 30px
- Centered above logo

### Diamond Shape
- Width/Height: 100px
- Built with border triangles (CSS technique)
- Two triangles forming diamond

### Colors
- Top facet: `colors.accent[400]` (lighter orange)
- Bottom facet: `colors.accent[500]` (medium orange)
- Glow: `colors.accent[300]` (lightest orange, 30% opacity)

---

## Animation Parameters

| Effect | Property | Duration | Repeat | Easing |
|--------|----------|----------|--------|--------|
| Fade In | opacity | 1000ms | No | Default |
| Scale | scale | Spring | No | Spring physics |
| Rotation | rotate | 3000ms | ∞ | Linear |
| Vibration | translateX | 250ms | ∞ | Linear |
| Floating | translateY | 4000ms | ∞ | InOut ease |

---

## User Experience

### First Impression
1. User opens app
2. Diamond **fades in** magically (1s)
3. Diamond **bounces** into place (spring effect)
4. **Starts spinning** continuously
5. After 1s: **Vibrates energetically**
6. After 1.5s: **Floats up and down** gracefully

### Ongoing Effect
- Diamond keeps spinning (mesmerizing)
- Subtle vibration adds energy
- Floating adds elegance
- Glow creates premium feel

### Psychological Impact
- ✨ **Eye-catching** - Immediately draws attention
- 💎 **Premium** - Diamond symbolizes quality/value
- 🎯 **Professional** - Smooth animations show polish
- ⚡ **Energetic** - Vibration suggests activity
- 🌟 **Magical** - Glow and float create wonder

---

## Code Structure

### Component Layout
```typescript
<Animated.View style={[styles.diamondContainer, animatedStyle]}>
  <View style={styles.diamond}>
    <View style={[styles.diamondFacet, styles.facetTop]} />
    <View style={[styles.diamondFacet, styles.facetBottom]} />
    <View style={styles.diamondGlow} />
  </View>
</Animated.View>
```

### Animation Setup
- All animations initialized in `useEffect`
- `useSharedValue` for performant animations
- `useAnimatedStyle` to apply transforms
- `withRepeat` for continuous effects
- `withSequence` for vibration pattern
- `withSpring` for bounce effect

---

## Performance

### Optimized
- ✅ Uses `react-native-reanimated` (runs on UI thread)
- ✅ Smooth 60 FPS animations
- ✅ No JavaScript bridge overhead
- ✅ Performant on all devices

### Benefits
- Animations don't block UI
- Smooth even during navigation
- Low battery impact
- Native performance

---

## Files Modified

### `/src/screens/LandingScreen.tsx`
**Added:**
- Import `Animated` from `react-native-reanimated`
- Animation hooks and values
- Diamond component with 3 visual layers
- 5 different animation effects
- Styles for diamond shape and glow

**Changes:**
- Added animated diamond above logo
- Enhanced visual hierarchy
- Premium branded landing experience

---

## Visual Effects Summary

| Effect | Purpose | Impact |
|--------|---------|--------|
| 💫 Fade In | Smooth entrance | Professional |
| 🎯 Scale Bounce | Energetic arrival | Playful |
| 🔄 Rotation | Continuous movement | Mesmerizing |
| 📳 Vibration | Energy & urgency | Attention-grabbing |
| ☁️ Floating | Elegance & grace | Premium feel |
| ✨ Glow | Magical quality | Luxurious |

---

## Result

The landing page now features a **stunning animated diamond** that:
- ✨ Fades in elegantly
- 💎 Bounces with spring physics
- 🔄 Spins continuously
- 📳 Vibrates energetically
- ☁️ Floats gracefully
- ✨ Glows magically

This creates an **unforgettable first impression** that communicates quality, energy, and professionalism - perfect for a premium stone remnants marketplace! 🎉

---

## Testing

To see the animation:
1. Navigate to the **Landing Page** (app entry screen)
2. Watch the diamond:
   - Fade in (first second)
   - Bounce into place
   - Start spinning
   - Begin vibrating (after 1s)
   - Start floating (after 1.5s)
3. All effects continue indefinitely

The diamond is positioned prominently above "cutStone" and immediately captures attention! 💎✨
