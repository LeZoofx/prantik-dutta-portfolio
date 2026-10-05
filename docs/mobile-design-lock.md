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
