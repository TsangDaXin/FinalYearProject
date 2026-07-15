const fs = require('fs');
const path = 'src/pages/landing/components/StageSimulator.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Shrink the existing layout
code = code.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">',
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch transform scale-75 origin-top -mb-24">'
);

// 2. Add the 2-column layout at the end
const endIdx = code.lastIndexOf('      </div>\n    </section>');

if (endIdx !== -1) {
    const newContent = `
        {/* NEW 2-Column Layout based on Reference Image */}
        <div className="mt-16 max-w-7xl mx-auto px-6 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Column: Stages Image */}
            <div className="w-full h-auto bg-white/95 rounded-xl overflow-hidden p-4 shadow-2xl shadow-blue-900/10 border border-[#424754]/50 flex items-center justify-center">
              <img src="/assets/kl_grades.png" alt="Stages of Knee Osteoarthritis" className="w-full h-auto object-contain max-h-[500px]" />
            </div>

            {/* Right Column: KL Grading System Card */}
            <div className="bg-[#1b1b1d] border border-[#424754]/50 rounded-2xl p-6 md:p-8 w-full shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                   <svg className="w-6 h-6 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-white font-bold text-xl">KL Grading System (Stage 0-4)</h3>
              </div>

              <div className="flex flex-col gap-4">
                {/* Item 1 */}
                <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-green-500 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base">Stage 0-1: Pre-Clinical</span>
                    <span className="text-gray-400 text-sm mt-1">Normal joint or doubtful joint space narrowing.</span>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">HEALTHY</span>
                </div>

                {/* Item 2 */}
                <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-yellow-500 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base">Stage 2: Mild (Definite)</span>
                    <span className="text-gray-400 text-sm mt-1">Osteophyte formation; cartilage starts thinning.</span>
                  </div>
                  <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">EARLY STAGE</span>
                </div>

                {/* Item 3 */}
                <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-orange-500 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base">Stage 3: Moderate</span>
                    <span className="text-gray-400 text-sm mt-1">Multiple osteophytes; definite joint narrowing.</span>
                  </div>
                  <span className="bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">PROGRESSING</span>
                </div>

                {/* Item 4 */}
                <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-red-500 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base">Stage 4: Severe</span>
                    <span className="text-gray-400 text-sm mt-1">Large spurs; severe narrowing; bone deformity.</span>
                  </div>
                  <span className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">CRITICAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

`;

    const header = code.substring(0, endIdx);
    const footer = code.substring(endIdx);
    
    fs.writeFileSync(path, header + newContent + footer);
    console.log('2-column layout injected and simulator shrunk');
} else {
    console.log('Could not find boundaries');
}
