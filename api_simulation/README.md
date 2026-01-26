# API Simulation Module

This module simulates an external API that provides facility data for the VoltEdge intervention ranking system. It serves as a proof of concept until reliable public data sources are available.

## Purpose

- **Proof of Concept**: Demonstrates how real API integration would work
- **Static Data**: Provides realistic facility data with all metrics needed for intervention ranking
- **Future-Ready**: Structured to easily integrate user feedback and real API endpoints

## Structure

```
api_simulation/
├── index.js          # Main API simulation interface
├── data.js           # Static facility data
├── userFeedback.js   # User feedback integration (future)
└── README.md         # This file
```

## Usage

```javascript
import { fetchFacilityData, fetchAllFacilities } from './api_simulation';

// Fetch data for a specific facility
const facilityData = await fetchFacilityData(facilityId);

// Fetch all facilities
const allFacilities = await fetchAllFacilities();
```

## Data Fields

Each facility includes:
- **Basic Info**: name, type, location (lat/lng)
- **Intervention Metrics**:
  - `facility_importance`: very_important, important, moderate, not_important
  - `facility_condition`: bad, poor, fair, good, excellent
  - `supply_amount`: very_low, low, medium, high, very_high (for applicable types)
  - `population_amount`: very_high, high, medium, low, very_low (for shelters)
  - `population_served`: number (for water/power/food facilities)
  - `urgency_hours`: hours until failure (0-100+)
  - `effort_penalty`: difficulty multiplier (1.0 = easy, higher = harder)
  - `cascade_prevention_count`: number of dependent facilities
  - `status`: failed, at_risk, operational

## Integration

The API simulation integrates with:
- `src/utils/dataSync.js` - Syncs API data to local database
- `src/utils/interventionRanking.js` - Uses API data to calculate points
- Future: User feedback will modify API data before point calculation

## Future Enhancements

1. **User Feedback Integration**: Allow users to report facility conditions
2. **Real API Endpoints**: Replace static data with actual API calls
3. **Caching**: Cache API responses for offline use
4. **Incremental Updates**: Only fetch changed data
5. **Conflict Resolution**: Handle conflicts between API data and user reports
