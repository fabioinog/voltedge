/**
 * Data Sync Utility
 * Handles offline/online synchronization with public APIs
 * Caches data for offline use
 */

import { executeQuery, executeWrite, getDatabase } from '../db/database';
import { calculateInterventionPoints } from './interventionRanking';
import { fetchAllFacilities } from '../../api_simulation';

/**
 * Check if device is online
 */
export const isOnline = () => {
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  return true; // Assume online if can't determine
};

/**
 * Fetch public data for facilities from API simulation
 * Uses the api_simulation module as a proof of concept
 * Future: Replace with actual API calls to real data sources
 */
export const fetchPublicFacilityData = async (bounds) => {
  if (!isOnline()) {
    console.log('Offline - using cached data');
    return null; // Return null if offline, will use cached data
  }

  try {
    // Fetch from API simulation (proof of concept)
    // Future: Replace with real API endpoints
    const apiFacilities = await fetchAllFacilities();
    
    // Transform API data to match our database schema
    // IMPORTANT: Never set status to 'failed' from API - only operational or at_risk
    // Failures should only be set through user simulation
    const facilities = apiFacilities.map(facility => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      lat: facility.location_lat,
      lng: facility.location_lng,
      // Force operational status - failures are only set through simulation
      status: facility.status === 'failed' ? 'operational' : (facility.status || 'operational'),
      facility_condition: facility.facility_condition,
      supply_amount: facility.supply_amount,
      population_amount: facility.population_amount,
      facility_importance: facility.facility_importance,
      population_served: facility.population_served || 0,
      urgency_hours: facility.urgency_hours || 0,
      effort_penalty: facility.effort_penalty || 1.0,
      cascade_prevention_count: facility.cascade_prevention_count || 0,
      // Additional fields from API
      water_level_forecast: facility.type === 'water' ? facility.supply_amount : null,
      power_outage_detected: 0, // Never set to 1 from API - only through simulation
    }));
    
    console.log(`Fetched ${facilities.length} facilities from API simulation`);
    
    return {
      facilities: facilities,
      lastUpdated: new Date().toISOString(),
      source: 'api_simulation', // Track data source
    };
  } catch (error) {
    console.error('Error fetching public facility data:', error);
    return null;
  }
};

/**
 * Sync facilities with online data
 */
export const syncFacilities = async () => {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  try {
    // Get facilities that need syncing
    const unsyncedReports = await executeQuery(
      'SELECT * FROM user_reports WHERE synced = 0'
    );

    // TODO: Upload unsynced reports to server
    // For now, just mark as synced
    for (const report of unsyncedReports) {
      await executeWrite(
        'UPDATE user_reports SET synced = 1 WHERE id = ?',
        [report.id]
      );
    }

    // Fetch and update public data from API simulation
    const publicData = await fetchPublicFacilityData();
    if (publicData && publicData.facilities && publicData.facilities.length > 0) {
      console.log(`Syncing ${publicData.facilities.length} facilities from API simulation...`);
      await updateFacilitiesFromPublicData(publicData.facilities);
      console.log('API simulation data synced successfully');
    } else {
      console.log('No API simulation data to sync');
    }

    // Update sync status
    await executeWrite(
      'UPDATE sync_status SET last_synced_at = CURRENT_TIMESTAMP, pending_changes = 0 WHERE table_name = ?',
      ['infrastructure_assets']
    );

    console.log('Sync completed');
  } catch (error) {
    console.error('Error syncing facilities:', error);
  }
};

/**
 * Update facilities from public data (API simulation)
 * Handles all fields from the API simulation including intervention metrics
 */
