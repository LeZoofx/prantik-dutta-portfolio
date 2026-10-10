# Creative process panel

Owner requested the desktop and mobile addition on 10 October 2026. This is the
specific exception to the earlier mobile design lock; other mobile behaviour and
controls remain unchanged.

Edit the eight cards in `content/creative-process.json`. Keep claims consistent
with the source documents. `content/process-assets.json` records the document and
page used for each excerpt. The panel includes all six supplied production
packages; it presents planning documents and editorial material as process work.

Preview files are small WebP assets or native SVG artwork. The larger visual/document pages are
mounted only when a visitor opens a card. The CV is source material, not a public attachment.

The panel is a sibling of `.depth-scroll`, outside the scroll input owner and all
zoom planes. A single Web Animations transform moves two identical card runs.
Hover converts the current animation position into native panel scroll; leaving
converts that position back without restarting. Touch pauses for reading and
resumes eight seconds after release. The pause button and keyboard scrolling are
available. Reduced motion disables automatic movement. Hidden tabs pause it.

Rebuild assets locally, after extracting the source packages:

```sh
python3 scripts/build-process-assets.py /path/to/extracted/packages
npm run build
```

The live site never needs the source ZIPs, PDF parser or asset-generation script.
GitHub Pages serves the committed assets. The scene pager, transition, wheel input,
video player and orbit code are unchanged.

Existing career results in `content/positioning.json` are also present in the October 2026 CV.
Additional financial and audience outcomes are held for the owner's public-release approval.
They are kept separate from dated public video counters. No numeric outcome is
derived from planning mockups. The full CV is not published.
