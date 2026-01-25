# Building APK for Android Testing

This guide provides instructions for building an APK file to test VoltEdge on an Android device.

## Method 1: EAS Build (Recommended - Easiest)

EAS Build is Expo's cloud-based build service. It's the simplest way to create an APK.

### Prerequisites
- An Expo account (free)
- Node.js installed
- Internet connection

### Steps

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account:**
   ```bash
   eas login
   ```
   (If you don't have an account, create one at https://expo.dev)

3. **Configure EAS Build:**
   ```bash
   eas build:configure
   ```
   This will create an `eas.json` file in your project.

4. **Build the APK (Preview/Debug build):**
   ```bash
   eas build -p android --profile preview
   ```
   
   This will:
   - Upload your project to Expo's servers
   - Build the APK in the cloud
   - Provide a download link when complete

5. **Download and install:**
   - Once the build completes, you'll get a download link
   - Download the APK file
   - Transfer it to your Android phone
   - Enable "Install from Unknown Sources" in your phone settings
   - Install the APK

### Build Profiles

The `eas.json` file will have different profiles. For testing, use:
- `preview` - Debug APK (faster, for testing)
- `production` - Release APK (optimized, for distribution)

---

## Method 2: Local Build (Advanced - No Cloud)

Build the APK locally on your computer. Requires Android SDK setup.

### Prerequisites
- Android Studio installed
- Android SDK installed
- Java JDK installed
- Environment variables configured (ANDROID_HOME, JAVA_HOME)

### Steps

1. **Install Android build tools:**
   - Install Android Studio from https://developer.android.com/studio
   - Open Android Studio and install Android SDK
   - Set up environment variables:
     - `ANDROID_HOME` = path to Android SDK (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`)
     - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

2. **Generate native Android project:**
   ```bash
   npx expo prebuild --platform android
   ```
   This creates the `android/` folder with native Android code.

3. **Build the APK:**
   ```bash
   cd android
   .\gradlew assembleDebug
   ```
   (On Windows, use `.\gradlew`; on Mac/Linux, use `./gradlew`)

4. **Find your APK:**
   The APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Install on your phone:**
   - Transfer `app-debug.apk` to your Android phone
   - Enable "Install from Unknown Sources" in your phone settings
   - Install the APK

### Troubleshooting Local Build

- **"gradlew not found"**: Make sure you're in the `android/` directory
- **"SDK not found"**: Check ANDROID_HOME environment variable
- **Build errors**: Try `npx expo prebuild --clean` to regenerate native files

---

## Quick Comparison

| Method | Pros | Cons |
|--------|------|------|
| **EAS Build** | ✅ No local setup<br>✅ Works on any OS<br>✅ Handles all dependencies | ❌ Requires internet<br>❌ Requires Expo account<br>❌ Builds in cloud (slower) |
| **Local Build** | ✅ No internet needed<br>✅ Faster builds<br>✅ Full control | ❌ Complex setup<br>❌ Requires Android SDK<br>❌ Platform-specific |

---

## Recommended: Start with EAS Build

For testing purposes, **EAS Build** is recommended because:
- No complex local setup
- Works immediately
- Handles all Android build configuration automatically
- Free for personal use

---

## Notes

- **Debug APK**: Larger file size, includes debugging symbols (use for testing)
- **Release APK**: Smaller, optimized (use for distribution)
- **First build**: May take 10-20 minutes (subsequent builds are faster)
- **APK size**: Typically 20-50 MB for Expo apps

---

## After Building

Once you have the APK installed on your phone:
1. Test all features, especially:
   - Map display and interaction
   - Database operations (SQLite)
   - Offline functionality
   - GPS simulation
2. Report any issues you find
3. For production, you'll need to sign the APK (EAS can handle this automatically)
