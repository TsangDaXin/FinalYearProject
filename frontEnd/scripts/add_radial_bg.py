import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\dashboard\DailyActionDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_str = "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';"
new_import_str = "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';\nimport { RadialGlowBackground } from '../../components/ui/radial-glow-background';"
content = content.replace(import_str, new_import_str)

# Add component
root_div = '<div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white">'
new_root_div = '<div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">\n      <RadialGlowBackground />'
content = content.replace(root_div, new_root_div)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Background added successfully.")
