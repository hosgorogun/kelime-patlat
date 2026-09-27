from PIL import Image, ImageFilter
from collections import deque

def process_profile_icon():
    im = Image.open('assets/ui/icon-profile.png').convert('RGB')
    w, h = im.size
    pixels = im.load()

    # Flood fill from borders
    visited = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in [0, h - 1]:
            visited[y * w + x] = 1
            queue.append((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[y * w + x]:
                visited[y * w + x] = 1
                queue.append((x, y))

    is_bg = bytearray(w * h)
    while queue:
        cx, cy = queue.popleft()
        is_bg[cy * w + cx] = 1
        for dx, dy in ((-1,0), (1,0), (0,-1), (0,1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    r, g, b = pixels[nx, ny]
                    # Background criteria: bright warm white/cream
                    if r >= 242 and g >= 235 and b >= 180:
                        visited[nidx] = 1
                        queue.append((nx, ny))

    # Also find enclosed white pockets (e.g. between wings and crown if any)
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if not is_bg[idx]:
                r, g, b = pixels[x, y]
                # If pure white / light cream isolated pocket with min > 248
                if r >= 250 and g >= 248 and b >= 235:
                    is_bg[idx] = 1

    # Alpha map
    alpha_img = Image.new('L', (w, h), 255)
    alpha_data = alpha_img.load()

    for y in range(h):
        for x in range(w):
            if is_bg[y * w + x]:
                r, g, b = pixels[x, y]
                # Anti-aliasing ramp near border of object
                min_c = min(r, g, b)
                if min_c >= 246 and b >= 200:
                    alpha_data[x, y] = 0
                else:
                    # Soft edge
                    ratio = (246 - min_c) / 30.0
                    alpha_data[x, y] = max(0, min(255, int(ratio * 128)))

    # Smooth the alpha mask slightly for clean sub-pixel anti-aliasing
    alpha_smooth = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.2))
    alpha_smooth_data = alpha_smooth.load()

    # Create RGBA
    res = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    res_data = res.load()

    for y in range(h):
        for x in range(w):
            a = alpha_smooth_data[x, y]
            if a == 0:
                continue
            r, g, b = pixels[x, y]
            if a < 255:
                # Color decontaminate / unmultiply from white (255, 255, 255)
                fa = a / 255.0
                fg_r = max(0, min(255, int((r - 255.0 * (1.0 - fa)) / fa)))
                fg_g = max(0, min(255, int((g - 255.0 * (1.0 - fa)) / fa)))
                fg_b = max(0, min(255, int((b - 255.0 * (1.0 - fa)) / fa)))
                res_data[x, y] = (fg_r, fg_g, fg_b, a)
            else:
                res_data[x, y] = (r, g, b, 255)

    res.save('scratch/profile-transparent.png')
    
    # Test on yellow #FFD66E
    bg = Image.new('RGBA', (w, h), (255, 214, 110, 255))
    comp = Image.alpha_composite(bg, res)
    comp.save('scratch/profile-on-yellow-test.png')
    print('Done processing profile icon!')

process_profile_icon()
