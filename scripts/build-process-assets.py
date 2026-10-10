"""Build small portfolio excerpts from the owner's supplied production packages.

Usage: python3 scripts/build-process-assets.py /path/to/extracted/packages
The committed outputs are served directly; this script is not part of page loading.
"""
import json
import sys
import shutil
from pathlib import Path

import fitz
from PIL import Image

source = Path(sys.argv[1])
repo = Path(__file__).resolve().parents[1]
out = repo / 'public/media/process'
out.mkdir(parents=True, exist_ok=True)
specs = [
    ('research', 'Win_Theory/WT_Show_Direction_Production_Final.pdf', 8, None),
    ('strategy', 'TruNativ/Brand_Strategy_and_Packaging/OP01_Research_and_Operating_Plan.pdf', 1,
     'TruNativ/Campaign_Artwork/trunativ_everyday_range.png'),
    ('storyboard', 'Aarti_Sorted/ZO02_Zoho_One_Production_Treatment_Production_Final.pdf', 5,
     'Aarti_Sorted/Assets/Zoho_Director_Planning_12_Panels.png'),
    ('production', 'Hizzouse/Documents/HZ03_Set_Camera_Audio_Plan.pdf', 2,
     'Hizzouse/Assets/HZ_Graphics_Storyboard_Planning.png'),
    ('edit', 'BuzzFeed/BF00_Editorial_Programme_Strategy.pdf', 2,
     'BuzzFeed/Assets/Editorial_Boards/BF02_Board_02.png'),
    ('graphics', 'Product_Report/PR01_Show_direction_and_design_system_Production_Final.pdf', 5,
     'Product_Report/Assets/PR_Supplied_Identity_Board.png'),
    ('ai', 'Win_Theory/WT_Photoreal_Generation_Workflow_Final.pdf', 4,
     'Win_Theory/Design_System/Win_Theory_Figure_Look_Development.png'),
    ('review', 'TruNativ/Brand_Strategy_and_Packaging/OP01_Research_and_Operating_Plan.pdf', 6, None),
]
assets_path = repo / 'content/process-assets.json'
assets = json.loads(assets_path.read_text()) if assets_path.exists() else {}
for slug, pdf, page, image in specs:
    doc = fitz.open(source / pdf)
    p = doc[page - 1]
    pix = p.get_pixmap(matrix=fitz.Matrix(1280 / p.rect.width, 1280 / p.rect.width), alpha=False)
    proof = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    proof.save(out / f'{slug}-notes.webp', quality=85, method=6)
    visual = Image.open(source / image).convert('RGB') if image else proof
    if image:
        visual.thumbnail((1280, 1280))
        visual.save(out / f'{slug}-visual.webp', quality=82, method=6)
    if slug == 'edit':
        shutil.copyfile(source / 'BuzzFeed/Assets/Editorial_Boards/BF02_Board_02.svg', out / 'edit-board.svg')
    visual.thumbnail((416, 280))
    visual.save(out / f'{slug}-preview.webp', quality=68, method=6)
    assets[slug] = {'preview': f'media/process/{slug}-preview.webp',
                    'previewWidth': visual.width, 'previewHeight': visual.height,
                    'proof': f'media/process/{slug}-notes.webp',
                    'visual': f'media/process/{slug}-visual.webp' if image else f'media/process/{slug}-notes.webp',
                    'document': pdf, 'page': page}
assets['edit'].update(preview='media/process/edit-board.svg', visual='media/process/edit-board.svg', previewWidth=1280, previewHeight=720)
(repo / 'content/process-assets.json').write_text(json.dumps(assets, indent=2) + '\n')
print('Preview transfer:', sum(p.stat().st_size for p in out.glob('*-preview.webp')), 'bytes')
print('Detail assets are requested only when opened.')
