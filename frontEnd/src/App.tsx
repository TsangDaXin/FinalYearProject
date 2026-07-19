import { useState, useEffect } from 'react'

import Onboarding from './pages/onboarding/Onboarding'
import SymptomsAssessment from './pages/assessment/SymptomsAssessment'
import BehavioralLifestyle from './pages/assessment/BehavioralLifestyle'
import DiagnosticsUpload from './pages/diagnostics/DiagnosticsUpload'
import DiagnosticResults from './pages/diagnostics/DiagnosticResults'
import type { DiagnosticData } from './pages/diagnostics/DiagnosticResults'
import LoadingScreen from './pages/onboarding/LoadingScreen'

import DailyActionDashboard from './pages/dashboard/DailyActionDashboard'
import RoutinePage from './pages/treatment/RoutinePage'
import MasteryPage from './pages/treatment/MasteryPage'
import CareNetworkPage from './pages/treatment/CareNetworkPage'
import TreatmentDiagnosticsPage from './pages/treatment/TreatmentDiagnosticsPage'
import RoadmapPage from './pages/treatment/RoadmapPage'
import ProfilePage from './pages/profile/ProfilePage'
import LandingPage from './pages/landing/LandingPage'
import AuthPage from './features/auth/AuthPage'
import { RaycastBackground } from './components/ui/raycast-animated-background'
import { supabase } from './lib/supabase'

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'loading' | 'onboarding' | 'symptoms' | 'behavioral' | 'diagnostics' | 'dashboard' | 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile'>('landing')
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticData | null>(null)
  const [userStreak, setUserStreak] = useState(0)
  const [completedCheckInWeeks, setCompletedCheckInWeeks] = useState(0)
  const [onboardingDate, setOnboardingDate] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({})
  const [userId, setUserId] = useState<string | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [mounted, setMounted] = useState(false)

  // Trigger fade-in on mount
  useEffect(() => {
    setMounted(true)
  }, [])

  

  

  if (currentView === 'landing') {
    return <LandingPage onLoginClick={() => setCurrentView('auth')} />
  }

  if (currentView === 'loading') {
    return <LoadingScreen onComplete={() => setCurrentView('onboarding')} />
  }

  if (currentView === 'onboarding') {
    return <Onboarding 
      onComplete={(data) => {
        setOnboardingData(prev => ({...prev, ...data}))
        setCurrentView('symptoms')
      }} 
      onBack={() => setCurrentView('auth')} 
    />
  }

  if (currentView === 'symptoms') {
    return <SymptomsAssessment 
      onComplete={(data) => {
        setOnboardingData(prev => ({...prev, ...data}))
        setCurrentView('behavioral')
      }} 
      onBack={() => setCurrentView('onboarding')} 
    />
  }

  if (currentView === 'behavioral') {
    return <BehavioralLifestyle 
      onComplete={async (data) => {
        const finalData = { ...onboardingData, ...data }
        // Save gathered data to Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { error } = await supabase.from('profiles').update(finalData).eq('id', session.user.id)
          if (error) console.error("Error saving onboarding data:", error)
        }
        setCurrentView('diagnostics')
      }} 
      onBack={() => setCurrentView('symptoms')} 
    />
  }

  if (currentView === 'diagnostics') {
    if (!diagnosticResult) {
      return <DiagnosticsUpload 
        onComplete={(result) => {
          setDiagnosticResult(result)
          setCurrentView('dashboard')
        }} 
        onBack={() => setCurrentView('behavioral')} 
      />
    } else {
      return <TreatmentDiagnosticsPage onNavigate={(view) => setCurrentView(view)} userStreak={userStreak} completedCheckInWeeks={completedCheckInWeeks} previousResult={diagnosticResult} onNewResult={(result) => setDiagnosticResult(result)} userName={fullName || undefined} />
    }
  }

  if (currentView === 'dashboard') {
    if (!diagnosticResult) {
      setCurrentView('diagnostics')
      return null
    }
    return <DiagnosticResults data={diagnosticResult} onInitializeDashboard={() => setCurrentView('action_dashboard')} />
  }

  if (currentView === 'action_dashboard') {
    return <DailyActionDashboard 
      userName={fullName || undefined}
      imageUrl={diagnosticResult?.originalImageUrl}
      severityGrade={diagnosticResult?.severityGrade ?? 'Moderate'}
      topConfidence={diagnosticResult?.topConfidence ?? 78}
      confidenceDistribution={diagnosticResult?.confidenceDistribution ?? [
        { grade: 'Healthy', score: 5.2 },
        { grade: 'Doubtful', score: 16.9 },
        { grade: 'Minimal', score: 22.4 },
        { grade: 'Moderate', score: 42.8 },
        { grade: 'Severe', score: 12.7 },
      ]}
      userStreak={userStreak}
      onboardingDate={onboardingDate}
      onNavigate={(view) => setCurrentView(view)}
    />
  }

  if (currentView === 'routine') {
    return <RoutinePage patientKLGrade={diagnosticResult?.severityGrade ?? 'Moderate'} onNavigate={(view) => setCurrentView(view)} userName={fullName || undefined} />
  }

  if (currentView === 'mastery') {
    return <MasteryPage 
      userStreak={userStreak} 
      severityGrade={diagnosticResult?.severityGrade ?? 'Moderate'}
      onboardingDate={onboardingDate}
      onNavigate={(view) => setCurrentView(view)} 
      userName={fullName || undefined}
      userId={userId}
    />
  }

  if (currentView === 'care_network') {
    return <CareNetworkPage patientKLGrade={diagnosticResult?.severityGrade ?? 'Moderate'} onNavigate={(view) => setCurrentView(view)} userName={fullName || undefined} />
  }

  if (currentView === 'roadmap') {
    return <RoadmapPage
      severityGrade={diagnosticResult?.severityGrade ?? 'Severe'}
      onNavigate={(view) => setCurrentView(view)}
      userName={fullName || undefined}
    />
  }

  if (currentView === 'profile') {
    return <ProfilePage onNavigate={(view) => setCurrentView(view)} />
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-body-md select-none relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <RaycastBackground className="w-full h-full object-cover" />
      </div>
      {/* SaaS subtle accent glow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[110px] z-0 pointer-events-none" />
      {/* Centered Interaction Portal */}
      <section className="flex-1 flex flex-col p-md bg-transparent relative overflow-y-auto z-10">
        <AuthPage 
          onAuthSuccess={async (type, name) => {
            if (name) setFullName(name)
            
            if (type === 'signin') {
              const { data: { session } } = await supabase.auth.getSession()
              if (session?.user) {
                setUserId(session.user.id)
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('kl_grade, streak_current, onboarding_date, xray_image_url, gradcam_image_url, probability_distribution, confidence_score')
                  .eq('id', session.user.id)
                  .single()
                
                if (profile && profile.kl_grade !== null) {
                  setUserStreak(profile.streak_current || 0)
                  if (profile.onboarding_date) setOnboardingDate(profile.onboarding_date)

                  // Fetch completed weekly check-in count for diagnostics eligibility gate
                  const { count: checkinCount, error: checkinError } = await supabase
                    .from('weekly_checkins')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id)
                  if (checkinError) {
                    console.error('Failed to fetch check-in count:', checkinError)
                  }
                  setCompletedCheckInWeeks(checkinCount ?? 0)
                  const grades = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe']
                  let gradeStr = grades[profile.kl_grade] || 'Moderate'
                  
                  let imageUrl = profile.xray_image_url || '';
                  let gradCamUrl = profile.gradcam_image_url || '';
                  let topConfidence = profile.confidence_score || 85;
                  
                  let dist: any[] = [];
                  try {
                    if (typeof profile.probability_distribution === 'string') {
                      dist = JSON.parse(profile.probability_distribution);
                    } else if (Array.isArray(profile.probability_distribution)) {
                      dist = profile.probability_distribution;
                    }
                  } catch (e) {}

                  // Fallback if empty
                  if (!dist || dist.length === 0) {
                    dist = [
                      { grade: 'Healthy', score: profile.kl_grade === 0 ? 80 : 5 },
                      { grade: 'Doubtful', score: profile.kl_grade === 1 ? 80 : 5 },
                      { grade: 'Minimal', score: profile.kl_grade === 2 ? 80 : 5 },
                      { grade: 'Moderate', score: profile.kl_grade === 3 ? 80 : 5 },
                      { grade: 'Severe', score: profile.kl_grade === 4 ? 80 : 5 },
                    ];
                  }

                  // Check if there's a newer scan in scan_history
                  try {
                    const histRes = await fetch(`http://localhost:8000/scan-history/${session.user.id}`);
                    if (histRes.ok) {
                      const { scans } = await histRes.json();
                      if (scans && scans.length > 0) {
                        const latestScan = scans[0]; // ordered by scan_date DESC
                        gradeStr = grades[latestScan.klGrade] || gradeStr;
                        imageUrl = latestScan.xrayImageUrl || imageUrl;
                        gradCamUrl = latestScan.gradcamImageUrl || gradCamUrl;
                        topConfidence = latestScan.confidenceScore || topConfidence;
                        try { 
                          const parsedDist = typeof latestScan.probabilityDistribution === 'string' 
                            ? JSON.parse(latestScan.probabilityDistribution) 
                            : latestScan.probabilityDistribution;
                          if (parsedDist && parsedDist.length > 0) {
                            dist = parsedDist;
                          }
                        } catch (e) {}
                      }
                    }
                  } catch (e) {
                    console.error("Could not fetch scan history:", e);
                  }

                  // Populate diagnosticResult so the dashboard functions correctly
                  setDiagnosticResult({
                    originalImageUrl: imageUrl,
                    gradCamUrl: gradCamUrl,
                    severityGrade: gradeStr as any,
                    topConfidence: topConfidence,
                    confidenceDistribution: dist
                  })
                  setCurrentView('action_dashboard')
                  return
                }
              }
            }
            setCurrentView('loading')
          }} 
          onSkip={() => setCurrentView('diagnostics')}
          mounted={mounted} 
        />
      </section>
    </main>
  )
}

export default App
