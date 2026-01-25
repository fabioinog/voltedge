/**
 * Distance Calculation Utilities
 * Uses Haversine formula for great-circle distance calculations
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate bearing (direction) from point A to point B
 * @param {number} lat1 - Starting latitude
 * @param {number} lng1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x);
  const bearingDegrees = ((bearing * 180) / Math.PI + 360) % 360;

  return bearingDegrees;
};

/**
 * Find nearest facility to user location
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {Array} facilities - Array of facility objects with lat/lng
 * @returns {Object|null} Nearest facility with distance
 */
export const findNearestFacility = (userLat, userLng, facilities) => {
  if (!facilities || facilities.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  facilities.forEach((facility) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      facility.location_lat || facility.lat,
      facility.location_lng || facility.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        facility,
        distance,
      };
    }
  });

  return nearest;
};

/**
 * Format distance for display
 * @param {number} distanceMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceMeters) => {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)}km`;
};
