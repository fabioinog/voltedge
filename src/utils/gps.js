/**
 * GPS/Geolocation Utility
 * Returns fixed user location in Khartoum, Sudan (capital)
 * No actual GPS tracking - user is always spawned in Khartoum
 */

// Khartoum coordinates (capital of Sudan)
const KHARTOUM_CENTER = {
  lat: 15.5007,
  lng: 32.5599,
};

/**
 * Get current user location (always returns Khartoum)
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: number}>}
 */
export const getCurrentLocation = () => {
  return Promise.resolve({
    lat: KHARTOUM_CENTER.lat,
    lng: KHARTOUM_CENTER.lng,
    accuracy: 10, // Fixed accuracy
    timestamp: Date.now(),
  });
};
