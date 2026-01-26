# VoltEdge

VoltEdge is a field-ready decision tool that helps responders map water and electricity disruptions and turn them into ranked intervention actions. Unlike typical apps that show "where things are broken," VoltEdge shows what breaks next, who is at risk, and which repair restores the most service per hour.

## Problem Statement

When water and power systems fail together, responders face a brutal reality:
- Outages spread through dependencies (not distance)
- Fixing the wrong asset wastes time
- Hospitals and shelters collapse quietly (because it's not always visible)

VoltEdge turns infrastructure damage into a prioritized response plan.

## Key Capabilities

- Dependency-Aware City Map: Visualize infrastructure relationships across Sudan
- Cascading Failure System: Predict and track failure propagation through dependencies
- Intervention Ranking Engine: Point-based system prioritizing facilities by actual impact
- Minimum Survival Water Mode: Track critical water supply thresholds
- Facility-Collapse Timers: Countdown timers for facility collapse scenarios
- Offline Functionality: Core features work without connectivity, with sync when online
- User Report Validation: Algorithm prevents fake reports and validates user contributions
- Simulated GPS Navigation: Test movement and navigation without device GPS

## Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- For Android development: Android Studio and Android SDK
- For iOS development: Xcode (macOS only)

### Step 1: Install Dependencies

```bash
npm install
npx expo install expo expo-status-bar expo-sqlite react react-dom react-native react-native-web @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

If you encounter dependency conflicts:

```bash
npm install --legacy-peer-deps
npx expo install --fix
```

### Step 2: Verify Installation

```bash
npx expo --version
npm list --depth=0
```

## Running and Testing

### Web Development

```bash
npm start
# Then press 'w' to open in web browser
# Or directly:
npx expo start --web
```

The app will open at `http://localhost:8081` (or the next available port).

### Android Development

#### Using Expo Go (Easiest)

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) on your Android device
2. Run: `npx expo start`
3. Scan the QR code with Expo Go app

#### Android Emulator

1. Start Android Studio and launch an emulator
2. Run: `npx expo start --android`

#### Physical Device (USB Debugging)

1. Enable USB debugging on your Android device
2. Connect device via USB
3. Run: `npx expo start --android`

### Building APK (Android)

#### EAS Build (Recommended - Cloud Build)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

The APK will be available for download from the Expo dashboard.

#### Local Build (Requires Android Studio)

```bash
npx expo prebuild -p android
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Technology Stack

- Expo SDK 51.0.0: Cross-platform development framework
- React 18.2.0: UI library
- React Native 0.74.5: Mobile framework
- expo-sqlite ~14.0.6: SQLite database for offline storage
- Leaflet ^1.9.4: Interactive maps
- React-Leaflet ^4.2.1: React components for Leaflet

## Project Structure

```
voltedge/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── utils/           # Utility functions
│   └── db/              # Database layer
├── api_simulation/      # Mock API for facility data
├── assets/              # Images, fonts, etc.
├── App.js               # Main app entry point
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Database

The app uses SQLite via `expo-sqlite` for offline-first data storage. On web, it falls back to IndexedDB. The database is initialized automatically when the app starts.

### Database Schema

- infrastructure_assets: Power, water, shelters, food, and hospital facilities
- dependencies: Cascading failure relationships between facilities
- failure_events: Reported infrastructure failures
- interventions: Prioritized repair actions
- user_reports: User-submitted facility condition reports
- sync_status: Tracks synchronization state for offline sync

## Development Guidelines

- Use functional components with hooks
- Variable names: camelCase
- Component names: PascalCase
- File and folder names: snake_case
- Prefer `const` over `let`
- Use StyleSheet for styling
- All core features must work offline

## Testing

```bash
npm test        # Run tests
npm run lint    # Lint code
npm run format  # Format code
```

## License

MIT License - See LICENSE file for details

## Credits

Built with Expo React Native and open-source libraries including Leaflet for mapping functionality.

## Credits

Built with Expo React Native and open-source libraries including Leaflet for mapping functionality.
