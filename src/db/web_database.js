/**
 * Web Database Fallback – two DBs: online and offline (same schema).
 * Uses IndexedDB when expo-sqlite fails on web.
 */

const dbVersion = 1;
const STORE_NAMES = [
  'infrastructure_assets',
  'dependencies',
  'failure_events',
  'interventions',
  'facility_timers',
  'user_reports',
  'public_data_cache',
  'sync_status',
];

let dbOnline = null;
let dbOffline = null;

const openIndexedDB = (dbName) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = () => reject(new Error('Failed to open IndexedDB: ' + dbName));
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('infrastructure_assets')) {
        const assetsStore = database.createObjectStore('infrastructure_assets', { keyPath: 'id', autoIncrement: true });
        assetsStore.createIndex('type', 'type', { unique: false });
        assetsStore.createIndex('status', 'status', { unique: false });
        assetsStore.createIndex('location', ['location_lat', 'location_lng'], { unique: false });
        assetsStore.createIndex('points', 'intervention_points', { unique: false });
      }
      STORE_NAMES.forEach((name) => {
        if (!database.objectStoreNames.contains(name) && name !== 'infrastructure_assets') {
          database.createObjectStore(name, name === 'sync_status' ? { keyPath: 'table_name' } : { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
};

const executeQueryIndexedDB = async (db, storeName, filterFn = null) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result;
      if (filterFn) results = results.filter(filterFn);
      resolve(results);
    };
    request.onerror = () => reject(new Error('Query failed'));
  });
};

const executeWriteIndexedDB = async (db, operation, storeName, data, key = null) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    let request;
    if (operation === 'insert') request = store.add(data);
    else if (operation === 'update') request = store.put(data);
    else if (operation === 'delete') request = store.delete(key);
    else return reject(new Error('Invalid operation'));
    request.onsuccess = () => resolve({ lastInsertRowId: request.result });
    request.onerror = () => reject(new Error('Write operation failed'));
  });
};

