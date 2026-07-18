# Implementation Plan: Scan Engagement Gate

## Overview

This plan implements a dual-gate eligibility system for follow-up X-ray scans. The existing time-only gate (≥12 weeks) is extended with an engagement condition (≥10 weekly check-ins). Changes span the backend gate service, two routers (progress and prediction), and the frontend dashboard scan widget.

## Tasks

- [ ] 1. Implement Gate Service dual-gate logic
  - [ ] 1.1 Add XrayEligibilityStatus dataclass and constants to gate_service.py
    - Add `from dataclasses import dataclass` import
    - Define `REQUIRED_WEEKS = 12` and `REQUIRED_CHECKINS = 10` constants
    - Create `XrayEligibilityStatus` dataclass with fields: eligible, time_eligible, engagement_eligible, weeks_elapsed, weeks_remaining, checkins_completed, checkins_required, checkins_remaining
    - _Requirements: 2.1, 2.5, 2.9_

  - [ ] 1.2 Implement get_checkin_count function in gate_service.py
    - Add `get_checkin_count(user_id: str, db: Session) -> int` function
    - Execute `SELECT COUNT(*) FROM weekly_checkins WHERE user_id = :uid` query
    - Return 0 if query returns None
    - Wrap query in try/except to handle database errors (fail closed — return 0 on error)
    - _Requirements: 1.5, 2.4, 6.1, 6.4_

  - [ ] 1.3 Implement get_xray_eligibility_status function in gate_service.py
    - Add `get_xray_eligibility_status(onboarding_date: datetime, user_id: str, db: Session) -> XrayEligibilityStatus` function
    - Call `weeks_since_onboarding(onboarding_date)` for time evaluation
    - Call `get_checkin_count(user_id, db)` for engagement evaluation
    - Compute all fields: time_eligible, engagement_eligible, eligible (AND gate), weeks_remaining, checkins_remaining
    - Round weeks_elapsed and weeks_remaining to 1 decimal place
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.6, 2.7, 2.8, 2.9, 6.3_

  - [ ] 1.4 Update is_xray_eligible signature to accept (onboarding_date, user_id, db)
    - Change signature from `is_xray_eligible(onboarding_date: datetime)` to `is_xray_eligible(onboarding_date: datetime, user_id: str, db: Session) -> bool`
    - Implement by calling `get_xray_eligibility_status()` and returning `.eligible`
    - Remove the old implementation that only checked weeks >= 0
    - _Requirements: 7.1, 7.5_

  - [ ]* 1.5 Write property tests for gate service eligibility logic
    - **Property 1: Dual-Gate Conjunction** — For any weeks_elapsed ∈ [0, 52] and checkins_completed ∈ [0, 12], eligible == (weeks_elapsed >= 12 AND checkins_completed >= 10)
    - **Property 3: Remaining Counts Formula** — weeks_remaining == max(0, 12 - weeks_elapsed) AND checkins_remaining == max(0, 10 - checkins_completed)
    - **Property 4: Helper Function Agreement** — is_xray_eligible returns same value as get_xray_eligibility_status().eligible
    - Use Hypothesis library for property-based testing
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.2, 2.3, 7.1**

  - [ ]* 1.6 Write unit tests for get_checkin_count
    - **Property 2: Check-in Count Accuracy** — For N rows inserted, get_checkin_count returns exactly N
    - Test with 0, 5, 10, 12 check-in records
    - Test with invalid user_id returns 0
    - **Validates: Requirements 1.5**

