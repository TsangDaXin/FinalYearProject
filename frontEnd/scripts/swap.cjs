const fs = require('fs');
const path = 'src/pages/landing/components/StageSimulator.tsx';
let code = fs.readFileSync(path, 'utf8');

const rightStartStr = '          {/* Right Column: Interactive KL Grading Cards */}';
const leftStartStr = '          {/* Left Column: Interactive Biological/Radiographic SVG Simulator */}';

const rightIdx = code.indexOf(rightStartStr);
const leftIdx = code.indexOf(leftStartStr);
const endIdx = code.lastIndexOf('        </div>\n\n      </div>');

if (rightIdx !== -1 && leftIdx !== -1 && endIdx !== -1) {
    const header = code.substring(0, rightIdx);
    const rightBlock = code.substring(rightIdx, leftIdx);
    const leftBlock = code.substring(leftIdx, endIdx);
    const footer = code.substring(endIdx);
    
    // Swap them! leftBlock first, then rightBlock
    let newCode = header + leftBlock + rightBlock + footer;
    
    // Change the wrapper layout
    newCode = newCode.replace('<div className="flex flex-col gap-8">', '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">');
    
    // Change BentoGrid classes
    newCode = newCode.replace('className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4"', 'className="grid-cols-1 gap-3"');
    
    fs.writeFileSync(path, newCode);
    console.log('Swapped and modified classes successfully');
} else {
    console.log('Could not find indices', {rightIdx, leftIdx, endIdx});
}