const updateFacilitiesFromPublicData = async (facilities) => {
  const db = await getDatabase();

  for (const facilityData of facilities) {
    // Check if facility exists (by ID from API or by location)
    let existing = null;
    if (facilityData.id) {
      existing = await executeQuery(
        'SELECT id FROM infrastructure_assets WHERE id = ?',
        [facilityData.id]
      );
    }
    
    if (!existing || existing.length === 0) {
      // Try to find by location as fallback
      existing = await executeQuery(
        'SELECT id FROM infrastructure_assets WHERE location_lat = ? AND location_lng = ?',
        [facilityData.lat, facilityData.lng]
      );
    }

    if (existing && existing.length > 0) {
      // Get current facility status - preserve 'failed' status (only set through simulation)
      // IMPORTANT: Get the FULL facility record, not just status, to ensure we have the right one
      const currentFacility = await executeQuery(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [existing[0].id]
      );
      const currentStatus = currentFacility[0]?.status || 'operational';
      
      // CRITICAL: If facility is failed or at_risk, skip the update entirely - don't overwrite it
      // at_risk status should persist as long as there's a failed facility nearby
      if (currentStatus === 'failed' || currentStatus === 'at_risk') {
        console.log(`updateFacilitiesFromPublicData: Skipping update for ${currentFacility[0]?.name || 'facility'} (ID: ${existing[0].id}) - it is in ${currentStatus} state and must be preserved`);
        continue; // Skip this facility entirely - don't update it at all
      }
      
      // Never overwrite 'failed' status from API - only allow operational or at_risk
      let newStatus = facilityData.status || 'operational';
      if (newStatus === 'failed') {
        // API should never set failed - convert to operational
        newStatus = 'operational';
      }
      
      // Update existing facility with all API data
      // BUT: Don't update status if it's already failed (we already checked, but double-check)
      const finalStatus = currentStatus === 'failed' ? 'failed' : newStatus;
      
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET name = ?, type = ?, status = ?, 
             facility_importance = ?, facility_condition = ?,
             supply_amount = ?, population_amount = ?,
             population_served = ?, urgency_hours = ?,
             effort_penalty = ?, cascade_prevention_count = ?,
             water_level_forecast = ?, power_outage_detected = ?,
             last_forecast_update = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          facilityData.name,
          facilityData.type,
          finalStatus,
          facilityData.facility_importance || 'moderate',
          facilityData.facility_condition || 'fair',
          facilityData.supply_amount || null,
          facilityData.population_amount || null,
          facilityData.population_served || 0,
          facilityData.urgency_hours || 0,
          facilityData.effort_penalty || 1.0,
          facilityData.cascade_prevention_count || 0,
          facilityData.water_level_forecast || null,
          facilityData.power_outage_detected || 0,
          existing[0].id,
        ]
      );
      
      // Recalculate intervention points after update
      const updatedFacility = await executeQuery(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [existing[0].id]
      );
      if (updatedFacility[0]) {
        const points = await calculateInterventionPoints(updatedFacility[0]);
        await executeWrite(
          'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
          [points, existing[0].id]
        );
      }
    } else {
      // Insert new facility with all API data
      const result = await executeWrite(
        `INSERT INTO infrastructure_assets 
         (id, name, type, location_lat, location_lng, status, 
          facility_importance, facility_condition,
          supply_amount, population_amount, population_served,
          urgency_hours, effort_penalty, cascade_prevention_count,
          water_level_forecast, power_outage_detected)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          facilityData.id || null, // Use API ID if available
          facilityData.name,
          facilityData.type,
          facilityData.lat,
          facilityData.lng,
          facilityData.status || 'operational',
          facilityData.facility_importance || 'moderate',
          facilityData.facility_condition || 'fair',
          facilityData.supply_amount || null,
          facilityData.population_amount || null,
          facilityData.population_served || 0,
          facilityData.urgency_hours || 0,
          facilityData.effort_penalty || 1.0,
          facilityData.cascade_prevention_count || 0,
          facilityData.water_level_forecast || null,
          facilityData.power_outage_detected || 0,
        ]
      );

      // Calculate initial intervention points
      const facilityId = result.lastInsertRowId || facilityData.id;
      const newFacility = await executeQuery(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [facilityId]
      );
      if (newFacility[0]) {
        const points = await calculateInterventionPoints(newFacility[0]);
        await executeWrite(
          'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
          [points, facilityId]
        );
      }
    }
  }
};

/**
 * Fix any facilities that have 'failed' or 'at_risk' status in the database
 * This ensures all facilities start as 'operational' by default
 */
export const fixFacilityStatuses = async () => {
  try {
    console.log('fixFacilityStatuses: Starting to fix facility statuses...');
    
    // First, get all facilities and filter for failed/at_risk status
    // (web database doesn't support WHERE IN, so we query all and filter)
    const allFacilities = await executeQuery(
      `SELECT id, name, status FROM infrastructure_assets`
    );
    
    const failedFacilities = allFacilities.filter(f => 
      f.status === 'failed' || f.status === 'at_risk'
    );
    
    if (failedFacilities.length > 0) {
      console.log(`fixFacilityStatuses: Found ${failedFacilities.length} facilities with failed/at_risk status:`, 
        failedFacilities.map(f => `${f.name} (${f.status})`).join(', '));
    } else {
      console.log('fixFacilityStatuses: No facilities need fixing - all are operational');
      return; // Early return if nothing to fix
    }
    
    // Update each facility individually (web database requires WHERE id = ?)
    const { calculateInterventionPoints } = await import('./interventionRanking');
    let fixedCount = 0;
    
    for (const facility of failedFacilities) {
      try {
        // Update status to operational
        await executeWrite(
          `UPDATE infrastructure_assets 
           SET status = ? 
           WHERE id = ?`,
          ['operational', facility.id]
        );
        
        // Get the updated facility to recalculate points
        const updatedFacility = await executeQuery(
          'SELECT * FROM infrastructure_assets WHERE id = ?',
          [facility.id]
        );
        
        if (updatedFacility[0]) {
          // Recalculate points with operational status
          const newPoints = await calculateInterventionPoints(updatedFacility[0]);
          await executeWrite(
            `UPDATE infrastructure_assets 
             SET intervention_points = ? 
             WHERE id = ?`,
            [newPoints, facility.id]
          );
          fixedCount++;
          console.log(`fixFacilityStatuses: Fixed ${facility.name} - reset to operational, points recalculated`);
        }
      } catch (facilityError) {
        console.error(`fixFacilityStatuses: Error fixing ${facility.name}:`, facilityError);
      }
    }
    
    console.log(`fixFacilityStatuses: Fixed ${fixedCount} out of ${failedFacilities.length} facilities`);
    
    // Verify the fix worked
    const allFacilitiesAfter = await executeQuery(
      `SELECT id, name, status FROM infrastructure_assets`
    );
    const stillFailed = allFacilitiesAfter.filter(f => 
      f.status === 'failed' || f.status === 'at_risk'
    );
    
    if (stillFailed.length > 0) {
      console.warn(`fixFacilityStatuses: WARNING - ${stillFailed.length} facilities still have failed/at_risk status after fix:`, 
        stillFailed.map(f => `${f.name} (${f.status})`).join(', '));
    } else {
      console.log('fixFacilityStatuses: Verification passed - all facilities are operational');
    }
  } catch (error) {
    console.error('fixFacilityStatuses: Error fixing facility statuses:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

/**
 * Initialize with sample data for testing
 */
export const initializeSampleData = async () => {
  try {
    // NOTE: fixFacilityStatuses() is NOT called here anymore
    // Failures should persist across page refreshes and only be reset via "Resolve Failure" button
    
    // Check if we can query the database
    let existing;
    try {
      existing = await executeQuery('SELECT COUNT(*) as count FROM infrastructure_assets');
    } catch (queryError) {
      console.warn('Could not query database, may be using IndexedDB fallback:', queryError);
      // For IndexedDB, the query might fail - try a different approach
      existing = [{ count: 0 }];
    }
    
    // If we have data but less than 30 facilities, clear and reinitialize
    const count = existing && existing[0]?.count ? existing[0].count : 0;
    if (count > 0 && count < 30) {
      console.log(`Found ${count} facilities, clearing to reinitialize with 30 facilities...`);
      try {
        // Clear all existing facilities
        await executeWrite('DELETE FROM infrastructure_assets');
        console.log('Cleared existing facilities');
        // Also clear related data
        try {
          await executeWrite('DELETE FROM dependencies');
          await executeWrite('DELETE FROM failure_events');
          await executeWrite('DELETE FROM interventions');
          await executeWrite('DELETE FROM user_reports');
        } catch (clearError) {
          console.warn('Could not clear related tables:', clearError);
        }
      } catch (deleteError) {
        console.warn('Could not clear existing facilities:', deleteError);
        // Try to continue anyway - might be able to insert
      }
    } else if (count >= 30) {
      console.log(`Sample data already exists with ${count} facilities`);
      // NOTE: fixFacilityStatuses() is NOT called here anymore
      // Failures should persist across page refreshes
      return;
    }

    // Sample facilities in Sudan - based on real cities and towns
    const sampleFacilities = [
      // Khartoum (Capital) - 15.5007°N, 32.5599°E
      {
        name: 'Khartoum Water Treatment Plant',
        type: 'water',
        lat: 15.5007,
        lng: 32.5599,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'very_important',
        population_served: 5000000,
      },
      {
        name: 'Khartoum Power Grid Station',
        type: 'power',
        lat: 15.5100,
        lng: 32.5700,
        status: 'operational',
        facility_condition: 'good',
        facility_importance: 'very_important',
        population_served: 5000000,
      },
      {
        name: 'Emergency Shelter - Khartoum North',
        type: 'shelter',
        lat: 15.5200,
        lng: 32.5800,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      {
        name: 'Food Distribution Center - Khartoum',
        type: 'food',
        lat: 15.4900,
        lng: 32.5500,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'important',
      },
      
      // Port Sudan - 19.6158°N, 37.2164°E
      {
        name: 'Port Sudan Power Station',
        type: 'power',
        lat: 19.6158,
        lng: 37.2164,
        status: 'operational',
        facility_condition: 'fair',
        facility_importance: 'important',
        population_served: 500000,
      },
      {
        name: 'Port Sudan Water Supply',
        type: 'water',
        lat: 19.6250,
        lng: 37.2250,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'important',
        population_served: 500000,
      },
      
      // Nyala (Darfur) - 12.0500°N, 24.8800°E
      {
        name: 'Nyala Emergency Shelter',
        type: 'shelter',
        lat: 12.0500,
        lng: 24.8800,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'very_high',
        facility_importance: 'very_important',
      },
      {
        name: 'Nyala Food Distribution',
        type: 'food',
        lat: 12.0600,
        lng: 24.8900,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'important',
      },
      {
        name: 'Nyala Water Well',
        type: 'water',
        lat: 12.0400,
        lng: 24.8700,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'low',
        facility_importance: 'very_important',
        population_served: 200000,
      },
      
      // El Obeid - 13.1833°N, 30.2167°E
      {
        name: 'El Obeid Power Plant',
        type: 'power',
        lat: 13.1833,
        lng: 30.2167,
        status: 'operational',
        facility_condition: 'good',
        facility_importance: 'important',
        population_served: 400000,
      },
      {
        name: 'El Obeid Water Treatment',
        type: 'water',
        lat: 13.1900,
        lng: 30.2200,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'important',
        population_served: 400000,
      },
      
      // Kassala - 15.4500°N, 36.4000°E
      {
        name: 'Kassala Power Grid',
        type: 'power',
        lat: 15.4500,
        lng: 36.4000,
        status: 'operational',
        facility_condition: 'fair',
        facility_importance: 'moderate',
        population_served: 300000,
      },
      {
        name: 'Kassala Water Source',
        type: 'water',
        lat: 15.4600,
        lng: 36.4100,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'medium',
        facility_importance: 'important',
        population_served: 300000,
      },
      
      // Gedaref - 14.0333°N, 35.3833°E
      {
        name: 'Gedaref Food Storage',
        type: 'food',
        lat: 14.0333,
        lng: 35.3833,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'important',
      },
      {
        name: 'Gedaref Water Supply',
        type: 'water',
        lat: 14.0400,
        lng: 35.3900,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'moderate',
        population_served: 250000,
      },
      
      // Kosti - 13.1667°N, 32.6667°E
      {
        name: 'Kosti Power Station',
        type: 'power',
        lat: 13.1667,
        lng: 32.6667,
        status: 'operational',
        facility_condition: 'fair',
        facility_importance: 'moderate',
        population_served: 200000,
      },
      {
        name: 'Kosti Emergency Shelter',
        type: 'shelter',
        lat: 13.1700,
        lng: 32.6700,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'medium',
        facility_importance: 'important',
      },
      
      // Al-Fashir (Darfur) - 13.6167°N, 25.3500°E
      {
        name: 'Al-Fashir Shelter Complex',
        type: 'shelter',
        lat: 13.6167,
        lng: 25.3500,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'very_low',
        population_amount: 'very_high',
        facility_importance: 'very_important',
      },
      {
        name: 'Al-Fashir Food Aid Center',
        type: 'food',
        lat: 13.6200,
        lng: 25.3600,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'low',
        facility_importance: 'very_important',
      },
      
      // Geneina (West Darfur) - 13.4500°N, 22.4500°E
      {
        name: 'Geneina Emergency Shelter',
        type: 'shelter',
        lat: 13.4500,
        lng: 22.4500,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      {
        name: 'Geneina Water Well',
        type: 'water',
        lat: 13.4600,
        lng: 22.4600,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'low',
        facility_importance: 'very_important',
        population_served: 150000,
      },
      
      // Dongola - 19.1667°N, 30.4833°E
      {
        name: 'Dongola Power Grid',
        type: 'power',
        lat: 19.1667,
        lng: 30.4833,
        status: 'operational',
        facility_condition: 'good',
        facility_importance: 'moderate',
        population_served: 100000,
      },
      {
        name: 'Dongola Water Treatment',
        type: 'water',
        lat: 19.1700,
        lng: 30.4900,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'moderate',
        population_served: 100000,
      },
      
      // Atbara - 17.7000°N, 33.9667°E
      {
        name: 'Atbara Power Station',
        type: 'power',
        lat: 17.7000,
        lng: 33.9667,
        status: 'operational',
        facility_condition: 'good',
        facility_importance: 'important',
        population_served: 150000,
      },
      {
        name: 'Atbara Water Supply',
        type: 'water',
        lat: 17.7100,
        lng: 33.9700,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'important',
        population_served: 150000,
      },
      
      // Shendi - 16.6833°N, 33.4333°E
      {
        name: 'Shendi Power Grid',
        type: 'power',
        lat: 16.6833,
        lng: 33.4333,
        status: 'operational',
        facility_condition: 'fair',
        facility_importance: 'moderate',
        population_served: 120000,
      },
      {
        name: 'Shendi Food Distribution',
        type: 'food',
        lat: 16.6900,
        lng: 33.4400,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'moderate',
      },
      
      // Kadugli (South Kordofan) - 11.0167°N, 29.7167°E
      {
        name: 'Kadugli Water Treatment',
        type: 'water',
        lat: 11.0167,
        lng: 29.7167,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'important',
        population_served: 180000,
      },
      {
        name: 'Kadugli Emergency Shelter',
        type: 'shelter',
        lat: 11.0200,
        lng: 29.7200,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      
      // Singa (Sennar) - 13.1500°N, 33.9333°E
      {
        name: 'Singa Power Grid',
        type: 'power',
        lat: 13.1500,
        lng: 33.9333,
        status: 'operational',
        facility_condition: 'good',
        facility_importance: 'moderate',
        population_served: 100000,
      },
      
      // Ed Damazin (Blue Nile) - 11.7833°N, 34.3500°E
      {
        name: 'Ed Damazin Water Plant',
        type: 'water',
        lat: 11.7833,
        lng: 34.3500,
        status: 'operational',
        facility_condition: 'good',
        supply_amount: 'high',
        facility_importance: 'important',
        population_served: 200000,
      },
      
      // Rabak (White Nile) - 13.1500°N, 32.7333°E
      {
        name: 'Rabak Emergency Shelter',
        type: 'shelter',
        lat: 13.1500,
        lng: 32.7333,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'medium',
        facility_importance: 'important',
      },
      
      // El Daein (East Darfur) - 11.4667°N, 26.1333°E
      {
        name: 'El Daein Food Aid Center',
        type: 'food',
        lat: 11.4667,
        lng: 26.1333,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'low',
        facility_importance: 'very_important',
      },
      
      // Zalingei (Central Darfur) - 12.9000°N, 23.4833°E
      {
        name: 'Zalingei Shelter Complex',
        type: 'shelter',
        lat: 12.9000,
        lng: 23.4833,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'very_low',
        population_amount: 'very_high',
        facility_importance: 'very_important',
      },
      
      // Hospitals throughout Sudan
      {
        name: 'Khartoum Teaching Hospital',
        type: 'hospital',
        lat: 15.5007,
        lng: 32.5599,
        status: 'operational',
        facility_condition: 'poor',
        population_amount: 'very_high',
        facility_importance: 'very_important',
      },
      {
        name: 'Port Sudan General Hospital',
        type: 'hospital',
        lat: 19.6158,
        lng: 37.2164,
        status: 'operational',
        facility_condition: 'bad',
        population_amount: 'very_high',
        facility_importance: 'very_important',
      },
      {
        name: 'Nyala Regional Medical Center',
        type: 'hospital',
        lat: 12.0500,
        lng: 24.8800,
        status: 'operational',
        facility_condition: 'fair',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      {
        name: 'El Obeid Central Hospital',
        type: 'hospital',
        lat: 13.1833,
        lng: 30.2167,
        status: 'operational',
        facility_condition: 'good',
        population_amount: 'medium',
        facility_importance: 'important',
      },
      {
        name: 'Kassala Emergency Hospital',
        type: 'hospital',
        lat: 15.4500,
        lng: 36.4000,
        status: 'operational',
        facility_condition: 'poor',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      {
        name: 'Gedaref Medical Facility',
        type: 'hospital',
        lat: 14.0333,
        lng: 35.3833,
        status: 'operational',
        facility_condition: 'good',
        population_amount: 'medium',
        facility_importance: 'important',
      },
      {
        name: 'Kosti General Hospital',
        type: 'hospital',
        lat: 13.1667,
        lng: 32.6667,
        status: 'operational',
        facility_condition: 'fair',
        population_amount: 'medium',
        facility_importance: 'moderate',
      },
      {
        name: 'Al-Fashir Medical Center',
        type: 'hospital',
        lat: 13.6333,
        lng: 25.3500,
        status: 'operational',
        facility_condition: 'poor',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
    ];

    for (const facility of sampleFacilities) {
      const result = await executeWrite(
        `INSERT INTO infrastructure_assets 
         (name, type, location_lat, location_lng, status, 
          facility_condition, supply_amount, population_amount, 
          facility_importance, population_served,
          urgency_hours, effort_penalty, cascade_prevention_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          facility.name,
          facility.type,
          facility.lat,
          facility.lng,
          facility.status || 'operational',
          facility.facility_condition || 'fair',
          facility.supply_amount || null,
          facility.population_amount || null,
          facility.facility_importance || 'moderate',
          facility.population_served || 0,
          facility.urgency_hours || 100, // Default: 100 hours (not urgent)
          facility.effort_penalty || 1.0, // Default: normal effort
          facility.cascade_prevention_count || 0, // Default: no cascade prevention
        ]
      );

      // Calculate intervention points
      if (result.lastInsertRowId) {
        const newFacility = await executeQuery(
          'SELECT * FROM infrastructure_assets WHERE id = ?',
          [result.lastInsertRowId]
        );
        if (newFacility[0]) {
          const points = await calculateInterventionPoints(newFacility[0]);
          await executeWrite(
            'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
            [points, result.lastInsertRowId]
          );
        }
      }
    }

    console.log(`Sample data initialized with ${sampleFacilities.length} facilities`);
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error; // Re-throw to let caller know initialization failed
  }
};
