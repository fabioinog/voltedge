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

#### Work in Progress

## Technology Stack

- Expo SDK 51.0.0: Cross-platform development framework
- React 18.2.0: UI library
- React Native 0.74.5: Mobile framework
- expo-sqlite ~14.0.6: SQLite database for offline storage
- Leaflet ^1.9.4: Interactive maps
- React-Leaflet ^4.2.1: React components for Leaflet

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


## License

MIT License - See LICENSE file for details

