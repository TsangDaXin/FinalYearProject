# Requirements Document

## Introduction

This feature addresses the weekly check-in modal behavior in the SteadyGerak clinical portal. Currently, the weekly check-in modal (a 2-step flow for Pain Level and Morning Stiffness) appears every time the DailyActionDashboard component mounts if no check-in record exists for the current week. Because App.tsx uses state-based navigation (no React Router), navigating away from the dashboard unmounts the component, causing the modal to reappear on return. This feature introduces session-scoped dismissal persistence using sessionStorage, and extracts the modal into a dedicated component file for maintainability.

## Glossary

- **Weekly_Check_In_Modal**: The pop-out overlay component that collects the user's weekly pain level (0–10 slider) and morning stiffness level (3 options) in a 2-step flow
- **DailyActionDashboard**: The main dashboard page component that displays the user's rehabilitation metrics, videos, and quick stats
- **Session**: A single browser tab lifecycle — begins when the user signs in or loads the app, and ends when the browser tab is closed or the page is refreshed
- **SessionStorage**: The browser Web Storage API scoped to a single tab session, cleared automatically on tab close or browser refresh
- **Dismissal_Flag**: A key-value entry written to sessionStorage indicating that the Weekly_Check_In_Modal has been closed (either via submission or manual dismissal) during the current session
- **App_Navigation**: The state-based view switching mechanism in App.tsx that mounts and unmounts page components based on the currentView state variable
- **WeeklyCheckInModal_Component**: The extracted standalone React component file (WeeklyCheckInModal.tsx) containing the modal UI and logic

## Requirements

### Requirement 1: Session-Scoped Dismissal Persistence

**User Story:** As a user, I want the weekly check-in modal to stay hidden after I close it, so that I am not repeatedly prompted while navigating between tabs in the same session.

#### Acceptance Criteria

1. WHEN the user dismisses the Weekly_Check_In_Modal (via the close button), THE WeeklyCheckInModal_Component SHALL write the Dismissal_Flag to sessionStorage
2. WHEN the user completes the check-in submission successfully, THE WeeklyCheckInModal_Component SHALL write the Dismissal_Flag to sessionStorage
3. WHEN the DailyActionDashboard mounts, THE WeeklyCheckInModal_Component SHALL check sessionStorage for the Dismissal_Flag and, IF the flag is present, SHALL hide the modal without further checks
4. WHILE the Dismissal_Flag exists in sessionStorage, THE WeeklyCheckInModal_Component SHALL remain hidden regardless of the weekly_checkins table state
5. WHEN the browser tab is closed or the page is refreshed, THE Session SHALL end and the Dismissal_Flag SHALL be cleared automatically by the browser

### Requirement 2: Initial Display Condition

**User Story:** As a user, I want the weekly check-in modal to appear on first sign-in landing if I have not yet completed my check-in for the current week, so that I am prompted at the appropriate time.

#### Acceptance Criteria

1. WHEN the DailyActionDashboard mounts AND no Dismissal_Flag exists in sessionStorage AND no check-in record exists in the weekly_checkins table for the current week, THE WeeklyCheckInModal_Component SHALL display the modal overlay
2. WHEN the DailyActionDashboard mounts AND a check-in record already exists in the weekly_checkins table for the current week, THE WeeklyCheckInModal_Component SHALL remain hidden
3. WHEN the DailyActionDashboard mounts AND the Dismissal_Flag exists in sessionStorage, THE WeeklyCheckInModal_Component SHALL remain hidden without querying the weekly_checkins table for modal visibility purposes

### Requirement 3: Component Extraction

**User Story:** As a developer, I want the weekly check-in modal extracted into its own component file, so that the DailyActionDashboard file is shorter and the modal logic is easier to maintain.

#### Acceptance Criteria

1. THE WeeklyCheckInModal_Component SHALL be a standalone React component in a dedicated file (WeeklyCheckInModal.tsx)
2. THE WeeklyCheckInModal_Component SHALL encapsulate the full 2-step check-in flow (pain level slider and morning stiffness selection) only when the component has been properly extracted as a standalone file; IF extraction is incomplete, the encapsulation requirement SHALL NOT be enforced
3. THE WeeklyCheckInModal_Component SHALL accept props for required data (onboarding date, user session context) and a callback for when the modal closes or submission completes
4. THE DailyActionDashboard SHALL import and render the WeeklyCheckInModal_Component in place of the current inline modal markup
5. THE WeeklyCheckInModal_Component SHALL preserve the existing visual design, animations (Framer Motion), and interaction behavior of the current inline modal

### Requirement 4: Navigation Resilience

**User Story:** As a user, I want the modal to stay hidden when I navigate away from the dashboard and return, so that my workflow is not interrupted after I have already dismissed the check-in.

#### Acceptance Criteria

1. WHEN the user navigates from DailyActionDashboard to another view via App_Navigation, THE DailyActionDashboard SHALL unmount without affecting the Dismissal_Flag in sessionStorage
2. WHEN the user navigates back to DailyActionDashboard after previously dismissing the modal, THE WeeklyCheckInModal_Component SHALL detect the existing Dismissal_Flag and remain hidden; IF the detection mechanism fails due to a technical issue (e.g., sessionStorage API throws an exception), THE WeeklyCheckInModal_Component SHALL default to showing the modal
3. WHEN the user navigates back to DailyActionDashboard after previously submitting the check-in, THE WeeklyCheckInModal_Component SHALL remain hidden (due to both Dismissal_Flag and existing database record)

### Requirement 5: New Session Behavior

**User Story:** As a user, I want the modal to reappear in a new session if I have not completed my weekly check-in, so that I am prompted again after returning to the app.

#### Acceptance Criteria

1. WHEN the user opens a new browser tab or refreshes the page AND no check-in record exists for the current week, THE WeeklyCheckInModal_Component SHALL display the modal overlay on DailyActionDashboard mount UNLESS a suppression condition applies (e.g., a system-level override flag is set or the user's account is in a state that warrants suppression)
2. WHEN the user opens a new browser tab or refreshes the page AND a check-in record already exists for the current week, THE WeeklyCheckInModal_Component SHALL remain hidden

### Requirement 6: On-Demand Check-In from Recovery Mastery Analytics

**User Story:** As a user on the Recovery Mastery Analytics page, I want to complete my weekly check-in directly from a "Complete Check-In" button without navigating away, so that I can log my pain and stiffness levels in context.

#### Acceptance Criteria

1. WHEN the user clicks the "Complete Check-In" button on the MasteryPage, THE WeeklyCheckInModal_Component SHALL open in forced/on-demand mode on the MasteryPage itself (no navigation to the dashboard)
2. THE WeeklyCheckInModal_Component SHALL support a `forceOpen` prop that, when set to true, bypasses the sessionStorage dismissal flag and the weekly_checkins DB check to display the modal immediately
3. WHEN `forceOpen` is true AND the user submits the check-in, THE WeeklyCheckInModal_Component SHALL still write the Dismissal_Flag to sessionStorage and call the `onCheckInComplete` callback
4. WHEN `forceOpen` is true AND the user dismisses the modal (close button), THE WeeklyCheckInModal_Component SHALL NOT write the Dismissal_Flag to sessionStorage (since the user intentionally opened it and chose to cancel)
5. AFTER a successful submission via the MasteryPage button, THE showCheckinReminder banner SHALL be hidden (the check-in is now complete for this week)
6. THE MasteryPage SHALL manage a local state (`showCheckinModal`) toggled by the "Complete Check-In" button, passed as `forceOpen` to the WeeklyCheckInModal_Component
