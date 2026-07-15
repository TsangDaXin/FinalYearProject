# Design Document: Weekly Check-In Modal

## Overview

This feature extracts the existing inline weekly check-in modal from `DailyActionDashboard.tsx` into a standalone `WeeklyCheckInModal.tsx` component and introduces session-scoped dismissal persistence via `sessionStorage`. The architecture is intentionally simple — a single extracted component with a clear props interface, and a thin sessionStorage utility layer.

## Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx (state nav)                    │
│  currentView === 'action_dashboard' → mount Dashboard    │
└───────────────────────────┬─────────────────────────────┘
                            │ mounts
                            ▼
┌─────────────────────────────────────────────────────────┐
│              DailyActionDashboard.tsx                     │
│  • Fetches user stats (XP, streak, latest pain)         │
│  • Renders <WeeklyCheckInModal />                       │
│  • Passes onboarding date + callbacks                   │
└───────────────────────────┬─────────────────────────────┘
                            │ renders
                            ▼
┌─────────────────────────────────────────────────────────┐
│            WeeklyCheckInModal.tsx                         │
│                                                          │
│  Mount Logic:                                            │
│  1. Check sessionStorage for dismissal flag              │
│     → flag found? Stay hidden. DONE.                     │
│  2. Query weekly_checkins table for current week         │
│     → record found? Stay hidden. DONE.                   │
│  3. No flag + no record → Show modal                     │
│                                                          │
│  Dismissal (close button or submit):                     │
│  → Write dismissal flag to sessionStorage                │
│  → Call onClose/onSubmit callback                        │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### WeeklyCheckInModal

**File:** `frontEnd/src/components/WeeklyCheckInModal.tsx`

**Responsibility:** Self-contained modal component that manages its own visibility logic, 2-step check-in flow, and sessionStorage persistence.

```typescript
interface WeeklyCheckInModalProps {
  onboardingDate: string | null;
  onCheckInComplete: (painLevel: number) => void;
  onDismiss: () => void;
}
```

**Internal State:**
- `isVisible: boolean` — resolved on mount from sessionStorage + DB check
- `isLoading: boolean` — true while checking weekly_checkins table
- `checkinStep: 1 | 2` — current step in the 2-step flow
- `painLevel: number` — slider value (0–10)
- `stiffnessLevel: number` — selection value (1–3)
- `isSubmitting: boolean` — submission in progress

**Lifecycle:**
1. On mount: run visibility resolution (sessionStorage → DB check → render decision)
2. On close/submit: write dismissal flag, invoke callback, hide modal
3. On unmount: no cleanup needed (sessionStorage persists independently)

### SessionStorage Utility

**Location:** Inline within `WeeklyCheckInModal.tsx` (no separate file needed for 2 functions)

```typescript
const DISMISSAL_KEY = 'weekly_checkin_dismissed';

function isDismissed(): boolean {
  return sessionStorage.getItem(DISMISSAL_KEY) === 'true';
}

function setDismissed(): void {
  sessionStorage.setItem(DISMISSAL_KEY, 'true');
}
```

The key is a simple string constant. The value is `'true'`. The browser automatically clears sessionStorage when the tab closes or the page refreshes, which provides the "new session = fresh prompt" behavior for free.

### Component Props

```typescript
interface WeeklyCheckInModalProps {
  /** User's onboarding date for calculating the current week number */
  onboardingDate: string | null;
  /** Called after successful submission with the pain level value */
  onCheckInComplete: (painLevel: number) => void;
  /** Called when the user dismisses without submitting */
  onDismiss: () => void;
  /** When true, bypass sessionStorage/DB checks and show modal immediately (on-demand trigger from Mastery page) */
  forceOpen?: boolean;
}
```

### API Contract (existing, unchanged)

```typescript
// POST /api/progress/checkin/weekly
interface WeeklyCheckInPayload {
  user_id: string;
  week_number: number;
  week_start_date: string; // ISO date (YYYY-MM-DD)
  pain_level: number;      // 0-10
  stiffness_level: number; // 1-3
  notes: string | null;
}
```

### Supabase Query (existing, unchanged)

```typescript
// Check if check-in exists for current week
const { data } = await supabase
  .from('weekly_checkins')
  .select('current_pain_level')
  .eq('user_id', userId)
  .eq('check_in_week_number', currentWeek)
  .maybeSingle();
```

## Data Models

No new database tables or schema changes are required. The feature relies on:

1. **sessionStorage** (browser-native, tab-scoped)
   - Key: `'weekly_checkin_dismissed'`
   - Value: `'true'` | absent

2. **Existing `weekly_checkins` table** (Supabase/Postgres, unchanged)
   - Queried to determine if a check-in record exists for the current week
   - Written to via `POST /api/progress/checkin/weekly` on submission

### Week Number Calculation

```typescript
function getCurrentWeekNumber(onboardingDate: string | null): number {
  const now = new Date();
  const onboard = onboardingDate ? new Date(onboardingDate) : now;
  const diffDays = Math.floor(
    (now.getTime() - onboard.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}
```

## Visibility Resolution Algorithm

The modal uses a short-circuit evaluation pattern to minimize unnecessary API calls:

