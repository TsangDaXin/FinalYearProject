import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlowButton } from '../../components/ui/flow-button';

interface BehavioralLifestyleProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// ── Option card button (with icon) ─────────────────────────────────────────────
function OptionCard({
  label,
  icon,
  active,
  iconColor,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  iconColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 px-5 py-5 rounded-xl border transition-all duration-200 cursor-pointer w-full ${
        active
          ? 'bg-brand-orange/15 border-brand-orange/60 shadow-[0_0_16px_rgba(255, 109, 41,0.12)]'
          : 'bg-surface-container/40 border-outline-variant/25 hover:border-outline-variant/50 hover:bg-surface-container-highest/50'
      }`}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 26, color: active ? (iconColor ?? '#93c5fd') : 'rgba(255,255,255,0.35)' }}
      >
        {icon}
      </span>
      <span className={`text-sm font-semibold font-sans text-center ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {label}
      </span>
    </button>
  );
}

// ── Adherence card button (text only, left aligned) ────────────────────────────
function AdherenceCard({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 px-6 py-5 rounded-xl border transition-all duration-200 cursor-pointer w-full text-left ${
        active
          ? 'bg-brand-orange/15 border-brand-orange/60 shadow-[0_0_16px_rgba(255, 109, 41,0.12)]'
          : 'bg-surface-container/40 border-outline-variant/25 hover:border-outline-variant/50 hover:bg-surface-container-highest/50'
      }`}
    >
      <span className={`text-sm font-bold font-sans ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {title}
      </span>
      <span className="text-xs text-on-surface-variant/70 font-sans">
        {subtitle}
      </span>
    </button>
  );
}

