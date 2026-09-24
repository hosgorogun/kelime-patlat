import base64

with open('assets/images/splash.png', 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

html_content = f'''<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @keyframes pulseGlow {{
      0%, 100% {{ transform: scale(1); opacity: 0.95; }}
      50% {{ transform: scale(1.04); opacity: 1; }}
    }}
    @keyframes shimmer {{
      0% {{ width: 8%; }}
      50% {{ width: 88%; }}
      100% {{ width: 88%; }}
    }}
    .animate-hud-pulse {{
      animation: pulseGlow 1.6s infinite ease-in-out;
    }}
    .animate-progress {{
      animation: shimmer 3s ease-out forwards;
    }}
  </style>
</head>
<body class="bg-transparent text-white font-sans antialiased p-2 flex justify-center items-center">
  <div class="relative w-[340px] h-[580px] rounded-[32px] overflow-hidden border-4 border-emerald-500/40 shadow-2xl bg-[#050B14] flex flex-col justify-end p-4">
    
    <!-- Base64 Encoded High-Res Background Image -->
    <img 
      src="data:image/png;base64,{b64_data}" 
      class="absolute inset-0 w-full h-full object-cover"
      alt="New Splash Background Photo"
    />
    
    <!-- Top Subtle Vignette Gradient -->
    <div class="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#050B14]/60 to-transparent pointer-events-none"></div>

    <!-- Bottom Subtle Vignette Gradient -->
    <div class="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#050B14]/85 via-[#050B14]/30 to-transparent pointer-events-none"></div>

    <!-- Elevated & Restyled Cyber HUD Card (Lifted Position) -->
    <div class="relative z-10 mb-16 w-full px-1">
      <div class="w-full bg-[#081812]/95 border-[1.5px] border-[#3ee8b5]/60 rounded-2xl p-4 shadow-[0_0_24px_rgba(62,232,181,0.5)] backdrop-blur-md">
        
        <!-- Status Text & Percentage -->
        <div class="flex justify-between items-center mb-2.5">
          <span class="text-xs font-black text-[#f0fdf4] tracking-wide animate-hud-pulse drop-shadow-[0_2px_8px_rgba(62,232,181,0.8)]">
            Kelime Patlat dünyası hazır!
          </span>
          <span class="text-sm font-black text-[#3ee8b5] tracking-wider drop-shadow-[0_0_6px_rgba(62,232,181,0.9)]">%88</span>
        </div>

        <!-- Glowing Neon Taller Progress Bar Track -->
        <div class="w-full h-3 bg-[#05120e] rounded-full border border-[#3ee8b5]/40 overflow-hidden relative p-[1px]">
          <div class="h-full rounded-full bg-gradient-to-r from-[#FF647C] via-[#FFC24A] to-[#3EE8B5] animate-progress relative">
            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_#3ee8b5]"></div>
          </div>
        </div>

        <!-- Subtitle & Version -->
        <div class="flex justify-between items-center mt-3 pt-2 border-t border-[#3ee8b5]/20 text-[10px] font-black tracking-wider">
          <span class="text-[#FFC24A] drop-shadow-[0_1px_4px_rgba(255,194,74,0.5)]">⚡ SİBER KELİME MATRİSİ</span>
          <span class="text-[#A7F3D0]">v1.0.0</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>'''

with open(r'C:\Users\ogo77\.gemini\antigravity\brain\1c2ec0fe-b92b-49dc-84a5-208c99cf8ac2\splash_preview.html', 'w', encoding='utf-8') as out:
    out.write(html_content)

print('Updated splash_preview.html with elevated position and premium design!')
