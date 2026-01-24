# VoltEdge

A field-ready decision tool that helps responders map water and electricity disruptions and turn them into ranked intervention actions. VoltEdge shows what breaks next, who is at risk, and which repair restores the most service per hour.

## Problem Statement

When water and power systems fail together, responders face a brutal reality:
- Outages spread through dependencies (not distance)
- Fixing the wrong asset wastes time
- Hospitals and shelters collapse quietly (because it's not always visible)

VoltEdge turns infrastructure damage into a prioritized response plan.

## Key Capabilities

- **Dependency-Aware City Map**: Visualize infrastructure relationships
- **Cascading Failure System**: Predict and track failure propagation
- **Intervention Ranking Engine**: Point system based on actual impact
- **Minimum Survival Water Mode**: Prioritize critical water needs
- **Facility-Collapse Timers**: Countdown to critical facility failures
- **Offline Functionality**: Core features work without connectivity, with sync when online

## Technology Stack

- **Expo React Native**: Cross-platform framework (Web, Android, iOS)
- **expo-sqlite**: Local database for offline-first architecture
- **React Navigation**: Navigation between screens
- **TypeScript**: Type safety (optional, can be added)

## Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- For Android development: Android Studio and Android SDK
- For iOS development: Xcode (macOS only)

### Step 1: Install Dependencies

**Recommended approach (ensures compatible versions):**

```bash
# First, install base dependencies
npm install

# Then install Expo packages with correct versions
npx expo install expo expo-status-bar expo-sqlite react react-dom react-native react-native-web @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

**Alternative approach (if you encounter dependency conflicts):**

```bash
# Install with legacy peer deps to resolve conflicts
npm install --legacy-peer-deps

# Then ensure Expo packages are correct versions
npx expo install --fix
```

### Step 2: Verify Installation

```bash
# Check Expo version
npx expo --version

# Verify all packages are installed
npm list --depth=0
```

## Local Testing Environment

### Web Development

Run the app in your web browser:

```bash
npm start
# Then press 'w' to open in web browser

# Or directly:
npx expo start --web
```

The app will open at `http://localhost:8081` (or the next available port).

### Android Development

#### Option 1: Using Expo Go (Easiest)

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) on your Android device
2. Run:
   ```bash
   npx expo start
   ```
3. Scan the QR code with Expo Go app

#### Option 2: Android Emulator

1. Start Android Studio and launch an emulator
2. Run:
   ```bash
   npx expo start --android
   ```

#### Option 3: Physical Device (USB Debugging)

1. Enable USB debugging on your Android device
2. Connect device via USB
3. Run:
   ```bash
   npx expo start --android
   ```

### Building APK (Android)

#### Option 1: EAS Build (Recommended - Cloud Build)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build (first time only)
eas build:configure

# Build APK
eas build -p android --profile preview
```

The APK will be available for download from the Expo dashboard.

#### Option 2: Local Build (Requires Android Studio)

```bash
# Generate native Android project
npx expo prebuild -p android

# Build debug APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Note**: Local builds require Android Studio and proper Android SDK setup.

## Project Structure

```
voltedge/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation configuration
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── db/              # Database layer (expo-sqlite)
│       ├── database.js  # Database initialization and queries
│       └── README.md    # Database documentation
├── assets/              # Images, fonts, etc.
├── App.js               # Main app entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── README.md            # This file
```

## Database

The app uses SQLite via `expo-sqlite` for offline-first data storage. The database is initialized automatically when the app starts.

### Database Schema

- **infrastructure_assets**: Power, water, and facility assets
- **dependencies**: Cascading failure relationships
- **failure_events**: Reported infrastructure failures
- **interventions**: Prioritized repair actions
- **facility_timers**: Countdown timers for facility collapse scenarios
- **sync_status**: Tracks synchronization state for offline sync

See `src/db/README.md` for detailed database documentation.

## Development Guidelines

### Code Style

- Use functional components with hooks
- Variable names: camelCase
- Component names: PascalCase
- Prefer `const` over `let`
- Use StyleSheet for styling
- Include JSDoc comments for functions

### Offline-First Architecture

- All core features work without network connectivity
- Data is stored locally in SQLite
- Sync mechanism tracks pending changes for upload when online
- Clear offline/online state indicators

### Performance

- Minimize network usage
- Use FlatList for long lists
- Memoize expensive renders
- Keep bundle size small
- Optimize for low-end devices

## Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Database Issues

If you encounter database errors:
1. Clear app data (or reinstall app)
2. Check that `expo-sqlite` is properly installed
3. Verify database initialization in `App.js`

### Build Issues

- Ensure Android SDK is properly configured
- Check that all dependencies are installed
- Clear cache: `npx expo start -c`

### Web Compatibility

Some features may behave differently on web. The database layer includes web compatibility abstractions.

## Contributing

1. Follow the coding standards outlined in `.cursor/rules/`
2. Ensure all features work offline
3. Test on web and Android
4. Keep bundle size minimal
5. Document new features

## License

[Add your license here]

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
