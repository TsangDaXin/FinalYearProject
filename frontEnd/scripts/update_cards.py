import re

file_path = r'c:\Users\Owent\Desktop\final_fyp\FinalYearProject\frontEnd\src\pages\diagnostics\DiagnosticResults.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the card container classes
content = content.replace(
    'className="bg-[#1b1b1d] border border-[#424754]/30 rounded-xl p-5 flex flex-col h-[400px]"',
    'className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 flex flex-col h-[400px] overflow-hidden"'
)

content = content.replace(
    'className="bg-[#1b1b1d] border border-[#424754]/30 rounded-xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden"',
    'className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 flex-1 flex flex-col justify-center overflow-hidden"'
)

content = content.replace(
    'className="bg-[#1b1b1d] border border-[#424754]/30 rounded-xl p-5 flex-1 flex flex-col justify-between"',
    'className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 flex-1 flex flex-col justify-between overflow-hidden"'
)

content = content.replace(
    'className="lg:col-span-2 bg-[#1b1b1d] border border-[#424754]/30 rounded-xl overflow-hidden flex flex-col"',
    'className="relative lg:col-span-2 bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl overflow-hidden flex flex-col"'
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

# Card 1 Replacement
card1_end_orig = """<img src={data.originalImageUrl} alt="Original X-Ray" className="w-full h-full object-cover" />
            </div>
          </motion.div>"""
card1_end_new = """<img src={data.originalImageUrl} alt="Original X-Ray" className="w-full h-full object-cover" />
            </div>""" + overlay_html + """          </motion.div>"""
content = content.replace(card1_end_orig, card1_end_new)

# Card 2 Replacement
card2_end_orig = """<div className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-orange-500/10 to-transparent mix-blend-overlay pointer-events-none" />
            </div>
          </motion.div>"""
card2_end_new = """<div className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-orange-500/10 to-transparent mix-blend-overlay pointer-events-none" />
            </div>""" + overlay_html + """          </motion.div>"""
content = content.replace(card2_end_orig, card2_end_new)

# Card 3a Replacement
card3a_end_orig = """className="h-full bg-[#FF6D29] rounded-full shadow-[0_0_10px_rgba(255,109,41,0.5)]"
                  />
                </div>
              </div>
            </motion.div>"""
card3a_end_new = """className="h-full bg-[#FF6D29] rounded-full shadow-[0_0_10px_rgba(255,109,41,0.5)]"
                  />
                </div>
              </div>""" + overlay_html + """            </motion.div>"""
content = content.replace(card3a_end_orig, card3a_end_new)

# Card 3b Replacement
card3b_end_orig = """<span className="w-10 text-xs text-right text-on-surface font-mono">{d.score.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>"""
card3b_end_new = """<span className="w-10 text-xs text-right text-on-surface font-mono">{d.score.toFixed(1)}%</span>
                  </div>
                ))}
              </div>""" + overlay_html + """            </motion.div>"""
content = content.replace(card3b_end_orig, card3b_end_new)

# Card 4 Replacement
card4_end_orig = """{intervention}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>"""
card4_end_new = """{intervention}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>""" + overlay_html + """          </motion.div>"""
content = content.replace(card4_end_orig, card4_end_new)

# 3. Remove "AI Model" and "Pro" badges
badges_html = """<div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-zinc-800/60 text-zinc-300 rounded-2xl">
                  AI Model
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-[#FF6D29]/10 text-[#FF6D29] border border-[#FF6D29]/20 rounded-2xl">
                  Pro
                </span>
              </div>"""

content = content.replace(badges_html, "<div></div>")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed successfully.")
