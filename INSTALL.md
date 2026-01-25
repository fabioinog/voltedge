# Installation Guide

## Quick Install (Recommended)

For Expo projects, the best way to install dependencies is using `npx expo install` which ensures all packages are compatible.

### Step 1: Install Base Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 2: Fix Expo Package Versions

```bash
npx expo install --fix
```

This will automatically update all Expo packages to compatible versions.

### Step 3: Verify Installation

```bash
npx expo --version
npm list --depth=0
```

## Alternative: Manual Install

If the above doesn't work, try:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo install expo expo-status-bar expo-sqlite react react-dom react-native react-native-web
```

## Troubleshooting

If you still get dependency errors:

1. **Use legacy peer deps flag:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Let Expo fix versions:**
   ```bash
   npx expo install --fix
   ```

3. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```