// ── AI Rationale box ────────────────────────────────────────────────────────
function RationaleBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl mt-5 mb-6"
      style={{ background: 'rgba(14,14,16,0.5)', border: '1px solid rgba(66,71,84,0.4)' }}>
      <span className="material-symbols-outlined text-brand-orange shrink-0" style={{ fontSize: 18, marginTop: 1 }}>info</span>
      <p className="text-sm text-on-surface-variant italic leading-relaxed">{text}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function BehavioralLifestyle({ onComplete, onBack }: BehavioralLifestyleProps) {
  const [activity, setActivity] = useState<'sitting' | 'standing' | 'lifting' | null>(null);
  const [frequency, setFrequency] = useState<'sedentary' | '1-2' | '3+' | null>(null);
  const [exerciseType, setExerciseType] = useState<'none' | 'low' | 'high' | null>(null);
  const [adherence, setAdherence] = useState<'consistent' | 'inconsistent' | 'no' | 'stopped' | null>(null);
  const [submitError, setSubmitError] = useState<string>('');

  const answeredCount = useMemo(() => {
    let n = 0;
    if (activity !== null) n++;
    if (frequency !== null) n++;
    if (exerciseType !== null) n++;
    if (adherence !== null) n++;
    return n;
  }, [activity, frequency, exerciseType, adherence]);

  const handleContinue = () => {
    if (!activity) {
      setSubmitError('Please select your daily activity level before continuing.');
      return;
    }
    if (!frequency) {
      setSubmitError('Please select your exercise frequency before continuing.');
      return;
    }
    if (!exerciseType) {
      setSubmitError('Please select your primary exercise type before continuing.');
      return;
    }
    if (!adherence) {
      setSubmitError('Please select your physiotherapy adherence before continuing.');
      return;
    }
    setSubmitError('');
    onComplete({
      daily_activity: activity,
      exercise_frequency: frequency,
      primary_exercise: exerciseType,
      physio_adherence: adherence
    });
  };

  const cardAnim = (i: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.15 + i * 0.1, ease: 'easeOut' as const },
  });

  return (
    <div className="font-sans antialiased selection:bg-brand-orange selection:text-white min-h-screen w-full relative">
      {/* Background Layer (Cyber Glitch) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050B14]">
        <img
          alt=""
          className="w-full h-full object-cover glitch-bg"
          src="/cyber-knee-xray.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 md:py-12 max-w-4xl mx-auto">

        {/* ── Progress Header ──────────────────────────────────────────── */}
        <motion.header
          className="w-full mb-10 flex flex-col items-center relative"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button — top left */}
          <button
            onClick={onBack}
            className="absolute left-0 top-0 flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors duration-200 group"
          >
            <span
              className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform duration-200"
              style={{ fontSize: 18 }}
            >
              arrow_back
            </span>
            <span className="text-xs font-sans font-semibold uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-2 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === 2 ? 32 : 8,
                  height: 8,
                  background: i <= 2 ? '#FF6D29' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-brand-orange mb-1">
            Step 3 of 4
          </span>
          <h1 className="font-heading text-headline-xl text-on-surface mt-1 text-center">
            Behavioral &amp; Lifestyle Metrics
          </h1>

          {/* Mini completion tracker */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-[5px]">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-[6px] h-[6px] rounded-full transition-all duration-400"
                  style={{
                    background: i < answeredCount ? '#FF6D29' : 'rgba(255,255,255,0.1)',
                    boxShadow: i < answeredCount ? '0 0 6px rgba(255, 109, 41,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-sans text-on-surface-variant ml-1">
              {answeredCount}/4 answered
            </span>
          </div>
        </motion.header>

        {/* ── Companion Section ────────────────────────────────────────── */}
        <motion.section
          className="flex flex-col md:flex-row items-center gap-6 mb-10 w-full glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {/* Drop your avatar at: frontEnd/public/avatars/lifestyle-avatar.png */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
            <img
              alt="Companion Avatar – Lifestyle Guide"
              className="w-full h-full object-contain drop-shadow-lg"
              src="/avatars/biometrics-avatar.png"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = 'none';
                const parent = t.parentElement;
                if (parent && !parent.querySelector('.avatar-fallback')) {
                  const fb = document.createElement('div');
                  fb.className = 'avatar-fallback w-full h-full rounded-full bg-surface-container-high border-2 border-orange-500/30 flex items-center justify-center text-5xl';
                  fb.textContent = '🐧';
                  parent.appendChild(fb);
                }
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-brand-orange w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-[14px] text-white">medical_services</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="font-heading text-headline-sm text-on-surface mb-2">Steady Companion</p>
            <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed italic">
              "Refine your diagnostic profile by detailing daily habits. Your answers help the Orionix AI contextualize physiological findings."
            </p>
          </div>
        </motion.section>

        {/* ── Questions ───────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-5">

          {/* Q01 — Daily Activity */}
          <motion.div className="onboarding-card" {...cardAnim(0)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 1</div>
            <label className="onboarding-card-heading">Daily Activity</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              How would you describe your daily physical activity at work or home?
            </p>
            <RationaleBox text="Helps our AI contextualize mobility patterns and stress loads on weight-bearing joints." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard
                label="Mostly sitting"
                icon="chair_alt"
                active={activity === 'sitting'}
                onClick={() => setActivity('sitting')}
              />
              <OptionCard
                label="Prolonged standing"
                icon="directions_walk"
                active={activity === 'standing'}
                onClick={() => setActivity('standing')}
              />
              <OptionCard
                label="Heavy lifting"
                icon="fitness_center"
                active={activity === 'lifting'}
                onClick={() => setActivity('lifting')}
              />
            </div>

            {submitError && !activity && (
              <motion.p
                className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                Please select an option.
              </motion.p>
            )}
          </motion.div>

          {/* Q02 — Exercise Frequency */}
          <motion.div className="onboarding-card" {...cardAnim(1)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 2</div>
            <label className="onboarding-card-heading">Exercise Frequency</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Frequency of deliberate exercise?
            </p>
            <RationaleBox text="This allows us to calculate your average weekly physical load and recovery windows." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard
                label="Sedentary"
                icon="hotel"
                active={frequency === 'sedentary'}
                onClick={() => setFrequency('sedentary')}
              />
              <OptionCard
                label="1-2 times/week"
                icon="calendar_today"
                active={frequency === '1-2'}
                onClick={() => setFrequency('1-2')}
              />
              <OptionCard
                label="3+ times/week"
                icon="bolt"
                active={frequency === '3+'}
                onClick={() => setFrequency('3+')}
              />
            </div>

            {submitError && !frequency && (
              <motion.p
                className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                Please select an option.
              </motion.p>
            )}
          </motion.div>

          {/* Q03 — Primary Exercise Type */}
          <motion.div className="onboarding-card" {...cardAnim(2)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 3</div>
            <label className="onboarding-card-heading">Primary Exercise Type</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              What is the intensity of your usual workout routine?
            </p>
            <RationaleBox text="Strain pattern analysis helps differentiate between muscle fatigue and joint strain." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard
                label="None"
                icon="block"
                active={exerciseType === 'none'}
                onClick={() => setExerciseType('none')}
              />
              <OptionCard
                label="Low-impact (Yoga)"
                icon="self_improvement"
                active={exerciseType === 'low'}
                onClick={() => setExerciseType('low')}
              />
              <OptionCard
                label="High-impact (HIIT)"
                icon="sprint"
                active={exerciseType === 'high'}
                onClick={() => setExerciseType('high')}
              />
            </div>

            {submitError && !exerciseType && (
              <motion.p
                className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                Please select an option.
              </motion.p>
            )}
          </motion.div>

          {/* Q04 — Physiotherapy Adherence */}
          <motion.div className="onboarding-card" {...cardAnim(3)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 4</div>
            <label className="onboarding-card-heading">Physiotherapy Adherence</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Are you currently following a prescribed physiotherapy routine?
            </p>
            <RationaleBox text="Tracking adherence allows us to correlate physical therapy efficacy with symptom progression." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdherenceCard
                title="Yes consistently"
                subtitle="Highly Recommended"
                active={adherence === 'consistent'}
                onClick={() => setAdherence('consistent')}
              />
              <AdherenceCard
                title="Yes inconsistently"
                subtitle="Partial coverage"
                active={adherence === 'inconsistent'}
                onClick={() => setAdherence('inconsistent')}
              />
              <AdherenceCard
                title="No"
                subtitle="No current routine"
                active={adherence === 'no'}
                onClick={() => setAdherence('no')}
              />
              <AdherenceCard
                title="Previously stopped"
                subtitle="History found"
                active={adherence === 'stopped'}
                onClick={() => setAdherence('stopped')}
              />
            </div>

            {submitError && !adherence && (
              <motion.p
                className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                Please select an option.
              </motion.p>
            )}
          </motion.div>

        </div>

        {/* ── Submit Error ──────────────────────────────────────────────── */}
        {submitError && (
          <motion.div
            className="w-full mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {submitError}
          </motion.div>
        )}

        {/* ── Continue CTA ──────────────────────────────────────────────── */}
        <motion.div
          className="w-full mt-6 mb-8 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
        >
          <FlowButton
            onClick={handleContinue}
            text="Continue to Analysis"
            className="w-72 h-14 text-lg mx-auto"
          />
        </motion.div>

      </main>
    </div>
  );
}
