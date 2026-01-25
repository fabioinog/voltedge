# Web Database Error Fix

## Error: "ExpoSQLiteNext.default.NativeDatabase is not a constructor"

This is a known issue with expo-sqlite on web platforms. Here are solutions:

## Quick Fixes (Try in order)

### 1. Hard Refresh Browser
- **Windows/Linux**: Press `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`
- This clears cached JavaScript and reloads the module

### 2. Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npx expo start --web --clear
```

The `--clear` flag clears Metro bundler cache.

### 4. Clear All Caches
```bash
# Stop server
# Then run:
npx expo start --web --clear
# Or manually:
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --web
```

### 5. Reinstall expo-sqlite
```bash
npm uninstall expo-sqlite
npm install expo-sqlite@~14.0.6 --legacy-peer-deps
npx expo start --web --clear
```

## Why This Happens

expo-sqlite uses SQL.js on web, which requires proper module initialization. Sometimes the module doesn't load correctly due to:
- Browser cache issues
- Metro bundler cache
- Module loading race conditions

## Permanent Solution

The code has been updated to:
- Wait for module to fully load
- Provide better error messages
- Handle web-specific initialization

If the error persists after trying all fixes, it may be a deeper compatibility issue with your browser or Expo SDK version.

## Alternative: Use Different Browser

Try a different browser (Chrome, Firefox, Edge) to see if it's browser-specific.

## Still Not Working?

1. Check Expo SDK version: `npx expo --version` (should be 51.0.0)
2. Check Node.js version: `node --version` (should be 18+)
3. Check if other Expo apps work on web
4. Report the issue with:
   - Browser name and version
   - Expo SDK version
   - Full error message from console
