# Creative process panel

Owner requested the desktop and mobile addition on 10 October 2026. This is the
specific exception to the earlier mobile design lock; other mobile behaviour and
controls remain unchanged.

Edit the twelve stages in `content/creative-process.json`. Keep claims consistent
with the source documents. `content/process-assets.json` records the document and
page used for each excerpt. The panel includes all six supplied production
packages; it presents planning documents and editorial material as process work.

Preview files are small WebP assets or native SVG artwork. Related source choices
are indexed in `content/process-library-sources.json`: research and claim ledgers,
personal brands, channel playbooks, packaging, storyboards, shoot plans, VFX briefs,
edit strategy, graphics, AI continuity and creative tests. Selected page text is
extracted verbatim to `content/process-evidence.json`. That module is imported only
when notes open. Additional storyboard assets are loaded only for the chosen
document. The CV is source material, not a public attachment.

The panel is a sibling of `.depth-scroll`, outside the scroll input owner and all
zoom planes. A single Web Animations transform moves two identical card runs.
Hover converts the current animation position into native panel scroll; leaving
converts that position back without restarting. Touch pauses for reading and
resumes eight seconds after release. The pause button and keyboard scrolling are
available. Reduced motion disables automatic movement. Hidden tabs pause it.

Rebuild assets locally, after extracting the source packages:

```sh
python3 scripts/build-process-assets.py /path/to/extracted/packages
python3 scripts/build-process-library.py /path/to/extracted/packages
npm run build
```

The live site never needs the source ZIPs, PDF parser or asset-generation script.
GitHub Pages serves the committed assets. The scene pager, transition, wheel input,
video player and orbit code are unchanged.

On 10 October the owner explicitly instructed publication of the additional CV
statistics after reviewing the proposed figures. All 39 additions are in
`content/positioning.json`, retaining their exact measurement context. The marquee
includes the existing results and dated public video counters; its source dialog
identifies owner-reported career figures separately. No numeric outcome is derived
from planning mockups. The full CV and private contact details are not published.

Strategy, production and post use equal line sizes and treatment within each
page's existing art style. Category copy follows research and briefing before
shooting, editing, motion, AI and VFX. No main-scroll or player logic was changed.

## 20 November 2026: context follows the work

The existing rail now follows the current page and its settled featured work.
`content/process-contexts.json` supplies authored project and programme context;
`src/processContext.ts` matches real page items and campaign memberships rather
than injecting category-wide examples. Campaign collections, brand filters and
mobile pagination use the same lookup. Hover, touch reading, pause and open notes
hold the selected context; leaving/resuming picks up the current featured work.
The original wheel, paging, orbit timing and player allocation remain in place.

All twelve original entries in `content/creative-process.json`, source extracts,
artwork and document tabs remain accessible through **All notes** in the rail.
The contextual cards add a layer around that library; they do not replace it.
The smaller card previews use the work on the page. Source documents stay inside
the relevant expanded note. The complete CV is not published.

Context was reconciled with the existing campaign descriptions, published project
credits, the supplied production packages and their source index, the 12 November
context handover, and the recent Kofuku portfolio markers. Additional input came
from the local reconstruction records: TruNativ TR01 (category and price questions),
ED07 (creative tests, comments and acquisition model), Sorted SG02 (native-content
research) and SG03 (responsive performance and creator formats). These are authored
development/reconstruction documents, not historical analytics or proof that every
proposed experiment ran. The original reconstruction chat and portfolio-positioning
corrections were read for continuity. No new growth figures were inferred.

The copy connects research to decisions: category/competitor and buying-objection
research, channel and audience relationships, cultural/format research, visual
explanation, performance, retention, packaging, team handoffs, budgets and review.
Platform work is described through testable audience and distribution signals;
no claim is made to possess a secret ranking-system exploit. CV programme figures
retain their comparison sets and are not assigned to individual films. Unreleased
shows retain their release status. Private AI production recipes are excluded.

The YouTube warning is now a local child of the video screen, above the bottom
controls. Its three-second lifecycle begins when that embed activates. It is
click-through, uses a short entrance/exit animation, and respects reduced motion.
The earlier viewport portal and collision-based suppression were removed. Native
and Instagram players do not display a YouTube warning.
