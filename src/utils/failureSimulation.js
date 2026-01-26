/**
 * Failure Simulation Utility
 * Manages facility failures and cascading effects
 * 
 * Failures persist across page refresh but reset on app restart (Ctrl+C)
 */

import { executeQuery, executeWrite } from '../db/database';
import { getFacilityConnections } from './facilityConnections';
import { calculateInterventionPoints } from './interventionRanking';
import { calculateDistance } from './distance';

// In-memory storage for failed facilities
// On app restart (Ctrl+C), this is cleared and failures are reset
// On page refresh, this is loaded from database
const failedFacilities = new Set();
const atRiskFacilities = new Set();

/**
 * Get all failed facility IDs
 * @returns {Array<number>} Array of failed facility IDs
 */
export const getFailedFacilities = () => {
  return Array.from(failedFacilities);
};

/**
 * Get all at-risk facility IDs
 * @returns {Array<number>} Array of at-risk facility IDs
 */
export const getAtRiskFacilities = () => {
  return Array.from(atRiskFacilities);
};

/**
 * Check if a facility is failed
 * @param {number} facilityId - Facility ID
 * @returns {boolean} True if facility is failed
 */
export const isFacilityFailed = (facilityId) => {
  return failedFacilities.has(facilityId);
};

/**
 * Check if a facility is at risk
 * @param {number} facilityId - Facility ID
 * @returns {boolean} True if facility is at risk
 */
export const isFacilityAtRisk = (facilityId) => {
  return atRiskFacilities.has(facilityId);
};

/**
 * Calculate cascading failures when a facility fails
 * Only marks NEARBY facilities as at risk (not failed)
 * @param {number} failedFacilityId - ID of the facility that failed
 * @param {Array} allFacilities - All facilities
 * @param {Array} connections - All facility connections (not used for distance-based calculation)
 * @returns {Array<number>} Array of facility IDs that are now at risk (only nearby facilities)
 */
const calculateCascadingFailures = (failedFacilityId, allFacilities, connections) => {
  const atRiskIds = new Set();
  
  // Find the failed facility
  const failedFacility = allFacilities.find(f => f.id === failedFacilityId);
  if (!failedFacility) {
    console.warn(`calculateCascadingFailures: Failed facility ${failedFacilityId} not found`);
    return [];
  }
  
  // Maximum distance for facilities to be considered "at risk" (in meters)
  // 50km = 50,000 meters - facilities within this distance are at risk
  // Reduced from 100km to make it more realistic
  const MAX_RISK_DISTANCE = 50000; // 50km
  
  const failedLat = failedFacility.location_lat || failedFacility.lat;
  const failedLng = failedFacility.location_lng || failedFacility.lng;
  
  if (!failedLat || !failedLng) {
    console.warn(`calculateCascadingFailures: Failed facility ${failedFacility.name} has no coordinates`);
    return [];
  }
  
  console.log(`calculateCascadingFailures: ${failedFacility.name} (${failedLat}, ${failedLng}) failed. Checking ${allFacilities.length} facilities...`);
  
  // Check all facilities and find those within the risk distance
  allFacilities.forEach((facility) => {
    // Skip the failed facility itself
    if (facility.id === failedFacilityId) {
      return;
    }
    
    // Skip facilities that are already failed (they should stay failed)
    if (facility.status === 'failed') {
      return;
    }
    
    // Get facility coordinates
    const facilityLat = facility.location_lat || facility.lat;
    const facilityLng = facility.location_lng || facility.lng;
    
    if (!facilityLat || !facilityLng) {
      return; // Skip facilities without coordinates
    }
    
    // Calculate distance from failed facility to this facility
    const distance = calculateDistance(
      failedLat,
      failedLng,
      facilityLat,
      facilityLng
    );
    
    // If facility is within risk distance, mark it as at risk (NOT failed)
    if (distance <= MAX_RISK_DISTANCE) {
      atRiskIds.add(facility.id);
      console.log(`  - ${facility.name} is ${(distance / 1000).toFixed(1)}km away - marking as AT RISK (not failed)`);
    }
  });
  
  console.log(`calculateCascadingFailures: ${failedFacility.name} failed. ${atRiskIds.size} nearby facilities marked as AT RISK (within ${MAX_RISK_DISTANCE / 1000}km). Only the original facility is FAILED.`);
  
  return Array.from(atRiskIds);
};

