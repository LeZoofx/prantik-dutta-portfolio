# Portfolio editing rules

The owner locked the current desktop and mobile design and interaction code on
10 October 2026. The current baseline is `efb0559059223f88dbb14cab29e5912731b376b5`,
including the expressly requested compact header, separated mobile frames and
more frequent cycling. This supersedes the older visual baseline below.

- Preserve the current Explore layout, fonts, scroll, depth, orbit timing,
  loading policy and player budget. `docs/current-design-lock.json` records
  the protected file hashes.
- The current request authorizes grounded content updates to Overview and
  project-process notes, mobile content fit, and necessary privacy/accessibility
  safeguards. It does not authorize an experience redesign.
- Keep research examples source-specific. Distinguish development materials,
  reconstructed planning, CV-reported aggregate outcomes and public counters.

The mobile design is locked by the owner's explicit instruction on 5 October 2026.
Its approved baseline is commit `4c37cff`, immediately before the owner said
"The mobile site works fine for now" on 3 October 2026.

- Do not redesign mobile, change its layout, typography, controls or animation
  direction unless the owner explicitly asks for that mobile change.
- Desktop requests must remain confined to desktop. Preserve the mobile media
  boundary in `src/idle-motion.css` and the restored `src/mobile-locked.css`.
- Mobile bug fixes and performance repairs are allowed when they preserve the
  approved appearance and behavior. Keep scenes mounted during consecutive,
  fast, reverse and wraparound swipes.
- Preserve all project content, links and tap-to-play/fullscreen behavior.

See `docs/mobile-design-lock.md` for the baseline and regression check.
