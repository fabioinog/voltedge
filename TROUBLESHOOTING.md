# Troubleshooting Guide

## expo-sqlite Installation Issues

### Error: Cannot find module 'SQLiteDatabase'

This error occurs when `expo-sqlite` is not properly installed or built.

### Solution 1: Clean Reinstall (Recommended)

```powershell
# Navigate to project directory
cd c:\Users\fabio\OneDrive\Desktop\voltedge

# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Reinstall all dependencies
npm install --legacy-peer-deps

# Fix Expo package versions
npx expo install --fix
```

### Solution 2: Reinstall expo-sqlite Only

```powershell
# Remove expo-sqlite
Remove-Item -Recurse -Force node_modules\expo-sqlite -ErrorAction SilentlyContinue

# Reinstall using Expo's installer
npx expo install expo-sqlite
```

### Solution 3: Verify Installation

```powershell
# Check if expo-sqlite is installed
npm list expo-sqlite

# Check Expo version
npx expo --version

# Should show SDK 51.0.0
```

### Solution 4: Clear Metro Cache

If the app is running but database doesn't work:

```powershell
# Stop the Expo server (Ctrl+C)
# Then restart with cleared cache
npx expo start --clear
```

## Common Issues

### Issue: "expo-sqlite is not properly installed"

**Fix:**
```powershell
npx expo install expo-sqlite
```

### Issue: Dependency conflicts

**Fix:**
```powershell
npm install --legacy-peer-deps
npx expo install --fix
```

### Issue: Web compatibility

expo-sqlite works on web using SQL.js. If you encounter web-specific issues:
1. Ensure you're using Expo SDK 51+
2. The database will work in-memory on web (data persists during session)
3. For persistent storage on web, consider using AsyncStorage or IndexedDB wrapper

## Verification Steps

After fixing, verify the installation:

1. **Check package.json:**
   ```json
   "expo-sqlite": "~14.0.6"
   ```

2. **Check node_modules:**
   ```powershell
   Test-Path node_modules\expo-sqlite
   ```

3. **Run the app:**
   ```powershell
   npx expo start --web
   ```

4. **Check console:** Should see "Database schema initialized successfully"

## Still Having Issues?

1. Check Expo SDK version matches package.json
2. Ensure Node.js version is 18+ 
3. Try: `npm cache clean --force`
4. Try: `npx expo install --check`
