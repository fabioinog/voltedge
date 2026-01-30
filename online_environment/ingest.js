/**
 * Simulated "online" environment: API data is sent only to the online database.
 * This module writes facility data from the API simulation into the online DB only.
 */

import { fetchAllFacilities } from '../api_simulation';
import { executeQueryToOnline, executeWriteToOnline } from '../src/db/database';
import { calculateInterventionPoints } from '../src/utils/intervention_ranking';

const normalizeFacility = (facility) => ({
  name: facility.name,
  type: facility.type,
  lat: facility.location_lat ?? facility.lat,
  lng: facility.location_lng ?? facility.lng,
  status: facility.status === 'failed' ? 'operational' : (facility.status || 'operational'),
  facility_condition: facility.facility_condition || 'fair',
  supply_amount: facility.supply_amount ?? null,
  population_amount: facility.population_amount ?? null,
  facility_importance: facility.facility_importance || 'moderate',
  population_served: facility.population_served || 0,
  urgency_hours: facility.urgency_hours ?? 0,
  effort_penalty: facility.effort_penalty ?? 1.0,
  cascade_prevention_count: facility.cascade_prevention_count ?? 0,
  water_level_forecast: facility.type === 'water' ? facility.supply_amount : facility.water_level_forecast ?? null,
  power_outage_detected: 0,
});

/**
 * Ingest facility data from the API simulation into the online database only.
 * Call when user is "online" to simulate the API updating the server.
 */
export const ingestFromApi = async () => {
  try {
    const apiFacilities = await fetchAllFacilities();
    const facilities = apiFacilities.map(normalizeFacility);

    for (const f of facilities) {
      let existing = await executeQueryToOnline(
        'SELECT id FROM infrastructure_assets WHERE location_lat = ? AND location_lng = ?',
        [f.lat, f.lng]
      );
      if (existing && existing.length > 0) {
        await executeWriteToOnline(
          `UPDATE infrastructure_assets 
           SET name = ?, type = ?, status = ?, facility_importance = ?, facility_condition = ?,
               supply_amount = ?, population_amount = ?, population_served = ?, urgency_hours = ?,
               effort_penalty = ?, cascade_prevention_count = ?, water_level_forecast = ?, power_outage_detected = ?
           WHERE id = ?`,
          [
            f.name,
            f.type,
            f.status,
            f.facility_importance,
            f.facility_condition,
            f.supply_amount,
            f.population_amount,
            f.population_served,
            f.urgency_hours,
            f.effort_penalty,
            f.cascade_prevention_count,
            f.water_level_forecast,
            f.power_outage_detected,
            existing[0].id,
          ]
        );
        const updated = await executeQueryToOnline('SELECT * FROM infrastructure_assets WHERE id = ?', [existing[0].id]);
        if (updated && updated[0]) {
          const points = await calculateInterventionPoints(updated[0]);
          await executeWriteToOnline('UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?', [points, existing[0].id]);
        }
      } else {
        await executeWriteToOnline(
          `INSERT INTO infrastructure_assets 
           (name, type, location_lat, location_lng, status, facility_condition, supply_amount, population_amount,
            facility_importance, population_served, urgency_hours, effort_penalty, cascade_prevention_count,
            water_level_forecast, power_outage_detected)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            f.name,
            f.type,
            f.lat,
            f.lng,
            f.status,
            f.facility_condition,
            f.supply_amount,
            f.population_amount,
            f.facility_importance,
            f.population_served,
            f.urgency_hours,
            f.effort_penalty,
            f.cascade_prevention_count,
            f.water_level_forecast,
            f.power_outage_detected,
          ]
        );
        const all = await executeQueryToOnline('SELECT * FROM infrastructure_assets ORDER BY id DESC LIMIT 1', []);
        if (all && all[0]) {
          const points = await calculateInterventionPoints(all[0]);
          await executeWriteToOnline('UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?', [points, all[0].id]);
        }
      }
    }
    await executeWriteToOnline(
      'UPDATE sync_status SET last_synced_at = CURRENT_TIMESTAMP, pending_changes = 0 WHERE table_name = ?',
      ['infrastructure_assets']
    );
    console.log(`Ingested ${facilities.length} facilities into online DB (simulated API → online only).`);
  } catch (error) {
    console.error('ingestFromApi error:', error);
    throw error;
  }
};
