from pathlib import Path

from PIL import Image

source = Path("/home/ubuntu/webdev-static-assets/kelime-patlat-logo-v2.png")
targets = [
    Path("/home/ubuntu/kelime-patlat/assets/images/icon.png"),
    Path("/home/ubuntu/kelime-patlat/assets/images/splash-icon.png"),
    Path("/home/ubuntu/kelime-patlat/assets/images/favicon.png"),
    Path("/home/ubuntu/kelime-patlat/assets/images/android-icon-foreground.png"),
]

with Image.open(source) as image:
    image = image.convert("RGB")
    image.thumbnail((768, 768), Image.Resampling.LANCZOS)
    for target in targets:
        image.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{target.name}: {target.stat().st_size} bytes")
