/**
 * Intervention Ranking Utility
 * Calculates intervention points based on multiple factors
 */

import { executeQuery } from '../db/database';

/**
 * Calculate intervention points for a facility
 * Points are based on:
 * - People restored
 * - Urgency (time to failure)
 * - Effort penalty (is it worth it)
 * - Cascade prevention (how many failures stop)
 * - Facility importance
 * - Facility condition
 * - Supply amount
 * - Population amount
 */
export const calculateInterventionPoints = async (facility) => {
  let points = 0;

  // Base points from facility importance
  const importanceMultiplier = {
    very_important: 5.0,
    important: 3.0,
    moderate: 1.5,
    not_important: 0.5,
  };
  points += importanceMultiplier[facility.facility_importance] || 1.5;

  // People restored (for shelters and facilities)
  if (facility.type === 'shelter') {
    const populationMultiplier = {
      very_high: 50,
      high: 30,
      medium: 15,
      low: 5,
      very_low: 1,
    };
    points += populationMultiplier[facility.population_amount] || 15;
  } else {
    // For other facilities, use population_served if available
    points += (facility.population_served || 0) * 0.1;
  }

  // Urgency (time to failure) - higher urgency = more points
  // If urgency_hours is low (imminent failure), add more points
  if (facility.urgency_hours > 0) {
    const urgencyPoints = Math.max(0, 100 - facility.urgency_hours) * 0.5;
    points += urgencyPoints;
  }

  // Facility condition - worse condition = more points (higher priority)
  const conditionMultiplier = {
    bad: 3.0,
    poor: 2.0,
    fair: 1.0,
    good: 0.5,
    excellent: 0.2,
  };
  points *= conditionMultiplier[facility.facility_condition] || 1.0;

  // Supply amount - lower supply = more points (higher priority)
  if (facility.supply_amount) {
    const supplyMultiplier = {
      very_low: 2.5,
      low: 2.0,
      medium: 1.0,
      high: 0.7,
      very_high: 0.5,
    };
    points *= supplyMultiplier[facility.supply_amount] || 1.0;
  }

  // Effort penalty - if effort is high, reduce points
  // Lower effort_penalty means easier to fix = more points
  points *= (1.0 / (facility.effort_penalty || 1.0));

  // Cascade prevention - facilities that prevent more failures get more points
  const cascadePoints = facility.cascade_prevention_count * 10;
  points += cascadePoints;

  // Status multiplier - failed or at risk facilities get priority
  const statusMultiplier = {
    failed: 2.0,
    at_risk: 1.5,
    operational: 1.0,
  };
  points *= statusMultiplier[facility.status] || 1.0;

  // Type-specific bonuses
  const typeBonus = {
    shelter: 20, // Shelters are critical
    water: 15, // Water is essential
    power: 12, // Power is important
    food: 10, // Food is important
  };
  points += typeBonus[facility.type] || 0;

  // Get cascade prevention count from dependencies
  try {
    const dependencies = await executeQuery(
      `SELECT COUNT(*) as count 
       FROM dependencies 
       WHERE depends_on_asset_id = ?`,
      [facility.id]
    );
    const cascadeCount = dependencies[0]?.count || 0;
    points += cascadeCount * 5; // Each dependent facility adds points
  } catch (error) {
    console.error('Error calculating cascade prevention:', error);
  }

  return Math.max(0, points); // Ensure non-negative
};

/**
 * Get top N facilities by intervention points
 */
export const getTopFacilities = async (limit = 10) => {
  try {
    const facilities = await executeQuery(
      `SELECT * FROM infrastructure_assets 
       ORDER BY intervention_points DESC 
       LIMIT ?`,
      [limit]
    );
    return facilities;
  } catch (error) {
    console.error('Error getting top facilities:', error);
    return [];
  }
};
