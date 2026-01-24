# Database Layer

This directory contains the database abstraction layer for VoltEdge using `expo-sqlite`.

## Overview

The database layer provides:
- **Offline-first architecture**: All data is stored locally in SQLite
- **Cross-platform compatibility**: Works on web, iOS, and Android
- **Sync management**: Tracks pending changes for synchronization when online
- **Error handling**: Retry logic for transient failures

## Schema

### Tables

1. **infrastructure_assets**: Power, water, and facility assets
2. **dependencies**: Cascading failure relationships between assets
3. **failure_events**: Reported and verified infrastructure failures
4. **interventions**: Prioritized repair actions
5. **facility_timers**: Countdown timers for facility collapse scenarios
6. **sync_status**: Tracks synchronization state for offline sync

## Usage

```javascript
import { initDatabase, executeQuery, executeWrite } from './db/database';

// Initialize database (call once at app startup)
await initDatabase();

// Query data
const assets = await executeQuery(
  'SELECT * FROM infrastructure_assets WHERE status = ?',
  ['failed']
);

// Write data
await executeWrite(
  'INSERT INTO infrastructure_assets (name, type, status) VALUES (?, ?, ?)',
  ['Power Plant A', 'power', 'operational']
);
```

## Future Sync Implementation

When implementing sync with remote database:
1. Check `sync_status` table for tables with `pending_changes > 0`
2. Fetch pending changes from local database
3. Upload to remote API
4. Update `last_synced_at` and reset `pending_changes`