const queryIndexedDBWithDb = async (db, query, params = []) => {
  const lowerQuery = query.toLowerCase().trim();
  if (lowerQuery.startsWith('select')) {
    const fromMatch = query.match(/from\s+(\w+)/i);
    if (!fromMatch) return [];
    const tableName = fromMatch[1];
    let results = await executeQueryIndexedDB(db, tableName);
    const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
    if (whereMatch && params.length > 0) {
      const fieldMatch = whereMatch[1].match(/(\w+)\s*=\s*\?/);
      if (fieldMatch) {
        const field = fieldMatch[1];
        const value = params[0];
        results = results.filter((item) => item[field] === value);
      }
    }
    const orderMatch = query.match(/order\s+by\s+(\w+)\s+(asc|desc)/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const direction = orderMatch[2].toLowerCase();
      results.sort((a, b) => {
        const aVal = a[field] ?? 0;
        const bVal = b[field] ?? 0;
        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    if (lowerQuery.includes('count(*)')) return [{ count: results.length }];
    return results;
  }
  return [];
};

const writeIndexedDBWithDb = async (db, query, params = []) => {
  const lowerQuery = query.toLowerCase().trim();

  if (lowerQuery.startsWith('insert')) {
    const intoMatch = query.match(/into\s+(\w+)/i);
    if (!intoMatch) throw new Error('Invalid INSERT query');
    const tableName = intoMatch[1];
    const isIgnore = lowerQuery.includes('insert or ignore');
    const fieldsMatch = query.match(/into\s+\w+\s*\(([^)]+)\)/i);
    const fields = fieldsMatch ? fieldsMatch[1].split(',').map((f) => f.trim()) : [];
    const valuesMatch = query.match(/values\s*\(([^)]+)\)/i);
    if (!valuesMatch) throw new Error('Invalid INSERT values');
    const data = {};
    fields.forEach((field, index) => {
      if (params[index] !== undefined && params[index] !== null) data[field] = params[index];
    });
    if (!data.created_at && tableName !== 'sync_status') data.created_at = new Date().toISOString();
    if (!data.updated_at && tableName !== 'sync_status') data.updated_at = new Date().toISOString();
    try {
      return await executeWriteIndexedDB(db, 'insert', tableName, data);
    } catch (e) {
      if (isIgnore && (e.message || '').includes('Constraint')) return { lastInsertRowId: null };
      throw e;
    }
  }

  if (lowerQuery.startsWith('update')) {
    const tableMatch = query.match(/update\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid UPDATE query');
    const tableName = tableMatch[1];
    const normalizedQuery = query.replace(/[\s\n\r\t]+/g, ' ').trim();
    const setMatch = normalizedQuery.match(/set\s+(.+?)\s+where/i) || normalizedQuery.match(/set\s+(.+)$/i);
    if (!setMatch) throw new Error('Invalid UPDATE SET');
    const setClause = setMatch[1].trim();
    const updates = {};
    const setFields = setClause.split(',').map((s) => s.trim());
    let paramIndex = 0;
    setFields.forEach((field) => {
      const fieldMatch = field.match(/(\w+)\s*=\s*(?:\?|CURRENT_TIMESTAMP)/i);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        if (field.includes('CURRENT_TIMESTAMP')) updates[fieldName] = new Date().toISOString();
        else if (field.includes('?')) updates[fieldName] = params[paramIndex++];
      }
    });
    const whereMatch = normalizedQuery.match(/where\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch) throw new Error('UPDATE requires WHERE clause with ?');
    const whereField = whereMatch[1];
    const whereValue = params[paramIndex];
    const existing = await executeQueryIndexedDB(db, tableName, (item) => item[whereField] === whereValue);
    if (existing.length === 0) {
      if (tableName === 'sync_status') {
        return await executeWriteIndexedDB(db, 'insert', tableName, { table_name: whereValue, ...updates });
      }
      throw new Error('Record not found');
    }
    const updated = { ...existing[0], ...updates };
    return await executeWriteIndexedDB(db, 'update', tableName, updated);
  }

  if (lowerQuery.startsWith('delete')) {
    const fromMatch = query.match(/from\s+(\w+)/i);
    if (!fromMatch) throw new Error('Invalid DELETE query');
    const tableName = fromMatch[1];
    if (!query.match(/where/i)) {
      return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database not initialized'));
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        store.clear().onsuccess = () => resolve({ changes: 0 });
        transaction.onerror = () => reject(new Error('DELETE failed'));
      });
    }
    const whereMatch = query.match(/where\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const whereField = whereMatch[1];
      const whereValue = params[0];
      const toDelete = await executeQueryIndexedDB(db, tableName, (item) => item[whereField] === whereValue);
      for (const record of toDelete) {
        await executeWriteIndexedDB(db, 'delete', tableName, null, record.id);
      }
      return { changes: toDelete.length };
    }
    throw new Error('DELETE requires WHERE clause or no clause for delete all');
  }

  throw new Error('Unsupported query type: ' + query.substring(0, 50));
};

function getDb(which) {
  return which === 'online' ? dbOnline : dbOffline;
}

export const initWebDatabase = async () => {
  try {
    dbOnline = await openIndexedDB('voltedge_online');
    dbOffline = await openIndexedDB('voltedge_offline');
    return true;
  } catch (error) {
    console.error('IndexedDB initialization failed:', error);
    throw error;
  }
};

export const executeQueryWeb = async (query, params = [], which = 'offline') => {
  const db = getDb(which);
  if (!db) throw new Error('Database not initialized');
  return queryIndexedDBWithDb(db, query, params);
};

export const executeWriteWeb = async (query, params = [], which = 'offline') => {
  const db = getDb(which);
  if (!db) throw new Error('Database not initialized');
  return writeIndexedDBWithDb(db, query, params);
};

export const getWebDatabase = (which = 'offline') => getDb(which);

export { executeQueryIndexedDB, executeWriteIndexedDB, queryIndexedDBWithDb, writeIndexedDBWithDb, STORE_NAMES };
