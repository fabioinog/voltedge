/**
 * Persisted sign-in state (user role).
 * Survives page reload (web) and app restart when storage is available.
 * Uses localStorage on web; can be extended with AsyncStorage on native.
 */

const STORAGE_KEY = 'voltedge_user_role';

const VALID_ROLES = ['control_center', 'khartoum_response_team'];

/**
 * Get stored user role, if any.
 * @returns {Promise<string|null>} Stored role or null.
 */
export const getStoredUserRole = async () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (VALID_ROLES.includes(stored)) {
        return stored;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Persist user role after sign-in.
 * @param {string} userRole - One of VALID_ROLES.
 */
export const setStoredUserRole = async (userRole) => {
  try {
    if (typeof localStorage !== 'undefined' && VALID_ROLES.includes(userRole)) {
      localStorage.setItem(STORAGE_KEY, userRole);
    }
  } catch (e) {
    // ignore
  }
};

/**
 * Clear stored role on sign out.
 */
export const clearStoredUserRole = async () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
};
