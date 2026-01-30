/**
 * Wraps expo-sqlite/legacy database so it exposes the same interface as the next API:
 * getAllAsync(query, params), runAsync(query, params), execAsync(sqlString).
 * Used as fallback on Android when the next API throws "Unimplemented".
 */

/**
 * Split multi-statement SQL into single statements for legacy exec (array of { sql, args }).
 * @param {string} source - SQL string (may contain multiple statements)
 * @returns {Array<{ sql: string, args: any[] }>}
 */
function splitStatements(source) {
  if (!source || typeof source !== 'string') return [];
  const parts = source.split(';').map((s) => s.trim()).filter(Boolean);
  return parts.map((sql) => ({ sql: sql.endsWith(';') ? sql : sql + ';', args: [] }));
}

/**
 * Wrap a legacy DB (from expo-sqlite/legacy openDatabase) to match next API:
 * getAllAsync(query, params), runAsync(query, params), execAsync(sqlString).
 * @param {object} legacyDb - Legacy database with execAsync(queries, readOnly)
 * @returns {object} Adapter with getAllAsync, runAsync, execAsync
 */
export function wrapLegacyDb(legacyDb) {
  if (!legacyDb || typeof legacyDb.execAsync !== 'function') {
    throw new Error('Legacy DB must have execAsync(queries, readOnly)');
  }

  return {
    getAllAsync: async (query, params = []) => {
      const resultSets = await legacyDb.execAsync([{ sql: query, args: params }], true);
      const first = resultSets[0];
      if (first && 'error' in first) throw first.error;
      return (first && first.rows) ? first.rows : [];
    },

    runAsync: async (query, params = []) => {
      const resultSets = await legacyDb.execAsync([{ sql: query, args: params }], false);
      const first = resultSets[0];
      if (first && 'error' in first) throw first.error;
      return {
        lastInsertRowId: (first && first.insertId != null) ? first.insertId : 0,
        changes: (first && first.rowsAffected != null) ? first.rowsAffected : 0,
      };
    },

    execAsync: async (sqlString) => {
      const queries = splitStatements(sqlString);
      if (queries.length === 0) return;
      const resultSets = await legacyDb.execAsync(queries, false);
      for (let i = 0; i < resultSets.length; i++) {
        const r = resultSets[i];
        if (r && 'error' in r) throw r.error;
      }
    },
  };
}

/**
 * Open a database using expo-sqlite/legacy and return an adapter with next-style API.
 * Only use on native (Android/iOS) when the next API fails; do not use on web.
 * @param {string} name - Database file name (e.g. 'voltedge_offline.db')
 * @returns {Promise<object>} Adapter with getAllAsync, runAsync, execAsync
 */
export async function openLegacyDatabaseAsync(name) {
  const SQLiteLegacy = require('expo-sqlite/legacy');
  const db = SQLiteLegacy.openDatabase(name, '1.0', name, 1);
  if (!db || !db.execAsync) throw new Error('Legacy openDatabase did not return a valid DB');
  return wrapLegacyDb(db);
}
