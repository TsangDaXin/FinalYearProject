import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\diagnostics\DiagnosticResults.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports at the top
if "lucide-react" not in content:
    content = content.replace(
        "import { motion, AnimatePresence } from 'framer-motion';",
        "import { motion, AnimatePresence } from 'framer-motion';\nimport { Paperclip, Link, Code, Mic, Send, Info } from 'lucide-react';"
    )

# 2. Replace the Chat Card block
# We will use string manipulation to extract and replace the exact section.
start_marker = "{/* Card 5: SteadyGerak Assistant Chat"
end_marker = "          </motion.div>\n\n        </motion.div>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    old_card = content[start_idx:end_idx]

    new_card = """{/* Card 5: SteadyGerak Assistant Chat */}
          <motion.div variants={item} className="relative flex flex-col rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl overflow-hidden h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-zinc-700/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-zinc-400">SteadyGerak Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-zinc-800/60 text-zinc-300 rounded-2xl">
                  AI Model
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-[#FF6D29]/10 text-[#FF6D29] border border-[#FF6D29]/20 rounded-2xl">
                  Pro
                </span>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#FF6D29]/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">smart_toy</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#FF6D29]/20 text-zinc-100 rounded-tr-sm'
                        : 'bg-zinc-800/80 text-zinc-300 rounded-tl-sm border border-zinc-700/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6D29]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">smart_toy</span>
                  </div>
                  <div className="bg-zinc-800/80 p-3 rounded-2xl rounded-tl-sm text-sm text-zinc-400 border border-zinc-700/50">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Section */}
            <div className="relative overflow-hidden shrink-0 border-t border-zinc-700/50 bg-zinc-900/50">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-sm text-zinc-100 placeholder-zinc-500 scrollbar-none"
                placeholder="Ask about your condition..."
                disabled={isLoading}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-zinc-800/5 to-transparent pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(39, 39, 42, 0.05), transparent)' }}
              ></div>

              {/* Controls Section */}
              <div className="px-4 pb-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Attachment Group */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                      {/* File Upload */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-3 transform">
                        <Paperclip className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Upload files
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>

                      {/* Link */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-105 hover:rotate-6 transform">
                        <Link className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Web link
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>

                      {/* Code */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-green-400 hover:bg-zinc-800/80 hover:scale-105 hover:rotate-3 transform">
                        <Code className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Code repo
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>
                    </div>

                    {/* Voice Button */}
                    <button className="group relative p-2 bg-transparent border border-zinc-700/30 rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-110 hover:rotate-2 transform hover:border-[#FF6D29]/30">
                      <Mic className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-3" />
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                        Voice input
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Character Counter */}
                    <div className="text-[10px] font-medium text-zinc-500 hidden sm:block">
                      <span>{chatInput.length}</span>/<span className="text-zinc-400">2000</span>
                    </div>

                    {/* Send Button */}
                    <button 
                      onClick={sendMessage}
                      disabled={isLoading || !chatInput.trim()}
                      className="group relative p-2.5 bg-gradient-to-r from-[#FF6D29] to-[#DF5412] border-none rounded-xl cursor-pointer transition-all duration-300 text-white shadow-lg hover:from-[#FF8D59] hover:to-[#FF6D29] hover:scale-110 hover:shadow-[#FF6D29]/30 hover:shadow-xl active:scale-95 transform hover:-rotate-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:rotate-0"
                      style={{
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(255, 109, 41, 0.4)',
                      }}
                    >
                      <Send className="w-4 h-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12 group-hover:scale-110" />
                      
                      {/* Animated background glow */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#DF5412] opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-lg transform scale-110"></div>
                      
                      {/* Ripple effect on click */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-200 rounded-xl"></div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50 text-[10px] text-zinc-500 gap-6">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>
                      Press <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-400 font-mono text-[9px] shadow-sm">Enter</kbd> to send
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>System online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
"""
    content = content.replace(old_card, new_card)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement done successfully.")
