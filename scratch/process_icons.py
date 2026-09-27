from PIL import Image, ImageFilter
from collections import deque
import sys

def remove_white_background(input_path, output_path, min_val=225, sat_thresh=18, feather=1.5):
    im = Image.open(input_path).convert('RGB')
    w, h = im.size
    pixels = im.load()
    
    # 1. Flood fill from borders to identify outer background
    visited = bytearray(w * h)
    queue = deque()
    
    # Add all border pixels
    for x in range(w):
        for y in [0, h - 1]:
            idx = y * w + x
            if not visited[idx]:
                visited[idx] = 1
                queue.append((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            idx = y * w + x
            if not visited[idx]:
                visited[idx] = 1
                queue.append((x, y))
                
    # BFS
    is_bg = bytearray(w * h)
    
    while queue:
        cx, cy = queue.popleft()
        r, g, b = pixels[cx, cy]
        min_c = min(r, g, b)
        max_c = max(r, g, b)
        sat = max_c - min_c
        
        # Check if background-like (bright and low saturation / neutral)
        # Or very bright regardless of saturation
        if min_c >= min_val and sat <= sat_thresh or min_c >= 250:
            is_bg[cy * w + cx] = 255  # 255 = background
            
            # Check 4 neighbors
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h:
                    nidx = ny * w + nx
                    if not visited[nidx]:
                        visited[nidx] = 1
                        queue.append((nx, ny))

    # Create initial alpha mask (0 = transparent/bg, 255 = foreground)
    alpha_img = Image.new('L', (w, h), 255)
    alpha_data = alpha_img.load()
    
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if is_bg[idx] == 255:
                r, g, b = pixels[x, y]
                min_c = min(r, g, b)
                # Soft transition for anti-aliasing near edges
                if min_c > 248:
                    alpha_data[x, y] = 0
                else:
                    # ramp between min_val and 248
                    ratio = (248 - min_c) / max(1, (248 - min_val))
                    alpha_data[x, y] = int(255 * ratio * 0.5)

    # Clean up alpha mask: smooth edges slightly using MinFilter/BoxBlur for anti-aliasing
    # Blur the alpha mask slightly to remove jaggedness
    alpha_smooth = alpha_img.filter(ImageFilter.GaussianBlur(radius=feather))
    alpha_smooth_data = alpha_smooth.load()
    
    # Unmultiply color from white background for anti-aliased edge pixels
    result = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    res_pixels = result.load()
    
    for y in range(h):
        for x in range(w):
            a = alpha_smooth_data[x, y]
            if a == 0:
                continue
            r, g, b = pixels[x, y]
            if a < 255:
                # Color un-multiplication from white (255, 255, 255)
                # Observed: C = fg * (a/255) + 255 * (1 - a/255)
                # fg = (C - 255 * (1 - a/255)) / (a/255)
                fa = a / 255.0
                fg_r = max(0, min(255, int((r - 255.0 * (1.0 - fa)) / fa)))
                fg_g = max(0, min(255, int((g - 255.0 * (1.0 - fa)) / fa)))
                fg_b = max(0, min(255, int((b - 255.0 * (1.0 - fa)) / fa)))
                res_pixels[x, y] = (fg_r, fg_g, fg_b, a)
            else:
                res_pixels[x, y] = (r, g, b, 255)
                
    result.save(output_path, 'PNG')
    print(f"Saved transparent PNG to {output_path}")

if __name__ == '__main__':
    inp = sys.argv[1]
    out = sys.argv[2]
    min_v = int(sys.argv[3]) if len(sys.argv) > 3 else 225
    sat_t = int(sys.argv[4]) if len(sys.argv) > 4 else 18
    remove_white_background(inp, out, min_v, sat_t)