/**
 * Simulate a facility failure
 * @param {number} facilityId - ID of facility to fail
 * @param {Array} allFacilities - All facilities
 * @param {Array} connections - All facility connections
 * @returns {Object} Result object with failed facility and at-risk facilities
 */
export const simulateFacilityFailure = async (facilityId, allFacilities, connections) => {
  try {
    // Get the facility to fail
    let failedFacility = allFacilities.find(f => f.id === facilityId);
    if (!failedFacility) {
      // Try to load from database if not in allFacilities
      const dbFacility = await executeQuery(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (dbFacility[0]) {
        failedFacility = dbFacility[0];
      } else {
        throw new Error(`Facility ${facilityId} not found`);
      }
    }
    
    // Mark facility as failed
    failedFacilities.add(facilityId);
    
    // Update facility status in database
    // IMPORTANT: Use explicit parameterized query to ensure it works with web database
    console.log(`simulateFacilityFailure: Attempting to update ${failedFacility.name} (ID: ${facilityId}) to failed status...`);
    
    const updateResult = await executeWrite(
      `UPDATE infrastructure_assets 
       SET status = ? 
       WHERE id = ?`,
      ['failed', facilityId]
    );
    
    console.log(`simulateFacilityFailure: Update result:`, updateResult);
    
    // For web database (IndexedDB), we need to ensure the transaction completes
    // Wait a bit longer for IndexedDB to commit
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify the update worked - try multiple times if needed
    let verifyUpdate = await executeQuery(
      'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
      [facilityId]
    );
    
    console.log(`simulateFacilityFailure: First verification - Found facility:`, verifyUpdate[0]);
    
    let attempts = 0;
    while (verifyUpdate[0] && verifyUpdate[0].status !== 'failed' && attempts < 5) {
      console.log(`simulateFacilityFailure: Verification attempt ${attempts + 1} - status is '${verifyUpdate[0]?.status}', retrying update...`);
      
      // Try the update again
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['failed', facilityId]
      );
      
      await new Promise(resolve => setTimeout(resolve, 200));
      verifyUpdate = await executeQuery(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      attempts++;
    }
    
    if (verifyUpdate[0]?.status === 'failed') {
      console.log(`simulateFacilityFailure: ✓ SUCCESS - Verified status for ${failedFacility.name}: ${verifyUpdate[0]?.status}`);
    } else {
      console.error(`simulateFacilityFailure: ✗ ERROR - Status verification failed after ${attempts} attempts! Expected 'failed', got '${verifyUpdate[0]?.status}'`);
      console.error(`simulateFacilityFailure: Full facility data:`, verifyUpdate[0]);
    }
    
    // Calculate cascading effects
    const atRiskIds = calculateCascadingFailures(facilityId, allFacilities, connections);
    
    // Mark facilities as at risk
    atRiskIds.forEach((id) => {
      atRiskFacilities.add(id);
    });
    
    // Update at-risk facility statuses in database
    console.log(`simulateFacilityFailure: Updating ${atRiskIds.length} facilities to at_risk status in database...`);
    for (const atRiskId of atRiskIds) {
      const updateResult = await executeWrite(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ? AND status != 'failed'`,
        ['at_risk', atRiskId]
      );
      console.log(`simulateFacilityFailure: Updated facility ${atRiskId} to at_risk status. Update result:`, updateResult);
      
      // Verify the update worked
      await new Promise(resolve => setTimeout(resolve, 100));
      const verifyAtRisk = await executeQuery(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [atRiskId]
      );
      
      if (verifyAtRisk[0] && verifyAtRisk[0].status === 'at_risk') {
        console.log(`simulateFacilityFailure: ✓ Verified ${verifyAtRisk[0].name} is now at_risk`);
      } else {
        console.error(`simulateFacilityFailure: ✗ ERROR - Facility ${atRiskId} is NOT at_risk! Status: ${verifyAtRisk[0]?.status}`);
        // Try again
        await executeWrite(
          `UPDATE infrastructure_assets 
           SET status = ? 
           WHERE id = ?`,
          ['at_risk', atRiskId]
        );
      }
    }
    console.log(`simulateFacilityFailure: Completed updating ${atRiskIds.length} facilities to at_risk status`);
    
    // Recalculate points for failed facility (with failed status)
    const failedFacilityUpdated = { ...failedFacility, status: 'failed' };
    const failedPoints = await calculateInterventionPoints(failedFacilityUpdated);
    await executeWrite(
      `UPDATE infrastructure_assets 
       SET intervention_points = ? 
       WHERE id = ?`,
      [failedPoints, facilityId]
    );
    
    // Recalculate points for at-risk facilities (with at_risk status)
    for (const atRiskId of atRiskIds) {
      let atRiskFacility = allFacilities.find(f => f.id === atRiskId);
      if (!atRiskFacility) {
        const dbFacility = await executeQuery(
          'SELECT * FROM infrastructure_assets WHERE id = ?',
          [atRiskId]
        );
        if (dbFacility[0]) {
          atRiskFacility = dbFacility[0];
        }
      }
      
      if (atRiskFacility) {
        const atRiskFacilityUpdated = { ...atRiskFacility, status: 'at_risk' };
        const atRiskPoints = await calculateInterventionPoints(atRiskFacilityUpdated);
        await executeWrite(
          `UPDATE infrastructure_assets 
           SET intervention_points = ? 
           WHERE id = ?`,
          [atRiskPoints, atRiskId]
        );
      }
    }
    
    return {
      failedFacility: { ...failedFacility, status: 'failed', intervention_points: failedPoints },
      atRiskFacilities: atRiskIds.map(id => {
        const facility = allFacilities.find(f => f.id === id);
        return facility ? { ...facility, status: 'at_risk' } : null;
      }).filter(f => f),
      atRiskIds: atRiskIds,
    };
  } catch (error) {
    console.error('Error simulating facility failure:', error);
    throw error;
  }
};

/**
 * Get failure suggestions based on facility type
 * @param {Object} facility - Failed facility
 * @returns {Array<string>} Array of suggestion strings
 */
export const getFailureSuggestions = (facility) => {
  const suggestions = [];
  
  if (facility.type === 'water') {
    suggestions.push('Dispatch water truck to affected areas');
    suggestions.push('Set up temporary water distribution points');
    suggestions.push('Contact nearest water treatment facility for backup supply');
    suggestions.push('Notify hospitals and shelters to activate emergency water reserves');
  } else if (facility.type === 'power') {
    suggestions.push('Deploy backup generator to critical facilities');
    suggestions.push('Contact power grid operator for emergency restoration');
    suggestions.push('Prioritize power restoration to hospitals and shelters');
    suggestions.push('Check for downed power lines or transformer failures');
  } else if (facility.type === 'hospital') {
    suggestions.push('Evacuate critical patients to nearest operational hospital');
    suggestions.push('Deploy mobile medical unit to area');
    suggestions.push('Ensure backup power and water supplies are available');
    suggestions.push('Coordinate with emergency services for patient transport');
  } else if (facility.type === 'shelter') {
    suggestions.push('Relocate residents to nearest operational shelter');
    suggestions.push('Set up temporary shelter with emergency supplies');
    suggestions.push('Ensure food and water distribution to displaced persons');
    suggestions.push('Coordinate with relief organizations for support');
  } else if (facility.type === 'food') {
    suggestions.push('Redirect food distribution from nearest operational center');
    suggestions.push('Set up temporary food distribution point');
    suggestions.push('Contact food aid organizations for emergency supplies');
    suggestions.push('Ensure food reaches affected hospitals and shelters');
  }
  
  // Add general suggestions
  suggestions.push('Assess damage and determine repair timeline');
  suggestions.push('Coordinate with local authorities and emergency services');
  
  return suggestions;
};

/**
 * Load failures from database (persist across page refresh and app restart)
 * Failures are only reset via the "Resolve Failure" button
 */
export const loadFailuresFromDatabase = async () => {
  try {
    // Clear in-memory storage first
    failedFacilities.clear();
    atRiskFacilities.clear();
    
    // Load failed facilities from database
    const failed = await executeQuery(
      `SELECT id FROM infrastructure_assets WHERE status = 'failed'`
    );
    failed.forEach(f => failedFacilities.add(f.id));
    
    // Load at-risk facilities from database
    const atRisk = await executeQuery(
      `SELECT id FROM infrastructure_assets WHERE status = 'at_risk'`
    );
    atRisk.forEach(f => atRiskFacilities.add(f.id));
    
    console.log(`Loaded ${failedFacilities.size} failed and ${atRiskFacilities.size} at-risk facilities from database`);
  } catch (error) {
    console.error('Error loading failures from database:', error);
  }
};

/**
 * Resolve a single facility failure
 * @param {number} facilityId - ID of facility to resolve
 * @param {Array} allFacilities - All facilities
 * @returns {Promise<Object>} Updated facility
 */
export const resolveFacilityFailure = async (facilityId, allFacilities) => {
  try {
    console.log(`resolveFacilityFailure: Starting to resolve facility ID ${facilityId}`);
    
    // Remove from failed facilities
    failedFacilities.delete(facilityId);
    console.log(`resolveFacilityFailure: Removed facility ${facilityId} from failedFacilities set`);
    
    // Get the facility first to get its name for logging
    let facility = allFacilities.find(f => f.id === facilityId);
    if (!facility) {
      const dbFacility = await executeQuery(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (dbFacility[0]) {
        facility = dbFacility[0];
      }
    }
    
    if (!facility) {
      console.error(`resolveFacilityFailure: Facility ${facilityId} not found!`);
      throw new Error(`Facility ${facilityId} not found`);
    }
    
    console.log(`resolveFacilityFailure: Resolving ${facility.name} (ID: ${facilityId}) to operational status`);
    
    // Update facility status to operational - use parameterized query
    const updateResult = await executeWrite(
      `UPDATE infrastructure_assets 
       SET status = ? 
       WHERE id = ?`,
      ['operational', facilityId]
    );
    console.log(`resolveFacilityFailure: Update result:`, updateResult);
    
    // Wait for database write to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify the update worked
    const verifyUpdate = await executeQuery(
      'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
      [facilityId]
    );
    
    console.log(`resolveFacilityFailure: Verification - Found facility:`, verifyUpdate[0]);
    
    if (verifyUpdate[0] && verifyUpdate[0].status === 'operational') {
      console.log(`resolveFacilityFailure: ✓ SUCCESS - Verified ${facility.name} is now operational`);
    } else {
      console.error(`resolveFacilityFailure: ✗ ERROR - Status verification failed! Expected 'operational', got '${verifyUpdate[0]?.status}'`);
      // Try the update again
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['operational', facilityId]
      );
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify again
      const verifyAgain = await executeQuery(
        'SELECT status FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (verifyAgain[0]?.status === 'operational') {
        console.log(`resolveFacilityFailure: ✓ SUCCESS after retry - ${facility.name} is now operational`);
      } else {
        console.error(`resolveFacilityFailure: ✗ ERROR - Retry also failed! Status is still '${verifyAgain[0]?.status}'`);
      }
    }
    
    // Recalculate points with operational status
    const facilityUpdated = { ...facility, status: 'operational' };
    const newPoints = await calculateInterventionPoints(facilityUpdated);
    await executeWrite(
      `UPDATE infrastructure_assets 
       SET intervention_points = ? 
       WHERE id = ?`,
      [newPoints, facilityId]
    );
    
    console.log(`resolveFacilityFailure: Updated intervention points for ${facility.name} to ${newPoints}`);
    
    // Now check if any at-risk facilities should be resolved back to operational
    // An at-risk facility should go back to operational if there are no failed facilities nearby
    const MAX_RISK_DISTANCE = 50000; // 50km - same as in calculateCascadingFailures
    
    // Get all remaining failed facilities (excluding the one we just resolved)
    const allRemainingFailed = await executeQuery(
      'SELECT * FROM infrastructure_assets WHERE status = ?',
      ['failed']
    );
    
    // Get all at-risk facilities
    const allAtRisk = await executeQuery(
      'SELECT * FROM infrastructure_assets WHERE status = ?',
      ['at_risk']
    );
    
    console.log(`resolveFacilityFailure: Checking ${allAtRisk.length} at-risk facilities. ${allRemainingFailed.length} failed facilities remaining.`);
    
    // For each at-risk facility, check if there are any failed facilities nearby
    const facilitiesToResolve = [];
    
    for (const atRiskFacility of allAtRisk) {
      const atRiskLat = atRiskFacility.location_lat || atRiskFacility.lat;
      const atRiskLng = atRiskFacility.location_lng || atRiskFacility.lng;
      
      if (!atRiskLat || !atRiskLng) {
        continue; // Skip facilities without coordinates
      }
      
      // Check if there are any failed facilities within risk distance
      let hasNearbyFailed = false;
      
      for (const failedFac of allRemainingFailed) {
        const failedLat = failedFac.location_lat || failedFac.lat;
        const failedLng = failedFac.location_lng || failedFac.lng;
        
        if (!failedLat || !failedLng) {
          continue;
        }
        
        const distance = calculateDistance(
          atRiskLat,
          atRiskLng,
          failedLat,
          failedLng
        );
        
        if (distance <= MAX_RISK_DISTANCE) {
          hasNearbyFailed = true;
          console.log(`resolveFacilityFailure: ${atRiskFacility.name} is still at risk - ${failedFac.name} is ${(distance / 1000).toFixed(1)}km away`);
          break;
        }
      }
      
      // If no failed facilities nearby, this at-risk facility should be resolved
      if (!hasNearbyFailed) {
        facilitiesToResolve.push(atRiskFacility);
        console.log(`resolveFacilityFailure: ${atRiskFacility.name} has no nearby failed facilities - will be resolved to operational`);
      }
    }
    
    // Resolve all at-risk facilities that have no nearby failed facilities
    for (const facilityToResolve of facilitiesToResolve) {
      console.log(`resolveFacilityFailure: Resolving ${facilityToResolve.name} from at_risk to operational`);
      
      // Remove from at-risk facilities set
      atRiskFacilities.delete(facilityToResolve.id);
      
      // Update status to operational
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['operational', facilityToResolve.id]
      );
      
      // Recalculate points with operational status
      const resolvedFacilityUpdated = { ...facilityToResolve, status: 'operational' };
      const resolvedPoints = await calculateInterventionPoints(resolvedFacilityUpdated);
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET intervention_points = ? 
         WHERE id = ?`,
        [resolvedPoints, facilityToResolve.id]
      );
      
      console.log(`resolveFacilityFailure: ✓ Resolved ${facilityToResolve.name} to operational with ${resolvedPoints} points`);
    }
    
    if (facilitiesToResolve.length > 0) {
      console.log(`resolveFacilityFailure: Resolved ${facilitiesToResolve.length} at-risk facilities back to operational`);
    }
    
    return { ...facilityUpdated, intervention_points: newPoints };
  } catch (error) {
    console.error('Error resolving facility failure:', error);
    throw error;
  }
};

/**
 * Clear all failures (for prototype reset on app restart)
 */
export const clearAllFailures = async () => {
  try {
    // Clear in-memory storage
    failedFacilities.clear();
    atRiskFacilities.clear();
    
    // Reset all facility statuses to operational
    await executeWrite(
      `UPDATE infrastructure_assets 
       SET status = 'operational' 
       WHERE status IN ('failed', 'at_risk')`
    );
    
    // Recalculate points for all facilities
    const facilities = await executeQuery('SELECT * FROM infrastructure_assets');
    for (const facility of facilities) {
      const facilityUpdated = { ...facility, status: 'operational' };
      const newPoints = await calculateInterventionPoints(facilityUpdated);
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET intervention_points = ? 
         WHERE id = ?`,
        [newPoints, facility.id]
      );
    }
    
    console.log('All failures cleared - facilities reset to operational');
  } catch (error) {
    console.error('Error clearing failures:', error);
  }
};
