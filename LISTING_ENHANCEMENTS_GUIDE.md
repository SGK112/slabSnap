# SlabSnap Listing Enhancement - Implementation Guide

## Overview
Enhanced the SlabSnap listing system to support:
1. **Multiple pieces with individual dimensions** (bundled listings)
2. **Quantity tracking** (# of pieces, sq ft, linear ft, etc.)
3. **AI Writer integration** for all text fields
4. **Complete SlabSnap branding**

## Changes Made

### 1. Branding Updates ✅
- **src/utils/i18n/en.ts**: Changed `appName: 'cutStone'` → `appName: 'SlabSnap'`
- **src/utils/i18n/es.ts**: Changed `appName: 'cutStone'` → `appName: 'SlabSnap'`
- **app.json**: Already configured as "SlabSnap"

### 2. Type System Updates ✅
- **src/types/marketplace.ts**:
  ```typescript
  // Added ListingPiece interface for multiple pieces
  export interface ListingPiece {
    id: string;
    pieceNumber: number;
    dimensions: {
      length: number;
      width: number;
      thickness?: number;
      height?: number;
    };
    quantity?: number;
    notes?: string;
  }

  // Updated Listing interface
  export interface Listing {
    // ... existing fields
    pieces?: ListingPiece[]; // NEW: Multiple pieces
    totalQuantity?: number; // NEW: Total quantity
    quantityUnit?: "pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes"; // NEW
    // ... rest of fields
  }

  // Updated ListingType to include "Slab"
  export type ListingType = "New" | "Used" | "Surplus" | "Remnant" | "Slab" | "Custom";
  ```

### 3. AI Writer Component ✅
- **src/components/AIWriterButton.tsx**: New reusable component
  - Floating "AI Writer" button overlays on text inputs
  - Modal interface for generating content
  - Supports different field types (title, description, ad, job, bio, notes)
  - Context-aware prompts
  - Regenerate capability
  - Direct integration with OpenAI

## CreateListingScreen Changes Needed

### State Variables to Add:
```typescript
const [pieces, setPieces] = useState<Array<{
  id: string;
  length: string;
  width: string;
  thickness: string;
  notes: string;
}>>([]);
const [totalQuantity, setTotalQuantity] = useState("");
const [quantityUnit, setQuantityUnit] = useState<"pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes">("pieces");
const [showAIWriter, setShowAIWriter] = useState(false);
```

### Import AI Writer:
```typescript
import { AIWriterButton } from "../components/AIWriterButton";
```

### UI Updates:

#### 1. Title Field (line ~355):
```typescript
{/* Title */}
<View style={{ marginBottom: 16 }}>
  <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>Title</Text>
  <View style={{ position: "relative" }}>
    <TextInput
      className="rounded-xl px-5 py-4 text-base"
      style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', paddingRight: 120 }}
      placeholder="e.g. Premium Carrara Marble Slab"
      placeholderTextColor="#9ca3af"
      value={title}
      onChangeText={setTitle}
    />
    <AIWriterButton
      value={title}
      onValueChange={setTitle}
      placeholder="Premium Carrara Marble Slab"
      fieldType="title"
      context={`${stoneType} ${listingType}`}
    />
  </View>
</View>
```

#### 2. Description Field (line ~369):
```typescript
{/* Description */}
<View style={{ marginBottom: 16 }}>
  <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
    Description
  </Text>
  <View style={{ position: "relative" }}>
    <TextInput
      className="rounded-xl px-5 py-4 text-base"
      style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', minHeight: 120, paddingRight: 120 }}
      placeholder="Describe the stone, condition, and any details..."
      placeholderTextColor="#9ca3af"
      value={description}
      onChangeText={setDescription}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />
    <AIWriterButton
      value={description}
      onValueChange={setDescription}
      placeholder="Describe the stone"
      fieldType="description"
      context={`${stoneType} ${listingType}, ${title}`}
    />
  </View>
</View>
```

#### 3. Quantity/Inventory Section (add after ListingType, line ~468):
```typescript
{/* Quantity & Unit */}
<View style={{ marginBottom: 24 }}>
  <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
    Quantity / Inventory
  </Text>
  <View style={{ flexDirection: "row", gap: 12 }}>
    <View style={{ flex: 1 }}>
      <TextInput
        className="rounded-xl px-5 py-4 text-base"
        style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
        placeholder="e.g. 3"
        placeholderTextColor="#9ca3af"
        value={totalQuantity}
        onChangeText={setTotalQuantity}
        keyboardType="numeric"
      />
    </View>
    <View style={{ flex: 1.5 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {["pieces", "slabs", "sq_ft", "linear_ft", "tiles", "boxes"].map((unit) => (
          <Pressable
            key={unit}
            onPress={() => setQuantityUnit(unit as any)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 10,
              marginRight: 8,
              backgroundColor: quantityUnit === unit ? '#2563eb' : 'white',
              borderWidth: 2,
              borderColor: quantityUnit === unit ? '#2563eb' : '#e5e7eb',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: quantityUnit === unit ? 'white' : '#374151'
            }}>
              {unit === "sq_ft" ? "sq ft" : unit === "linear_ft" ? "linear ft" : unit}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  </View>
</View>
```

#### 4. Multiple Pieces Section (replace single dimensions, line ~497):
```typescript
{/* Multiple Pieces */}
<View style={{ marginBottom: 24 }}>
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
    <Text className="text-base" style={{ fontWeight: '600', color: '#0f172a' }}>
      Pieces {pieces.length > 0 && `(${pieces.length})`}
    </Text>
    <Pressable
      onPress={() => {
        const newPiece = {
          id: `piece-${Date.now()}`,
          length: "",
          width: "",
          thickness: "",
          notes: "",
        };
        setPieces([...pieces, newPiece]);
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
      }}
    >
      <Ionicons name="add" size={20} color="white" />
      <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add Piece</Text>
    </Pressable>
  </View>

  {pieces.length === 0 ? (
    <Pressable
      onPress={() => {
        const newPiece = {
          id: `piece-${Date.now()}`,
          length: "",
          width: "",
          thickness: "",
          notes: "",
        };
        setPieces([newPiece]);
      }}
      style={{
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
      }}
    >
      <Ionicons name="cube-outline" size={40} color="#9ca3af" />
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 12 }}>
        Add Individual Pieces
      </Text>
      <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
        Track dimensions for each piece separately
      </Text>
    </Pressable>
  ) : (
    pieces.map((piece, index) => (
      <View
        key={piece.id}
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#e5e7eb',
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
            Piece #{index + 1}
          </Text>
          <Pressable
            onPress={() => setPieces(pieces.filter(p => p.id !== piece.id))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#fee2e2',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </Pressable>
        </View>

        {/* Dimensions */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Length</Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#0f172a',
              }}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={piece.length}
              onChangeText={(text) => {
                const updated = pieces.map(p =>
                  p.id === piece.id ? { ...p, length: text } : p
                );
                setPieces(updated);
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Width</Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#0f172a',
              }}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={piece.width}
              onChangeText={(text) => {
                const updated = pieces.map(p =>
                  p.id === piece.id ? { ...p, width: text } : p
                );
                setPieces(updated);
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Thick</Text>
            <TextInput
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#0f172a',
              }}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={piece.thickness}
              onChangeText={(text) => {
                const updated = pieces.map(p =>
                  p.id === piece.id ? { ...p, thickness: text } : p
                );
                setPieces(updated);
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes */}
        <TextInput
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13,
            color: '#0f172a',
          }}
          placeholder="Notes (e.g., chipped corner, polished edge)"
          placeholderTextColor="#9ca3af"
          value={piece.notes}
          onChangeText={(text) => {
            const updated = pieces.map(p =>
              p.id === piece.id ? { ...p, notes: text } : p
            );
            setPieces(updated);
          }}
        />
      </View>
    ))
  )}
</View>
```

#### 5. Update handleSubmit function:
```typescript
const handleSubmit = () => {
  // ... existing validation ...

  // Build pieces array
  const listingPieces: ListingPiece[] = pieces
    .filter(p => p.length && p.width)
    .map((p, index) => ({
      id: `piece-${Date.now()}-${index}`,
      pieceNumber: index + 1,
      dimensions: {
        length: parseFloat(p.length),
        width: parseFloat(p.width),
        thickness: p.thickness ? parseFloat(p.thickness) : undefined,
      },
      notes: p.notes || undefined,
    }));

  const newListing = {
    // ... existing fields ...
    category: "Stone" as MaterialCategory, // ADD THIS
    pieces: listingPieces.length > 0 ? listingPieces : undefined,
    totalQuantity: totalQuantity ? parseInt(totalQuantity) : pieces.length || 1,
    quantityUnit: quantityUnit,
    // ... rest of fields ...
  };

  addListing(newListing);
  // ... rest of function ...
};
```

## Usage

### Posting a Listing with Multiple Pieces:
1. Add photos
2. Enter title (use AI Writer for suggestions)
3. Enter description (use AI Writer)
4. Select stone type and listing type
5. Enter price and location
6. **Enter total quantity** (e.g., "5" pieces)
7. Select unit (pieces, slabs, sq ft, etc.)
8. **Click "Add Piece"** to add individual dimensions
9. Enter dimensions for each piece
10. Add notes per piece if needed
11. Post listing

### Benefits:
✅ Bundle multiple pieces in one listing
✅ Track individual piece dimensions
✅ Support different quantity units (sq ft for tile, pieces for remnants, etc.)
✅ AI-powered title and description generation
✅ Professional SlabSnap branding throughout

## Files Modified:
- ✅ src/utils/i18n/en.ts
- ✅ src/utils/i18n/es.ts
- ✅ src/types/marketplace.ts
- ✅ src/components/AIWriterButton.tsx (NEW)
- ⏳ src/screens/CreateListingScreen.tsx (needs updates above)

## Next Steps:
1. Apply CreateListingScreen changes
2. Test listing creation flow
3. Update ListingDetailScreen to display multiple pieces
4. Add AI Writer to CreateAdScreen and PostJobScreen
