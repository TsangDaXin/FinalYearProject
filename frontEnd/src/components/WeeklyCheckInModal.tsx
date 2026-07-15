import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

// ─── Props Interface ────────────────────────────────────────────────────────────

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

// ─── SessionStorage Utility ─────────────────────────────────────────────────────

const DISMISSAL_KEY = 'weekly_checkin_dismissed';

function isDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSAL_KEY) === 'true';
  } catch {
    // sessionStorage unavailable (e.g. private browsing quota exceeded)
    return false;
  }
}

function setDismissed(): void {
  try {
    sessionStorage.setItem(DISMISSAL_KEY, 'true');
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
}

// ─── Week Number Helper ─────────────────────────────────────────────────────────

function getCurrentWeekNumber(onboardingDate: string | null): number {
  const now = new Date();
  const onboard = onboardingDate ? new Date(onboardingDate) : now;
  const diffDays = Math.floor(
    (now.getTime() - onboard.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function WeeklyCheckInModal({
  onboardingDate,
  onCheckInComplete,
  onDismiss,
  forceOpen = false,
}: WeeklyCheckInModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkinStep, setCheckinStep] = useState<1 | 2>(1);
  const [painLevel, setPainLevel] = useState(5);
  const [stiffnessLevel, setStiffnessLevel] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Visibility Resolution (Task 1.2) ───────────────────────────────────────
  useEffect(() => {
    // forceOpen mode: skip all checks, show immediately
    if (forceOpen) {
      setIsVisible(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function resolveVisibility() {
      // Step 1: Check sessionStorage (synchronous short-circuit)
      if (isDismissed()) {
        if (!cancelled) {
          setIsVisible(false);
          setIsLoading(false);
        }
        return;
      }

      // Step 2: Check database for existing check-in
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Auth session missing → hide modal
        if (!session?.user) {
          if (!cancelled) {
            setIsVisible(false);
            setIsLoading(false);
          }
          return;
        }

        const currentWeek = getCurrentWeekNumber(onboardingDate);

        const { data: existingCheckin, error } = await supabase
          .from('weekly_checkins')
          .select('current_pain_level')
          .eq('user_id', session.user.id)
          .eq('check_in_week_number', currentWeek)
          .maybeSingle();

        // Query failure → hide modal (fail closed)
        if (error) {
          if (!cancelled) {
            setIsVisible(false);
            setIsLoading(false);
          }
          return;
        }

        // Step 3: Show only if no record exists for current week
        if (!cancelled) {
          setIsVisible(!existingCheckin);
          setIsLoading(false);
        }
      } catch {
        // Network or unexpected error → hide modal (fail closed)
        if (!cancelled) {
          setIsVisible(false);
          setIsLoading(false);
        }
      }
    }

    resolveVisibility();

    return () => {
      cancelled = true;
    };
  }, [onboardingDate, forceOpen]);

  // ─── Error state for submission retry ───────────────────────────────────────
  const [submitError, setSubmitError] = useState(false);

  // ─── Submission Handler ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (checkinStep === 1) {
      // Move to stiffness step
      setCheckinStep(2);
      return;
    }

    // Step 2: Submit weekly check-in
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const now = new Date();
      const onboard = onboardingDate ? new Date(onboardingDate) : now;
      const diffDays = Math.floor((now.getTime() - onboard.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of current week

      const response = await fetch('http://localhost:8000/api/progress/checkin/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          week_number: weekNumber,
          week_start_date: weekStart.toISOString().split('T')[0],
          pain_level: painLevel,
          stiffness_level: stiffnessLevel,
          notes: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      // Success: dismiss and notify parent
      setDismissed();
      setIsVisible(false);
      onCheckInComplete(painLevel);
    } catch {
      // Show error state, keep modal open for retry
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Close Button Handler ───────────────────────────────────────────────────
  const handleClose = () => {
    if (!forceOpen) {
      // Normal mode: write dismissal flag so modal stays hidden this session
      setDismissed();
    }
    // forceOpen mode: do NOT write dismissal flag (user chose to cancel their own action)
    setIsVisible(false);
    onDismiss();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!isVisible || isLoading) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#131315] border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl w-full relative shadow-[0_0_40px_rgba(255,109,41,0.15)] mx-auto"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${checkinStep === 1 ? 'bg-[#FF6D29]' : 'bg-white/20'}`} />
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${checkinStep === 2 ? 'bg-[#FF6D29]' : 'bg-white/20'}`} />
            </div>

            {/* Submission error message */}
            {submitError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                <p className="text-sm text-red-400">Submission failed. Please try again.</p>
              </div>
            )}

            {/* Step 1: Pain Level */}
            {checkinStep === 1 && (
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                <div className="flex-1 text-center md:text-left">
                  <div className="w-12 h-12 bg-[#FF6D29]/10 rounded-full flex items-center justify-center text-[#FF6D29] mb-4 mx-auto md:mx-0">
                    <span className="material-symbols-outlined text-2xl">sentiment_dissatisfied</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Weekly Check-In</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    How would you rate your knee pain this week? This helps us track your long-term recovery trajectory and calibrate your action plan.
                  </p>
                </div>

                <div className="flex-1 w-full bg-black/40 rounded-xl p-5 border border-white/5">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-black text-[#FF6D29] leading-none">{painLevel}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Pain Score</div>
                  </div>

                  <div className="w-full pb-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 px-1">
                      <span>No Pain (0)</span>
                      <span>Severe (10)</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="10"
                      value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value))}
                      className="w-full accent-[#FF6D29] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#C2410C] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.4)]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Stiffness Level */}
            {checkinStep === 2 && (
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                <div className="flex-1 text-center md:text-left">
                  <div className="w-12 h-12 bg-[#FF6D29]/10 rounded-full flex items-center justify-center text-[#FF6D29] mb-4 mx-auto md:mx-0">
                    <span className="material-symbols-outlined text-2xl">accessibility_new</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Morning Stiffness</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    How stiff has your knee felt this week? This helps calculate your composite mobility score and track joint function over time.
                  </p>
                </div>

                <div className="flex-1 w-full bg-black/40 rounded-xl p-5 border border-white/5">
                  <div className="text-center mb-5">
                    <div className="text-4xl font-black text-[#FF6D29] leading-none">{stiffnessLevel}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Stiffness Level</div>
                  </div>

                  <div className="space-y-3 mb-5">
                    {[
                      { value: 1, label: 'Mild', desc: 'Minimal stiffness, resolves quickly' },
                      { value: 2, label: 'Moderate', desc: 'Noticeable stiffness, lasts < 30 min' },
                      { value: 3, label: 'Severe', desc: 'Significant stiffness, lasts > 30 min' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStiffnessLevel(opt.value)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          stiffnessLevel === opt.value
                            ? 'border-[#FF6D29] bg-[#FF6D29]/10'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-sm font-semibold ${stiffnessLevel === opt.value ? 'text-[#FF6D29]' : 'text-white'}`}>{opt.label}</span>
                            <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            stiffnessLevel === opt.value ? 'border-[#FF6D29]' : 'border-white/20'
                          }`}>
                            {stiffnessLevel === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6D29]" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCheckinStep(1)}
                      className="flex-1 py-3 border border-white/10 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#C2410C] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.4)] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { isDismissed, setDismissed, getCurrentWeekNumber, DISMISSAL_KEY };
export type { WeeklyCheckInModalProps };
