/**
 * Data Sync Utility
 * Handles offline/online synchronization with public APIs
 * Caches data for offline use
 */

import { executeQuery, executeWrite, getDatabase } from '../db/database';
import { calculateInterventionPoints } from './interventionRanking';

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
 * Fetch public data for facilities (mock API - replace with real API)
 * For now, this uses OpenStreetMap Nominatim API for location data
 * and generates sample facility data
 */
export const fetchPublicFacilityData = async (bounds) => {
  if (!isOnline()) {
    return null; // Return null if offline
  }

  try {
    // TODO: Replace with actual API calls
    // Example: OpenStreetMap Overpass API, Humanitarian Data Exchange, etc.
    
    // For now, return sample data structure
    // In production, this would call real APIs like:
    // - OpenStreetMap Overpass API for infrastructure
    // - Humanitarian Data Exchange (HDX) for Sudan data
    // - UN OCHA for emergency facilities
    
    return {
      facilities: [],
      lastUpdated: new Date().toISOString(),
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

    // Fetch and update public data
    const publicData = await fetchPublicFacilityData();
    if (publicData && publicData.facilities) {
      await updateFacilitiesFromPublicData(publicData.facilities);
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
 * Update facilities from public data
 */
const updateFacilitiesFromPublicData = async (facilities) => {
  const db = await getDatabase();

  for (const facilityData of facilities) {
    // Check if facility exists
    const existing = await executeQuery(
      'SELECT id FROM infrastructure_assets WHERE location_lat = ? AND location_lng = ?',
      [facilityData.lat, facilityData.lng]
    );

    if (existing.length > 0) {
      // Update existing facility
      await executeWrite(
        `UPDATE infrastructure_assets 
         SET name = ?, type = ?, status = ?, 
             facility_importance = ?, population_served = ?,
             water_level_forecast = ?, power_outage_detected = ?,
             last_forecast_update = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          facilityData.name,
          facilityData.type,
          facilityData.status || 'operational',
          facilityData.importance || 'moderate',
          facilityData.population || 0,
          facilityData.waterLevel,
          facilityData.powerOutage ? 1 : 0,
          existing[0].id,
        ]
      );
    } else {
      // Insert new facility
      const result = await executeWrite(
        `INSERT INTO infrastructure_assets 
         (name, type, location_lat, location_lng, status, 
          facility_importance, population_served, 
          water_level_forecast, power_outage_detected)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          facilityData.name,
          facilityData.type,
          facilityData.lat,
          facilityData.lng,
          facilityData.status || 'operational',
          facilityData.importance || 'moderate',
          facilityData.population || 0,
          facilityData.waterLevel,
          facilityData.powerOutage ? 1 : 0,
        ]
      );

      // Calculate initial intervention points
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
  }
};

/**
 * Initialize with sample data for testing
 */
export const initializeSampleData = async () => {
  try {
    const existing = await executeQuery('SELECT COUNT(*) as count FROM infrastructure_assets');
    if (existing[0]?.count > 0) {
      console.log('Sample data already exists');
      return;
    }

    // Sample facilities in Sudan
    const sampleFacilities = [
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
        name: 'Port Sudan Power Station',
        type: 'power',
        lat: 19.6158,
        lng: 37.2164,
        status: 'at_risk',
        facility_condition: 'fair',
        facility_importance: 'important',
        population_served: 500000,
      },
      {
        name: 'Emergency Shelter - Khartoum',
        type: 'shelter',
        lat: 15.5007,
        lng: 32.5599,
        status: 'operational',
        facility_condition: 'poor',
        supply_amount: 'low',
        population_amount: 'high',
        facility_importance: 'very_important',
      },
      {
        name: 'Food Distribution Center - Darfur',
        type: 'food',
        lat: 13.8293,
        lng: 25.3320,
        status: 'operational',
        facility_condition: 'fair',
        supply_amount: 'medium',
        facility_importance: 'important',
      },
    ];

    for (const facility of sampleFacilities) {
      const result = await executeWrite(
        `INSERT INTO infrastructure_assets 
         (name, type, location_lat, location_lng, status, 
          facility_condition, supply_amount, population_amount, 
          facility_importance, population_served)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          facility.name,
          facility.type,
          facility.lat,
          facility.lng,
          facility.status,
          facility.facility_condition,
          facility.supply_amount,
          facility.population_amount,
          facility.facility_importance,
          facility.population_served || 0,
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

    console.log('Sample data initialized');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};
