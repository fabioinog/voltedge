# Clean Install Commands

## Option 1: PowerShell (Windows PowerShell or PowerShell Core)

```powershell
cd c:\Users\fabio\OneDrive\Desktop\voltedge
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install --legacy-peer-deps
npx expo start --web
```

## Option 2: Command Prompt (cmd)

```cmd
cd c:\Users\fabio\OneDrive\Desktop\voltedge
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
npx expo start --web
```

## Option 3: Git Bash or WSL

```bash
cd /c/Users/fabio/OneDrive/Desktop/voltedge
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
npx expo start --web
```

## Option 4: Using npm directly (works in any terminal)

If you can't delete folders via terminal, you can:

1. **Manually delete** `node_modules` folder and `package-lock.json` file using File Explorer
2. Then run in your terminal:
   ```bash
   npm cache clean --force
   npm install --legacy-peer-deps
   npx expo start --web
   ```

## Quick Test (Skip Clean Install)

If you want to test if the app works without cleaning:

```bash
npm install --legacy-peer-deps
npx expo start --web
```

The installation error might not prevent the app from running!
