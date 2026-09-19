import os
from PIL import Image

ui_dir = os.path.join(os.getcwd(), "assets", "ui")
files = [
    "icon-play.png",
    "icon-coin.png",
    "icon-gem.png",
    "icon-heart.png",
    "icon-radar.png",
    "icon-shield.png",
    "icon-trophy.png"
]

for filename in files:
    filepath = os.path.join(ui_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    img = Image.open(filepath).convert("RGBA")
    width, height = img.size
    
    # Use BFS / Floodfill from all 4 corners to remove background
    datas = img.load()
    
    visited = set()
    queue = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    
    # Also add border pixels to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    for pt in queue:
        visited.add(pt)
        
    head = 0
    while head < len(queue):
        x, y = queue[head]
        head += 1
        
        r, g, b, a = datas[x, y]
        # Check if pixel is dark background (brightness / distance to black)
        # Background is near-black or dark green/black
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        max_c = max(r, g, b)
        
        if max_c < 45 or (max_c < 65 and abs(r - g) < 20 and abs(g - b) < 20):
            # Calculate alpha gradient for smooth anti-aliasing
            if max_c < 20:
                alpha = 0
            else:
                alpha = int(255 * ((max_c - 20) / 45))
                alpha = max(0, min(255, alpha))
            
            datas[x, y] = (r, g, b, alpha)
            
            # Add neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        nr, ng, nb, _ = datas[nx, ny]
                        nbright = max(nr, ng, nb)
                        if nbright < 65:
                            queue.append((nx, ny))

    # Also clean up any isolated remaining near-black pixels around edges
    for y in range(height):
        for x in range(width):
            r, g, b, a = datas[x, y]
            if a > 0:
                max_c = max(r, g, b)
                if max_c < 18:
                    datas[x, y] = (r, g, b, 0)
                elif max_c < 38:
                    alpha = int(255 * ((max_c - 18) / 20))
                    datas[x, y] = (r, g, b, min(a, alpha))

    # Save as true PNG format
    img.save(filepath, "PNG")
    print(f"Successfully processed and saved transparent PNG for {filename} (Size: {width}x{height})")
