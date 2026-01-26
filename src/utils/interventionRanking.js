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

  // Validate facility object
  if (!facility || typeof facility !== 'object') {
    console.warn('calculateInterventionPoints: Invalid facility object', facility);
    return 0;
  }

  // Base points from facility importance
  const importanceMultiplier = {
    very_important: 5.0,
    important: 3.0,
    moderate: 1.5,
    not_important: 0.5,
  };
  const importance = facility.facility_importance || 'moderate';
  points += importanceMultiplier[importance] || 1.5;

  // People restored (for shelters, hospitals, and facilities)
  if (facility.type === 'shelter' || facility.type === 'hospital') {
    const populationMultiplier = {
      very_high: 50,
      high: 30,
      medium: 15,
      low: 5,
      very_low: 1,
    };
    const popAmount = facility.population_amount || 'medium';
    points += populationMultiplier[popAmount] || 15;
  } else {
    // For other facilities, use population_served if available
    const popServed = facility.population_served || 0;
    if (typeof popServed === 'number' && !isNaN(popServed)) {
      points += popServed * 0.1;
    }
  }

  // Urgency (time to failure) - higher urgency = more points
  // If urgency_hours is low (imminent failure), add more points
  const urgencyHours = facility.urgency_hours;
  if (typeof urgencyHours === 'number' && !isNaN(urgencyHours) && urgencyHours > 0) {
    const urgencyPoints = Math.max(0, 100 - urgencyHours) * 0.5;
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
  const condition = facility.facility_condition || 'fair';
  const conditionMult = conditionMultiplier[condition] || 1.0;
  if (typeof conditionMult === 'number' && !isNaN(conditionMult)) {
    points *= conditionMult;
  }

  // Supply amount - lower supply = more points (higher priority)
  if (facility.supply_amount) {
    const supplyMultiplier = {
      very_low: 2.5,
      low: 2.0,
      medium: 1.0,
      high: 0.7,
      very_high: 0.5,
    };
    const supplyMult = supplyMultiplier[facility.supply_amount] || 1.0;
    if (typeof supplyMult === 'number' && !isNaN(supplyMult)) {
      points *= supplyMult;
    }
  }

  // Effort penalty - if effort is high, reduce points
  // Lower effort_penalty means easier to fix = more points
  const effortPenalty = facility.effort_penalty || 1.0;
  if (typeof effortPenalty === 'number' && !isNaN(effortPenalty) && effortPenalty > 0) {
    points *= (1.0 / effortPenalty);
  }

  // Cascade prevention - facilities that prevent more failures get more points
  const cascadeCount = facility.cascade_prevention_count || 0;
  if (typeof cascadeCount === 'number' && !isNaN(cascadeCount)) {
    points += cascadeCount * 10;
  }

  // Status multiplier - failed or at risk facilities get VERY HIGH priority
  const statusMultiplier = {
    failed: 10.0, // Failed facilities get 10x multiplier (highest priority)
    at_risk: 5.0, // At-risk facilities get 5x multiplier (very high priority)
    operational: 1.0,
  };
  const status = facility.status || 'operational';
  const statusMult = statusMultiplier[status] || 1.0;
  if (typeof statusMult === 'number' && !isNaN(statusMult)) {
    points *= statusMult;
  }
  
  // Additional massive point boost for failed facilities
  if (status === 'failed') {
    points += 1000; // Add 1000 base points to ensure failed facilities are always top priority
  }
  
  // Additional point boost for at-risk facilities
  if (status === 'at_risk') {
    points += 500; // Add 500 base points to ensure at-risk facilities are very high priority
  }

  // Type-specific bonuses
  const typeBonus = {
    shelter: 20, // Shelters are critical
    hospital: 25, // Hospitals are most critical
    water: 15, // Water is essential
    power: 12, // Power is important
    food: 10, // Food is important
  };
  const type = facility.type || '';
  points += typeBonus[type] || 0;

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

  // Final validation - ensure points is a valid number
  const finalPoints = typeof points === 'number' && !isNaN(points) ? Math.max(0, points) : 0;
  
  if (isNaN(finalPoints) || finalPoints < 0) {
    console.warn('calculateInterventionPoints: Invalid points calculated', {
      facility: facility.name || facility.id,
      points: finalPoints,
      facility_data: facility
    });
    return 0;
  }
  
  return finalPoints;
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
