# Implementation Plan: Weekly Check-In Modal

## Overview

Extract the inline weekly check-in modal from `DailyActionDashboard.tsx` into a standalone `WeeklyCheckInModal.tsx` component, add sessionStorage-based dismissal persistence, and clean up the dashboard file. The implementation uses React 19 + TypeScript + Framer Motion with the existing Supabase client and API endpoint.

## Tasks

- [x] 1. Create the WeeklyCheckInModal component
  - [x] 1.1 Create `frontEnd/src/components/WeeklyCheckInModal.tsx` with the component interface and sessionStorage utility
    - Define the `WeeklyCheckInModalProps` interface (`onboardingDate`, `onCheckInComplete`, `onDismiss`)
    - Implement inline `DISMISSAL_KEY`, `isDismissed()`, and `setDismissed()` utility functions
    - Implement `getCurrentWeekNumber(onboardingDate)` helper
    - Create the component skeleton with internal state (`isVisible`, `isLoading`, `checkinStep`, `painLevel`, `stiffnessLevel`, `isSubmitting`)
    - _Requirements: 3.1, 3.3_

  - [x] 1.2 Implement visibility resolution logic in `WeeklyCheckInModal.tsx`
    - Add `useEffect` on mount that runs the short-circuit visibility algorithm: check sessionStorage first, then query `weekly_checkins` table via Supabase
    - If `isDismissed()` returns true, set `isVisible = false` without making a DB call
    - If no dismissal flag, query `weekly_checkins` for current week record; if record exists set hidden, otherwise show modal
    - Handle error cases: sessionStorage unavailable (treat as not dismissed), auth session missing (hide), query failure (hide)
    - _Requirements: 2.1, 2.2, 2.3, 1.3, 1.4_

  - [x] 1.3 Implement the 2-step modal UI and submission logic in `WeeklyCheckInModal.tsx`
    - Port the existing Step 1 (pain level slider 0–10) and Step 2 (stiffness selection 1–3) JSX from `DailyActionDashboard.tsx`
    - Preserve all Framer Motion animations (`AnimatePresence`, `motion.div` with scale/opacity transitions)
    - Preserve existing Tailwind styling, button gradients, and layout (responsive flex with `md:flex-row`)
    - Implement `handleSubmit`: POST to `/api/progress/checkin/weekly` with the correct payload, then call `setDismissed()` and `onCheckInComplete(painLevel)`
    - Implement close button handler: call `setDismissed()` then `onDismiss()`
    - Wrap sessionStorage calls in try-catch for private browsing compatibility
    - _Requirements: 3.2, 3.5, 1.1, 1.2, 5.1, 5.2_

  - [ ]* 1.4 Write property test for dismissal persistence (Property 1)
    - **Property 1: Dismissal persistence across all closure paths**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.5 Write property test for dismissal flag suppression (Property 2)
    - **Property 2: Dismissal flag suppresses modal visibility**
    - **Validates: Requirements 1.4, 2.3, 4.2**

- [x] 2. Checkpoint - Verify WeeklyCheckInModal works standalone
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Integrate into DailyActionDashboard and clean up
  - [x] 3.1 Remove inline modal state and logic from `DailyActionDashboard.tsx`
    - Remove state declarations: `showPainModal`, `checkinStep`, `painLevel`, `stiffnessLevel`, `submittingPain`
    - Remove the `handlePainSubmit` function
    - Remove the weekly check-in detection logic from the `fetchStats` useEffect (the part that sets `showPainModal`)
    - Keep the `latestPain` state and the non-modal parts of `fetchStats` (XP fetch, latest pain from previous weeks)
    - _Requirements: 3.4_

  - [x] 3.2 Remove inline modal JSX from `DailyActionDashboard.tsx`
    - Delete the entire `<AnimatePresence>{showPainModal && ...}</AnimatePresence>` block (~120 lines of modal markup)
    - _Requirements: 3.4_

  - [x] 3.3 Import and render `WeeklyCheckInModal` in `DailyActionDashboard.tsx`
    - Add import statement for `WeeklyCheckInModal` from `../../components/WeeklyCheckInModal`
    - Render `<WeeklyCheckInModal onboardingDate={onboardingDate} onCheckInComplete={(painLevel) => setLatestPain(painLevel)} onDismiss={() => {}} />` at the top of the component return
    - _Requirements: 3.4, 2.1_

  - [ ]* 3.4 Write property test for unmount preserving dismissal flag (Property 3)
    - **Property 3: Component unmount preserves dismissal flag**
    - **Validates: Requirements 4.1**

  - [ ]* 3.5 Write unit tests for navigation resilience
    - Test: mount dashboard with dismissed flag → modal hidden → unmount → remount → modal still hidden
    - Test: mount dashboard → submit check-in → unmount → remount → modal still hidden
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add forceOpen support and integrate with MasteryPage
  - [x] 5.1 Add `forceOpen` prop to `WeeklyCheckInModal.tsx`
    - Add optional `forceOpen?: boolean` to the props interface
    - When `forceOpen` is true, skip the sessionStorage/DB visibility resolution and show the modal immediately
    - On submit in forceOpen mode: write dismissal flag to sessionStorage, call `onCheckInComplete`
    - On dismiss in forceOpen mode: do NOT write dismissal flag, just call `onDismiss`
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 5.2 Update `MasteryPage.tsx` to use the modal directly
    - Add `import WeeklyCheckInModal from '../../components/WeeklyCheckInModal'`
    - Add local state: `const [showCheckinModal, setShowCheckinModal] = useState(false)`
    - Replace the "Complete Check-In" button's `onClick={() => onNavigate('action_dashboard')}` with `onClick={() => setShowCheckinModal(true)}`
    - Render `<WeeklyCheckInModal forceOpen={showCheckinModal} onboardingDate={onboardingDate} onCheckInComplete={() => { setShowCheckinModal(false); setShowCheckinReminder(false); }} onDismiss={() => setShowCheckinModal(false)} />`
    - _Requirements: 6.1, 6.5, 6.6_

- [x] 6. Final checkpoint - Verify Mastery page integration
  - Ensure the modal opens on "Complete Check-In" click, submits correctly, and hides the reminder banner after submission.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The existing API endpoint (`POST /api/progress/checkin/weekly`) and database table (`weekly_checkins`) are unchanged
- sessionStorage is automatically cleared on tab close/refresh, providing new-session behavior for free
- The implementation language is TypeScript (React 19 + Vite + Tailwind CSS 4 + Framer Motion)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "1.5"] },
    { "id": 4, "tasks": ["3.1", "3.2"] },
    { "id": 5, "tasks": ["3.3"] },
    { "id": 6, "tasks": ["3.4", "3.5"] }
  ]
}
```
