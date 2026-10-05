# Desktop startup and scrolling

The artwork, mobile swipe interaction, categories and content remain intact.

## What was making startup and tab return worse

- Scene changes called React `flushSync` inside the scroll frame, forcing rendering and pending effects into the same frame as camera motion.
- Main-thread JavaScript wrote each scene's camera, dispersal and focus every scroll frame. Third-party iframe work could delay those writes while native scrolling continued.
- Instagram previews were destroyed while hidden and recreated on return. YouTube players resumed independently and simultaneously.
- Native scroll capture and the Explore motion event maintained separate idle timers, competing over media admission.
- Card rotation used wall-clock timeouts that kept progressing while its animation was paused. Video reassignment could precede the actual end of a paused rotation.
- Broad animation-pausing rules froze entry lettering before it reached a visible state. Font completion also failed to invalidate cached scene geometry.

These are code-level causes; they are not a claim that every external player's delay can be controlled by the portfolio.

## Current ownership

1. **Input:** `NativeSceneScroll` observes native scroll and scrollend; the browser owns wheel input, momentum and mandatory CSS snapping throughout the gesture. There is no wheel-release timer, snap-type toggling, or forced extra-page rule. Recovery can only round to the nearest page. Category buttons use native smooth scroll. A debounced scrollend fallback is used only on browsers without scrollend.
2. **Scene motion:** supporting browsers use `ScrollTimeline` with the existing camera/dispersal/focus curves. Three buffered planes are retained; newly mounted planes are bound in React's layout phase before paint. Font/layout changes update existing keyframes in place instead of cancelling and recreating animations. Older browsers use the event-driven RAF path; mobile retains its existing pager.
3. **Loading:** prerendered text and poster facades appear first. Core fonts are preloaded and posters have responsive WebP derivatives. A nonblocking loading label covers initial font/poster readiness, capped at one second. New players enter a shared capacity-limited queue only after the interface is ready and scrolling is idle.
4. **Tab lifecycle:** existing preview containers survive tab hiding. The central policy pauses YouTube playback, then resumes after a short idle period. Orbit animations pause on hide/scroll and resume on the same rest event. Video handover follows animation completion, not a separate timer. Instagram's cross-origin playback remains provider-controlled; the page does not reload the embed on tab return.
5. **Geometry:** font loading invalidates cached layout. Scene decorations are present in the buffer before a scene enters; scenery fades in after decode. Intro lettering is allowed to finish, while decorative loops pause during motion.

## References used

- React, `flushSync` caveats: https://react.dev/reference/react-dom/flushSync
- Chrome's scroll animation performance comparison: https://developer.chrome.com/blog/scroll-animation-performance-case-study/
- Native ScrollTimeline examples: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Page lifecycle and hidden-state handling: https://developer.chrome.com/docs/web-platform/page-lifecycle-api
- Video facades and third-party iframe loading: https://web.dev/learn/performance/video-performance

## Build

GitHub Actions generates responsive previews automatically with Pillow. For local development, install `Pillow==12.3.0` in Python, then use the normal npm commands. Original posters remain unchanged; generated scenery and previews are not committed.

## Follow-up: partial entrances and unsolicited second scroll

The 160ms wheel-release correction could split a single trackpad gesture and force an extra page from its residual tail. Toggling `scroll-snap-type` additionally requests browser re-snapping. Both were removed. Animation installation for newly buffered planes previously waited until after paint; it now occurs before paint, and geometry updates preserve existing animation instances.

CSS re-snap behavior: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type
