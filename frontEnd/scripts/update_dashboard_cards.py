import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\dashboard\DailyActionDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the card container classes
content = content.replace(
    'className="bg-[#1b1b1d] border border-[#424754]/30 rounded-xl p-6"',
    'className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 overflow-hidden"'
)

content = content.replace(
    'className="bg-[#1b1b1d] border border-[#424754]/30 rounded-xl p-6 h-full flex flex-col"',
    'className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 h-full flex flex-col overflow-hidden"'
)

# 2. Add Floating Overlays before closing tags of the cards
overlay_html = """
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
"""

# Card 1 end:
card1_end_orig = """                  </div>
                </div>
              </motion.div>"""
card1_end_new = f"""                  </div>
                </div>{overlay_html}              </motion.div>"""
content = content.replace(card1_end_orig, card1_end_new)

# Card 2 end:
card2_end_orig = """<span className="material-symbols-outlined filled text-[18px]">play_arrow</span>
                  Start Today's Session
                </button>
              </motion.div>"""
card2_end_new = f"""<span className="material-symbols-outlined filled text-[18px]">play_arrow</span>
                  Start Today's Session
                </button>{overlay_html}              </motion.div>"""
content = content.replace(card2_end_orig, card2_end_new)

# Card 3 end:
card3_end_orig = """              </div>
            </motion.div>"""
# Wait, this might match multiple things. Let's make it more specific.
card3_end_orig_full = """                  </div>
                </div>

              </div>
            </motion.div>"""
card3_end_new_full = f"""                  </div>
                </div>

              </div>{overlay_html}            </motion.div>"""
content = content.replace(card3_end_orig_full, card3_end_new_full)


# Card 4 end:
card4_end_orig = """<span className="material-symbols-outlined text-[18px]">map</span>
              View Full Recovery Roadmap
            </button>
          </motion.div>"""
card4_end_new = f"""<span className="material-symbols-outlined text-[18px]">map</span>
              View Full Recovery Roadmap
            </button>{overlay_html}          </motion.div>"""
content = content.replace(card4_end_orig, card4_end_new)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Card UI updated successfully.")
