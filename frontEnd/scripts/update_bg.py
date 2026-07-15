import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\diagnostics\DiagnosticResults.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add RaycastBackground import if missing
if "RaycastBackground" not in content:
    content = content.replace(
        "import { FlowButton } from '../../components/ui/flow-button';",
        "import { FlowButton } from '../../components/ui/flow-button';\nimport { RaycastBackground } from '../../components/ui/raycast-animated-background';"
    )

# 2. Replace the main wrapper div
old_wrapper = """  return (
    <div className="min-h-screen bg-[#131315] text-on-surface font-sans p-4 md:p-8 overflow-y-auto selection:bg-[#FF6D29] selection:text-white pb-28 md:pb-32">
      <div className="max-w-[1400px] mx-auto space-y-6">"""

new_wrapper = """  return (
    <div className="relative min-h-screen w-full bg-[#131315] text-on-surface font-sans overflow-hidden selection:bg-[#FF6D29] selection:text-white">
      {/* Background animation matching sign-in page */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <RaycastBackground className="w-full h-full object-cover" />
      </div>
      {/* SaaS subtle accent glow */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[110px] z-0 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-screen overflow-y-auto p-4 md:p-8 pb-28 md:pb-32">
        <div className="max-w-[1400px] mx-auto space-y-6">"""

# wait, adding an extra div level means I would need to add a closing div at the end of the return statement.
# To avoid missing closing div issues, I'll just keep the original structure but change it so it works:
new_wrapper_alt = """  return (
    <div className="relative min-h-screen w-full bg-[#131315] text-on-surface font-sans p-4 md:p-8 overflow-y-auto overflow-x-hidden selection:bg-[#FF6D29] selection:text-white pb-28 md:pb-32">
      {/* Background animation matching sign-in page */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <RaycastBackground className="w-full h-full object-cover" />
      </div>
      {/* SaaS subtle accent glow */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[110px] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-6">"""

content = content.replace(old_wrapper, new_wrapper_alt)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
