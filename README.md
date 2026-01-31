# VoltEdge

VoltEdge is a field-ready decision tool that helps responders map water and electricity disruptions and turn them into ranked intervention actions. Unlike typical apps that show "where things are broken," VoltEdge shows what breaks next, who is at risk, and which repair restores the most service per hour.

## Problem Statement

In conflict-affected cities, electricity and water systems are highly interdependent, making infrastructure failures especially severe. Power disruptions can quickly halt water pumps and treatment facilities, cause pressure failures, and cut access to safe water within hours, often without warning. With limited time, fuel, and repair capacity, responders tend to prioritize visible damage rather than actions that would restore water services most effectively. As a result, displaced families and critical facilities such as hospitals and shelters face prolonged water shortages, increased reliance on unsafe sources, and heightened public health risks. Evidence from Sudan shows that persistent power outages disrupt drinking-water supply due to reliance on electric pumps (ACAPS, 2023), while 38% of the population requires WASH assistance due to damaged water and electricity infrastructure (iMMAP, 2024). The International Committee of the Red Cross (2025) further warns that attacks on hospitals and water and power infrastructure can leave civilians without essential services.


## Key Capabilities

- Dependency-Aware City Map: Visualize infrastructure relationships across Sudan
- Cascading Failure System: Predict and track failure propagation through dependencies
- Intervention Ranking Engine: Point-based system prioritizing facilities by actual impact
- Minimum Survival Water Mode: Track critical water supply thresholds
- Facility-Collapse Timers: Countdown timers for facility collapse scenarios

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

Run on device or emulator:

```bash
npx expo start --android
```

**Building an APK (same UI and functionality as the website)**

The Android app uses the same codebase as the website (sign-in screen, map, pastel UI, etc.). To get an APK that matches the current website:

1. **Rebuild from the current code** – The APK bundle is created at build time. Any UI or logic change requires a new build.
2. **Install dependencies** (including AsyncStorage for sign-in persistence):
   ```bash
   npm install
   ```
3. **Build with EAS** (recommended):
   ```bash
   npm i -g eas-cli
   eas login
   eas build -p android --profile preview
   ```
   Download the APK from the link EAS provides.
4. **On the phone**: Uninstall any old VoltEdge APK, then install the new APK. This avoids cached state from an older version.

If the installed app does not show the sign-in page or matches an older design, the APK was built from an older version; rebuild from the current repo and reinstall.

## Technology Stack

**Runtime**
- **Expo** ~51.0.0 – Cross-platform framework (web, Android, iOS)
- **React** 18.2.0 & **React DOM** 18.2.0 – UI
- **React Native** 0.74.5 & **react-native-web** ~0.19.10 – Mobile and web
- **expo-sqlite** ~14.0.6 – Local SQLite (IndexedDB fallback on web)
- **expo-status-bar** ~1.12.1 – Status bar styling
- **React Navigation** (@react-navigation/native ^6.1.9, native-stack ^6.9.17) – Navigation
- **react-native-screens** ~3.31.1, **react-native-safe-area-context** 4.10.5 – Native screens and safe areas
- **Leaflet** ^1.9.4 & **react-leaflet** ^4.2.1 – Maps (web)
- **@expo/metro-runtime** ~3.2.3 – Metro bundler runtime

**Development**
- **Jest** ^29.7.0 & **@testing-library/react-native** ^12.4.3 – Tests
- **ESLint** ^8.57.0 & **eslint-config-expo** ^7.1.2 – Linting
- **Prettier** ^3.2.5 – Formatting
- **TypeScript** ~5.3.3 & **@types/react** ~18.2.45 – Types
- **Babel** (@babel/core ^7.24.0) – Transpilation
- **pngjs** ^7.0.0 – Asset handling (scripts)

## Simulated API

VoltEdge uses a simulated API (`api_simulation/`) to provide facility data for intervention ranking. This is a proof of concept that will be replaced with actual API calls to real data sources in production.

### API Data Structure

The simulated API generates facility data with the following fields:

**Importance Metrics:**
- `facility_importance`: Importance level (`very_important`, `important`, `moderate`, `not_important`)
- `facility_condition`: Physical condition (`excellent`, `good`, `fair`, `poor`, `bad`)

**Population Metrics:**
- `population_amount`: Population at facility (`very_high`, `high`, `medium`, `low`) - for shelters and hospitals
- `population_served`: Number of people served by the facility (numeric) - for water, power, and food facilities

**Supply Metrics:**
- `supply_amount`: Supply level (`very_high`, `high`, `medium`, `low`, `very_low`) - for water, power, and food facilities

**Urgency Metrics:**
- `urgency_hours`: Hours until facility failure (0 = already failed, lower = more urgent)

**Effort Metrics:**
- `effort_penalty`: Repair difficulty multiplier (higher = more difficult/expensive to repair)

**Cascade Metrics:**
- `cascade_prevention_count`: Number of other facility failures prevented by fixing this facility

## Database

The app uses SQLite via `expo-sqlite` for offline-first data storage. On web, it falls back to IndexedDB. The database is initialized automatically when the app starts.

### Database Schema

- infrastructure_assets: Power, water, shelters, food, and hospital facilities
- dependencies: Cascading failure relationships between facilities
- failure_events: Reported infrastructure failures
- interventions: Prioritized repair actions
- user_reports: User-submitted facility condition reports
- sync_status: Tracks synchronization state for offline sync

## License

MIT License - See LICENSE file for details

