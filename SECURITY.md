# Security and privacy

Report a suspected vulnerability privately through the contact details at
https://lezoofx.github.io/prantik-dutta-portfolio/contact/ .
Include the affected URL and reproducible steps. Do not include passwords,
access tokens, private client files or visitor information in public issues.

The site is static: no visitor accounts, database, enquiry form, analytics,
advertising pixel or visitor-data API. Fonts, posters and document previews
are hosted with the site. The existing video-consent gate defaults to off,
holds its choice in tab memory and removes players when consent is withdrawn.
Device and connection signals are used locally for performance only.

Production documents receive a build-time Content Security Policy. Only
same-origin application scripts, the exact inline compatibility bootstrap,
and the consent-gated YouTube API may execute. Frames are limited to the
existing media providers. Object embeds and form submissions are blocked.
Source maps are disabled. GitHub Pages controls response headers; a meta CSP
cannot provide header-only protections such as frame-ancestors or a custom
Permissions-Policy. Do not claim these headers are configured by this file.

Build and edit workflows run for the owner, pin external Actions to verified
commit IDs and scope write permissions to the jobs that need them. The site
build never publishes repository history, credentials or source maps. A
private repository still requires review of collaborator and app access by
the account owner; only the owner and explicitly trusted deployment/editing
integrations should have write access. Keep two-factor authentication enabled
and protect recovery codes. No account-wide credential changes are automated.

GitHub Pages records visitor IP addresses for security. After a visitor
opts in, Google/YouTube/Drive or Meta/Instagram may process connection and
viewing information and use cookies/storage. Those services and voluntarily
sent email/messages are described in the public privacy notice. A blanket
claim of zero third-party collection or worldwide legal certification would
be inaccurate. No third-party players should load before consent.

Repository visibility and site visibility are separate. Verify the personal
account has GitHub Pro (or a qualifying higher plan) before making this
repository private: GitHub Free would unpublish its Pages site. Keep the site
public and its current URL. Browser-delivered HTML, CSS, JS and media remain
downloadable. A private repository cannot retract earlier public copies.
