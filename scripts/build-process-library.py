"""Extract selected source pages and storyboard visuals; runs offline, never in the website."""
import json
import sys
from pathlib import Path
import shutil

import fitz
from PIL import Image

root = Path(sys.argv[1])
repo = Path(__file__).resolve().parents[1]
out = repo / 'public/media/process'
specs = json.loads((repo / 'content/process-library-sources.json').read_text())
evidence = {}
for key, spec in specs.items():
    with fitz.open(root / spec['document']) as doc:
        pages = [{'page': n, 'text': doc[n - 1].get_text().strip()} for n in spec['pages']]
    visuals = []
    for i, visual in enumerate(spec.get('visuals', [])):
        source = root / visual['source']
        suffix = '.svg' if source.suffix == '.svg' else '.webp'
        name = f'library-{key}-{i + 1}{suffix}'
        if suffix == '.svg':
            shutil.copyfile(source, out / name)
        else:
            image = Image.open(source).convert('RGB')
            image.thumbnail((1440, 1440))
            image.save(out / name, quality=82, method=6)
        visuals.append({'src': 'media/process/' + name, 'caption': visual['caption']})
    evidence[key] = {'document': spec['document'], 'excerpts': pages, 'visuals': visuals}
(repo / 'content/process-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'{len(evidence)} source selections; {sum(len(e["excerpts"]) for e in evidence.values())} pages. Full evidence loads only when opened.')
