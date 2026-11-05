"""Responsive poster derivatives, generated at build time. Originals stay intact."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
output = root / 'public' / 'previews'
output.mkdir(parents=True, exist_ok=True)
posters = {p.get('poster') for name in ('projects', 'campaign-assets') for p in json.loads((root / ('content/' + name + '.json')).read_text())}
count = 0
for poster in sorted(p for p in posters if p and p.startswith('media/') and not p.endswith('.svg')):
    source = root / 'public' / poster
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        for width in (320, 640, 960):
            target = output / f'{source.stem}-{width}.webp'
            if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
                continue
            size = (width, round(image.height * width / image.width))
            image.resize(size, Image.Resampling.LANCZOS).save(target, 'WEBP', quality=82, method=4)
            count += 1
print(f'Built {count} responsive previews.')
