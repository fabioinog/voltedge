# VoltEdge

A field-ready decision tool that helps responders map water and electricity disruptions and turn them into ranked intervention actions. VoltEdge shows what breaks next, who is at risk, and which repair restores the most service per hour.

## Problem Statement

When water and power systems fail together, responders face a brutal reality:
- Outages spread through dependencies (not distance)
- Fixing the wrong asset wastes time
- Hospitals and shelters collapse quietly (because it's not always visible)

VoltEdge turns infrastructure damage into a prioritized response plan.

## Key Capabilities

- **Dependency-Aware City Map**: Visualize infrastructure relationships across Sudan
- **Cascading Failure System**: Predict and track failure propagation through dependencies
- **Intervention Ranking Engine**: Point-based system prioritizing facilities by actual impact
- **User Report Validation**: Algorithm prevents fake reports and validates user contributions
- **Simulated GPS Navigation**: Test movement and navigation without device GPS
- **Offline Functionality**: Core features work without connectivity, with sync when online
- **Multi-Facility Support**: Water, Power, Shelters, Food, and Hospitals
- **Real-Time Priority Updates**: Dynamic ranking based on conditions and user reports

## Technology Stack

### Core Framework & Runtime

- **Expo SDK 51.0.0**: Cross-platform development framework for React Native
  - Enables single codebase for Web, Android, and iOS
  - Managed workflow with minimal native code requirements
  - Built-in development tools and OTA updates support

- **React 18.2.0**: UI library for building user interfaces
  - Functional components with hooks
  - Component-based architecture

- **React Native 0.74.5**: Mobile framework for native app development
  - Cross-platform mobile development
  - Native performance with JavaScript

- **React Native Web 0.19.10**: React Native components for web
  - Enables web deployment from React Native codebase
  - Consistent UI across platforms

- **@expo/metro-runtime ~3.2.3**: Metro bundler runtime for Expo
  - Fast JavaScript bundling and hot reloading

### Database & Storage

- **expo-sqlite ~14.0.6**: SQLite database for React Native
  - Offline-first data persistence
  - SQL-based queries and transactions
  - Automatic database initialization

- **IndexedDB** (Web Fallback): Browser-based database storage
  - Custom implementation in `src/db/webDatabase.js`
  - Fallback when expo-sqlite is unavailable on web
  - SQL-like query interface for consistency

### Navigation

- **@react-navigation/native ^6.1.9**: Navigation library for React Native
  - Declarative navigation system
  - Cross-platform navigation patterns

- **@react-navigation/native-stack ^6.9.17**: Stack navigator implementation
  - Screen-based navigation with stack history
  - Native transitions and gestures

- **react-native-screens ~3.31.1**: Native screen components
  - Optimized screen rendering
  - Better performance and memory management

- **react-native-safe-area-context 4.10.5**: Safe area handling
  - Proper layout on devices with notches/status bars
  - Consistent spacing across devices

### Mapping & Geolocation

- **Leaflet ^1.9.4**: Open-source JavaScript library for interactive maps
  - Lightweight and mobile-friendly
  - Extensive plugin ecosystem
  - Offline tile support capability

- **React-Leaflet ^4.2.1**: React components for Leaflet maps
  - React-friendly Leaflet integration
  - Component-based map configuration
  - Hooks for map interaction

- **OpenStreetMap Tiles**: Free map tile service
  - No API key required
  - Global coverage including Sudan
  - Can be cached for offline use

### UI Components & Styling

- **React Native StyleSheet**: Built-in styling system
  - Platform-agnostic styling
  - Optimized for performance

- **Expo Status Bar ~1.12.1**: Status bar component
  - Control device status bar appearance
  - Platform-specific styling

### Development Tools

- **Babel @babel/core ^7.24.0**: JavaScript compiler
  - Transpiles modern JavaScript
  - JSX transformation
  - Configured via Expo

- **ESLint ^8.57.0**: JavaScript linter
  - Code quality and consistency
  - Catches common errors

- **eslint-config-expo ^7.1.2**: Expo-specific ESLint configuration
  - Pre-configured rules for Expo projects
  - React Native best practices

- **Prettier ^3.2.5**: Code formatter
  - Automatic code formatting
  - Consistent code style

- **TypeScript ~5.3.3**: Type-safe JavaScript (optional)
  - Type checking and IntelliSense
  - Better developer experience

### Testing

- **Jest ^29.7.0**: JavaScript testing framework
  - Unit and integration testing
  - Snapshot testing support

- **@testing-library/react-native ^12.4.3**: React Native testing utilities
  - Component testing utilities
  - User-centric testing approach

- **react-test-renderer 18.2.0**: React test renderer
  - Render React components for testing
  - Snapshot testing

### Build & Deployment

- **EAS Build** (Expo Application Services): Cloud build service
  - Build Android APKs and iOS apps in the cloud
  - No local build environment required
  - Automated signing and distribution

- **Gradle** (Local Android builds): Android build system
  - Used for local APK generation
  - Requires Android Studio setup

### Custom Modules & Utilities

- **API Simulation Module** (`api_simulation/`): Mock API for facility data
  - Static facility data with intervention metrics
  - Simulates external organization API
  - Ready for real API integration

- **Report Validation System** (`src/utils/reportValidation.js`): User report validation
  - Algorithm to prevent fake/spam reports
  - Severity-based point adjustments
  - Prototype implementation with memory-based storage

- **User Point Adjustments** (`src/utils/userPointAdjustments.js`): In-memory adjustment tracking
  - Tracks user-generated point changes
  - Resets on app restart (prototype behavior)
  - Future: Database persistence

- **Intervention Ranking Engine** (`src/utils/interventionRanking.js`): Priority calculation
  - Multi-factor point system
  - Considers urgency, population, condition, cascade prevention
  - Type-specific bonuses

- **Distance & Routing Utilities** (`src/utils/distance.js`, `src/utils/routing.js`):
  - Haversine formula for distance calculation
  - Simplified road-based routing algorithm
  - Offline navigation support

- **Data Synchronization** (`src/utils/dataSync.js`): Data sync management
  - Syncs API data to local database
  - Handles online/offline states
  - Batch updates and conflict resolution

### Platform Support

- **Web**: Browser-based deployment
  - IndexedDB fallback for database
  - Leaflet maps with web optimizations
  - Responsive design

- **Android**: Native Android app
  - SQLite via expo-sqlite
  - Native map components
  - APK build support

- **iOS**: Native iOS app (ready, not fully tested)
  - SQLite via expo-sqlite
  - Native map components
  - Requires macOS for development

### Key Features Enabled by Technology

- **Offline-First Architecture**: SQLite/IndexedDB enables full offline functionality
- **Cross-Platform Development**: Single codebase for web and mobile
- **Interactive Maps**: Leaflet provides rich mapping capabilities
- **Real-Time Updates**: Expo enables OTA updates without app store
- **Low-End Device Support**: Optimized for devices with limited resources
- **Data Validation**: Custom algorithms prevent data manipulation
- **Priority Ranking**: Complex calculation engine for intervention prioritization

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

- **infrastructure_assets**: Power, water, shelters, food, and hospital facilities
  - Types: `power`, `water`, `shelter`, `food`, `hospital`
  - Tracks condition, supply, population, importance, and intervention points
- **dependencies**: Cascading failure relationships between facilities
- **failure_events**: Reported infrastructure failures
- **interventions**: Prioritized repair actions
- **facility_timers**: Countdown timers for facility collapse scenarios
- **user_reports**: User-submitted facility condition reports
- **public_data_cache**: Cached data from external APIs
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
