import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import './KneeJoint3D.css'

const GRADE_MAP: Record<string, number> = { Healthy: 0, Doubtful: 1, Minimal: 2, Moderate: 3, Severe: 4 }

// ─── Annotation Detail Data ──────────────────────────────────────────────────
const ANNOTATION_DETAILS: Record<string, Record<string, { title: string; description: string; recommendation: string }>> = {
  Healthy: {
    'Healthy joint space': {
      title: 'Normal Joint Space Width',
      description: 'The distance between the femur and tibia appears within normal range (4-8mm), indicating adequate cartilage thickness and healthy joint mechanics. No evidence of narrowing or asymmetric loading.',
      recommendation: 'Maintain your current activity level. Regular low-impact exercise (swimming, cycling, walking) helps preserve cartilage health. Consider maintaining a healthy weight to reduce joint loading forces.',
    },
    'Intact cartilage': {
      title: 'Healthy Articular Cartilage',
      description: 'The cartilage lining both the femoral condyles and tibial plateau appears intact with normal thickness (2-4mm). No signs of fibrillation, erosion, or thinning detected by the AI model.',
      recommendation: 'Continue with joint-friendly activities. Adequate hydration, omega-3 fatty acids, and glucosamine supplementation may support long-term cartilage maintenance. Annual monitoring is sufficient.',
    },
  },
  Doubtful: {
    'Early osteophytes': {
      title: 'Early Osteophyte Formation (KL-1)',
      description: 'The AI detected minute bony projections forming at the joint margins. These are the earliest radiographic signs of degenerative change — often just 1-2mm in size. They represent the body\'s initial response to subtle changes in joint loading patterns.',
      recommendation: 'This is an early warning sign. Focus on quadriceps and hamstring strengthening exercises to improve joint stability. Consider a physiotherapy assessment for biomechanical optimization. Weight management is particularly impactful at this stage.',
    },
    'Slight narrowing': {
      title: 'Possible Early Joint Space Reduction',
      description: 'The model detects a borderline reduction in the tibiofemoral joint space, suggesting the very earliest cartilage changes. This is often the first mechanical consequence of osteoarthritis — the cartilage begins to lose its water content and compressive resilience.',
      recommendation: 'Low-impact exercise is crucial — it pumps nutrients into cartilage. Avoid prolonged kneeling or deep squatting. Consider anti-inflammatory foods (turmeric, fish oil) and ensure adequate vitamin D levels.',
    },
  },
  Minimal: {
    'Osteophyte formation': {
      title: 'Definite Osteophytes Present (KL-2)',
      description: 'Clear bony spurs (3-5mm) are now visible at the medial and/or lateral joint margins. These form because the body attempts to increase the joint\'s surface area to distribute load more evenly as cartilage begins to thin. They are a definitive radiographic marker of early OA.',
      recommendation: 'Begin a structured strengthening programme targeting the VMO (vastus medialis oblique) and hip abductors. These muscles are critical for medial compartment offloading. Consider a knee brace for high-load activities. Discuss with your GP about referral to physiotherapy.',
    },
    'Cartilage thinning': {
      title: 'Cartilage Degradation Detected',
      description: 'The AI model identified areas where the articular cartilage has noticeably thinned, particularly in the medial compartment. Cartilage is transitioning from its healthy state (shown as green) toward a degraded state (orange). This reflects progressive proteoglycan loss and collagen network disruption.',
      recommendation: 'This is a critical intervention window. Structured physiotherapy (3x/week), weight loss if applicable (each kg lost = 4kg less force on the knee per step), and activity modification can significantly slow progression. Avoid high-impact activities (running, jumping) and transition to cycling or swimming.',
    },
  },
  Moderate: {
    'Significant narrowing': {
      title: 'Definite Joint Space Narrowing (KL-3)',
      description: 'The joint space has reduced substantially, indicating moderate-to-significant cartilage loss in the tibiofemoral compartment. The femur and tibia are now closer together than normal, increasing bone-on-bone loading risk. Subchondral bone stress is likely elevated.',
      recommendation: 'Active rehabilitation is essential. A multi-modal approach is recommended: structured physiotherapy programme (quadriceps, hip strengthening), potential use of an unloader knee brace, weight management, and pain management strategies (topical NSAIDs, paracetamol). Discuss intra-articular options (e.g., corticosteroid or hyaluronic acid injections) with your specialist.',
    },
    'Subchondral sclerosis': {
      title: 'Subchondral Bone Hardening',
      description: 'The AI detected increased bone density (sclerosis) beneath the cartilage surface — shown as the orange pulsing glow in the 3D model. This occurs because the subchondral bone remodels and thickens in response to abnormal mechanical loading from cartilage loss. It indicates the bone is "compensating" for inadequate cartilage cushioning.',
      recommendation: 'This finding suggests established OA with bone involvement. Focus on load-modifying interventions: activity pacing (alternate between rest and activity), supportive footwear with shock-absorbing insoles, and avoid prolonged standing. Calcium and vitamin D supplementation supports bone health. Discuss referral to an orthopaedic specialist.',
    },
    'Osteophytes present': {
      title: 'Moderate Osteophyte Burden',
      description: 'Multiple osteophytes of moderate size (5-8mm) are present at the joint margins. At this stage, they may begin to impinge on surrounding soft tissues, potentially contributing to pain and restricted range of motion beyond what cartilage loss alone would cause.',
      recommendation: 'If osteophytes are limiting range of motion or causing mechanical symptoms (catching, locking), discuss this with your healthcare provider. Gentle range-of-motion exercises and stretching can help maintain flexibility. Avoid end-range forced movements that may aggravate osteophyte-related impingement.',
    },
  },
  Severe: {
    'Bone-on-bone contact': {
      title: 'Near-Complete Cartilage Loss',
      description: 'The AI model indicates the joint space has narrowed to near-zero in the most affected compartment, meaning the femur and tibia are in direct or near-direct contact. This represents the most advanced stage of cartilage destruction where the natural shock-absorbing layer is largely absent.',
      recommendation: 'This level of severity typically warrants specialist referral for comprehensive management planning. Options include: advanced physiotherapy focusing on pain management and function maintenance, walking aids if needed, intra-articular injections for symptom relief, and discussion of surgical options (total knee arthroplasty) if conservative measures are insufficient. Quality of life and functional goals should guide decision-making.',
    },
    'Severe degeneration': {
      title: 'Advanced Structural Deterioration',
      description: 'Widespread degenerative changes are present across the entire joint: substantial cartilage loss, bone remodeling, subchondral cyst formation likely, and possible early valgus/varus deformity. The joint\'s biomechanical integrity is significantly compromised.',
      recommendation: 'A comprehensive multidisciplinary approach is recommended: orthopaedic specialist review, pain management team, physiotherapy for function optimization (not reversal), and psychological support if chronic pain is affecting quality of life. Discuss the full spectrum of surgical and non-surgical options with your healthcare team.',
    },
    'Large osteophytes': {
      title: 'Large Osteophyte Formation (>8mm)',
      description: 'Prominent bone spurs exceeding 8mm are visible at multiple joint margins. At this size, they represent significant structural remodeling and may independently contribute to pain, reduced range of motion, and mechanical symptoms. They can impinge on the capsule, ligaments, and periarticular tissues.',
      recommendation: 'Large osteophytes that limit function or cause significant pain may be a factor in surgical decision-making. In the interim, avoid activities that provoke mechanical symptoms. Gentle, pain-free range of motion is more beneficial than aggressive stretching. Hot/cold therapy may provide symptomatic relief for osteophyte-related discomfort.',
    },
  },
}