- [ ] 2. Checkpoint - Ensure gate service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Update Progress Router with engagement data
  - [ ] 3.1 Update imports in progress.py for new gate service functions
    - Add `get_xray_eligibility_status` to the import from `services.gate_service`
    - Remove the standalone `is_xray_eligible` call (replaced by eligibility status object)
    - _Requirements: 7.3, 7.5_

  - [ ] 3.2 Update /summary/{user_id} endpoint to include engagement fields
    - Call `get_xray_eligibility_status(profile.onboarding_date, user_id, db)` instead of the old `is_xray_eligible(profile.onboarding_date)`
    - Replace `xray_ok` computation with eligibility status object
    - Add new response fields: xray_checkins_completed, xray_checkins_required, xray_engagement_met, xray_time_met
    - Set xray_unlocked from `eligibility.eligible`
    - Maintain all existing response fields with unchanged semantics (xp, streak_current, chart_unlocked, chart_days_remaining, xray_weeks_elapsed, xray_weeks_remaining, pain_chart)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.3 Write unit tests for updated /summary endpoint
    - Test response includes all new engagement fields
    - Test xray_unlocked is true only when both gates pass
    - Test with zero check-ins returns xray_checkins_completed=0 and xray_engagement_met=false
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 4. Update Prediction Router gate enforcement
  - [ ] 4.1 Update imports in prediction.py for new gate service functions
    - Add `get_xray_eligibility_status` to imports from `services.gate_service`
    - Keep `is_xray_eligible` import (updated signature)
    - Remove `weeks_since_onboarding` import (no longer needed directly)
    - _Requirements: 7.2, 7.5_

  - [ ] 4.2 Update /predict endpoint gate check with richer 403 response
    - Change `is_xray_eligible(profile.onboarding_date)` call to `is_xray_eligible(profile.onboarding_date, user_id, db)`
    - When not eligible, call `get_xray_eligibility_status()` to build detailed 403 response
    - Return 403 JSON detail with: error, message, time_met, engagement_met, weeks_remaining, checkins_completed, checkins_required
    - When eligible, proceed to prediction as before (no blocking)
    - If user_id is not provided or profile not found, skip gate evaluation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.3 Write unit tests for prediction endpoint gate behavior
    - Test 403 returned when time not met
    - Test 403 returned when engagement not met
    - Test 403 detail contains all required fields (time_met, engagement_met, weeks_remaining, checkins_completed, checkins_required)
    - Test prediction proceeds when both gates satisfied
    - Test gate skipped when user_id not provided
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 5. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update Frontend Scan Status Widget
  - [ ] 6.1 Update DailyActionDashboard.tsx to fetch and store engagement data
    - Add state for scan eligibility data (xray_checkins_completed, xray_checkins_required, xray_engagement_met, xray_time_met, xray_weeks_elapsed, xray_weeks_remaining)
    - Update the existing summary API fetch to capture the new engagement fields from the response
    - Replace the simple `daysUntilNextScan` calculation with data from the API response
    - _Requirements: 5.1, 5.2_

  - [ ] 6.2 Update scan widget to show dual-gate progress display
    - Replace the single "Days to Scan" stat with a dual-progress widget
    - Show time progress: "Week X of 12" with proportional progress bar
    - Show check-in progress: "Y of 10 check-ins" with proportional progress bar
    - Display green check or completion indicator when each condition is satisfied
    - When both conditions met, show "Scan Unlocked" state with enabled visual affordance
    - When time unmet, display remaining weeks alongside time progress
    - When engagement unmet, display remaining check-ins alongside check-in progress
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.3 Write unit tests for scan widget rendering states
    - Test locked state with both conditions unmet shows both progress bars
    - Test partially met (time met, engagement not) shows correct indicators
    - Test partially met (engagement met, time not) shows correct indicators
    - Test fully unlocked state shows enabled scan button
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `is_xray_eligible` signature change is a breaking change — tasks 1.4, 3.1/3.2, and 4.1/4.2 must all be applied together to avoid runtime errors
- No database schema changes needed — the existing `weekly_checkins` table already supports this feature
- The design uses Python (backend) and TypeScript/React (frontend) — both are used in their respective tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["1.5", "1.6"] },
    { "id": 4, "tasks": ["3.1", "4.1"] },
    { "id": 5, "tasks": ["3.2", "4.2"] },
    { "id": 6, "tasks": ["3.3", "4.3", "6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["6.3"] }
  ]
}
```
