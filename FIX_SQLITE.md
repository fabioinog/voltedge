# Fix for expo-sqlite Module Error

## The Problem

You're seeing this error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...expo-sqlite\build\SQLiteDatabase'
```

This is a known issue with expo-sqlite 14.0.6 and Node.js ES module resolution during installation.

## Solution 1: Try Running the App Anyway

**The error might only occur during installation, not when running the app.** Try:

```powershell
npx expo start --web
```

If the app runs and the database works, you can ignore this installation error.

## Solution 2: Use a Different Version

Try installing a slightly different version:

```powershell
npm install expo-sqlite@14.0.2 --legacy-peer-deps --save-exact
```

## Solution 3: Clean Reinstall

```powershell
# Remove everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps

# Then install expo-sqlite specifically
npx expo install expo-sqlite
```

## Solution 4: Check Node.js Version

Make sure you're using Node.js 18 or higher:

```powershell
node --version
```

If it's lower, update Node.js from [nodejs.org](https://nodejs.org/)

## Solution 5: Use Metro Bundler (App Should Work)

The error occurs during Node.js module resolution, but Metro bundler (used by Expo) handles modules differently. **The app should still work** even if you see this error during installation.

## Verification

After trying the solutions, verify:

1. **Check if app runs:**
   ```powershell
   npx expo start --web
   ```

2. **Check database initialization:**
   - Open browser console
   - Look for "Database schema initialized successfully"
   - If you see this, the database is working!

3. **If database doesn't work:**
   - Check browser console for errors
   - The error message will tell us what's actually wrong

## Most Likely Outcome

**The app will work fine.** This error is a Node.js module resolution quirk during installation, but Metro bundler (which Expo uses) resolves modules correctly at runtime.

Try running `npx expo start --web` and see if the app loads!
