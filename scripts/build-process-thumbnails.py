"""Small source-page previews from the supplied packages; never runs in the browser."""
import json
import sys
from pathlib import Path

import fitz
from PIL import Image

source = Path(sys.argv[1])
repo = Path(__file__).resolve().parents[1]
destination = repo / 'public/media/process'
manifest_path = repo / 'content/process-assets.json'
manifest = json.loads(manifest_path.read_text())
# Supply an array of {step, document, page} selections as JSON on stdin.
# Source-package locations stay with the owner; the public script is generic.
specs = json.load(sys.stdin)
for spec in specs:
    slug, document, page = spec['step'], spec['document'], spec['page']
    with fitz.open(source / document) as pdf:
        p = pdf[page - 1]
        pixels = p.get_pixmap(matrix=fitz.Matrix(640 / p.rect.width, 640 / p.rect.width), alpha=False)
    image = Image.frombytes('RGB', (pixels.width, pixels.height), pixels.samples)
    image.thumbnail((416, 280))
    image.save(destination / f'{slug}-source-preview.webp', quality=76, method=6)
    manifest[slug].update(preview=f'media/process/{slug}-source-preview.webp',
                          previewWidth=image.width, previewHeight=image.height)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Built {len(specs)} actual document thumbnails.')
