import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { RadialGlowBackground } from '../../components/ui/radial-glow-background';

interface CareNetworkPageProps {
  patientKLGrade: string;
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile') => void;
  userName?: string;
}

const GRADE_MAP: Record<string, number> = {
  'Healthy': 0,
  'Doubtful': 1,
  'Minimal': 2,
  'Moderate': 3,
  'Severe': 4,
};

function getKLGradeNumber(grade: string): number {
  return GRADE_MAP[grade] ?? 3;
}

type ProviderCategory = 'Surgery' | 'Physiotherapy' | 'Screening';

const USER_LOCATION: [number, number] = [3.1412, 101.6865]; // KL Center Mock

const PROVIDERS = [
  { icon: 'local_hospital', name: 'Gleneagles Hospital', specialty: 'Orthopaedic & Trauma Surgery', url: 'https://gleneagles.com.my/kuala-lumpur/orthopaedics', category: 'Surgery' as ProviderCategory, coords: [3.1601, 101.7408] as [number, number] },
  { icon: 'precision_manufacturing', name: 'KPJ Healthcare', specialty: 'Robotic Total Knee Replacement Package', url: 'https://www.kpjhealth.com.my/', category: 'Surgery' as ProviderCategory, coords: [3.1345, 101.6267] as [number, number] },
  { icon: 'clinical_notes', name: 'Pantai Hospital KL', specialty: 'Knee Osteoarthritis Screening Package', url: 'https://www.pantai.com.my/kuala-lumpur', category: 'Screening' as ProviderCategory, coords: [3.1197, 101.6669] as [number, number] },
  { icon: 'local_hospital', name: 'Pantai Hospital KL', specialty: 'Orthopaedic Surgery Department', url: 'https://www.pantai.com.my/kuala-lumpur', category: 'Surgery' as ProviderCategory, coords: [3.1197, 101.6669] as [number, number] },
  { icon: 'physical_therapy', name: 'Rootheal Group', specialty: 'Specialized Osteoarthritis Treatment', url: 'https://rootheal.com/', category: 'Physiotherapy' as ProviderCategory, coords: [3.0903, 101.7247] as [number, number] },
  { icon: 'search_insights', name: 'Sunway Medical Centre', specialty: 'Orthopaedic Specialist Directory', url: 'https://www.sunwaymedical.com/', category: 'Surgery' as ProviderCategory, coords: [3.0673, 101.6092] as [number, number] },
  { icon: 'physical_therapy', name: 'YourPhysio Cheras', specialty: 'Targeted Physiotherapy & Rehabilitation', url: 'https://yourphysio.com.my/', category: 'Physiotherapy' as ProviderCategory, coords: [3.0983, 101.7371] as [number, number] },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PROVIDERS_WITH_DIST = PROVIDERS.map(p => {
  const dist = calculateDistance(USER_LOCATION[0], USER_LOCATION[1], p.coords[0], p.coords[1]);
  const timeMins = Math.round((dist / 30) * 60); // Assuming 30km/h average city speed
  return { ...p, distance: dist.toFixed(1) + ' km', timeMins };
}).sort((a, b) => a.timeMins - b.timeMins);

// Custom Leaflet Icons
const createCustomIcon = (iconName: string, color: string, bgColor: string, isPulsing: boolean = false) => {
  const pulseHtml = isPulsing ? `
    <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background-color: ${color}; animation-duration: 2s;"></div>
    <div class="absolute -inset-2 rounded-full animate-pulse opacity-20" style="background-color: ${color};"></div>
  ` : '';
  
  return L.divIcon({
    html: `
      <div class="relative w-[36px] h-[36px] group">
        ${pulseHtml}
        <div class="relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style="background-color: ${bgColor}; border: 2px solid ${color}; box-shadow: 0 0 15px ${color}80;">
          <span class="material-symbols-outlined" style="color: ${color}; font-size: 20px;">${iconName}</span>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40]
  });
};

const userIcon = createCustomIcon('my_location', '#10B981', '#131315', true);
const getProviderIcon = (isRecommended: boolean) => 
  createCustomIcon('local_hospital', isRecommended ? '#FF6D29' : '#9CA3AF', '#1b1b1d', isRecommended);

export default function CareNetworkPage({ patientKLGrade, onNavigate, userName = 'Guest' }: CareNetworkPageProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | ProviderCategory>('All');

  const klGradeNum = getKLGradeNumber(patientKLGrade);
  const recommendedCategory: ProviderCategory = klGradeNum >= 3 ? 'Surgery' : 'Physiotherapy';

  const filteredProviders = PROVIDERS_WITH_DIST.filter(
    (p) => activeFilter === 'All' || p.category === activeFilter
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };

  return (
    <div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">
      <RadialGlowBackground />
      {/* Side Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-[#0A0A0C] border-r border-white/5 flex-col py-8 px-4 hidden md:flex">
        <div className="px-4 mb-8 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">SteadyGerak</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-1 font-semibold">Clinical Rehab</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => onNavigate('action_dashboard')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Main Dashboard</span>
          </button>
          <button onClick={() => onNavigate('routine')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">event_repeat</span>
            <span className="text-sm font-medium">Routine</span>
          </button>
          <button onClick={() => onNavigate('mastery')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">insights</span>
            <span className="text-sm font-medium">Mastery & Progress</span>
          </button>
          <button className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 w-full text-left">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups_2</span>
            <span className="text-sm">Care Network</span>
          </button>
          <button onClick={() => onNavigate('diagnostics')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">biotech</span>
            <span className="text-sm font-medium">Diagnostics</span>
          </button>
          <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm font-medium">Profile & Biometrics</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 flex flex-col overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="flex justify-between items-center w-full px-6 md:px-10 h-16 sticky top-0 z-40 glass-nav">
          <div className="flex items-center gap-4">
            <span className="md:hidden material-symbols-outlined text-[#FF6D29] cursor-pointer">menu</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">{userName}</span>
              <div className="w-8 h-8 rounded-full bg-gray-700 border border-white/20 flex items-center justify-center text-xs font-bold">{(userName || 'U').charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10 flex-grow">

          {/* Hero Header */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden relative min-h-[280px] flex flex-col justify-center border border-white/10"
          >
            <div className="absolute inset-0 z-0">
              <img
                alt="Professional orthopaedic doctors"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7JY61ex0ZSGdpQ9hrmE9TouCBGMJ8ID5s7jPWw92UpCS-Qch1LFyWp32rN9wILcsyMORncQSBJj3Rop_nWRudnBXeGaP2cV3SlxTYW3ImZI7kFE2blN3EtaOzHk1Mvuv5Yq05rk8kDYLCU_mD-59D-uSEg_INhQsjdvPbTd-Lmu_7-QVC-9gaO4EhtXFMy6ZaOuBKMZrl8kcpX9ERtU99A4ErIxxkZEoIymDeTeBbbcdbnPj_3U3u2wwS5Xp8vZ5oASlWofkDIQo"
              />
            </div>
            
            <div className="bg-[#131315]/60 backdrop-blur-md p-8 border-t border-[#424754]/50 w-full absolute bottom-0 z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Clinical Care Network</h2>
              <p className="text-base text-white/80 leading-relaxed max-w-2xl">
                {klGradeNum >= 3
                  ? `Based on your ${patientKLGrade} diagnosis, Orionix recommends prioritizing Orthopaedic Surgical consultations.`
                  : `Based on your ${patientKLGrade} diagnosis, Orionix recommends prioritizing targeted Physiotherapy & Rehabilitation.`}
              </p>
            </div>
          </motion.section>

          {/* Verified Partner Institutions */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 shrink-0">
                <span className="material-symbols-outlined text-[#FF6D29]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <h3 className="text-xl font-bold text-white tracking-tight">Verified Partner Institutions</h3>
              </div>
              
              {/* Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                {(['All', 'Surgery', 'Physiotherapy', 'Screening'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      activeFilter === filter
                        ? 'bg-[#FF6D29] text-white shadow-[0_0_15px_rgba(255,109,41,0.3)] border border-[#FF6D29]'
                        : 'bg-[#1b1b1d] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filteredProviders.map((provider, idx) => {
                  const isAIRecommended = provider.category === recommendedCategory;
                  
                  return (
                    <motion.div
                      layout
                      key={provider.name + idx}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-[#13141A]/50 backdrop-blur-md rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 select-none text-left relative group overflow-hidden ${
                        isAIRecommended
                          ? 'border-[#FF6D29]/50 shadow-[0_0_15px_rgba(255,109,41,0.15)] hover:bg-[#13141A]/90 hover:shadow-[0_0_20px_rgba(255,109,41,0.25)]'
                          : 'border-[#453027] hover:border-[#FF6D29]/50 hover:bg-[#13141A]/90 hover:shadow-xl hover:shadow-[#FF6D29]/5'
                      }`}
                    >
                      {/* Inside card subtle glow design */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF6D29]/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="space-y-4">
                        {/* Icon & Badge Line */}
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-[#FF6D29]/10 border border-[#FF6D29]/15 text-[#FF6D29] rounded-xl group-hover:bg-[#FF6D29] group-hover:text-white transition-all duration-300 shrink-0">
                            <span className="material-symbols-outlined text-2xl">{provider.icon}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            {isAIRecommended && (
                              <span className="text-[9px] font-bold tracking-wider uppercase bg-[#FF6D29] text-white px-2.5 py-0.5 rounded font-mono shadow-[0_0_10px_rgba(255,109,41,0.3)]">
                                AI Recommended
                              </span>
                            )}
                            <span className="text-[9px] font-bold tracking-wider uppercase bg-white/5 border border-[#453027] px-2.5 py-0.5 rounded text-[#BABABA] font-mono mt-1">
                              {provider.category}
                            </span>
                          </div>
                        </div>

                        {/* Text stack */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-base font-heading group-hover:text-[#FF6D29] transition-colors duration-200">
                            {provider.name}
                          </h3>
                          <p className="text-[#BABABA] text-xs leading-relaxed font-sans flex items-center justify-between">
                            <span>{provider.specialty}</span>
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="material-symbols-outlined text-[12px] text-[#FF6D29]">location_on</span>
                              {provider.distance}
                            </span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={provider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 pt-4 border-t border-[#453027] flex items-center justify-between text-[11px] text-[#BABABA] font-mono group-hover:text-[#FF6D29] transition-colors duration-200 cursor-pointer"
                      >
                        <span>Visit Booking Portal</span>
                        <span className="material-symbols-outlined text-[14px] transform group-hover:translate-x-1 transition-transform">open_in_new</span>
                      </a>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </section>

          {/* Clinic Locator Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF6D29]/10 rounded-xl border border-[#FF6D29]/20 flex">
                  <span className="material-symbols-outlined text-[#FF6D29]">map</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Locate Nearby Facilities</h3>
              </div>
              <span className="px-4 py-1.5 bg-[#1b1b1d]/80 backdrop-blur-xl border border-white/10 rounded-full text-xs text-gray-300 shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-medium">
                Kuala Lumpur, MY
              </span>
            </div>

            <div className="w-full h-[600px]">
              {/* Full Width Map */}
              <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] group">
                {/* Map Glow Overlay */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none z-[1000] transition-all duration-500 group-hover:ring-[#FF6D29]/30" />
                
                <MapContainer 
                  center={USER_LOCATION} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%', backgroundColor: '#0A0A0C' }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <Marker position={USER_LOCATION} icon={userIcon}>
                    <Popup className="glassmorphic-popup">
                      <div className="p-1">
                        <div className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#10B981] text-sm">my_location</span>
                          Your Location
                        </div>
                        <p className="text-xs text-gray-400">Current Position (Mock)</p>
                      </div>
                    </Popup>
                  </Marker>

                  {filteredProviders.map((provider, idx) => {
                    const isAIRecommended = provider.category === recommendedCategory;
                    return (
                      <Marker key={idx} position={provider.coords} icon={getProviderIcon(isAIRecommended)}>
                        <Popup className="glassmorphic-popup">
                          <div className="p-1 min-w-[200px]">
                            {isAIRecommended && (
                              <div className="text-[10px] uppercase tracking-wider text-[#FF6D29] font-bold mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                AI Recommended
                              </div>
                            )}
                            <h4 className="font-bold text-white text-base mb-1">{provider.name}</h4>
                            <p className="text-xs text-gray-400 mb-4">{provider.specialty}</p>
                            
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-black/40 rounded-lg p-2.5 flex flex-col items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-[#FF6D29] text-[18px] mb-1">directions_car</span>
                                <span className="text-[11px] text-white font-mono">{provider.timeMins} mins</span>
                              </div>
                              <div className="bg-black/40 rounded-lg p-2.5 flex flex-col items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-[#FF6D29] text-[18px] mb-1">route</span>
                                <span className="text-[11px] text-white font-mono">{provider.distance}</span>
                              </div>
                            </div>
                            
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&origin=${USER_LOCATION[0]},${USER_LOCATION[1]}&destination=${provider.coords[0]},${provider.coords[1]}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full bg-[#FF6D29] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#FF8D59] transition-all duration-300 shadow-[0_0_15px_rgba(255,109,41,0.4)] hover:shadow-[0_0_25px_rgba(255,109,41,0.6)]"
                            >
                              <span className="material-symbols-outlined text-sm">navigation</span>
                              Start Route
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-3 bg-[#1b1b1d]/50 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md shadow-lg">
                <div className="w-8 h-8 rounded-full bg-[#FF6D29]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-[#FF6D29]">info</span>
                </div>
                <p className="text-sm text-gray-400">
                  Export your Orionix diagnostic report as a PDF before your consultation.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
      {/* Leaflet CSS Overrides for Glassmorphism */}
      <style>{`
        .glassmorphic-popup .leaflet-popup-content-wrapper {
          background: rgba(20, 20, 22, 0.85) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
        }
        .glassmorphic-popup .leaflet-popup-tip {
          background: rgba(20, 20, 22, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-top: none !important;
          border-left: none !important;
        }
        .glassmorphic-popup .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.5) !important;
          margin-top: 4px !important;
          margin-right: 4px !important;
        }
        .glassmorphic-popup .leaflet-popup-close-button:hover {
          color: white !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