// ─── Femur Bone ──────────────────────────────────────────────────────────────
function Femur() {
  return (
    <group position={[0, 2.4, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.1, 0.85, 3.2, 32]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[-0.6, -1.6, 0]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0.6, -1.6, 0]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.75} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Tibia Bone ──────────────────────────────────────────────────────────────
function Tibia({ gradeIndex }: { gradeIndex: number }) {
  const ref = useRef<THREE.Group>(null)
  const targetY = useMemo(() => -1.6 - (0.9 - (0.9 - gradeIndex * 0.18)), [gradeIndex])
  useFrame(() => { if (ref.current) ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.03) })
  return (
    <group ref={ref} position={[0, targetY, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.15, 32]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[1.0, 0.78, 3.0, 32]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.75} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Cartilage Layer ─────────────────────────────────────────────────────────
function Cartilage({ gradeIndex, yPosition }: { gradeIndex: number; yPosition: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const targetOpacity = Math.max(0.35, 0.90 - gradeIndex * 0.13)
  const color = useMemo(() => new THREE.Color('#4caf50').lerp(new THREE.Color('#ff7043'), gradeIndex / 4), [gradeIndex])
  const targetScale = Math.max(0.04, 0.22 - gradeIndex * 0.045) / 0.22
  useFrame(() => {
    if (ref.current) {
      ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetScale, 0.03)
      ;(ref.current.material as THREE.MeshStandardMaterial).opacity = THREE.MathUtils.lerp((ref.current.material as THREE.MeshStandardMaterial).opacity, targetOpacity, 0.03)
    }
  })
  return (
    <mesh ref={ref} position={[0, yPosition, 0]} castShadow>
      <cylinderGeometry args={[0.75, 0.75, 0.22, 32]} />
      <meshStandardMaterial color={color} transparent opacity={targetOpacity} roughness={0.4} />
    </mesh>
  )
}

// ─── Osteophytes ─────────────────────────────────────────────────────────────
function Osteophytes({ gradeIndex }: { gradeIndex: number }) {
  if (gradeIndex < 1) return null
  const spurSize = 0.06 + (gradeIndex - 1) * 0.07
  const positions = [[0.78, 0.8, 0.1], [-0.78, 0.8, 0.1], [0.82, -0.95, 0.0], [-0.82, -0.95, 0.0]]
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <sphereGeometry args={[spurSize, 16, 16]} />
          <meshStandardMaterial color="#e8d5b0" roughness={0.6} emissive="#ff6b35" emissiveIntensity={gradeIndex >= 3 ? 0.3 : 0} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Sclerosis ───────────────────────────────────────────────────────────────
function Sclerosis({ gradeIndex }: { gradeIndex: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => { if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 2) * 0.1 })
  if (gradeIndex < 3) return null
  return (
    <mesh ref={ref} position={[0, -0.85, 0]}>
      <cylinderGeometry args={[1.0, 1.0, 0.05, 32]} />
      <meshStandardMaterial color="#ff8c42" emissive="#ff8c42" emissiveIntensity={0.2 + (gradeIndex - 3) * 0.15} transparent opacity={0.5} />
    </mesh>
  )
}

// ─── Clickable Annotations ───────────────────────────────────────────────────
function Annotations({ gradeIndex, onAnnotationClick }: { gradeIndex: number; onAnnotationClick: (label: string) => void }) {
  const annotations = useMemo(() => {
    if (gradeIndex === 0) return [
      { pos: [1.8, 0.5, 0] as [number, number, number], label: 'Healthy joint space' },
      { pos: [-1.8, 1.2, 0] as [number, number, number], label: 'Intact cartilage' },
    ]
    if (gradeIndex === 1) return [
      { pos: [1.8, 0.8, 0] as [number, number, number], label: 'Early osteophytes' },
      { pos: [-1.8, 0.2, 0] as [number, number, number], label: 'Slight narrowing' },
    ]
    if (gradeIndex === 2) return [
      { pos: [1.8, 0.8, 0] as [number, number, number], label: 'Osteophyte formation' },
      { pos: [-1.8, 0.2, 0] as [number, number, number], label: 'Cartilage thinning' },
    ]
    if (gradeIndex === 3) return [
      { pos: [1.8, 0.5, 0] as [number, number, number], label: 'Significant narrowing' },
      { pos: [-1.8, -0.8, 0] as [number, number, number], label: 'Subchondral sclerosis' },
      { pos: [1.8, 1.2, 0] as [number, number, number], label: 'Osteophytes present' },
    ]
    return [
      { pos: [1.8, 0.3, 0] as [number, number, number], label: 'Bone-on-bone contact' },
      { pos: [-1.8, -0.8, 0] as [number, number, number], label: 'Severe degeneration' },
      { pos: [1.8, 1.5, 0] as [number, number, number], label: 'Large osteophytes' },
    ]
  }, [gradeIndex])

  return (
    <>
      {annotations.map((a, i) => (
        <Html key={i} position={a.pos} center distanceFactor={8}>
          <div className="annotation-card annotation-clickable" onClick={() => onAnnotationClick(a.label)}>
            <span className="dot" />
            <span>{a.label}</span>
            <span className="tap-icon">›</span>
          </div>
        </Html>
      ))}
    </>
  )
}

// ─── Controls ────────────────────────────────────────────────────────────────
function ControlsWrapper() {
  const controlsRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const handleStart = () => { setAutoRotate(false); if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  const handleEnd = () => { timeoutRef.current = setTimeout(() => setAutoRotate(true), 4000) }
  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} minDistance={3} maxDistance={15} enablePan autoRotate={autoRotate} autoRotateSpeed={0.4} onStart={handleStart} onEnd={handleEnd} />
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function KneeScene({ gradeIndex, onAnnotationClick }: { gradeIndex: number; onAnnotationClick: (label: string) => void }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 3, -3]} color="#4fc3f7" intensity={0.6} />
      <spotLight position={[0, 8, 0]} intensity={0.8} castShadow penumbra={0.5} angle={0.5} />
      <ControlsWrapper />
      <Femur />
      <Tibia gradeIndex={gradeIndex} />
      <Cartilage gradeIndex={gradeIndex} yPosition={0.85} />
      <Cartilage gradeIndex={gradeIndex} yPosition={-0.65} />
      <Osteophytes gradeIndex={gradeIndex} />
      <Sclerosis gradeIndex={gradeIndex} />
      <Annotations gradeIndex={gradeIndex} onAnnotationClick={onAnnotationClick} />
    </>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function KneeSkeleton() {
  return (
    <div className="w-full h-[480px] rounded-xl bg-[#0d0d0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#424754] to-[#2a2a30] animate-pulse" />
        <span className="text-xs text-on-surface-variant animate-pulse">Loading 3D model...</span>
      </div>
    </div>
  )
}

// ─── Detailed Grade Reasoning ────────────────────────────────────────────────
const GRADE_REASONING: Record<string, { summary: string; findings: string[]; clinical: string; action: string }> = {
  Healthy: {
    summary: 'The 3D model shows a fully intact knee joint with healthy cartilage, normal joint spacing, and no bone spurs.',
    findings: ['Joint space width within normal parameters (4-8mm)', 'Articular cartilage intact on both femoral and tibial surfaces', 'No osteophyte formation detected at joint margins', 'Subchondral bone density appears normal', 'No evidence of asymmetric loading or malalignment'],
    clinical: 'No radiographic evidence of osteoarthritis. The knee joint demonstrates normal structural integrity across all evaluated dimensions.',
    action: 'Continue with regular low-impact exercise, maintain a healthy weight, and ensure adequate calcium/vitamin D intake. Annual monitoring is sufficient. No intervention required.',
  },
  Doubtful: {
    summary: 'The earliest signs of change are detected — minute osteophytes beginning to form at joint margins with cartilage remaining largely intact.',
    findings: ['Possible minute osteophyte formation (1-2mm) at medial/lateral margins', 'Joint space width borderline — very early narrowing may be present', 'Cartilage thickness still within acceptable range but at lower boundary', 'No subchondral sclerosis detected', 'No alignment abnormalities'],
    clinical: 'KL Grade 1 represents the borderline between normal aging and early pathology. These changes are common in the general population and may or may not progress.',
    action: 'Preventive strengthening exercises (quadriceps, hip abductors). Activity modification to avoid repeated high-impact loading. Weight management is particularly impactful. Re-scan recommended in 12-18 months to monitor progression.',
  },
  Minimal: {
    summary: 'Definite osteophytes are visible with early cartilage degradation and initial joint space narrowing — confirmed early-stage OA.',
    findings: ['Definite osteophytes (3-5mm) present at joint margins', 'Articular cartilage showing measurable thinning (medial > lateral)', 'Joint space narrowing detectable — early but definite', 'Possible very early subchondral changes', 'Cartilage color transition indicates proteoglycan loss'],
    clinical: 'KL Grade 2 confirms early osteoarthritis with definite structural changes. This is a critical intervention window — early treatment at this stage has the highest impact on slowing disease progression.',
    action: 'Begin structured physiotherapy (3x/week minimum): focus on VMO strengthening, hip abductor exercises, and neuromuscular control. Weight loss if BMI > 25 (each kg = 4kg less force per step). Transition to low-impact activities. Consider referral to musculoskeletal specialist.',
  },
  Moderate: {
    summary: 'Significant structural changes are present: prominent bone spurs, notable cartilage loss, visible joint narrowing, and subchondral sclerosis.',
    findings: ['Moderate-to-large osteophytes (5-8mm) at multiple margins', 'Definite joint space narrowing — cartilage loss confirmed', 'Subchondral sclerosis present (orange glow) — bone stress response active', 'Possible subchondral cyst formation', 'Cartilage integrity significantly compromised in load-bearing zones'],
    clinical: 'KL Grade 3 represents established osteoarthritis with multi-dimensional structural involvement. The joint is actively remodeling in response to progressive cartilage loss.',
    action: 'Comprehensive multi-modal management required: structured physiotherapy programme, pain management strategy (topical/oral NSAIDs as needed), unloader knee brace consideration, weight management, activity pacing. Discuss intra-articular injections (corticosteroid/hyaluronic acid) with specialist. Surgical consultation may be appropriate depending on symptoms and functional limitation.',
  },
  Severe: {
    summary: 'Advanced deterioration: large osteophytes, near-complete cartilage loss, minimal joint space (bone-on-bone), and widespread sclerosis with bone remodeling.',
    findings: ['Large osteophytes (>8mm) dominating joint margins', 'Near-complete or complete joint space obliteration', 'Extensive subchondral sclerosis — widespread bone stress', 'Likely subchondral cyst formation', 'Possible varus/valgus deformity from asymmetric loading', 'Bone-on-bone articulation in primary load zone'],
    clinical: 'KL Grade 4 represents the most advanced radiographic stage of osteoarthritis. The joint has undergone extensive structural deterioration with significant impact on mechanical function.',
    action: 'Specialist orthopaedic referral recommended. Comprehensive options discussion: advanced physiotherapy for function maintenance, walking aids, pain management team input, intra-articular injections for symptomatic relief, and total knee arthroplasty (TKA) candidacy assessment. Psychological support for chronic pain management if needed.',
  },
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface KneeJoint3DProps {
  data: { severityGrade: string }
}

export default function KneeJoint3D({ data }: KneeJoint3DProps) {
  const gradeIndex = GRADE_MAP[data.severityGrade] ?? 0
  const [hasInteracted, setHasInteracted] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const gradeColors = ['#06D6A0', '#A7D129', '#FFD166', '#FF8C42', '#EF476F']
  const reasoning = GRADE_REASONING[data.severityGrade]
  const gradeDetails = ANNOTATION_DETAILS[data.severityGrade] || {}

  const handleAnnotationClick = (label: string) => {
    setSelectedAnnotation(label)
  }

  return (
    <div className="space-y-4">
      {/* 3D Canvas */}
      <div
        className="w-full h-[480px] rounded-xl overflow-hidden relative border border-[#424754]/30"
        onPointerDown={() => setHasInteracted(true)}
      >
        <Suspense fallback={<KneeSkeleton />}>
          <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }} style={{ background: '#0d0d0f' }}>
            <KneeScene gradeIndex={gradeIndex} onAnnotationClick={handleAnnotationClick} />
          </Canvas>
        </Suspense>

        {!hasInteracted && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none animate-pulse">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">3d_rotation</span>
            <span className="text-[10px] text-on-surface-variant">Drag to rotate · Scroll to zoom · Click labels for details</span>
          </div>
        )}
      </div>

      {/* Annotation Detail Popup */}
      {selectedAnnotation && gradeDetails[selectedAnnotation] && (
        <div className="bg-[#0d0d0f] border border-[#FF6D29]/30 rounded-xl p-5 relative animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setSelectedAnnotation(null)}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">close</span>
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6D29] shadow-[0_0_8px_rgba(255,109,41,0.5)]" />
            <h4 className="text-sm font-bold text-on-surface">{gradeDetails[selectedAnnotation].title}</h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{gradeDetails[selectedAnnotation].description}</p>
          <div className="bg-[#131315] border border-[#424754]/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-green-400 text-[14px]">clinical_notes</span>
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">AI Recommendation</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">{gradeDetails[selectedAnnotation].recommendation}</p>
          </div>
        </div>
      )}

      {/* Enhanced Grade Panel */}
      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: gradeColors[gradeIndex], boxShadow: `0 0 10px ${gradeColors[gradeIndex]}` }} />
          <span className="text-sm font-bold text-on-surface">{data.severityGrade}</span>
          <span className="text-xs text-on-surface-variant">— KL Grade {gradeIndex}</span>
        </div>

        {/* Summary */}
        <p className="text-sm text-on-surface-variant leading-relaxed">{reasoning.summary}</p>

        {/* Key Findings */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">radiology</span>
            <span className="text-[11px] font-semibold text-on-surface">Key Radiographic Findings</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            {reasoning.findings.map((f, i) => (
              <li key={i} className="flex gap-2 text-xs text-on-surface-variant leading-relaxed">
                <span className="text-[#FF6D29] mt-0.5">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clinical Interpretation */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-blue-400 text-[14px]">stethoscope</span>
            <span className="text-[11px] font-semibold text-on-surface">Clinical Interpretation</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">{reasoning.clinical}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-[#0d0d0f] border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-green-400 text-[14px]">clinical_notes</span>
            <span className="text-[11px] font-semibold text-green-400">Recommended Action Plan</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">{reasoning.action}</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-[10px] text-blue-300">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>
            <strong>Important:</strong> This AI assessment is based on radiographic features only. Always consult your healthcare provider for comprehensive diagnosis and personalised treatment planning.
          </p>
        </div>
      </div>
    </div>
  )
}
