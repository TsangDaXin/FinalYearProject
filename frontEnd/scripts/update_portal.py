import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\dashboard\DailyActionDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the blue theme with the orange theme
content = content.replace('#3B82F6', '#FF6D29')
content = content.replace('#2563EB', '#FF8D59')

# 2. Fix the color mapping for Scan Probability Distribution
# Replace the old constants
old_colors = """const PIE_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626'];
const BAR_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626'];"""

new_colors = """const GRADE_COLORS: Record<string, string> = {
  'Healthy': '#22c55e',
  'Doubtful': '#eab308',
  'Minimal': '#f97316',
  'Moderate': '#ef4444',
  'Severe': '#dc2626'
};"""
content = content.replace(old_colors, new_colors)

# Replace Pie Cell filling logic
old_pie_cell = """<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />"""
new_pie_cell = """<Cell key={`cell-${index}`} fill={GRADE_COLORS[_entry.name] || '#FF6D29'} />"""
content = content.replace(old_pie_cell, new_pie_cell)

# Replace Bar background logic
old_bar_style = """style={{ backgroundColor: BAR_COLORS[idx] }}"""
new_bar_style = """style={{ backgroundColor: GRADE_COLORS[d.grade] || '#FF6D29' }}"""
content = content.replace(old_bar_style, new_bar_style)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed successfully.")
