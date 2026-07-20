import { useEffect, useState } from 'react'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import BoxLoader from '../../components/ui/box-loader'
import { GradientBackground } from '../../components/ui/paper-design-shader-background'

interface Props {
  onComplete: () => void
}

const DURATION = 5500 // ms

// ── Animated ellipsis ───────────────────────────────────────────────────────
function Ellipsis() {
  const [dots, setDots] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 450)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="inline-block w-8 text-left">
      {'.'.repeat(dots)}
    </span>
  )
}


// ── Main component ──────────────────────────────────────────────────────────
export default function LoadingScreen({ onComplete }: Props) {
  const [exiting, setExiting] = useState(false)

  // Progress bar motion value
  const rawProgress = useMotionValue(0)
  const widthPct = useTransform(rawProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    // Animate progress from 0 → 1 over DURATION ms
    const ctrl = animate(rawProgress, 1, {
      duration: DURATION / 1000,
      ease: 'easeInOut',
    })

    const exitTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 600)
    }, DURATION)

    return () => {
      ctrl.stop()
      clearTimeout(exitTimer)
    }
  }, [onComplete, rawProgress])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* ── Shader Background ─────────────────────────────────────────── */}
      <GradientBackground />
      {/* Dimming overlay to ensure text contrast */}
      <div className="absolute inset-0 z-0 bg-black/75 pointer-events-none" />

      {/* ── Center content ───────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-7 px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Box Loader */}
        <div className="mb-16 mt-12 scale-125 md:scale-150">
          <BoxLoader />
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[15px] font-sans uppercase tracking-[0.28em] text-brand-orange/80">
            SteadyGerak Clinical System
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-white leading-tight">
            SteadyGerak
          </h1>
        </div>

        {/* Status */}
        <p className="text-xl font-sans text-white/90">
          Preparing your session<Ellipsis />
        </p>

        {/* Progress bar */}
        <div className="w-80 md:w-[28rem] mt-6">
          <div
            className="h-[6px] rounded-full overflow-hidden relative shadow-inner"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full overflow-hidden"
              style={{
                width: widthPct,
                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
                boxShadow: '0 0 12px rgba(249,115,22,0.6)',
              }}
            >
              {/* Animated shimmer highlight */}
              <motion.div
                className="absolute inset-0 w-[200%] h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '50%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 px-px">
            <span className="text-[10px] font-sans text-brand-orange/70 uppercase tracking-widest">
              Initializing
            </span>
            <motion.span
              className="text-[10px] font-sans text-brand-orange tabular-nums"
            >
              {/* Live % readout */}
              <ProgressPercent value={rawProgress} />
            </motion.span>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}

// Small helper to display live percentage from a motion value
function ProgressPercent({ value }: { value: ReturnType<typeof useMotionValue<number>> }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const unsub = value.on('change', v => setDisplay(Math.round(v * 100)))
    return unsub
  }, [value])
  return <>{display}%</>
}
