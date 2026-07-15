import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\diagnostics\DiagnosticResults.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add FlowButton import if missing
if "FlowButton" not in content:
    content = content.replace(
        "import { motion, AnimatePresence } from 'framer-motion';",
        "import { motion, AnimatePresence } from 'framer-motion';\nimport { FlowButton } from '../../components/ui/flow-button';"
    )

# 2. Replace the buttons
old_buttons = """<div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-semibold text-sm"
            >
              Export PDF
            </button>
            <button
              onClick={() => setIsValidatingOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FF6D29] hover:bg-[#FF8D59] text-white transition-colors font-semibold text-sm shadow-[0_0_20px_rgba(255,109,41,0.3)]"
            >
              Validate Results
            </button>
          </div>"""

new_buttons = """<div className="flex items-center gap-3 shrink-0">
            <FlowButton 
              text="Export PDF" 
              onClick={() => setIsPdfModalOpen(true)} 
              className="!border-outline-variant !text-on-surface hover:!border-transparent" 
            />
            <FlowButton 
              text="Validate Results" 
              onClick={() => setIsValidatingOpen(true)} 
            />
          </div>"""

content = content.replace(old_buttons, new_buttons)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
