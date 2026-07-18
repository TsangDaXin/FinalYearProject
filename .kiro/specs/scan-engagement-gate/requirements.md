# Requirements Document

## Introduction

This document specifies the requirements for the Scan Engagement Gate feature in SteadyGerak. The feature adds a second eligibility condition to the follow-up X-ray scan unlock logic. Currently, scan eligibility is determined solely by time elapsed (≥12 weeks since onboarding). This feature introduces an engagement requirement: the user must have completed at least 10 out of 12 weekly check-ins before the scan becomes available. Both conditions (time AND engagement) must be satisfied simultaneously.

## Glossary

- **Gate_Service**: The backend service module (`gate_service.py`) responsible for evaluating X-ray scan eligibility conditions.
- **Progress_Router**: The backend router (`progress.py`) that serves the `/summary/{user_id}` dashboard endpoint.
- **Prediction_Router**: The backend router (`prediction.py`) that handles X-ray upload and inference via the `/predict` endpoint.
- **Scan_Widget**: The frontend React component on the dashboard that displays scan eligibility status to the user.
- **Eligibility_Status**: A structured data object containing the evaluation results of both time and engagement conditions.
- **Weekly_Checkin**: A record in the `weekly_checkins` table representing a completed weekly rehabilitation check-in by a user.
- **Engagement_Threshold**: The minimum number of weekly check-ins required for scan eligibility (10 out of 12).
- **Time_Threshold**: The minimum number of weeks since onboarding required for scan eligibility (12 weeks).

## Requirements

### Requirement 1: Dual-Gate Eligibility Evaluation

**User Story:** As a rehabilitation platform, I want to evaluate X-ray scan eligibility based on both time elapsed and engagement level, so that users must actively participate in their program before receiving a follow-up scan.

#### Acceptance Criteria

1. WHEN evaluating X-ray eligibility for a user, THE Gate_Service SHALL return eligible status as true only when both conditions are satisfied: elapsed days since the user's onboarding_date divided by 7 is greater than or equal to 12, and the count of rows in the `weekly_checkins` table for that user_id is greater than or equal to 10
2. WHEN the time condition is not met (elapsed days since onboarding_date divided by 7 is less than 12), THE Gate_Service SHALL return eligible status as false regardless of the check-in count
3. WHEN the engagement condition is not met (count of rows in `weekly_checkins` for the user is less than 10), THE Gate_Service SHALL return eligible status as false regardless of the time elapsed
4. WHEN computing weeks since onboarding, THE Gate_Service SHALL calculate the value as the number of whole days between the onboarding_date (UTC) and the current date (UTC) divided by 7, yielding a fractional result
5. WHEN computing the check-in count, THE Gate_Service SHALL count distinct rows in the `weekly_checkins` table matching the given user_id
6. IF the user_id does not exist in the profiles table or the onboarding_date is null, THEN THE Gate_Service SHALL return not eligible with an indication that the user profile is incomplete

### Requirement 2: Structured Eligibility Status

**User Story:** As a developer, I want the eligibility evaluation to return a structured status object, so that both the API and frontend can display detailed progress information for each condition.

#### Acceptance Criteria

1. THE Gate_Service SHALL return an Eligibility_Status object containing: eligible (bool), time_eligible (bool), engagement_eligible (bool), weeks_elapsed (float rounded to 1 decimal place), weeks_remaining (float rounded to 1 decimal place), checkins_completed (int), checkins_required (int), and checkins_remaining (int)
2. THE Gate_Service SHALL compute weeks_elapsed as the number of days since onboarding_date divided by 7, using timezone-aware UTC arithmetic, rounded to 1 decimal place
3. THE Gate_Service SHALL compute weeks_remaining as max(0, 12 - weeks_elapsed), rounded to 1 decimal place
4. THE Gate_Service SHALL compute checkins_completed as the count of weekly_checkins records for the given user
5. THE Gate_Service SHALL set checkins_required to 10
6. THE Gate_Service SHALL compute checkins_remaining as max(0, 10 - checkins_completed)
7. THE Gate_Service SHALL set time_eligible to true WHEN weeks_elapsed is greater than or equal to 12, and false otherwise
8. THE Gate_Service SHALL set engagement_eligible to true WHEN checkins_completed is greater than or equal to 10, and false otherwise
9. THE Gate_Service SHALL compute the eligible field as the logical AND of time_eligible and engagement_eligible
10. IF the user profile does not exist or onboarding_date is null, THEN THE Gate_Service SHALL return an error indicating that eligibility cannot be evaluated

### Requirement 3: Prediction Endpoint Gate Enforcement

**User Story:** As a user, I want the X-ray upload to be blocked with a clear explanation when I have not met both eligibility conditions, so that I understand what I need to do to unlock the scan.

#### Acceptance Criteria

1. WHEN a user submits an X-ray upload and at least one eligibility condition (time_met or engagement_met) is false, THE Prediction_Router SHALL return HTTP 403 with a JSON detail object containing: time_met (boolean), engagement_met (boolean), weeks_remaining (number rounded to 1 decimal place, minimum 0.0), checkins_completed (integer, 0 or greater), and checkins_required (integer, representing total check-ins needed to satisfy the engagement condition)
2. WHEN a user submits an X-ray upload and both time_met and engagement_met are true, THE Prediction_Router SHALL proceed to model inference and return prediction results without blocking
3. WHEN a user submits an X-ray upload with a valid user_id, THE Prediction_Router SHALL pass the user_id and database session to the Gate_Service for eligibility evaluation before performing any prediction processing
4. IF user_id is not provided in the upload request, THEN THE Prediction_Router SHALL skip gate evaluation and proceed directly to prediction processing
5. IF user_id is provided but no matching profile exists in the database, THEN THE Prediction_Router SHALL skip gate evaluation and proceed directly to prediction processing

