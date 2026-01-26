/**
 * Static Facility Data for API Simulation
 * 
 * This data simulates what a real API would return.
 * Each facility includes all metrics needed for intervention ranking.
 * 
 * Facilities are ordered by urgency (highest points = most urgent response needed)
 */

/**
 * Static facility data with realistic intervention metrics
 * This simulates data from an external organization's API
 */
export const staticFacilityData = [
  // HIGH PRIORITY - Critical Shelters
  {
    id: 'api_shelter_001',
    name: 'Khartoum Central Emergency Shelter',
    type: 'shelter',
    location_lat: 15.5007,
    location_lng: 32.5599,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'poor',
    population_amount: 'very_high', // 500+ people
    urgency_hours: 12, // Critical - will fail soon
    effort_penalty: 1.2, // Moderate effort
    cascade_prevention_count: 3, // Prevents 3 other facility failures
    population_served: 0,
    supply_amount: null, // Not applicable for shelters
  },
  {
    id: 'api_shelter_002',
    name: 'Port Sudan Refugee Camp',
    type: 'shelter',
    location_lat: 19.6158,
    location_lng: 37.2164,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'bad',
    population_amount: 'very_high', // 800+ people
    urgency_hours: 0, // Already failed
    effort_penalty: 1.5, // Higher effort needed
    cascade_prevention_count: 5,
    population_served: 0,
    supply_amount: null,
  },
  
  // HIGH PRIORITY - Critical Water Sources
  {
    id: 'api_water_001',
    name: 'Khartoum Main Water Treatment Plant',
    type: 'water',
    location_lat: 15.5500,
    location_lng: 32.6000,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'poor',
    supply_amount: 'very_low', // Critical water shortage
    population_served: 50000, // Serves 50,000 people
    urgency_hours: 18, // Will fail in 18 hours
    effort_penalty: 1.3,
    cascade_prevention_count: 8, // Many facilities depend on this
    population_amount: null,
  },
  {
    id: 'api_water_002',
    name: 'Omdurman Water Distribution Center',
    type: 'water',
    location_lat: 15.6500,
    location_lng: 32.4800,
    status: 'operational',
    facility_importance: 'important',
    facility_condition: 'fair',
    supply_amount: 'low',
    population_served: 30000,
    urgency_hours: 36,
    effort_penalty: 1.1,
    cascade_prevention_count: 4,
    population_amount: null,
  },
  {
    id: 'api_water_003',
    name: 'Khartoum North Well Station',
    type: 'water',
    location_lat: 15.6000,
    location_lng: 32.5500,
    status: 'operational',
    facility_importance: 'moderate',
    facility_condition: 'good',
    supply_amount: 'medium',
    population_served: 15000,
    urgency_hours: 72,
    effort_penalty: 1.0,
    cascade_prevention_count: 2,
    population_amount: null,
  },
  
  // HIGH PRIORITY - Critical Power Sources
  {
    id: 'api_power_001',
    name: 'Khartoum Power Station Alpha',
    type: 'power',
    location_lat: 15.5200,
    location_lng: 32.5800,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'bad',
    supply_amount: 'very_low', // No power output
    population_served: 75000, // Serves 75,000 people
    urgency_hours: 0, // Already failed
    effort_penalty: 2.0, // Very difficult to repair
    cascade_prevention_count: 12, // Many facilities depend on power
    population_amount: null,
  },
  {
    id: 'api_power_002',
    name: 'Omdurman Substation',
    type: 'power',
    location_lat: 15.6400,
    location_lng: 32.4700,
    status: 'operational',
    facility_importance: 'important',
    facility_condition: 'poor',
    supply_amount: 'low',
    population_served: 40000,
    urgency_hours: 24,
    effort_penalty: 1.4,
    cascade_prevention_count: 6,
    population_amount: null,
  },
  {
    id: 'api_power_003',
    name: 'Bahri Power Distribution Hub',
    type: 'power',
    location_lat: 15.6300,
    location_lng: 32.6200,
    status: 'operational',
    facility_importance: 'moderate',
    facility_condition: 'good',
    supply_amount: 'high',
    population_served: 25000,
    urgency_hours: 96,
    effort_penalty: 1.0,
    cascade_prevention_count: 3,
    population_amount: null,
  },
  
  // MEDIUM PRIORITY - Food Sources
  {
    id: 'api_food_001',
    name: 'Khartoum Central Food Distribution',
    type: 'food',
    location_lat: 15.5100,
    location_lng: 32.5700,
    status: 'operational',
    facility_importance: 'important',
    facility_condition: 'fair',
    supply_amount: 'low',
    population_served: 20000,
    urgency_hours: 48,
    effort_penalty: 1.2,
    cascade_prevention_count: 2,
    population_amount: null,
  },
  {
    id: 'api_food_002',
    name: 'Omdurman Food Warehouse',
    type: 'food',
    location_lat: 15.6600,
    location_lng: 32.4900,
    status: 'operational',
    facility_importance: 'moderate',
    facility_condition: 'good',
    supply_amount: 'medium',
    population_served: 12000,
    urgency_hours: 120,
    effort_penalty: 1.0,
    cascade_prevention_count: 1,
    population_amount: null,
  },
  
  // MEDIUM PRIORITY - Additional Shelters
  {
    id: 'api_shelter_003',
    name: 'Bahri Temporary Shelter',
    type: 'shelter',
    location_lat: 15.6200,
    location_lng: 32.6100,
    status: 'operational',
    facility_importance: 'important',
    facility_condition: 'fair',
    population_amount: 'high', // 200-300 people
    urgency_hours: 30,
    effort_penalty: 1.1,
    cascade_prevention_count: 1,
    population_served: 0,
    supply_amount: null,
  },
  {
    id: 'api_shelter_004',
    name: 'Khartoum South Emergency Camp',
    type: 'shelter',
    location_lat: 15.4800,
    location_lng: 32.5400,
    status: 'operational',
    facility_importance: 'moderate',
    facility_condition: 'good',
    population_amount: 'medium', // 100-200 people
    urgency_hours: 84,
    effort_penalty: 1.0,
    cascade_prevention_count: 0,
    population_served: 0,
    supply_amount: null,
  },
  
  // LOWER PRIORITY - Operational Facilities
  {
    id: 'api_water_004',
    name: 'Khartoum South Well',
    type: 'water',
    location_lat: 15.4700,
    location_lng: 32.5300,
    status: 'operational',
    facility_importance: 'moderate',
    facility_condition: 'excellent',
    supply_amount: 'very_high',
    population_served: 8000,
    urgency_hours: 200,
    effort_penalty: 0.8,
    cascade_prevention_count: 1,
    population_amount: null,
  },
  {
    id: 'api_power_004',
    name: 'Khartoum South Substation',
    type: 'power',
    location_lat: 15.4900,
    location_lng: 32.5500,
    status: 'operational',
    facility_importance: 'not_important',
    facility_condition: 'excellent',
    supply_amount: 'very_high',
    population_served: 5000,
    urgency_hours: 300,
    effort_penalty: 0.9,
    cascade_prevention_count: 0,
    population_amount: null,
  },
  {
    id: 'api_food_003',
    name: 'Khartoum North Food Market',
    type: 'food',
    location_lat: 15.5800,
    location_lng: 32.5600,
    status: 'operational',
    facility_importance: 'not_important',
    facility_condition: 'good',
    supply_amount: 'high',
    population_served: 6000,
    urgency_hours: 180,
    effort_penalty: 1.0,
    cascade_prevention_count: 0,
    population_amount: null,
  },
  
  // HIGH PRIORITY - Critical Hospitals
  {
    id: 'api_hospital_001',
    name: 'Khartoum Teaching Hospital',
    type: 'hospital',
    location_lat: 15.5007,
    location_lng: 32.5599,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'poor',
    population_amount: 'very_high', // 300+ patients
    urgency_hours: 8, // Critical - will fail soon
    effort_penalty: 1.3, // High effort needed
    cascade_prevention_count: 4, // Prevents 4 other facility failures
    population_served: 0,
    supply_amount: null, // Not applicable for hospitals
  },
  {
    id: 'api_hospital_002',
    name: 'Port Sudan General Hospital',
    type: 'hospital',
    location_lat: 19.6158,
    location_lng: 37.2164,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'bad',
    population_amount: 'very_high', // 500+ patients
    urgency_hours: 0, // Already failed
    effort_penalty: 1.6, // Very high effort needed
    cascade_prevention_count: 6,
    population_served: 0,
    supply_amount: null,
  },
  {
    id: 'api_hospital_003',
    name: 'Nyala Regional Medical Center',
    type: 'hospital',
    location_lat: 12.0500,
    location_lng: 24.8800,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'fair',
    population_amount: 'high', // 200+ patients
    urgency_hours: 24,
    effort_penalty: 1.2,
    cascade_prevention_count: 3,
    population_served: 0,
    supply_amount: null,
  },
  {
    id: 'api_hospital_004',
    name: 'El Obeid Central Hospital',
    type: 'hospital',
    location_lat: 13.1833,
    location_lng: 30.2167,
    status: 'operational',
    facility_importance: 'important',
    facility_condition: 'good',
    population_amount: 'medium', // 100+ patients
    urgency_hours: 72,
    effort_penalty: 1.0,
    cascade_prevention_count: 2,
    population_served: 0,
    supply_amount: null,
  },
  {
    id: 'api_hospital_005',
    name: 'Kassala Emergency Hospital',
    type: 'hospital',
    location_lat: 15.4500,
    location_lng: 36.4000,
    status: 'operational',
    facility_importance: 'very_important',
    facility_condition: 'poor',
    population_amount: 'high', // 250+ patients
    urgency_hours: 18,
    effort_penalty: 1.4,
    cascade_prevention_count: 4,
    population_served: 0,
    supply_amount: null,
  },
];

/**
 * Get facility data by ID
 * Simulates API endpoint: GET /api/facilities/:id
 */
export const getFacilityById = (facilityId) => {
  return staticFacilityData.find(facility => facility.id === facilityId) || null;
};

/**
 * Get all facilities
 * Simulates API endpoint: GET /api/facilities
 */
export const getAllFacilities = () => {
  return [...staticFacilityData]; // Return copy to prevent mutation
};

/**
 * Get facilities by type
 * Simulates API endpoint: GET /api/facilities?type=water
 */
export const getFacilitiesByType = (type) => {
  return staticFacilityData.filter(facility => facility.type === type);
};

/**
 * Get facilities by status
 * Simulates API endpoint: GET /api/facilities?status=failed
 */
export const getFacilitiesByStatus = (status) => {
  return staticFacilityData.filter(facility => facility.status === status);
};
