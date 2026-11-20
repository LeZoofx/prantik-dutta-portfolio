# Mobile design lock

The owner approved the mobile site on 3 October 2026 at 07:12 UTC, after
`4c37cff` and before `fa3a460`. On 5 October they explicitly locked that design.

`src/mobile-locked.css` restores the approved mobile-focus, creative-refinements
and adaptive-performance styles from that commit. Its outer media query limits
the restoration to phone-sized screens and tablets with coarse pointers. Recent
desktop idle-motion and navigation styling is confined to the complementary
desktop media query. The header, filter/shuffle toolbar, expand buttons and
footer controls use the earlier mobile arrangement. Video previews stay opt-in;
individual work still opens by tapping its frame.

The blank-screen regression came from refreshing the React scene window only
when a pre-sample moving flag was false. On the final touch animation frame that
flag was still true, while the pager had finished and stopped requesting frames.
The scene window therefore stayed at its old index. Further swipes moved the
camera beyond every mounted scene. Touch paging now refreshes the scene window
as each boundary is crossed and paints new planes in the layout phase. Desktop
continues to update its scene window at rest.

`tests/mobile-scenes.test.mjs` executes the actual Universe touch handlers and
animation loop with a deterministic hook/DOM fixture, testing repeated, fast,
reverse and wraparound gestures without loading media or a browser. The styling
check verifies that the approved source blocks remain intact.

Future mobile design changes require an explicit owner request. Desktop changes
do not authorize mobile visual changes.

## 21 November 2026 · scroll reliability repair

The owner's new direction authorizes repairing missed horizontal/vertical input
and adding conditional loading feedback inside existing frames. The approved
mobile layout and source style blocks remain unchanged.

Wheel input now commits an accepted gesture before handing off to a fresh axis;
the previous axis's inferred momentum cannot consume the new gesture. Rapid
line-mode notches and steady pixel-wheel impulses are retained. Small diagonal
and decaying tails still belong to their original gesture. Vertical input over
navigation chrome now reaches the page, while form fields, process notes and
horizontal category-strip scrolling retain local ownership.

Both horizontal queues retain requests beyond the previous three-step cap.
Swipes during preview warm-up wait for the existing readiness signal. New page
requests can retarget an unfinished transition, retaining both partly visible
neighbours. The desktop track rebases by complete cycles before hitting its
finite DOM edge, keeping velocity and queued destinations. Scene poses, orbit
paths, default durations, player budgets and media-admission rules are unchanged.

Poster loading is per image, with print registration corners and a subdued light
sweep inside the frame. It never receives pointer events or gates navigation.
Cached images bypass it; errors show a static unavailable-preview label with the
existing play/expand action still present. Reduced motion keeps the static frame.

The input owner covers the whole Explore stage, including rail chrome. The notes
body and expanded document/viewer dialogs retain native local scrolling. Hover
pauses the notes body rather than creating a navigation dead zone in its heading.
The opening animation transfers the first wheel event or touch pointer into the
same navigation handler before dismissing, so the first gesture is not discarded.
Tests cover these handoffs and a real production-build browser check confirmed
opening → page, rail heading → page, and notes body → notes without page movement.
