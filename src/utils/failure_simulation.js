import { executeQuery, executeWrite, executeQueryToOnline, executeWriteToOnline } from '../db/database';
import { getFacilityConnections } from './facility_connections';
import { calculateInterventionPoints } from './intervention_ranking';
import { calculateDistance } from './distance';

/** Admin actions (simulate/resolve failure) always write to online DB so offline users do not see changes until they go online. */
const queryForAdmin = executeQueryToOnline;
const writeForAdmin = executeWriteToOnline;

const failedFacilities = new Set();
const atRiskFacilities = new Set();

export const getFailedFacilities = () => {
  return Array.from(failedFacilities);
};

export const getAtRiskFacilities = () => {
  return Array.from(atRiskFacilities);
};

export const isFacilityFailed = (facilityId) => {
  return failedFacilities.has(facilityId);
};

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
  
  const MAX_RISK_DISTANCE = 50000;
  
  const failedLat = failedFacility.location_lat || failedFacility.lat;
  const failedLng = failedFacility.location_lng || failedFacility.lng;
  
  if (!failedLat || !failedLng) {
    console.warn(`calculateCascadingFailures: Failed facility ${failedFacility.name} has no coordinates`);
    return [];
  }
  
  allFacilities.forEach((facility) => {
    if (facility.id === failedFacilityId) {
      return;
    }
    
    if (facility.status === 'failed') {
      return;
    }
    
    const facilityLat = facility.location_lat || facility.lat;
    const facilityLng = facility.location_lng || facility.lng;
    
    if (!facilityLat || !facilityLng) {
      return;
    }
    
    const distance = calculateDistance(
      failedLat,
      failedLng,
      facilityLat,
      facilityLng
    );
    
    if (distance <= MAX_RISK_DISTANCE) {
      atRiskIds.add(facility.id);
    }
  });
  
  return Array.from(atRiskIds);
};

export const simulateFacilityFailure = async (facilityId, allFacilities, connections) => {
  try {
    let failedFacility = allFacilities.find(f => f.id === facilityId);
    if (!failedFacility) {
      const dbFacility = await queryForAdmin(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (dbFacility[0]) {
        failedFacility = dbFacility[0];
      } else {
        throw new Error(`Facility ${facilityId} not found`);
      }
    }
    
    failedFacilities.add(facilityId);
    
    await writeForAdmin(
      `UPDATE infrastructure_assets 
       SET status = ? 
       WHERE id = ?`,
      ['failed', facilityId]
    );
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let verifyUpdate = await queryForAdmin(
      'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
      [facilityId]
    );
    
    let attempts = 0;
    while (verifyUpdate[0] && verifyUpdate[0].status !== 'failed' && attempts < 5) {
      await writeForAdmin(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['failed', facilityId]
      );
      
      await new Promise(resolve => setTimeout(resolve, 200));
      verifyUpdate = await queryForAdmin(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      attempts++;
    }
    
    const atRiskIds = calculateCascadingFailures(facilityId, allFacilities, connections);
    
    atRiskIds.forEach((id) => {
      atRiskFacilities.add(id);
    });
    
    for (const atRiskId of atRiskIds) {
      await writeForAdmin(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ? AND status != 'failed'`,
        ['at_risk', atRiskId]
      );
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const verifyAtRisk = await queryForAdmin(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [atRiskId]
      );
      
      if (verifyAtRisk[0] && verifyAtRisk[0].status !== 'at_risk') {
        await writeForAdmin(
          `UPDATE infrastructure_assets 
           SET status = ? 
           WHERE id = ?`,
          ['at_risk', atRiskId]
        );
      }
    }
    
    const failedFacilityUpdated = { ...failedFacility, status: 'failed' };
    const failedPoints = await calculateInterventionPoints(failedFacilityUpdated);
    await writeForAdmin(
      `UPDATE infrastructure_assets 
       SET intervention_points = ? 
       WHERE id = ?`,
      [failedPoints, facilityId]
    );
    
    for (const atRiskId of atRiskIds) {
      let atRiskFacility = allFacilities.find(f => f.id === atRiskId);
      if (!atRiskFacility) {
        const dbFacility = await queryForAdmin(
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
        await writeForAdmin(
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

export const resolveFacilityFailure = async (facilityId, allFacilities) => {
  try {
    failedFacilities.delete(facilityId);
    
    let facility = allFacilities.find(f => f.id === facilityId);
    if (!facility) {
      const dbFacility = await queryForAdmin(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (dbFacility[0]) {
        facility = dbFacility[0];
      }
    }
    
    if (!facility) {
      throw new Error(`Facility ${facilityId} not found`);
    }
    
    await writeForAdmin(
      `UPDATE infrastructure_assets 
       SET status = ? 
       WHERE id = ?`,
      ['operational', facilityId]
    );
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const verifyUpdate = await queryForAdmin(
      'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
      [facilityId]
    );
    
    if (verifyUpdate[0] && verifyUpdate[0].status !== 'operational') {
      await writeForAdmin(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['operational', facilityId]
      );
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const facilityUpdated = { ...facility, status: 'operational' };
    const newPoints = await calculateInterventionPoints(facilityUpdated);
    await writeForAdmin(
      `UPDATE infrastructure_assets 
       SET intervention_points = ? 
       WHERE id = ?`,
      [newPoints, facilityId]
    );
    
    const MAX_RISK_DISTANCE = 50000;
    
    const allRemainingFailed = await queryForAdmin(
      'SELECT * FROM infrastructure_assets WHERE status = ?',
      ['failed']
    );
    
    const allAtRisk = await queryForAdmin(
      'SELECT * FROM infrastructure_assets WHERE status = ?',
      ['at_risk']
    );
    
    const facilitiesToResolve = [];
    
    for (const atRiskFacility of allAtRisk) {
      const atRiskLat = atRiskFacility.location_lat || atRiskFacility.lat;
      const atRiskLng = atRiskFacility.location_lng || atRiskFacility.lng;
      
      if (!atRiskLat || !atRiskLng) {
        continue;
      }
      
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
          break;
        }
      }
      
      if (!hasNearbyFailed) {
        facilitiesToResolve.push(atRiskFacility);
      }
    }
    
    for (const facilityToResolve of facilitiesToResolve) {
      atRiskFacilities.delete(facilityToResolve.id);
      
      await writeForAdmin(
        `UPDATE infrastructure_assets 
         SET status = ? 
         WHERE id = ?`,
        ['operational', facilityToResolve.id]
      );
      
      const resolvedFacilityUpdated = { ...facilityToResolve, status: 'operational' };
      const resolvedPoints = await calculateInterventionPoints(resolvedFacilityUpdated);
      await writeForAdmin(
        `UPDATE infrastructure_assets 
         SET intervention_points = ? 
         WHERE id = ?`,
        [resolvedPoints, facilityToResolve.id]
      );
    }
    
    return { ...facilityUpdated, intervention_points: newPoints };
  } catch (error) {
    console.error('Error resolving facility failure:', error);
    throw error;
  }
};

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
