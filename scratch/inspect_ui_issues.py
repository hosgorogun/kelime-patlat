import os
import re

components_dir = "components"
files = [f for f in os.listdir(components_dir) if f.endswith(".tsx")]

print("=== CHECKING ALL MODAL BACKDROPS AND OVERLAYS ===")
for f in sorted(files):
    p = os.path.join(components_dir, f)
    with open(p, "r", encoding="utf-8", errors="ignore") as fp:
        content = fp.read()
    
    # Search for overlay, backdrop, modalBg, modalWrap
    matches = re.findall(r'(\b[a-zA-Z0-9_]*(?:overlay|backdrop|dim|modalBackground|modalBg)[a-zA-Z0-9_]*\s*:\s*\{[^}]+\})', content, re.IGNORECASE)
    for m in matches:
        # extract key and backgroundColor
        key_match = re.match(r'([a-zA-Z0-9_]+)', m)
        key = key_match.group(1) if key_match else "unknown"
        bg_match = re.search(r'backgroundColor\s*:\s*["\']([^"\']+)["\']', m)
        if bg_match:
            bg = bg_match.group(1)
            if not ("rgba" in bg or "transparent" in bg or bg == "rgba(35, 48, 59, 0.42)"):
                print(f"[{f}] {key}: backgroundColor is '{bg}' (Expected rgba overlay!)")

print("\n=== CHECKING CARDS AND BOXES WITH ODD BACKGROUNDS OR CONTRAST ===")
for f in sorted(files):
    p = os.path.join(components_dir, f)
    with open(p, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    
    for i, line in enumerate(lines):
        # Look for text with color matching background, or washed out colors
        if "#f8b0b0" in line or "#bf5757" in line or "#ed4343" in line or "#98732c" in line or "#8c7540" in line or "#279f73" in line:
            print(f"[{f}:{i+1}] suspicious muted color: {line.strip()[:80]}")
