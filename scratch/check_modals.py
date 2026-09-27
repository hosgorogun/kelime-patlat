import os
import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

files = [
    'lives-modal.tsx', 'daily-treasure-modal.tsx', 'loot-box-reveal-modal.tsx',
    'match-history-modal.tsx', 'user-profile-modal.tsx', 'modern-alert-modal.tsx',
    'terms-modal.tsx', 'duel-invite-modal.tsx', 'matchmaking-overlay.tsx', 'match-rewards.tsx'
]

print("=== CHECKING MODALS ===")
for f in files:
    p = os.path.join('components', f)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
            c = fp.read()
        for m in re.finditer(r'([a-zA-Z0-9_]*overlay[a-zA-Z0-9_]*)\s*:\s*\{([^}]+)\}', c, re.I):
            k = m.group(1)
            b = m.group(2)
            bg = re.search(r'backgroundColor\s*:\s*["\']([^"\']+)["\']', b)
            if bg:
                print(f'{f}: {k} -> {bg.group(1)}')
