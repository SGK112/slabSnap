# SlabSnap - Complete Stone Marketplace App

**Powered by Surprise Granite**

## 🎉 App Overview

**SlabSnap** is a modern, camera-first mobile marketplace for buying and selling stone slabs and remnants. The name combines "Slab" (stone slabs) with "Snap" (quick photo posting) for instant brand recognition.

---

## 🎨 Branding

### App Name
**SlabSnap** - "Snap. List. Sell Stone."

### Colors
- **Primary**: Amber/Orange (#f59e0b, #ea580c)
- **Accent**: Amber 500 (#f59e0b)
- **Background**: White/Gray-50
- **Text**: Gray-900

### Powered By
**Surprise Granite** - Arizona's Premier Stone Fabricator

---

## ✨ Key Features

### 1. Landing Page
- **Hero section** with gradient background (amber/orange)
- Value proposition: "The fastest way to buy and sell stone slabs and remnants"
- **How It Works** in 3 steps
- **Benefits section**
- Surprise Granite branding in footer
- Call-to-actions for Sign Up / Sign In

### 2. Camera-First Posting
- **Up to 7 photos** per listing (increased from 5)
- Traditional camera settings (no cropping, high quality 90%)
- Multi-select from gallery
- Big camera prompt when no photos
- Numbered photo badges (1, 2, 3...)

### 3. Built-in Messaging System
- **Messages tab** in main navigation
- In-app conversations with buyers/sellers
- Real-time messaging interface
- Conversation list with unread badges
- Links to listing context
- Message bubbles with timestamps

### 4. Quick Listing Creation
- Snap photos → Add details → Post
- Stone type selection (10 types)
- Listing type: Slab or Remnant
- Price and location
- Optional dimensions
- 1 credit per listing

### 5. Browse & Search
- Grid view of stone listings
- Filter by stone type
- Search by title/description
- Real stone slab images from manufacturers
- Favorite/save listings

---

## 📱 Navigation Structure

### Bottom Tabs (5 tabs)
1. **Browse** - Home feed of listings
2. **Messages** - In-app conversations
3. **Sell** - Camera-first posting (center tab)
4. **My Listings** - Manage your posts
5. **Profile** - Account settings

### Stack Navigation
- Landing → Login/Signup
- Onboarding (first time)
- Main Tabs
- Listing Detail
- Chat (messaging)
- User Profile
- Buy Credits (modal)

---

## 💬 Messaging System

### Conversation List (Messages Tab)
- Shows all active conversations
- Listing thumbnail and title
- Other user's name
- Last message preview
- Unread count badge
- Sorted by most recent

### Chat Screen
- Real-time messaging interface
- Message bubbles (amber for sent, white for received)
- Timestamps relative ("2 min ago")
- Linked to specific listing
- Send button (amber when active)
- Keyboard-aware scrolling

### How It Works
1. User taps "Message Seller" on listing detail
2. Creates new conversation or opens existing one
3. Messages stored in Zustand + AsyncStorage
4. Persistent across app sessions

---

## 🎯 User Flow

### New User
1. **Landing page** → Tap "Get Started Free"
2. **Sign up** → Email, password, name
3. **Onboarding** → See 3-step process
4. **Browse** → See stone listings with real images
5. **Post first listing** → 5 free credits included

### Posting a Listing
1. Tap **"Sell" tab** (center)
2. See big camera button
3. **Snap photos** (up to 7)
4. Add details (30 seconds)
5. **Post** → Live for 72 hours

### Buying/Messaging
1. **Browse listings**
2. Tap listing → See details
3. **"Message Seller"** button (amber)
4. Opens chat → Send message
5. Continue conversation in Messages tab

---

## 🎨 Color Updates Throughout App

### Updated Screens
- ✅ Landing Page (gradient amber/orange)
- ✅ Onboarding (amber primary buttons)
- ✅ Login/Signup (amber buttons, accent colors)
- ✅ Navigation tabs (amber active state)
- ✅ Create Listing (amber camera button, selection states)
- ✅ Listing Detail (amber "Message Seller" button)
- ✅ Credits Screen (fixed checkmark overlap)
- ✅ Messages (amber unread badges)
- ✅ Chat (amber sent messages and send button)

---

## 📷 Image Limits

- **7 photos per listing** (increased from 5)
- High quality (90%)
- No forced cropping
- Multi-select support
- Numbered badges show order

---

## 🏢 Surprise Granite Integration

### Branding Placement
1. **Landing page footer**
   - Logo icon (amber diamond)
   - "Powered by Surprise Granite"
   - "Arizona's Premier Stone Fabricator"

2. **App Identity**
   - Bundle ID: com.surprisegranite.slabsnap
   - App scheme: slabsnap://

### Real Stone Images
All mock listings use actual stone photos from:
- MSI Surfaces
- Surprise Granite
- Silestone

Stone types:
1. Bianco Antico Granite
2. Black Galaxy Granite
3. Calacatta Gold Quartz
4. Andino White Granite
5. Giallo Ornamental Granite
6. Blue Pearl Granite
7. Colonial White Granite
8. Absolute Black Granite

---

## 💳 Credit System

### Pricing
- **5 free credits** on signup
- 1 credit = 1 listing
- Listings live for 72 hours
- Purchase packages: 5, 10, 25, 50 credits
- Starting at $4.99 for 5 credits

### Payment
- Stripe integration (simulated)
- Credits never expire
- Secure checkout modal

---

## 🔄 Data Management

### Zustand Stores
1. **authStore** - User authentication, credits
2. **listingsStore** - Posts with versioning
3. **messagingStore** - Conversations and messages

### Persistence
- AsyncStorage for all stores
- Data versioning for migrations
- Fresh stone images on updates

---

## 📊 Technical Stack

- **Framework**: React Native + Expo SDK 53
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State**: Zustand with persistence
- **Styling**: NativeWind (Tailwind CSS)
- **Camera**: Expo Image Picker
- **Storage**: AsyncStorage
- **Icons**: Ionicons
- **Date Formatting**: date-fns

---

## 🚀 Ready Features

✅ Landing page with branding
✅ Camera-first listing creation (7 photos)
✅ In-app messaging system
✅ Amber/orange branding colors
✅ Real stone slab images
✅ 72-hour auto-archive
✅ Credit purchase system
✅ Browse, search, filter
✅ User profiles
✅ Surprise Granite branding

---

## 📝 App Store Info

**Name**: SlabSnap
**Tagline**: Snap. List. Sell Stone.
**Description**: The fastest marketplace for stone slabs and remnants. Snap photos, set your price, and connect with buyers instantly.

**Category**: Shopping / Marketplace
**Target Users**: Fabricators, contractors, homeowners, stone dealers

---

## 🎯 Competitive Advantages

1. **Camera-first** - Post in 60 seconds
2. **Built-in messaging** - No need for phone numbers
3. **Stone-specific** - Not diluted by other categories
4. **72-hour listings** - Fresh inventory always
5. **Credit system** - Affordable at $0.99/listing
6. **Real stone images** - Professional quality
7. **Surprise Granite backing** - Industry trust

---

**Built with ❤️ by Surprise Granite**
Arizona's Premier Stone Fabricator
