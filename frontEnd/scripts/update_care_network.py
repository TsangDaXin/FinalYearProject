import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\treatment\CareNetworkPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add RadialGlowBackground import
if "RadialGlowBackground" not in content:
    content = content.replace("import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';", "import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';\nimport { RadialGlowBackground } from '../../components/ui/radial-glow-background';")

# 2. Add RadialGlowBackground to the main wrapper
old_wrapper = '<div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#3B82F6] selection:text-white">'
new_wrapper = '<div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">\n      <RadialGlowBackground />'
content = content.replace(old_wrapper, new_wrapper)

# 3. Replace all blue with orange
content = content.replace('#3B82F6', '#FF6D29')
content = content.replace('rgba(59,130,246', 'rgba(255,109,41')
content = content.replace('#2563EB', '#FF8D59')

# 4. Update the card backgrounds to match the dashboard
old_card_class = "className={`bg-[#1b1b1d] border rounded-xl p-6 flex flex-col h-full group transition-all duration-300 relative"
new_card_class = "className={`bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border rounded-xl p-6 flex flex-col h-full group transition-all duration-300 relative shadow-2xl"
content = content.replace(old_card_class, new_card_class)

# Add floating overlays to cards
overlay_html = """                      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' }}></div>"""

old_card_end = """                          Visit Booking Portal
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </a>
                      </div>
                    </motion.div>"""

new_card_end = f"""                          Visit Booking Portal
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </a>
                      </div>
{overlay_html}
                    </motion.div>"""
content = content.replace(old_card_end, new_card_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("CareNetworkPage updated successfully.")
