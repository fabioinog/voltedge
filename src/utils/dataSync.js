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
        status: 'at_risk',
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
        status: 'at_risk',
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
        status: 'at_risk',
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
        status: 'at_risk',
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
        status: 'at_risk',
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

    console.log(`Sample data initialized with ${sampleFacilities.length} facilities`);
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error; // Re-throw to let caller know initialization failed
  }
};