### Requirement 4: Dashboard Summary with Engagement Data

**User Story:** As a user, I want to see my progress toward both eligibility conditions on the dashboard, so that I know exactly how close I am to unlocking my follow-up scan.

#### Acceptance Criteria

1. WHEN the dashboard summary is requested, THE Progress_Router SHALL include the following fields in the response: xray_checkins_completed (integer representing the number of weekly check-ins the user has submitted), xray_checkins_required (integer fixed at 10), xray_engagement_met (boolean, true when xray_checkins_completed >= 10), and xray_time_met (boolean, true when xray_weeks_elapsed >= 12)
2. IF both xray_time_met and xray_engagement_met are true, THEN THE Progress_Router SHALL set xray_unlocked to true; otherwise it SHALL set xray_unlocked to false
3. THE Progress_Router SHALL maintain all existing response fields (xp, streak_current, chart_unlocked, chart_days_remaining, xray_weeks_elapsed, xray_weeks_remaining, pain_chart) with unchanged semantics
4. WHEN the user has submitted zero weekly check-ins, THE Progress_Router SHALL return xray_checkins_completed as 0 and xray_engagement_met as false

### Requirement 5: Frontend Scan Status Display

**User Story:** As a user, I want the scan status widget on my dashboard to show both time remaining and check-in progress, so that I have clear visibility into what actions I need to take.

#### Acceptance Criteria

1. WHEN the scan is locked, THE Scan_Widget SHALL display a time progress indicator showing the current week number out of 12 total weeks as a numeric label (e.g., "Week 5 of 12") and a visual progress representation filled proportionally to weeks elapsed
2. WHEN the scan is locked, THE Scan_Widget SHALL display a check-in progress indicator showing the count of completed weekly check-ins out of 10 required as a numeric label (e.g., "7 of 10 check-ins") and a visual progress representation filled proportionally to check-ins completed
3. WHEN weeks elapsed is greater than or equal to 12 AND completed check-ins is greater than or equal to 10, THE Scan_Widget SHALL display the scan status as "unlocked" with a visual affordance (such as an enabled button or highlighted state) that allows the user to initiate the scan
4. IF only the time condition (12 weeks) is unmet, THEN THE Scan_Widget SHALL display the remaining weeks until eligibility alongside the time progress indicator while showing the check-in condition as satisfied
5. IF only the check-in condition (10 check-ins) is unmet, THEN THE Scan_Widget SHALL display the remaining number of check-ins needed alongside the check-in progress indicator while showing the time condition as satisfied
6. IF both the time condition and the check-in condition are unmet, THEN THE Scan_Widget SHALL display the remaining weeks and remaining check-ins needed for each respective indicator

### Requirement 6: Error Handling and Fail-Safe Behavior

**User Story:** As a system operator, I want the eligibility check to fail safely when database errors occur, so that users cannot bypass the engagement requirement due to system failures.

#### Acceptance Criteria

1. IF the weekly_checkins query raises any database exception (connection error, timeout, or query execution failure), THEN THE Gate_Service SHALL treat the user as not eligible (fail closed)
2. IF the user profile is not found in the profiles table, THEN THE Progress_Router SHALL return HTTP 404 with a JSON body containing an error message indicating the user was not found
3. WHILE performing eligibility evaluation, THE Gate_Service SHALL execute only read-only SELECT queries with no INSERT, UPDATE, or DELETE operations on the database
4. IF any database query during eligibility evaluation does not return a response within 10 seconds, THEN THE Gate_Service SHALL treat the query as failed and apply the fail-closed behavior defined in criterion 1

### Requirement 7: Function Signature Compatibility

**User Story:** As a developer, I want the updated `is_xray_eligible` function signature to be applied consistently across all callers, so that the codebase remains correct after the breaking change.

#### Acceptance Criteria

1. THE Gate_Service SHALL expose `is_xray_eligible` with the signature `(onboarding_date: datetime, user_id: str, db: Session)` and SHALL return a boolean value indicating eligibility
2. WHEN the Prediction_Router calls `is_xray_eligible`, THE Prediction_Router SHALL pass the user's onboarding_date, user_id, and database session as positional arguments matching the updated signature
3. WHEN the Progress_Router evaluates eligibility, THE Progress_Router SHALL call `get_xray_eligibility_status(onboarding_date, user_id, db)` which SHALL return an Eligibility_Status object for use in response construction
4. THE Gate_Service SHALL expose `get_xray_eligibility_status` with the signature `(onboarding_date: datetime, user_id: str, db: Session)` and SHALL return an Eligibility_Status object containing eligible (boolean), weeks_elapsed (float), and weeks_remaining (float, minimum 0.0)
5. WHEN either the Prediction_Router or Progress_Router is updated, THE codebase SHALL have both callers updated to the new signature before deployment so that no caller invokes the old single-parameter signature