```typescript
async function resolveVisibility(onboardingDate: string | null): Promise<boolean> {
  // Step 1: Check sessionStorage (synchronous, instant)
  if (isDismissed()) {
    return false; // Hidden — no DB call needed
  }

  // Step 2: Check database for existing check-in (async)
  const session = await supabase.auth.getSession();
  if (!session.data.session?.user) return false;

  const currentWeek = getCurrentWeekNumber(onboardingDate);
  const { data: existingCheckin } = await supabase
    .from('weekly_checkins')
    .select('current_pain_level')
    .eq('user_id', session.data.session.user.id)
    .eq('check_in_week_number', currentWeek)
    .maybeSingle();

  // Step 3: Show only if no record exists
  return !existingCheckin;
}
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| sessionStorage unavailable (e.g. private browsing quota exceeded) | Treat as "not dismissed" — fall through to DB check. Wrap `getItem`/`setItem` in try-catch. |
| Supabase auth session missing | Hide modal (user not authenticated) |
| `weekly_checkins` query fails (network error) | Hide modal (fail closed — don't annoy user on error) |
| `POST /api/progress/checkin/weekly` fails | Show error state briefly, keep modal open, allow retry. Still write dismissal flag if user closes manually. |
| `onboardingDate` is null | Default to current date for week calculation (week 1) |

## Integration with DailyActionDashboard

The refactored `DailyActionDashboard.tsx` will:

1. **Remove** all inline modal state (`showPainModal`, `checkinStep`, `painLevel`, `stiffnessLevel`, `submittingPain`)
2. **Remove** the inline modal JSX block (~120 lines)
3. **Remove** the `handlePainSubmit` function
4. **Remove** the weekly check-in logic from the `useEffect` that fetches stats (the component handles its own visibility)
5. **Add** a single `<WeeklyCheckInModal />` render:

```typescript
import WeeklyCheckInModal from '../../components/WeeklyCheckInModal';

// Inside the component return:
<WeeklyCheckInModal
  onboardingDate={onboardingDate}
  onCheckInComplete={(painLevel) => setLatestPain(painLevel)}
  onDismiss={() => {}}
/>
```

The dashboard's `latestPain` state still gets updated via the `onCheckInComplete` callback, preserving the Quick Stats display behavior.

## Integration with MasteryPage

The `MasteryPage.tsx` will:

1. **Add** a local state: `const [showCheckinModal, setShowCheckinModal] = useState(false)`
2. **Replace** the "Complete Check-In" button's `onClick={() => onNavigate('action_dashboard')}` with `onClick={() => setShowCheckinModal(true)}`
3. **Render** the modal with `forceOpen`:

```typescript
import WeeklyCheckInModal from '../../components/WeeklyCheckInModal';

// Inside the component return:
<WeeklyCheckInModal
  onboardingDate={onboardingDate}
  forceOpen={showCheckinModal}
  onCheckInComplete={(painLevel) => {
    setShowCheckinModal(false);
    setShowCheckinReminder(false); // hide the reminder banner
  }}
  onDismiss={() => setShowCheckinModal(false)}
/>
```

### forceOpen Mode Behavior

When `forceOpen` is true:
- Skip sessionStorage check and DB check entirely
- Show modal immediately
- On successful submission: write dismissal flag + call `onCheckInComplete`
- On dismiss (close button): do NOT write dismissal flag (user chose to cancel their own action), just call `onDismiss`

## Testing Strategy

### Unit Tests (Example-Based)
- Mount component with no sessionStorage flag and mock DB returning no check-in → verify modal is visible
- Mount component with no sessionStorage flag and mock DB returning existing check-in → verify modal is hidden
- Mount component with sessionStorage flag set → verify modal is hidden without DB query
- Render step 1 → click "Next" → verify step 2 renders with stiffness options
- Submit check-in → verify `POST /api/progress/checkin/weekly` is called with correct payload
- Verify `onCheckInComplete` callback is called with the selected pain level after submission

### Property Tests
- Validate Properties 1–3 as specified in the Correctness Properties section below
- Minimum 100 iterations per property using randomized inputs (pain 0–10, stiffness 1–3, sessionStorage states, DB states)

### Integration Tests
- Full flow: sign in → land on dashboard → modal appears → submit → navigate away → return → modal stays hidden
- Full flow: sign in → land on dashboard → dismiss modal → navigate away → return → modal stays hidden

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dismissal persistence across all closure paths

*For any* valid modal closure action (close button click with any step active, or successful submission with any pain level 0–10 and stiffness level 1–3), the sessionStorage dismissal flag SHALL be written with value `'true'` immediately after the action completes.

**Validates: Requirements 1.1, 1.2**

### Property 2: Dismissal flag suppresses modal visibility

*For any* state of the `weekly_checkins` table (record present or absent for current week), if the sessionStorage dismissal flag is set to `'true'`, the WeeklyCheckInModal component SHALL not render the modal overlay.

**Validates: Requirements 1.4, 2.3, 4.2**

### Property 3: Component unmount preserves dismissal flag

*For any* navigation target view in App_Navigation and any prior modal interaction state (dismissed or submitted), unmounting DailyActionDashboard SHALL leave the sessionStorage dismissal flag unchanged from its value immediately before unmount.

**Validates: Requirements 4.1**
