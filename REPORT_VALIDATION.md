# User Report Validation System

## Overview

When users report problems at facilities, a validation algorithm determines if the report should increase intervention points. This prevents fake/spam reports from skewing priority rankings.

## How It Works

### 1. User Submits Report
- User clicks on a facility and selects "Report Problem"
- User fills out the form (condition, supply, population, importance)
- Report is submitted

### 2. Validation Algorithm Runs
The `validateUserReport()` function in `src/utils/reportValidation.js` evaluates:

**Severity Score Calculation:**
- Compares reported values vs. current facility data
- Awards points for:
  - Worse condition reported (bad > poor > fair > good > excellent)
  - Lower supply reported (very_low > low > medium > high > very_high)
  - Higher population reported (for shelters)
  - Higher importance reported

**Validation Criteria:**
- Severity score must be >= 3 (significant change)
- Point adjustment must be > 0 (increases urgency)
- Report must indicate worse conditions than current data

### 3. Point Adjustment
If validated:
- User adjustment is added to facility's base points
- Adjustment is stored in memory (resets on app restart)
- Facility points are recalculated: `totalPoints = basePoints + userAdjustment`
- Facility ranking is updated immediately

If not validated:
- Report is saved to database
- No point adjustment is applied
- User receives explanation message

### 4. Point Calculation
When facilities load:
- Base points are calculated from API simulation data
- User adjustments are added from memory
- Total points = base + user adjustments

## Key Features

### Prototype Behavior
- **User adjustments reset on restart**: Stored in memory, cleared when app starts
- **No persistence**: Adjustments are temporary for testing

### Validation Rules
- Only reports that indicate **worse conditions** increase points
- Reports must show **significant severity** (score >= 3)
- Point adjustments are **capped at 50 points** per report
- Multiple reports can accumulate (cumulative adjustments)

### Example Scenarios

**Valid Report (Points Increase):**
- Current: condition = "good", supply = "high"
- Reported: condition = "poor", supply = "low"
- Result: ✅ Validated, +15 points added

**Invalid Report (No Points):**
- Current: condition = "poor", supply = "low"
- Reported: condition = "good", supply = "high"
- Result: ❌ Not validated (reports better conditions, doesn't increase urgency)

**Minor Change (No Points):**
- Current: condition = "good"
- Reported: condition = "fair"
- Result: ❌ Not validated (severity score too low)

## Files

- `src/utils/reportValidation.js` - Validation algorithm
- `src/utils/userPointAdjustments.js` - In-memory adjustment storage
- `src/screens/MapScreen.js` - Report submission handler

## Future Enhancements

1. **Persistent Storage**: Store adjustments in database with expiration
2. **Consensus Mechanism**: Require multiple users to agree before applying
3. **Time Decay**: Adjustments decrease over time
4. **User Reputation**: Trusted users' reports weighted higher
5. **Report History**: Track all reports per facility
6. **Admin Review**: Flag suspicious reports for manual review
