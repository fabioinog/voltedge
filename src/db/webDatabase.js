/**
 * Web Database Fallback
 * Uses IndexedDB when expo-sqlite fails on web
 */

let db = null;
let dbName = 'voltedge_db';
let dbVersion = 1;

/**
 * Initialize IndexedDB database
 */
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores (tables)
      if (!database.objectStoreNames.contains('infrastructure_assets')) {
        const assetsStore = database.createObjectStore('infrastructure_assets', { keyPath: 'id', autoIncrement: true });
        assetsStore.createIndex('type', 'type', { unique: false });
        assetsStore.createIndex('status', 'status', { unique: false });
        assetsStore.createIndex('location', ['location_lat', 'location_lng'], { unique: false });
        assetsStore.createIndex('points', 'intervention_points', { unique: false });
      }

      if (!database.objectStoreNames.contains('dependencies')) {
        database.createObjectStore('dependencies', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('failure_events')) {
        database.createObjectStore('failure_events', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('interventions')) {
        database.createObjectStore('interventions', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('facility_timers')) {
        database.createObjectStore('facility_timers', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('user_reports')) {
        database.createObjectStore('user_reports', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('public_data_cache')) {
        database.createObjectStore('public_data_cache', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('sync_status')) {
        database.createObjectStore('sync_status', { keyPath: 'table_name' });
      }
    };
  });
};

/**
 * Execute a query (SELECT)
 */
const executeQueryIndexedDB = async (storeName, filterFn = null) => {
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
      if (filterFn) {
        results = results.filter(filterFn);
      }
      resolve(results);
    };

    request.onerror = () => {
      reject(new Error('Query failed'));
    };
  });
};

/**
 * Execute a write operation (INSERT, UPDATE, DELETE)
 */
const executeWriteIndexedDB = async (operation, storeName, data, key = null) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    let request;
    if (operation === 'insert') {
      request = store.add(data);
    } else if (operation === 'update') {
      request = store.put(data);
    } else if (operation === 'delete') {
      request = store.delete(key);
    } else {
      reject(new Error('Invalid operation'));
      return;
    }

    request.onsuccess = () => {
      resolve({ lastInsertRowId: request.result });
    };

    request.onerror = () => {
      reject(new Error('Write operation failed'));
    };
  });
};

/**
 * SQL-like query interface for IndexedDB
 */
