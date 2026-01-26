/**
 * User Point Adjustments Manager
 * Stores user-generated point adjustments in memory (resets on restart)
 * 
 * This is a prototype implementation. In production, this would:
 * - Store in database with expiration
 * - Track report history per facility
 * - Implement consensus mechanisms (multiple users agreeing)
 * - Add time-based decay
 */

// In-memory storage for user point adjustments
// Format: { facilityId: { adjustment: number, timestamp: Date, reportCount: number } }
const userAdjustments = {};

/**
 * Get user point adjustment for a facility
 * 
 * @param {number} facilityId - Facility ID
 * @returns {number} Point adjustment (0 if none)
 */
export const getUserPointAdjustment = (facilityId) => {
  const adjustment = userAdjustments[facilityId];
  if (!adjustment) return 0;
  
  // Return the cumulative adjustment
  return adjustment.adjustment || 0;
};

/**
 * Add user point adjustment for a facility
 * 
 * @param {number} facilityId - Facility ID
 * @param {number} adjustment - Point adjustment (positive = increase, negative = decrease)
 * @param {Object} reportData - Report data for tracking
 */
export const addUserPointAdjustment = (facilityId, adjustment, reportData = {}) => {
  if (!facilityId || typeof adjustment !== 'number' || isNaN(adjustment)) {
    console.warn('Invalid adjustment data:', { facilityId, adjustment });
    return;
  }

  if (!userAdjustments[facilityId]) {
    userAdjustments[facilityId] = {
      adjustment: 0,
      reportCount: 0,
      firstReport: new Date().toISOString(),
      lastReport: new Date().toISOString(),
      reports: [],
    };
  }

  // Add to cumulative adjustment
  userAdjustments[facilityId].adjustment += adjustment;
  userAdjustments[facilityId].reportCount += 1;
  userAdjustments[facilityId].lastReport = new Date().toISOString();
  userAdjustments[facilityId].reports.push({
    adjustment,
    timestamp: new Date().toISOString(),
    reportData,
  });

  console.log(`User adjustment added for facility ${facilityId}: +${adjustment.toFixed(1)} points (total: ${userAdjustments[facilityId].adjustment.toFixed(1)})`);
};

/**
 * Get all user adjustments (for debugging/admin)
 * 
 * @returns {Object} All adjustments indexed by facility ID
 */
export const getAllUserAdjustments = () => {
  return { ...userAdjustments };
};

/**
 * Clear all user adjustments (called on app restart)
 */
export const clearAllUserAdjustments = () => {
  const count = Object.keys(userAdjustments).length;
  Object.keys(userAdjustments).forEach(key => delete userAdjustments[key]);
  console.log(`Cleared ${count} user point adjustments (app restart)`);
  return count;
};

/**
 * Clear adjustment for a specific facility
 * 
 * @param {number} facilityId - Facility ID
 */
export const clearFacilityAdjustment = (facilityId) => {
  if (userAdjustments[facilityId]) {
    delete userAdjustments[facilityId];
    return true;
  }
  return false;
};

/**
 * Get adjustment statistics
 */
export const getAdjustmentStats = () => {
  const facilities = Object.keys(userAdjustments);
  const totalAdjustment = facilities.reduce((sum, id) => {
    return sum + (userAdjustments[id].adjustment || 0);
  }, 0);
  
  return {
    facilityCount: facilities.length,
    totalAdjustment,
    averageAdjustment: facilities.length > 0 ? totalAdjustment / facilities.length : 0,
  };
};
