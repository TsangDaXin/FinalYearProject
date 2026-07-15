const fs = require('fs');
const path = 'src/pages/landing/components/StageSimulator.tsx';
let code = fs.readFileSync(path, 'utf8');

// The SVG starts with <svg viewBox="0 0 200 220" and ends with </svg>
const startIdx = code.indexOf('<svg viewBox="0 0 200 220" className="w-full h-full select-none">');
const endIdx = code.indexOf('</svg>', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const header = code.substring(0, startIdx);
    const footer = code.substring(endIdx + 6); // +6 to remove </svg>
    
    // We also want to remove "mt-8" from the wrapper of the dynamic image since it is the only thing there now
    // and maybe increase its max-width
    let finalCode = header + footer;
    finalCode = finalCode.replace('mt-8 w-full flex justify-center px-4', 'w-full flex justify-center px-4');
    finalCode = finalCode.replace('max-w-[200px]', 'max-w-[280px]');
    
    fs.writeFileSync(path, finalCode);
    console.log("SVG successfully removed!");
} else {
    console.log("Could not find SVG boundaries");
}
