/**
 * Report Validation Algorithm
 * Determines if user reports should affect facility intervention points
 * Prevents fake/spam reports from skewing priority rankings
 */

/**
 * Calculate severity score for a report
 * Higher severity = more likely to be valid
 */
const calculateSeverityScore = (reportData, currentFacility) => {
  let severityScore = 0;

  // Condition severity (worse condition = higher severity)
  const conditionSeverity = {
    bad: 5,
    poor: 4,
    fair: 2,
    good: 1,
    excellent: 0,
  };
  const reportedCondition = conditionSeverity[reportData.facilityCondition] || 0;
  const currentCondition = conditionSeverity[currentFacility.facility_condition] || 2;
  
  // If report indicates worse condition, add severity points
  if (reportedCondition > currentCondition) {
    severityScore += (reportedCondition - currentCondition) * 3;
  }

  // Supply amount severity (lower supply = higher severity)
  if (reportData.supplyAmount && currentFacility.supply_amount) {
    const supplySeverity = {
      very_low: 5,
      low: 4,
      medium: 2,
      high: 1,
      very_high: 0,
    };
    const reportedSupply = supplySeverity[reportData.supplyAmount] || 0;
    const currentSupply = supplySeverity[currentFacility.supply_amount] || 2;
    
    if (reportedSupply > currentSupply) {
      severityScore += (reportedSupply - currentSupply) * 2;
    }
  }

  // Population amount severity (for shelters and hospitals - higher population = higher severity)
  if (reportData.populationAmount && currentFacility.population_amount && (currentFacility.type === 'shelter' || currentFacility.type === 'hospital')) {
    const populationSeverity = {
      very_high: 5,
      high: 4,
      medium: 2,
      low: 1,
      very_low: 0,
    };
    const reportedPop = populationSeverity[reportData.populationAmount] || 0;
    const currentPop = populationSeverity[currentFacility.population_amount] || 2;
    
    if (reportedPop > currentPop) {
      severityScore += (reportedPop - currentPop) * 2;
    }
  }

  // Importance change severity
  const importanceSeverity = {
    very_important: 4,
    important: 3,
    moderate: 2,
    not_important: 1,
  };
  const reportedImportance = importanceSeverity[reportData.facilityImportance] || 2;
  const currentImportance = importanceSeverity[currentFacility.facility_importance] || 2;
  
  if (reportedImportance > currentImportance) {
    severityScore += (reportedImportance - currentImportance) * 1.5;
  }

  return severityScore;
};

/**
 * Calculate point adjustment based on validated report
 * Returns positive points if report increases urgency, negative if decreases
 */
const calculatePointAdjustment = (reportData, currentFacility) => {
  let adjustment = 0;
  const severityScore = calculateSeverityScore(reportData, currentFacility);

  // Only apply adjustments if severity score is significant (>= 3)
  // This filters out minor changes and potential spam
  if (severityScore < 3) {
    return 0; // Report doesn't significantly change urgency
  }

  // Base adjustment from severity
  adjustment += severityScore * 2;

  // Condition change adjustment
  const conditionMultiplier = {
    bad: 3.0,
    poor: 2.0,
    fair: 1.0,
    good: 0.5,
    excellent: 0.2,
  };
  const reportedCondition = reportData.facilityCondition;
  const currentCondition = currentFacility.facility_condition;
  
  if (conditionMultiplier[reportedCondition] > conditionMultiplier[currentCondition]) {
    // Worse condition reported - increase points
    const conditionDiff = conditionMultiplier[reportedCondition] - conditionMultiplier[currentCondition];
    adjustment += conditionDiff * 5;
  }

  // Supply amount adjustment
  if (reportData.supplyAmount && currentFacility.supply_amount) {
    const supplyMultiplier = {
      very_low: 2.5,
      low: 2.0,
      medium: 1.0,
      high: 0.7,
      very_high: 0.5,
    };
    const reportedSupply = reportData.supplyAmount;
    const currentSupply = currentFacility.supply_amount;
    
    if (supplyMultiplier[reportedSupply] > supplyMultiplier[currentSupply]) {
      // Lower supply reported - increase points
      const supplyDiff = supplyMultiplier[reportedSupply] - supplyMultiplier[currentSupply];
      adjustment += supplyDiff * 3;
    }
  }

  // Population adjustment (for shelters and hospitals)
  if (reportData.populationAmount && currentFacility.population_amount && (currentFacility.type === 'shelter' || currentFacility.type === 'hospital')) {
    const populationMultiplier = {
      very_high: 50,
      high: 30,
      medium: 15,
      low: 5,
      very_low: 1,
    };
    const reportedPop = reportData.populationAmount;
    const currentPop = currentFacility.population_amount;
    
    if (populationMultiplier[reportedPop] > populationMultiplier[currentPop]) {
      // Higher population reported - increase points
      const popDiff = populationMultiplier[reportedPop] - populationMultiplier[currentPop];
      adjustment += popDiff * 0.3;
    }
  }

  // Cap adjustment to prevent extreme values
  return Math.min(adjustment, 50); // Max 50 point adjustment per report
};

/**
 * Validate user report and determine if it should affect points
 * 
 * @param {Object} reportData - User report data
 * @param {Object} currentFacility - Current facility data from database
 * @returns {Object} Validation result with shouldApply and pointAdjustment
 */
export const validateUserReport = (reportData, currentFacility) => {
  if (!reportData || !currentFacility) {
    return {
      shouldApply: false,
      pointAdjustment: 0,
      reason: 'Invalid report or facility data',
    };
  }

  const severityScore = calculateSeverityScore(reportData, currentFacility);
  const pointAdjustment = calculatePointAdjustment(reportData, currentFacility);

  // Validation criteria:
  // 1. Severity score must be >= 3 (significant change)
  // 2. Point adjustment must be > 0 (increases urgency)
  // 3. Report must indicate worse conditions than current
  
  const shouldApply = severityScore >= 3 && pointAdjustment > 0;

  return {
    shouldApply,
    pointAdjustment: shouldApply ? pointAdjustment : 0,
    severityScore,
    reason: shouldApply 
      ? 'Report validated - conditions worse than current data' 
      : 'Report does not significantly increase urgency or may be invalid',
  };
};

/**
 * Get point adjustment explanation for user feedback
 */
export const getValidationExplanation = (validationResult) => {
  if (validationResult.shouldApply) {
    return `Report validated. Points increased by ${validationResult.pointAdjustment.toFixed(1)} based on severity.`;
  } else {
    return `Report received but did not significantly change priority. ${validationResult.reason}`;
  }
};
