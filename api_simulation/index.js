/**
 * API Simulation Module
 * 
 * Simulates an external API that provides facility data for intervention ranking.
 * This is a proof of concept until reliable public data sources are available.
 * 
 * Future: This will be replaced with actual API calls to real data sources.
 */

import { 
  staticFacilityData, 
  getFacilityById, 
  getAllFacilities,
  getFacilitiesByType,
  getFacilitiesByStatus 
} from './data';
import { applyUserFeedback } from './userFeedback';

/**
 * Simulate API delay (for realistic behavior)
 */
const simulateAPIDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Fetch facility data from API simulation
 * Simulates: GET /api/facilities/:id
 * 
 * @param {string} facilityId - Facility identifier
 * @returns {Promise<Object|null>} Facility data or null if not found
 */
export const fetchFacilityData = async (facilityId) => {
  await simulateAPIDelay(50); // Simulate network delay
  
  const facility = getFacilityById(facilityId);
  
  if (!facility) {
    return null;
  }
  
  // Apply user feedback if available (future feature)
  return applyUserFeedback(facility);
};

/**
 * Fetch all facilities from API simulation
 * Simulates: GET /api/facilities
 * 
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by facility type (water, power, shelter, food)
 * @param {string} options.status - Filter by status (failed, at_risk, operational)
 * @returns {Promise<Array>} Array of facility data
 */
export const fetchAllFacilities = async (options = {}) => {
  await simulateAPIDelay(100); // Simulate network delay
  
  let facilities = getAllFacilities();
  
  // Apply filters
  if (options.type) {
    facilities = facilities.filter(f => f.type === options.type);
  }
  
  if (options.status) {
    facilities = facilities.filter(f => f.status === options.status);
  }
  
  // Apply user feedback to all facilities (future feature)
  return facilities.map(facility => applyUserFeedback(facility));
};

/**
 * Fetch facilities by type
 * Simulates: GET /api/facilities?type=water
 * 
 * @param {string} type - Facility type (water, power, shelter, food)
 * @returns {Promise<Array>} Array of facilities of specified type
 */
export const fetchFacilitiesByType = async (type) => {
  await simulateAPIDelay(80);
  const facilities = getFacilitiesByType(type);
  return facilities.map(facility => applyUserFeedback(facility));
};

/**
 * Fetch facilities by status
 * Simulates: GET /api/facilities?status=failed
 * 
 * @param {string} status - Facility status (failed, at_risk, operational)
 * @returns {Promise<Array>} Array of facilities with specified status
 */
export const fetchFacilitiesByStatus = async (status) => {
  await simulateAPIDelay(80);
  const facilities = getFacilitiesByStatus(status);
  return facilities.map(facility => applyUserFeedback(facility));
};

/**
 * Get facility metrics for intervention ranking
 * This is what the main app will use to calculate points
 * 
 * @param {string} facilityId - Facility identifier
 * @returns {Promise<Object>} Facility metrics object
 */
export const getFacilityMetrics = async (facilityId) => {
  const facility = await fetchFacilityData(facilityId);
  
  if (!facility) {
    return null;
  }
  
  // Return only the metrics needed for intervention ranking
  return {
    id: facility.id,
    facility_importance: facility.facility_importance,
    facility_condition: facility.facility_condition,
    supply_amount: facility.supply_amount,
    population_amount: facility.population_amount,
    population_served: facility.population_served,
    urgency_hours: facility.urgency_hours,
    effort_penalty: facility.effort_penalty,
    cascade_prevention_count: facility.cascade_prevention_count,
    status: facility.status,
    type: facility.type,
  };
};

/**
 * Check if API is available (for offline detection)
 * In real implementation, this would ping the actual API
 * 
 * @returns {Promise<boolean>} True if API is available
 */
export const isAPIAvailable = async () => {
  // For simulation, always return true
  // In real implementation, check network connectivity
  return true;
};

/**
 * Get API metadata
 * Useful for debugging and monitoring
 * 
 * @returns {Object} API metadata
 */
export const getAPIMetadata = () => {
  return {
    name: 'VoltEdge API Simulation',
    version: '1.0.0',
    type: 'simulation',
    totalFacilities: staticFacilityData.length,
    lastUpdated: new Date().toISOString(),
    description: 'Proof of concept API simulation. Will be replaced with real API endpoints.',
  };
};

// Export all functions
export default {
  fetchFacilityData,
  fetchAllFacilities,
  fetchFacilitiesByType,
  fetchFacilitiesByStatus,
  getFacilityMetrics,
  isAPIAvailable,
  getAPIMetadata,
};
