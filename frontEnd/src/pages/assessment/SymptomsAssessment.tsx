import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlowButton } from '../../components/ui/flow-button';

interface SymptomsAssessmentProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// ── Reusable pain slider ──────────────────────────────────────────────────────
function PainSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = (value / 10) * 100;

  const painLabel = () => {
    if (value === 0) return { text: 'No Pain', color: '#22c55e' };
    if (value <= 3) return { text: 'Mild', color: '#86efac' };
    if (value <= 5) return { text: 'Moderate', color: '#facc15' };
    if (value <= 7) return { text: 'High', color: '#fb923c' };
    return { text: 'Severe', color: '#f87171' };
  };

  const { text, color } = painLabel();

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-on-surface-variant">Pain Intensity</span>
        <div className="flex items-end gap-2">
          <span className="text-[36px] font-bold tabular-nums leading-none" style={{ color }}>
            {value}
          </span>
          <span className="text-on-surface-variant text-sm mb-1">/10</span>
          <span className="text-xs font-sans font-semibold mb-1 ml-1" style={{ color }}>{text}</span>
        </div>
      </div>

      <div className="relative py-2">
        {/* Filled track */}
        <div className="absolute top-1/2 -translate-y-1/2 h-[6px] rounded-full w-full"
          style={{ background: '#353437' }}>
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ width: `${pct}%`, background: `linear-gradient(to right, #22c55e, ${color})` }}
          />
        </div>
        <input
          type="range" min={0} max={10} step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-outline uppercase tracking-widest font-semibold">
        <span>No Pain (0)</span>
        <span>Moderate (5)</span>
        <span>Severe (10)</span>
      </div>
    </div>
  );
}

// ── Option card button ─────────────────────────────────────────────────────────
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
export default function SymptomsAssessment({ onComplete, onBack }: SymptomsAssessmentProps) {
  const [walkingPain, setWalkingPain] = useState<number>(3);
  const [stiffness, setStiffness] = useState<'none' | 'less30' | 'more30' | null>(null);
  const [stability, setStability] = useState<'never' | 'rarely' | 'frequently' | null>(null);
  const [submitError, setSubmitError] = useState<string>('');

  const answeredCount = useMemo(() => {
    let n = 1; // pain slider always has a value
    if (stiffness !== null) n++;
    if (stability !== null) n++;
    return n;
  }, [stiffness, stability]);

  const handleContinue = () => {
    if (!stiffness) {
      setSubmitError('Please select a morning stiffness option before continuing.');
      return;
    }
    if (!stability) {
      setSubmitError('Please select a joint stability option before continuing.');
      return;
    }
    setSubmitError('');
    onComplete({
      walking_pain: walkingPain,
      morning_stiffness: stiffness === 'none' ? 0 : stiffness === 'less30' ? 1 : 2, // Arbitrary mapping since column is INTEGER
      joint_stability: stability === 'never' ? 0 : stability === 'rarely' ? 1 : 2
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
                  width: i === 1 ? 32 : 8,
                  height: 8,
                  background: i <= 1 ? '#FF6D29' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-brand-orange mb-1">
            Step 2 of 4
          </span>
          <h1 className="font-heading text-headline-xl text-on-surface mt-1 text-center">
            Symptoms Analysis
          </h1>

          {/* Mini completion tracker */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-[5px]">
              {[0, 1, 2].map(i => (
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
              {answeredCount}/3 answered
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
          {/* Drop your avatar at: frontEnd/public/avatars/symptoms-avatar.png */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
            <img
              alt="Companion Avatar – Symptoms Guide"
              className="w-full h-full object-contain drop-shadow-lg"
              src="/avatars/symptoms-avatar.png"
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
              "Now, let's look at your symptoms. Being precise here helps me tailor your recovery path."
            </p>
          </div>
        </motion.section>

        {/* ── Questions ───────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-5">

          {/* Q01 — Walking Pain */}
          <motion.div className="onboarding-card" {...cardAnim(0)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 1</div>
            <label className="onboarding-card-heading">Walking Pain</label>
            <p className="text-body-sm text-on-surface-variant mt-2 mb-2">
              On a scale of 0 to 10, how severe is your typical knee pain when walking on a flat surface?
            </p>
            <RationaleBox text="Helps our AI filter out aggressive exercises and prioritize gentle mobility if your pain levels are currently high." />

            <PainSlider value={walkingPain} onChange={setWalkingPain} />

            {/* High-pain warning */}
            {walkingPain >= 7 && (
              <motion.div
                className="flex items-center gap-3 mt-5 p-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ color: '#f59e0b', fontSize: 20 }}>warning</span>
                <span className="text-xs font-sans font-medium" style={{ color: '#fbbf24' }}>
                  High pain intensity detected. We will prioritize non-weight bearing movements.
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Q02 — Morning Stiffness */}
          <motion.div className="onboarding-card" {...cardAnim(1)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 2</div>
            <label className="onboarding-card-heading">Morning Stiffness</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              How long does knee stiffness typically last after you wake up in the morning?
            </p>
            <RationaleBox text="Morning stiffness duration helps our system distinguish between mechanical wear-and-tear and potential inflammatory conditions." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard
                label="None"
                icon="check_circle"
                active={stiffness === 'none'}
                onClick={() => setStiffness('none')}
              />
              <OptionCard
                label="Less than 30 minutes"
                icon="schedule"
                active={stiffness === 'less30'}
                onClick={() => setStiffness('less30')}
              />
              <OptionCard
                label="More than 30 minutes"
                icon="history_toggle_off"
                active={stiffness === 'more30'}
                iconColor="#fb923c"
                onClick={() => setStiffness('more30')}
              />
            </div>

            {/* Stiffness validation inline hint */}
            {submitError && !stiffness && (
              <motion.p
                className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                Please select an option.
              </motion.p>
            )}
          </motion.div>

          {/* Q03 — Joint Stability */}
          <motion.div className="onboarding-card" {...cardAnim(2)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 3</div>
            <label className="onboarding-card-heading">Joint Stability</label>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Do you ever feel your knee 'giving way', buckling, or locking up during daily activities?
            </p>
            <RationaleBox text="Frequent buckling indicates joint instability. We use this to recommend stabilizing brace usage or proprioceptive balance exercises." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard
                label="Never"
                icon="verified"
                active={stability === 'never'}
                onClick={() => setStability('never')}
              />
              <OptionCard
                label="Rarely"
                icon="error_outline"
                active={stability === 'rarely'}
                onClick={() => setStability('rarely')}
              />
              <OptionCard
                label="Frequently"
                icon="warning"
                active={stability === 'frequently'}
                iconColor="#fb923c"
                onClick={() => setStability('frequently')}
              />
            </div>

            {submitError && !stability && (
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
            text="Continue to Mobility"
            className="w-72 h-14 text-lg mx-auto"
          />
        </motion.div>

      </main>
    </div>
  );
}
