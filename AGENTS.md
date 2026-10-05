# Portfolio editing rules

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
