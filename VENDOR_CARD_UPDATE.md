# Vendor Card UI Update

## Changes Made

### 1. **Removed Close Button from Top Right**
- Previously: Close button (X) was positioned absolutely in the top right corner
- Now: Close button moved to bottom action bar

### 2. **Added Bottom Action Bar**
The vendor detail card now has a new bottom section with two buttons:

#### **Favorite Button (Left)**
- Shows heart icon + text
- Text changes based on state:
  - "Add to Favorites" (when not favorited)
  - "Favorited" (when favorited, with orange color)
- Takes up most of the width (flex: 1)
- Full clickable area

#### **Close Button (Right)**
- Shows X icon + "Close" text
- Fixed width (auto-sized to content)
- Dismisses the vendor card

### 3. **Visual Design**
- Bottom action bar has:
  - Border top separator line
  - 12px top margin and padding
  - 8px gap between buttons
- Both buttons have:
  - Light background
  - Border
  - Rounded corners (10px)
  - Icon + text layout
  - Clear hit target

### 4. **Removed Old Favorite Button**
- Removed the small heart icon that was in the top right of the header
- Now only the image heart button and bottom favorite button exist

## User Experience Improvements

1. **Clearer Actions**: Users can now see explicitly what the buttons do ("Add to Favorites", "Close")
2. **Easier Tapping**: Larger buttons with text labels are easier to tap than icon-only buttons
3. **Better Layout**: Content flows naturally from top to bottom with actions at the end
4. **Status Feedback**: "Favorited" text gives immediate feedback when the item is saved

## Layout Structure

```
[Vendor Image with Heart Button]
[Card Content]
  - Vendor badge (type)
  - Vendor name
  - Verified badge
  - Rating stars
  - Description
  - Specialty chips
  - Action buttons (Call, Directions, Email)
  [NEW] Bottom Action Bar
    [Add to Favorites / Favorited] [Close]
```

## Before & After

### Before:
- Close button: Top right corner (small X icon only)
- Favorite button: Top right of content header (small heart icon only)

### After:
- Close button: Bottom action bar (X icon + "Close" text)
- Favorite button: Bottom action bar (Heart icon + "Add to Favorites" / "Favorited" text)
- Favorite button also on image (unchanged)

## Files Modified
- `/src/screens/MapScreen.tsx`
  - Updated `VendorDetailCard` component
  - Added new styles: `cardBottomActions`, `cardFavoriteButton`, `cardCloseButton`, `cardActionText`
