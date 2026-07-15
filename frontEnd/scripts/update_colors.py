import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\dashboard\DailyActionDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'Healthy': '#22c55e'", "'Healthy': '#10b981'")  # Emerald 500 (distinct green)
content = content.replace("'Doubtful': '#eab308'", "'Doubtful': '#fde047'") # Yellow 300 (bright distinct yellow)
content = content.replace("'Minimal': '#f97316'", "'Minimal': '#f97316'")   # Orange 500 (distinct orange)
content = content.replace("'Moderate': '#ef4444'", "'Moderate': '#ef4444'") # Red 500 (bright red)
content = content.replace("'Severe': '#dc2626'", "'Severe': '#7f1d1d'")     # Red 900 (very dark red)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Colors updated successfully.")
