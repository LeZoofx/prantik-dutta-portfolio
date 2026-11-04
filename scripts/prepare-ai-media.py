"""Build cached, seekable portfolio copies from the owner's three public Drive files.

Runs in publishing, never in a visitor's browser. Original source links remain.
The source footage is not retimed or recut. MP4 fast-start and two-second GOPs
allow real seeking without reloading a Drive iframe.
"""
import json
import subprocess
from pathlib import Path
import gdown

root = Path(__file__).resolve().parent.parent
sources = json.loads((root / 'content/ai-media.json').read_text())
work = root / '.ai-source'
output = root / 'public/video'
work.mkdir(exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
for item in sources:
    target = output / ('ai-' + item['name'] + '.mp4')
    poster = root / 'public/media' / ('ai-' + item['name'] + '.webp')
    if target.exists() and (not item.get('posterAt') or poster.exists()):
        print('Cached web media: ' + item['name'], flush=True)
        continue
    source = work / (item['id'] + '.mp4')
    if not source.exists():
        if not gdown.download(id=item['id'], output=str(source), quiet=True, use_cookies=False):
            raise RuntimeError('Public video unavailable: ' + item['name'])
    if not target.exists():
        temporary = target.with_name(target.stem + '-encoding.mp4')
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(source),
            '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'fps=30',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '25',
            '-maxrate', '1800k', '-bufsize', '3600k', '-pix_fmt', 'yuv420p',
            '-g', '60', '-keyint_min', '30', '-sc_threshold', '0',
            '-c:a', 'aac', '-b:a', '112k', '-map_metadata', '-1',
            '-movflags', '+faststart', '-threads', '2', '-y', str(temporary)
        ], check=True)
        temporary.replace(target)
    if item.get('posterAt') is not None and not poster.exists():
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(item['posterAt']),
            '-i', str(source), '-frames:v', '1', '-vf', 'scale=1280:-2',
            '-c:v', 'libwebp', '-quality', '88', '-y', str(poster)
        ], check=True)
    source.unlink(missing_ok=True)
    print('Prepared web media: ' + item['name'], flush=True)
