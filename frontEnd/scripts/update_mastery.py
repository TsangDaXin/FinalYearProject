import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\treatment\MasteryPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add RadialGlowBackground import
if "RadialGlowBackground" not in content:
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { RadialGlowBackground } from '../../components/ui/radial-glow-background';")

# 2. Add RadialGlowBackground to the main wrapper
old_wrapper = '<div className="font-sans overflow-x-hidden bg-[#050505] text-[#F3F4F6] min-h-screen selection:bg-[#3B82F6] selection:text-white flex">'
new_wrapper = '<div className="font-sans overflow-x-hidden bg-[#050505] text-[#F3F4F6] min-h-screen selection:bg-[#FF6D29] selection:text-white flex relative">\n      <RadialGlowBackground />'
content = content.replace(old_wrapper, new_wrapper)

# 3. Replace all blue with orange
content = content.replace('#3B82F6', '#FF6D29')
content = content.replace('rgba(59, 130, 246', 'rgba(255, 109, 41')
content = content.replace('rgba(59,130,246', 'rgba(255,109,41')
content = content.replace('#2563EB', '#FF8D59')
content = content.replace('#1E40AF', '#C2410C') # Dark blue to dark orange
content = content.replace('#60A5FA', '#FF8D59') # Light blue to light orange

# 4. Update .bento-card style
old_css = """        .bento-card {
            background-color: #0F0F11;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
            border-color: rgba(255, 109, 41, 0.4);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }"""
        
new_css = """        .bento-card {
            background: linear-gradient(to bottom right, rgba(39, 39, 42, 0.8), rgba(24, 24, 27, 0.9));
            border: 1px solid rgba(113, 113, 122, 0.5);
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .bento-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05));
            pointer-events: none;
        }
        .bento-card:hover {
            border-color: rgba(255, 109, 41, 0.4);
            box-shadow: 0 8px 30px rgba(255, 109, 41, 0.15);
        }"""
content = content.replace(old_css, new_css)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("MasteryPage updated successfully.")
