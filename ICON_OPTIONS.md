# Icon Options for Facility Types

## Current Implementation
Currently using Unicode emoji symbols:
- Water: 💧
- Power: ⚡
- Shelter: 🏠
- Food: 🍞

These work on both web and mobile without any dependencies.

## Option 1: Expo Vector Icons (Recommended)

### Installation
```bash
npx expo install @expo/vector-icons
```

### Usage
This provides MaterialIcons, FontAwesome, Ionicons, etc. that work on web and mobile.

**Pros:**
- Professional-looking icons
- Works on web and mobile
- Many icon options
- No image files needed

**Cons:**
- Adds dependency (~500KB)

## Option 2: Custom SVG Icons

### Installation
```bash
npm install react-native-svg
npx expo install react-native-svg
```

### Usage
Create SVG icons in `assets/icons/` and import them.

**Pros:**
- Fully customizable
- Scalable
- Professional

**Cons:**
- Need to create/download SVG files
- More setup required

## Option 3: Image Icons

### Usage
Download PNG/SVG icons and place in `assets/icons/`

**Pros:**
- Full control over design
- Can match your brand

**Cons:**
- Need to manage image files
- Larger bundle size
- Need different sizes for different resolutions

## Recommendation

For now, the Unicode emoji approach is simplest and works everywhere. If you want more professional icons, I recommend **Option 1 (Expo Vector Icons)** as it's the easiest to implement and works cross-platform.

Would you like me to implement Expo Vector Icons, or do you prefer to download custom icon files?
