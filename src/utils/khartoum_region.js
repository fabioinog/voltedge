/**
 * Khartoum region helper for VoltEdge.
 * Used to filter facilities visible to "Khartoum Response Team" (failures in Khartoum only).
 */

// Approximate Khartoum bounds (lat/lng)
const KHARTOUM_LAT_MIN = 15.35;
const KHARTOUM_LAT_MAX = 15.65;
const KHARTOUM_LNG_MIN = 32.45;
const KHARTOUM_LNG_MAX = 32.65;

/**
 * Returns true if the facility is considered to be in Khartoum.
 * Uses: (1) name contains "Khartoum" (case-insensitive), or
 *       (2) coordinates fall within Khartoum bounds.
 * @param {Object} facility - Facility object with name, location_lat/lat, location_lng/lng
 * @returns {boolean}
 */
export const isFacilityInKhartoum = (facility) => {
  if (!facility) return false;
  const name = (facility.name || '').toLowerCase();
  if (name.includes('khartoum')) return true;
  const lat = facility.location_lat ?? facility.lat;
  const lng = facility.location_lng ?? facility.lng;
  if (lat == null || lng == null) return false;
  return (
    lat >= KHARTOUM_LAT_MIN &&
    lat <= KHARTOUM_LAT_MAX &&
    lng >= KHARTOUM_LNG_MIN &&
    lng <= KHARTOUM_LNG_MAX
  );
};
