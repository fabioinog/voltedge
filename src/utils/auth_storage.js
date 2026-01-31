/**
 * Persisted sign-in state (user role).
 * Survives page reload (web) and app restart (Android/iOS).
 * Web: localStorage (unchanged from before). Native: AsyncStorage so the app
 * has the same flow as the website (sign-in first, then map; role persists until sign out).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'voltedge_user_role';

const VALID_ROLES = ['control_center', 'khartoum_response_team'];

const isWeb = Platform.OS === 'web';

/**
 * Get stored user role, if any.
 * @returns {Promise<string|null>} Stored role or null.
 */
export const getStoredUserRole = async () => {
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_ROLES.includes(stored)) return stored;
      return null;
    }
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && VALID_ROLES.includes(stored)) return stored;
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
    if (!VALID_ROLES.includes(userRole)) return;
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, userRole);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, userRole);
  } catch (e) {
    // ignore
  }
};

/**
 * Clear stored role on sign out.
 */
export const clearStoredUserRole = async () => {
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
};
