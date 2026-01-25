/**
 * Offline Road-Based Routing Algorithm
 * Simplified routing using waypoints along major roads
 * For Sudan, uses major highways and roads as waypoints
 */

import { calculateDistance, calculateBearing } from './distance';

/**
 * Major road waypoints in Sudan (simplified network)
 * These represent intersections and key points on major roads
 */
const SUDAN_ROAD_NETWORK = [
  // Khartoum area roads
  { lat: 15.5007, lng: 32.5599, name: 'Khartoum Center' },
  { lat: 15.6000, lng: 32.5000, name: 'Khartoum North' },
  { lat: 15.4000, lng: 32.6000, name: 'Khartoum South' },
  
  // Highway connections
  { lat: 15.4500, lng: 32.4000, name: 'Highway Junction 1' },
  { lat: 15.3500, lng: 32.7000, name: 'Highway Junction 2' },
  { lat: 13.1833, lng: 30.2167, name: 'El Obeid Junction' },
  { lat: 19.6158, lng: 37.2164, name: 'Port Sudan Junction' },
  { lat: 12.0500, lng: 24.8800, name: 'Nyala Junction' },
  { lat: 15.4500, lng: 36.4000, name: 'Kassala Junction' },
  
  // Additional waypoints for better routing
  { lat: 14.0333, lng: 35.3833, name: 'Gedaref Junction' },
  { lat: 13.1667, lng: 32.6667, name: 'Kosti Junction' },
  { lat: 13.6167, lng: 25.3500, name: 'Al-Fashir Junction' },
  { lat: 13.4500, lng: 22.4500, name: 'Geneina Junction' },
  { lat: 17.7000, lng: 33.9667, name: 'Atbara Junction' },
  { lat: 16.6833, lng: 33.4333, name: 'Shendi Junction' },
];

/**
 * Find nearest road waypoint to a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Nearest waypoint
 */
const findNearestWaypoint = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;

  SUDAN_ROAD_NETWORK.forEach((waypoint) => {
    const distance = calculateDistance(lat, lng, waypoint.lat, waypoint.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = waypoint;
    }
  });

  return nearest;
};

/**
 * Simple A* pathfinding between waypoints
 * @param {Object} start - Start waypoint
 * @param {Object} end - End waypoint
 * @returns {Array} Path of waypoints
 */
const findPathBetweenWaypoints = (start, end) => {
  // Simplified: if waypoints are close, return direct path
  const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  if (distance < 50000) { // Less than 50km, use direct path
    return [start, end];
  }

  // For longer distances, find intermediate waypoints
  const path = [start];
  
  // Find waypoints that are roughly in the direction of the destination
  const bearing = calculateBearing(start.lat, start.lng, end.lat, end.lng);
  
  // Find intermediate waypoints (simplified - just use closest to midpoint)
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const intermediate = findNearestWaypoint(midLat, midLng);
  
  if (intermediate && intermediate !== start && intermediate !== end) {
    path.push(intermediate);
  }
  
  path.push(end);
  return path;
};

/**
 * Generate route from user location to facility
 * Uses road network waypoints for realistic routing
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {number} facilityLat - Facility latitude
 * @param {number} facilityLng - Facility longitude
 * @returns {Object} Route with waypoints and instructions
 */
export const generateRoute = (userLat, userLng, facilityLat, facilityLng) => {
  // Find nearest road waypoints
  const startWaypoint = findNearestWaypoint(userLat, userLng);
  const endWaypoint = findNearestWaypoint(facilityLat, facilityLng);

  // Generate path through waypoints
  const waypoints = findPathBetweenWaypoints(startWaypoint, endWaypoint);

  // Add final destination (may be off-road)
  waypoints.push({
    lat: facilityLat,
    lng: facilityLng,
    name: 'Destination',
  });

  // Generate turn-by-turn instructions
  const instructions = [];
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    const distance = calculateDistance(current.lat, current.lng, next.lat, next.lng);
    totalDistance += distance;

    let instruction = '';
    if (i === 0) {
      // First instruction: head to nearest road
      const bearing = calculateBearing(userLat, userLng, current.lat, current.lng);
      instruction = `Head ${getDirectionName(bearing)} to ${current.name}`;
    } else if (i === waypoints.length - 2) {
      // Last instruction: arrive at destination
      instruction = `Continue ${getDirectionName(calculateBearing(current.lat, current.lng, next.lat, next.lng))} to destination`;
    } else {
      // Intermediate: continue on road
      const bearing = calculateBearing(current.lat, current.lng, next.lat, next.lng);
      instruction = `Continue ${getDirectionName(bearing)} on road to ${next.name}`;
    }

    instructions.push({
      step: i + 1,
      instruction,
      distance: Math.round(distance),
      waypoint: next,
    });
  }

  return {
    waypoints,
    instructions,
    totalDistance: Math.round(totalDistance),
    estimatedTime: Math.round(totalDistance / 1.4), // Walking speed ~1.4 m/s
  };
};

/**
 * Get direction name from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Direction name
 */
const getDirectionName = (bearing) => {
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Get next instruction based on current location
 * @param {number} userLat - Current user latitude
 * @param {number} userLng - Current user longitude
 * @param {Object} route - Route object from generateRoute
 * @returns {Object|null} Next instruction
 */
export const getNextInstruction = (userLat, userLng, route) => {
  if (!route || !route.instructions || route.instructions.length === 0) {
    return null;
  }

  // Find which waypoint we're closest to
  let closestWaypointIndex = 0;
  let minDistance = Infinity;

  route.waypoints.forEach((waypoint, index) => {
    const distance = calculateDistance(userLat, userLng, waypoint.lat, waypoint.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestWaypointIndex = index;
    }
  });

  // If we're within 100m of a waypoint, move to next instruction
  if (minDistance < 100 && closestWaypointIndex < route.instructions.length) {
    return route.instructions[closestWaypointIndex];
  }

  // Return current instruction based on closest waypoint
  const currentInstructionIndex = Math.min(closestWaypointIndex, route.instructions.length - 1);
  return route.instructions[currentInstructionIndex];
};
