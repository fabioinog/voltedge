import { Platform } from 'react-native';
import { initWebDatabase, executeQueryWeb, executeWriteWeb, STORE_NAMES as WEB_STORE_NAMES } from './web_database';
import { getConnectionMode } from '../utils/connection_state';
import { openLegacyDatabaseAsync } from './legacy_db_adapter';

let SQLite = null;
let dbOnline = null;
let dbOffline = null;
let useWebFallback = false;
let useLegacySqlite = false;

try {
  SQLite = require('expo-sqlite');
  if (SQLite.default) SQLite = SQLite.default;
} catch (error) {
  console.warn('Error importing expo-sqlite:', error);
}

if (Platform.OS === 'web') {
  useWebFallback = true;
}

export const getConnectionModeFromDb = () => getConnectionMode();

export const initDatabase = async () => {
  try {
    if (Platform.OS === 'web') {
      try {
        await initWebDatabase();
        await createSchemaWeb();
        useWebFallback = true;
        return { _isWebFallback: true };
      } catch (indexedDBError) {
        console.error('IndexedDB initialization failed:', indexedDBError);
        useWebFallback = true;
        return { _isWebFallback: true, _error: indexedDBError.message };
      }
    }

    if (!SQLite) {
      const sqliteModule = require('expo-sqlite');
      SQLite = sqliteModule.default || sqliteModule;
    }
    if (typeof SQLite.openDatabaseAsync !== 'function') {
      if (SQLite.default && typeof SQLite.default.openDatabaseAsync === 'function') SQLite = SQLite.default;
      else throw new Error('expo-sqlite openDatabaseAsync method not found');
    }

    try {
      if (!dbOffline) dbOffline = await SQLite.openDatabaseAsync('voltedge_offline.db');
      if (!dbOnline) dbOnline = await SQLite.openDatabaseAsync('voltedge_online.db');
    } catch (nativeError) {
      const msg = (nativeError && (nativeError.message || String(nativeError))) || '';
      const useLegacy =
        /unimplemented/i.test(msg) ||
        /database module did not load/i.test(msg) ||
        /did not load correctly/i.test(msg);
      if (useLegacy && Platform.OS !== 'web') {
        console.warn('Native SQLite failed, using legacy adapter:', msg);
        useLegacySqlite = true;
        dbOffline = await openLegacyDatabaseAsync('voltedge_offline.db');
        dbOnline = await openLegacyDatabaseAsync('voltedge_online.db');
      } else {
        throw nativeError;
      }
    }

    await createSchemaForDb(dbOffline);
    await createSchemaForDb(dbOnline);
    return getCurrentDb();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/** App always uses offline DB; online DB is only for admin/API and sync. */
function getCurrentDb() {
  if (useWebFallback) return { _isWebFallback: true };
  return dbOffline;
}

/**
 * Create database schema on a given DB (native only).
 */
const createSchemaForDb = async (db) => {
  if (!db) throw new Error('Database not initialized');
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS infrastructure_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('power', 'water', 'shelter', 'food', 'hospital')),
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'operational' CHECK(status IN ('operational', 'failed', 'at_risk')),
        facility_condition TEXT DEFAULT 'good' CHECK(facility_condition IN ('excellent', 'good', 'fair', 'poor', 'bad')),
        supply_amount TEXT DEFAULT 'medium' CHECK(supply_amount IN ('very_high', 'high', 'medium', 'low', 'very_low')),
        population_amount TEXT DEFAULT 'medium' CHECK(population_amount IN ('very_high', 'high', 'medium', 'low', 'very_low')),
        facility_importance TEXT DEFAULT 'moderate' CHECK(facility_importance IN ('very_important', 'important', 'moderate', 'not_important')),
        intervention_points REAL DEFAULT 0,
        people_restored INTEGER DEFAULT 0,
        population_served INTEGER DEFAULT 0,
        urgency_hours REAL DEFAULT 0,
        effort_penalty REAL DEFAULT 1.0,
        cascade_prevention_count INTEGER DEFAULT 0,
        water_level_forecast REAL,
        power_outage_detected BOOLEAN DEFAULT 0,
        last_forecast_update DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Migration: Add population_served column if it doesn't exist (for existing databases)
    try {
      await db.execAsync(`
        ALTER TABLE infrastructure_assets ADD COLUMN population_served INTEGER DEFAULT 0;
      `);
    } catch (error) {
      // Column already exists, ignore error
      if (!error.message.includes('duplicate column')) {
        console.warn('Migration warning (expected if column exists):', error.message);
      }
    }

    // Dependencies table (represents cascading failure relationships)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dependent_asset_id INTEGER NOT NULL,
        depends_on_asset_id INTEGER NOT NULL,
        dependency_type TEXT NOT NULL CHECK(dependency_type IN ('power', 'water', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dependent_asset_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_asset_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
        UNIQUE(dependent_asset_id, depends_on_asset_id)
      );
    `);

    // Failure Events table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS failure_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        failure_type TEXT NOT NULL,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        severity INTEGER DEFAULT 1 CHECK(severity >= 1 AND severity <= 5),
        description TEXT,
        reported_by TEXT,
        verified BOOLEAN DEFAULT 0,
        FOREIGN KEY (asset_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE
      );
    `);

    // Interventions table (repair actions)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        priority_score REAL DEFAULT 0,
        estimated_hours REAL,
        crew_assigned TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (asset_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE
      );
    `);

    // Facility Collapse Timers table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS facility_timers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_id INTEGER NOT NULL,
        timer_type TEXT NOT NULL CHECK(timer_type IN ('water', 'power', 'both')),
        hours_remaining REAL NOT NULL,
        critical_threshold REAL NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facility_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE
      );
    `);

    // User Reports table (for user contributions)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_id INTEGER NOT NULL,
        facility_condition TEXT CHECK(facility_condition IN ('excellent', 'good', 'fair', 'poor', 'bad')),
        supply_amount TEXT CHECK(supply_amount IN ('very_high', 'high', 'medium', 'low', 'very_low')),
        population_amount TEXT CHECK(population_amount IN ('very_high', 'high', 'medium', 'low', 'very_low')),
        facility_importance TEXT CHECK(facility_importance IN ('very_important', 'important', 'moderate', 'not_important')),
        reported_by TEXT,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT 0,
        FOREIGN KEY (facility_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE
      );
    `);

    // Public Data Cache table (for offline API data)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS public_data_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_id INTEGER,
        data_type TEXT NOT NULL,
        data_json TEXT NOT NULL,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (facility_id) REFERENCES infrastructure_assets(id) ON DELETE CASCADE
      );
    `);

    // Sync Status table (for offline sync management)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL UNIQUE,
        last_synced_at DATETIME,
        pending_changes INTEGER DEFAULT 0
      );
    `);

    // Create indexes for performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_assets_type_status ON infrastructure_assets(type, status);
      CREATE INDEX IF NOT EXISTS idx_assets_location ON infrastructure_assets(location_lat, location_lng);
      CREATE INDEX IF NOT EXISTS idx_dependencies_dependent ON dependencies(dependent_asset_id);
      CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON dependencies(depends_on_asset_id);
      CREATE INDEX IF NOT EXISTS idx_failures_asset ON failure_events(asset_id);
      CREATE INDEX IF NOT EXISTS idx_interventions_priority ON interventions(priority_score DESC);
      CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
      CREATE INDEX IF NOT EXISTS idx_assets_intervention_points ON infrastructure_assets(intervention_points DESC);
      CREATE INDEX IF NOT EXISTS idx_user_reports_facility ON user_reports(facility_id);
      CREATE INDEX IF NOT EXISTS idx_user_reports_synced ON user_reports(synced);
      CREATE INDEX IF NOT EXISTS idx_public_data_facility ON public_data_cache(facility_id);
    `);

    // Initialize sync status
    await db.execAsync(`
      INSERT OR IGNORE INTO sync_status (table_name, last_synced_at, pending_changes)
      VALUES 
        ('infrastructure_assets', NULL, 0),
        ('dependencies', NULL, 0),
        ('failure_events', NULL, 0),
        ('interventions', NULL, 0),
        ('facility_timers', NULL, 0),
        ('user_reports', NULL, 0),
        ('public_data_cache', NULL, 0);
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Schema creation error:', error);
    throw error;
  }
};

/**
 * Get database instance (always offline DB – app only connects to offline DB).
 */
export const getDatabase = async () => {
  if (!dbOffline && !dbOnline && !useWebFallback) await initDatabase();
  return getCurrentDb();
};

const createSchemaWeb = async () => {
  const tables = ['infrastructure_assets', 'dependencies', 'failure_events', 'interventions', 'facility_timers', 'user_reports', 'public_data_cache'];
  for (const which of ['online', 'offline']) {
    try {
      const existing = await executeQueryWeb('SELECT * FROM sync_status WHERE table_name = ?', ['infrastructure_assets'], which);
      if (existing.length === 0) {
        for (const table of tables) {
          await executeWriteWeb(
            'INSERT INTO sync_status (table_name, last_synced_at, pending_changes) VALUES (?, ?, ?)',
            [table, null, 0],
            which
          );
        }
      }
    } catch (e) {
      console.warn('Schema init warning for', which, e);
    }
  }
};

/** App always uses offline DB for reads/writes. */
const whichDb = () => 'offline';

export const executeQuery = async (query, params = []) => {
  try {
    if (useWebFallback) return await executeQueryWeb(query, params, whichDb());
    const database = await getDatabase();
    return await database.getAllAsync(query, params);
  } catch (error) {
    console.error('Query execution error:', error);
    try {
      if (useWebFallback) return await executeQueryWeb(query, params, whichDb());
      const database = await getDatabase();
      return await database.getAllAsync(query, params);
    } catch (retryError) {
      console.error('Query retry failed:', retryError);
      throw retryError;
    }
  }
};

export const executeQueryToOnline = async (query, params = []) => {
  if (useWebFallback) return await executeQueryWeb(query, params, 'online');
  return await dbOnline.getAllAsync(query, params);
};

export const executeWriteToOnline = async (query, params = []) => {
  if (useWebFallback) return await executeWriteWeb(query, params, 'online');
  return await dbOnline.runAsync(query, params);
};

export const executeQueryToOffline = async (query, params = []) => {
  if (useWebFallback) return await executeQueryWeb(query, params, 'offline');
  return await dbOffline.getAllAsync(query, params);
};

export const executeWriteToOffline = async (query, params = []) => {
  if (useWebFallback) return await executeWriteWeb(query, params, 'offline');
  return await dbOffline.runAsync(query, params);
};

export const executeWrite = async (query, params = []) => {
  try {
    if (useWebFallback) {
      const result = await executeWriteWeb(query, params, whichDb());
      const tableName = extractTableName(query);
      if (tableName) await markPendingSync(tableName);
      return result;
    }
    const database = await getDatabase();
    const result = await database.runAsync(query, params);
    const tableName = extractTableName(query);
    if (tableName) await markPendingSync(tableName);
    return result;
  } catch (error) {
    console.error('Write execution error:', error);
    throw error;
  }
};

/**
 * Extract table name from SQL query for sync tracking
 * @param {string} query - SQL query
 * @returns {string|null} Table name or null
 */
const extractTableName = (query) => {
  const match = query.match(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO|FROM)\s+(\w+)/i);
  return match ? match[1] : null;
};

/**
 * Mark a table as having pending sync changes
 * @param {string} tableName - Name of the table
 */
const markPendingSync = async (tableName) => {
  try {
    if (useWebFallback) {
      const status = await executeQueryWeb('SELECT * FROM sync_status WHERE table_name = ?', [tableName], whichDb());
      if (status.length > 0) {
        const current = status[0].pending_changes || 0;
        await executeWriteWeb('UPDATE sync_status SET pending_changes = ? WHERE table_name = ?', [current + 1, tableName], whichDb());
      }
      return;
    }
    const database = await getDatabase();
    await database.runAsync('UPDATE sync_status SET pending_changes = pending_changes + 1 WHERE table_name = ?', [tableName]);
  } catch (error) {
    console.error('Sync status update error:', error);
  }
};

export const resetDatabase = async () => {
  try {
    if (useWebFallback) {
      console.warn('Database reset not fully supported with IndexedDB fallback');
      return;
    }
    const dropSql = `DROP TABLE IF EXISTS facility_timers; DROP TABLE IF EXISTS interventions; DROP TABLE IF EXISTS failure_events; DROP TABLE IF EXISTS dependencies; DROP TABLE IF EXISTS infrastructure_assets; DROP TABLE IF EXISTS sync_status;`;
    await dbOffline.execAsync(dropSql);
    await dbOnline.execAsync(dropSql);
    await createSchemaForDb(dbOffline);
    await createSchemaForDb(dbOnline);
    console.log('Database reset complete');
  } catch (error) {
    console.error('Database reset error:', error);
    throw error;
  }
};

const TABLE_NAMES = ['infrastructure_assets', 'dependencies', 'failure_events', 'interventions', 'facility_timers', 'user_reports', 'public_data_cache', 'sync_status'];

/**
 * Copy full state from online DB to offline DB (e.g. when user goes offline).
 */
export const copyOnlineToOffline = async () => {
  if (useWebFallback) {
    for (const storeName of WEB_STORE_NAMES) {
      const rows = await executeQueryToOnline('SELECT * FROM ' + storeName, []);
      await executeWriteToOffline('DELETE FROM ' + storeName, []);
      for (const row of rows) {
        const keys = Object.keys(row);
        const vals = keys.map((k) => row[k]);
        const placeholders = keys.map(() => '?').join(', ');
        await executeWriteToOffline('INSERT INTO ' + storeName + ' (' + keys.join(', ') + ') VALUES (' + placeholders + ')', vals);
      }
    }
    return;
  }
  for (const table of TABLE_NAMES) {
    const rows = await dbOnline.getAllAsync('SELECT * FROM ' + table, []);
    await dbOffline.runAsync('DELETE FROM ' + table, []);
    for (const row of rows) {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(', ');
      await dbOffline.runAsync('INSERT INTO ' + table + ' (' + keys.join(', ') + ') VALUES (' + placeholders + ')', keys.map((k) => row[k]));
    }
  }
};

/**
 * Merge offline changes into online (user_reports, then full copy online → offline).
 */
export const mergeOfflineIntoOnline = async () => {
  if (useWebFallback) {
    const reports = await executeQueryToOffline('SELECT * FROM user_reports WHERE synced = 0', []);
    for (const r of reports) {
      await executeWriteToOnline(
        'INSERT INTO user_reports (facility_id, facility_condition, supply_amount, population_amount, facility_importance, reported_by, synced) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [r.facility_id, r.facility_condition, r.supply_amount, r.population_amount, r.facility_importance, r.reported_by ?? 'user']
      );
    }
    await copyOnlineToOffline();
    return;
  }
  const reports = await dbOffline.getAllAsync('SELECT * FROM user_reports WHERE synced = 0', []);
  for (const r of reports) {
    await dbOnline.runAsync(
      'INSERT INTO user_reports (facility_id, facility_condition, supply_amount, population_amount, facility_importance, reported_by, synced) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [r.facility_id, r.facility_condition, r.supply_amount, r.population_amount, r.facility_importance, r.reported_by ?? 'user']
    );
  }
  await dbOffline.runAsync('UPDATE user_reports SET synced = 1', []);
  await copyOnlineToOffline();
}
