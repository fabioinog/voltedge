/**
 * Facility Connections Utility
 * Establishes logical connections between facilities based on type and proximity
 * 
 * Connection Rules:
 * - Hospitals need: power, water
 * - Shelters need: power, water
 * - Food centers need: power, water
 * - Each facility connects to nearest relevant source
 */

import { calculateDistance } from './distance';
import { executeQuery, executeWrite } from '../db/database';

/**
 * Determine what types a facility needs to connect to
 * @param {string} facilityType - Type of facility (hospital, shelter, food, etc.)
 * @returns {Array<string>} Array of required connection types
 */
const getRequiredConnections = (facilityType) => {
  const connectionMap = {
    hospital: ['power', 'water'],
    shelter: ['power', 'water'],
    food: ['power', 'water'],
    // Power and water facilities don't need connections (they are sources)
    power: [],
    water: [],
  };
  
  return connectionMap[facilityType] || [];
};

/**
 * Find nearest facility of a specific type
 * @param {Object} facility - Source facility
 * @param {Array} allFacilities - All facilities
 * @param {string} requiredType - Type to find (power, water)
 * @param {number} maxDistance - Maximum distance in meters (optional)
 * @returns {Object|null} Nearest facility of required type
 */
const findNearestOfType = (facility, allFacilities, requiredType, maxDistance = null) => {
  const candidates = allFacilities.filter(
    (f) => f.type === requiredType && f.id !== facility.id
  );

  if (candidates.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  candidates.forEach((candidate) => {
    const distance = calculateDistance(
      facility.location_lat,
      facility.location_lng,
      candidate.location_lat,
      candidate.location_lng
    );

    // Check max distance constraint
    if (maxDistance && distance > maxDistance) {
      return;
    }

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...candidate, connectionDistance: distance };
    }
  });

  return nearest;
};

/**
 * Establish connections for a single facility
 * @param {Object} facility - Facility to connect
 * @param {Array} allFacilities - All facilities
 * @returns {Array} Array of connection objects
 */
const establishFacilityConnections = (facility, allFacilities) => {
  const connections = [];
  const requiredTypes = getRequiredConnections(facility.type);

  requiredTypes.forEach((requiredType) => {
    // Find nearest facility of required type
    // Max distance: 200km (reasonable connection range for Sudan)
    const nearest = findNearestOfType(
      facility,
      allFacilities,
      requiredType,
      200000 // 200km max distance
    );

    if (nearest) {
      connections.push({
        fromFacilityId: facility.id,
        toFacilityId: nearest.id,
        connectionType: requiredType,
        distance: nearest.connectionDistance,
      });
    }
  });

  return connections;
};

/**
 * Establish all facility connections
 * Creates connections in the database
 * @param {Array} facilities - All facilities
 * @returns {Promise<Array>} Array of created connections
 */
export const establishAllConnections = async (facilities) => {
  try {
    // Clear existing connections to avoid duplicates
    await executeWrite('DELETE FROM dependencies');

    const allConnections = [];
    const connectionMap = new Map(); // Track to avoid duplicates

    // Establish connections for each facility
    facilities.forEach((facility) => {
      const connections = establishFacilityConnections(facility, facilities);
      
      connections.forEach((conn) => {
        // Create unique key to avoid duplicates
        const key = `${conn.fromFacilityId}-${conn.toFacilityId}`;
        const reverseKey = `${conn.toFacilityId}-${conn.fromFacilityId}`;
        
        // Only add if not already added (either direction)
        if (!connectionMap.has(key) && !connectionMap.has(reverseKey)) {
          connectionMap.set(key, conn);
          allConnections.push(conn);
        }
      });
    });

    // Store connections in database (using dependencies table)
    const storedConnections = [];
    for (const conn of allConnections) {
      try {
        await executeWrite(
          `INSERT OR IGNORE INTO dependencies 
           (dependent_asset_id, depends_on_asset_id, dependency_type)
           VALUES (?, ?, ?)`,
          [conn.fromFacilityId, conn.toFacilityId, conn.connectionType]
        );
        storedConnections.push(conn);
      } catch (error) {
        console.warn(`Failed to store connection ${conn.fromFacilityId} -> ${conn.toFacilityId}:`, error);
      }
    }

    console.log(`Established ${storedConnections.length} facility connections`);
    return storedConnections;
  } catch (error) {
    console.error('Error establishing connections:', error);
    return [];
  }
};