const queryIndexedDB = async (query, params = []) => {
  // Simple SQL parser for common queries
  const lowerQuery = query.toLowerCase().trim();

  // SELECT queries
  if (lowerQuery.startsWith('select')) {
    // Extract table name
    const fromMatch = query.match(/from\s+(\w+)/i);
    if (!fromMatch) return [];

    const tableName = fromMatch[1];
    let results = await executeQueryIndexedDB(tableName);

    // Simple WHERE clause parsing
    const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
    if (whereMatch && params.length > 0) {
      const whereClause = whereMatch[1];
      // Simple equality filter
      if (whereClause.includes('= ?')) {
        const fieldMatch = whereClause.match(/(\w+)\s*=\s*\?/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          const value = params[0];
          results = results.filter(item => item[field] === value);
        }
      }
    }

    // ORDER BY
    const orderMatch = query.match(/order\s+by\s+(\w+)\s+(asc|desc)/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const direction = orderMatch[2].toLowerCase();
      results.sort((a, b) => {
        const aVal = a[field] || 0;
        const bVal = b[field] || 0;
        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // COUNT(*)
    if (lowerQuery.includes('count(*)')) {
      return [{ count: results.length }];
    }

    return results;
  }

  return [];
};

/**
 * Write operation for IndexedDB
 */
const writeIndexedDB = async (query, params = []) => {
  const lowerQuery = query.toLowerCase().trim();

  // INSERT
  if (lowerQuery.startsWith('insert')) {
    const intoMatch = query.match(/into\s+(\w+)/i);
    if (!intoMatch) throw new Error('Invalid INSERT query');

    const tableName = intoMatch[1];
    
    // Handle INSERT OR IGNORE
    const isIgnore = lowerQuery.includes('insert or ignore');
    
    // Extract field names from INSERT INTO table (field1, field2) VALUES (?, ?)
    const fieldsMatch = query.match(/into\s+\w+\s*\(([^)]+)\)/i);
    const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : [];

    // Extract values - handle both VALUES (?, ?) and VALUES (value1, value2)
    const valuesMatch = query.match(/values\s*\(([^)]+)\)/i);
    if (!valuesMatch) throw new Error('Invalid INSERT values');

    const data = {};
    fields.forEach((field, index) => {
      if (params[index] !== undefined && params[index] !== null) {
        data[field] = params[index];
      }
    });

    // Add timestamps if not provided
    if (!data.created_at && tableName !== 'sync_status') {
      data.created_at = new Date().toISOString();
    }
    if (!data.updated_at && tableName !== 'sync_status') {
      data.updated_at = new Date().toISOString();
    }

    try {
      return await executeWriteIndexedDB('insert', tableName, data);
    } catch (error) {
      if (isIgnore && error.message.includes('ConstraintError')) {
        // Ignore duplicate key errors for INSERT OR IGNORE
        return { lastInsertRowId: null };
      }
      throw error;
    }
  }

  // UPDATE
  if (lowerQuery.startsWith('update')) {
    const tableMatch = query.match(/update\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid UPDATE query');

    const tableName = tableMatch[1];
    const setMatch = query.match(/set\s+(.+?)(?:\s+where|$)/i);
    if (!setMatch) throw new Error('Invalid UPDATE SET');

    const setClause = setMatch[1];
    const updates = {};

    // Parse SET field1 = ?, field2 = ?, field3 = CURRENT_TIMESTAMP
    const setFields = setClause.split(',').map(s => s.trim());
    let paramIndex = 0;
    
    setFields.forEach((field) => {
      const fieldMatch = field.match(/(\w+)\s*=\s*(?:\?|CURRENT_TIMESTAMP)/i);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        if (field.includes('CURRENT_TIMESTAMP')) {
          updates[fieldName] = new Date().toISOString();
        } else if (field.includes('?')) {
          updates[fieldName] = params[paramIndex];
          paramIndex++;
        }
      }
    });

    // Get the record to update - handle WHERE id = ? or WHERE table_name = ?
    const whereMatch = query.match(/where\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch) throw new Error('UPDATE requires WHERE clause with ?');

    const whereField = whereMatch[1];
    const whereValue = params[paramIndex];

    // Get existing record
    const existing = await executeQueryIndexedDB(tableName, item => item[whereField] === whereValue);
    if (existing.length === 0) {
      // For sync_status, create if doesn't exist
      if (tableName === 'sync_status') {
        const newRecord = { table_name: whereValue, ...updates };
        return await executeWriteIndexedDB('insert', tableName, newRecord);
      }
      throw new Error('Record not found');
    }

    const updated = { ...existing[0], ...updates };
    return await executeWriteIndexedDB('update', tableName, updated);
  }

  // DELETE
  if (lowerQuery.startsWith('delete')) {
    const fromMatch = query.match(/from\s+(\w+)/i);
    if (!fromMatch) throw new Error('Invalid DELETE query');

    const tableName = fromMatch[1];
    
    // DELETE FROM table (no WHERE clause - delete all)
    if (!query.match(/where/i)) {
      // Clear all records from the object store
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve({ changes: 0 }); // We don't track exact count
        };

        request.onerror = () => {
          reject(new Error('DELETE failed'));
        };
      });
    }

    // DELETE FROM table WHERE field = ?
    const whereMatch = query.match(/where\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const whereField = whereMatch[1];
      const whereValue = params[0];
      
      // Get records to delete
      const toDelete = await executeQueryIndexedDB(tableName, item => item[whereField] === whereValue);
      
      // Delete each record
      for (const record of toDelete) {
        await executeWriteIndexedDB('delete', tableName, null, record.id);
      }
      
      return { changes: toDelete.length };
    }

    throw new Error('DELETE requires WHERE clause or no clause for delete all');
  }

  throw new Error('Unsupported query type: ' + query.substring(0, 50));
};

export const initWebDatabase = async () => {
  try {
    await initIndexedDB();
    return true;
  } catch (error) {
    console.error('IndexedDB initialization failed:', error);
    throw error;
  }
};

export const executeQueryWeb = queryIndexedDB;
export const executeWriteWeb = writeIndexedDB;
export const getWebDatabase = () => db;
