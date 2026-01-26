/**
 * User Feedback Integration Module
 * 
 * This module handles user-reported data that modifies API data.
 * User feedback takes precedence over API data for certain fields.
 * 
 * FUTURE IMPLEMENTATION:
 * - Store user feedback in local database
 * - Sync user feedback to server
 * - Merge user feedback with API data
 * - Handle conflicts between API data and user reports
 */

// In-memory storage for user feedback (will be replaced with database)
// Format: { facilityId: { field: value, timestamp: Date, userId: string } }
const userFeedbackStore = {};

/**
 * Apply user feedback to facility data
 * User feedback overrides API data for certain fields
 * 
 * @param {Object} facilityData - Original facility data from API
 * @returns {Object} Facility data with user feedback applied
 */
export const applyUserFeedback = (facilityData) => {
  if (!facilityData || !facilityData.id) {
    return facilityData;
  }
  
  const feedback = userFeedbackStore[facilityData.id];
  
  if (!feedback) {
    return facilityData; // No user feedback, return original data
  }
  
  // Create a copy to avoid mutating original
  const updatedData = { ...facilityData };
  
  // Apply user feedback (user data takes precedence)
  // Only certain fields can be modified by users
  if (feedback.facility_condition !== undefined) {
    updatedData.facility_condition = feedback.facility_condition;
  }
  
  if (feedback.supply_amount !== undefined) {
    updatedData.supply_amount = feedback.supply_amount;
  }
  
  if (feedback.population_amount !== undefined) {
    updatedData.population_amount = feedback.population_amount;
  }
  
  if (feedback.facility_importance !== undefined) {
    updatedData.facility_importance = feedback.facility_importance;
  }
  
  // Add metadata about user feedback
  updatedData._hasUserFeedback = true;
  updatedData._feedbackTimestamp = feedback.timestamp;
  
  return updatedData;
};

/**
 * Submit user feedback for a facility
 * 
 * @param {string} facilityId - Facility identifier
 * @param {Object} feedback - User feedback data
 * @param {string} feedback.facility_condition - Condition (bad, poor, fair, good, excellent)
 * @param {string} feedback.supply_amount - Supply level (very_low, low, medium, high, very_high)
 * @param {string} feedback.population_amount - Population level (very_low, low, medium, high, very_high)
 * @param {string} feedback.facility_importance - Importance (not_important, moderate, important, very_important)
 * @param {string} userId - User identifier (optional, for future sync)
 * @returns {Promise<boolean>} True if feedback was saved successfully
 */
export const submitUserFeedback = async (facilityId, feedback, userId = 'anonymous') => {
  if (!facilityId || !feedback) {
    console.error('Invalid feedback data');
    return false;
  }
  
  try {
    // Store feedback (in real implementation, save to database)
    userFeedbackStore[facilityId] = {
      ...feedback,
      timestamp: new Date().toISOString(),
      userId: userId,
    };
    
    console.log(`User feedback saved for facility ${facilityId}:`, feedback);
    
    // TODO: Sync to server when online
    // await syncUserFeedbackToServer(facilityId, feedback);
    
    return true;
  } catch (error) {
    console.error('Error saving user feedback:', error);
    return false;
  }
};

/**
 * Get user feedback for a facility
 * 
 * @param {string} facilityId - Facility identifier
 * @returns {Object|null} User feedback or null if none exists
 */
export const getUserFeedback = (facilityId) => {
  return userFeedbackStore[facilityId] || null;
};

/**
 * Clear user feedback for a facility
 * Useful for testing or when user wants to revert to API data
 * 
 * @param {string} facilityId - Facility identifier
 * @returns {boolean} True if feedback was cleared
 */
export const clearUserFeedback = (facilityId) => {
  if (userFeedbackStore[facilityId]) {
    delete userFeedbackStore[facilityId];
    return true;
  }
  return false;
};

/**
 * Get all user feedback (for debugging/admin)
 * 
 * @returns {Object} All user feedback indexed by facility ID
 */
export const getAllUserFeedback = () => {
  return { ...userFeedbackStore }; // Return copy
};

/**
 * Sync user feedback to server (future implementation)
 * This will be called when the app comes online
 * 
 * @returns {Promise<boolean>} True if sync was successful
 */
export const syncUserFeedbackToServer = async () => {
  // TODO: Implement server sync
  // 1. Get all pending feedback
  // 2. Send to server API endpoint
  // 3. Mark as synced
  // 4. Handle conflicts with server data
  
  console.log('User feedback sync to server - not yet implemented');
  return false;
};

// Export all functions
export default {
  applyUserFeedback,
  submitUserFeedback,
  getUserFeedback,
  clearUserFeedback,
  getAllUserFeedback,
  syncUserFeedbackToServer,
};
