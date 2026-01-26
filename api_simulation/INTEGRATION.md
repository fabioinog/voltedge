# API Simulation Integration Guide

## Overview

The API simulation module has been integrated with the main VoltEdge application. It provides static facility data that includes all metrics needed for intervention ranking.

## Integration Points

### 1. Data Sync (`src/utils/dataSync.js`)

The `fetchPublicFacilityData()` function now uses the API simulation:

```javascript
import { fetchAllFacilities } from '../../api_simulation';

// Fetches all facilities from API simulation
const apiFacilities = await fetchAllFacilities();
```

### 2. Intervention Ranking

The API simulation data includes all fields needed for point calculation:
- `facility_importance`
- `facility_condition`
- `supply_amount`
- `population_amount`
- `population_served`
- `urgency_hours`
- `effort_penalty`
- `cascade_prevention_count`
- `status`

These are automatically used by `calculateInterventionPoints()` in `src/utils/interventionRanking.js`.

## How It Works

1. **App Starts**: Loads facilities from local database
2. **Online Sync**: When online, fetches data from API simulation
3. **Data Merge**: API data updates local database with latest metrics
4. **Point Calculation**: Intervention points are recalculated using API data
5. **Ranking**: Facilities are sorted by intervention points (highest = most urgent)

## User Feedback Integration (Future)

The `userFeedback.js` module is ready for integration:

```javascript
import { submitUserFeedback } from '../../api_simulation/userFeedback';

// User reports facility condition
await submitUserFeedback(facilityId, {
  facility_condition: 'poor',
  supply_amount: 'very_low',
  population_amount: 'high',
});
```

User feedback will override API data when calculating intervention points.

## Testing

To test the API simulation:

1. **Check API Data**: 
   ```javascript
   import { fetchAllFacilities } from './api_simulation';
   const facilities = await fetchAllFacilities();
   console.log(facilities);
   ```

2. **Verify Integration**:
   - Open the app
   - Check that facilities have intervention points
   - Verify facilities are ranked by urgency
   - Highest points = most urgent response needed

3. **Test User Feedback** (when implemented):
   ```javascript
   import { submitUserFeedback } from './api_simulation/userFeedback';
   await submitUserFeedback('api_shelter_001', {
     facility_condition: 'bad',
   });
   ```

## Next Steps

1. **Replace with Real API**: When reliable data sources are available, replace `api_simulation/index.js` with actual API calls
2. **User Feedback UI**: Add UI for users to report facility conditions
3. **Conflict Resolution**: Handle conflicts between API data and user reports
4. **Caching**: Implement better caching for offline use
5. **Incremental Updates**: Only fetch changed data instead of all facilities

## File Structure

```
api_simulation/
├── index.js          # Main API interface (integrated with dataSync.js)
├── data.js           # Static facility data
├── userFeedback.js   # User feedback system (ready for integration)
├── README.md         # Documentation
└── INTEGRATION.md    # This file
```