/**
 * Get all connections for facilities
 * @param {Array} facilities - Facilities to get connections for
 * @returns {Promise<Array>} Array of connection objects with facility data
 */
export const getFacilityConnections = async (facilities) => {
  try {
    // Get all dependencies (connections) - web database doesn't support JOIN, so we'll do it manually
    const dependencies = await executeQuery('SELECT * FROM dependencies');
    
    console.log(`getFacilityConnections: Found ${dependencies.length} dependencies from database`);
    
    if (dependencies.length === 0) {
      console.log('No dependencies found in database');
      return [];
    }

    // Get all facilities to join with
    const allFacilities = await executeQuery('SELECT * FROM infrastructure_assets');
    
    // Create a map for quick lookup
    const facilityMap = new Map();
    allFacilities.forEach((facility) => {
      facilityMap.set(facility.id, facility);
    });

    // Manually join dependencies with facilities
    const connections = dependencies
      .map((dep) => {
        const fromFacility = facilityMap.get(dep.dependent_asset_id);
        const toFacility = facilityMap.get(dep.depends_on_asset_id);
        
        // Skip if either facility is missing or has invalid coordinates
        if (!fromFacility || !toFacility) {
          return null;
        }
        
        const fromLat = fromFacility.location_lat;
        const fromLng = fromFacility.location_lng;
        const toLat = toFacility.location_lat;
        const toLng = toFacility.location_lng;
        
        // Validate coordinates
        if (
          fromLat == null || isNaN(fromLat) ||
          fromLng == null || isNaN(fromLng) ||
          toLat == null || isNaN(toLat) ||
          toLng == null || isNaN(toLng)
        ) {
          return null;
        }
        
        return {
          id: dep.id,
          from: {
            id: fromFacility.id,
            name: fromFacility.name,
            type: fromFacility.type,
            lat: Number(fromLat),
            lng: Number(fromLng),
            status: fromFacility.status,
            points: fromFacility.intervention_points || 0,
          },
          to: {
            id: toFacility.id,
            name: toFacility.name,
            type: toFacility.type,
            lat: Number(toLat),
            lng: Number(toLng),
            status: toFacility.status,
            points: toFacility.intervention_points || 0,
          },
          type: dep.dependency_type,
        };
      })
      .filter((conn) => conn !== null); // Remove null entries

    console.log(`getFacilityConnections: Returning ${connections.length} valid connections out of ${dependencies.length} total`);
    return connections;
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
};

/**
 * Determine connection line color based on facility priorities
 * @param {Object} connection - Connection object with from/to facilities
 * @param {Array} topPriorityFacilities - Top 3 priority facilities (by points)
 * @returns {string} Color code ('green', 'yellow', 'red')
 */
export const getConnectionColor = (connection, topPriorityFacilities) => {
  // Get top 3 facility IDs
  const topPriorityIds = topPriorityFacilities.slice(0, 3).map(f => f.id);
  
  // Check if either facility in connection is in top 3
  const isAtRisk = 
    topPriorityIds.includes(connection.from.id) || 
    topPriorityIds.includes(connection.to.id);
  
  // Check if either facility is failed
  const isFailed = 
    connection.from.status === 'failed' || 
    connection.to.status === 'failed';
  
  // Color logic - red for failed, yellow for at risk, green for normal
  if (isFailed) {
    return 'red'; // Failed facility - highest priority
  } else if (isAtRisk) {
    return 'yellow'; // At risk (top 3 priority)
  } else {
    return 'green'; // Default - working fine
  }
};
