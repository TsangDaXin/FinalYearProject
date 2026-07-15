const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'landing', 'components', 'InteractivePlayer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Center align the header
content = content.replace(
  'className="mb-14 text-left"',
  'className="mb-14 flex flex-col items-center text-center"'
);

// 2. Change the layout wrapper from grid-cols-3 to flex column
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">',
  '<div className="flex flex-col items-center max-w-4xl mx-auto gap-8">'
);

// 3. Update Video Frame classes
content = content.replace(
  'className="lg:col-span-2 relative w-full bg-[#13141A]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-[#453027] shadow-2xl flex flex-col justify-between group lg:h-[540px] min-h-[460px]"',
  'className="relative w-full bg-[#13141A]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-[#453027] shadow-2xl flex flex-col justify-between group min-h-[460px]"'
);

// 4. Update Clinical Context Panel classes
content = content.replace(
  'className="bg-[#13141A]/60 backdrop-blur-md rounded-3xl p-6 border border-[#453027] flex flex-col justify-between shadow-2xl relative overflow-hidden group lg:h-[540px] text-left"',
  'className="w-full bg-[#13141A]/60 backdrop-blur-md rounded-3xl p-6 border border-[#453027] flex flex-col shadow-2xl relative overflow-hidden group text-left"'
);

// 5. Update Clinical Context inner layout to adapt to full width
// We'll change the blocks from stacked to a grid so it looks good full-width
content = content.replace(
  '<div className="space-y-3 flex-1 overflow-y-auto pr-1">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mt-6">'
);

// Remove the hardcoded mb-2 and br from the title since it's now in a grid context or above it.
// Wait, the title is inside the same div. Let's adjust the title.
content = content.replace(
  '<h3 className="text-2xl font-extrabold font-heading text-white tracking-tight leading-tight mb-2">\n                  Empowering <br />Patient Care\n                </h3>',
  '<div className="md:col-span-3 mb-2">\n                  <h3 className="text-2xl font-extrabold font-heading text-white tracking-tight leading-tight">\n                    Empowering Patient Care\n                  </h3>\n                </div>'
);

// 6. Update the decorative stats grid at the bottom to align correctly
// Currently: <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#453027] mt-4 shrink-0">
// We can leave it as is or center it.

fs.writeFileSync(filePath, content);
console.log("Refactored InteractivePlayer.tsx successfully.");
