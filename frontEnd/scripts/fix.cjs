const fs = require('fs');
const path = 'src/pages/landing/components/StageSimulator.tsx';
let code = fs.readFileSync(path, 'utf8');

const brokenStr = `                    stroke={selectedStage >= 3 ? "#6366F1" : "#4b5563"}
                onChange={(e) => setSelectedStage(parseInt(e.target.value))}`;

const fixedStr = `                    stroke={selectedStage >= 3 ? "#6366F1" : "#4b5563"}
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />

                  {/* Label annotations */}
                  {selectedStage >= 2 && (
                    <g className="font-heading" fontSize="8" fill="#D16900" fontWeight="bold">
                      <text x="25" y="85" textAnchor="middle">Osteophyte</text>
                      <text x="175" y="85" textAnchor="middle">Osteophyte</text>
                    </g>
                  )}
                  {selectedStage === 4 && (
                    <g className="font-heading" fontSize="9" fill="#D16900" fontWeight="bold">
                      <text x="100" y="114" textAnchor="middle" className="text-orange-500 animate-pulse">★ BONE ATTRITION</text>
                    </g>
                  )}
                </svg>

                {/* NEW: Dynamic Image for KL Grade */}
                <div className="mt-8 w-full flex justify-center px-4">
                  <img 
                    src={\`/assets/kl_grades/KL\${selectedStage}.png\`} 
                    alt={\`KL Stage \${selectedStage}\`} 
                    className="w-full max-w-[200px] h-auto object-contain rounded-xl shadow-2xl shadow-blue-900/20 border border-[#453027]/50"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Slider control widget bottom */}
            <div className="p-6 bg-black/40 border-t border-[#453027] space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#BABABA] font-mono">Simulate Stage Level:</span>
                <span className="text-white font-bold font-mono">Level {selectedStage} / 4</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={selectedStage}
                onChange={(e) => setSelectedStage(parseInt(e.target.value))}`;

if (code.includes(brokenStr)) {
    code = code.replace(brokenStr, fixedStr);
    fs.writeFileSync(path, code);
    console.log("Successfully fixed the broken file!");
} else {
    console.log("Could not find the broken string!");
}
