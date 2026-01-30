/**
 * Simulated connection state (online/offline).
 * Toggled from the admin panel; persisted so it survives page refresh.
 */

const STORAGE_KEY = 'voltedge_connection_mode';

function readPersisted() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'offline' || stored === 'online') {
        return stored === 'online';
      }
    }
  } catch (e) {
    // ignore
  }
  return true;
}

function writePersisted(online) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, online ? 'online' : 'offline');
    }
  } catch (e) {
    // ignore
  }
}

let simulatedOnline = readPersisted();

export const getConnectionMode = () => simulatedOnline;

export const setConnectionMode = (online) => {
  simulatedOnline = Boolean(online);
  writePersisted(simulatedOnline);
};

/** Same as getConnectionMode(); use for compatibility with code that expects isOnline(). */
export const isOnline = () => simulatedOnline;
