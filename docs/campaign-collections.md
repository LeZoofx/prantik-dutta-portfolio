# Campaign collections

Campaigns uses shared brand, channel and programme collections in Explore, the
Overview scroll and the Campaigns work-index filter. Other category lists and
the original project records stay in place. `ai-sheldon` retains its stable ID
and seek annotations; its public name and brand are The Product Report.

`content/campaigns.json` defines the parent collections, labelled series,
scope and source-specific evidence. It links 79 existing projects and 20 extra
episodes/artwork records from `content/campaign-assets.json`. Independent AI
pieces remain in their existing categories. `content/campaign-labels.json`
supplies descriptive names inside collections without rewriting other archives.

The 26 collections cover The Product Report, TruNativ, Pero Like, Cocoa Butter,
Tasty, A*Pop, The Sorted Girl, Sorted, Mumbai Indians, Bumble, Groww,
Lollapalooza, BookMyShow, film trailers and release campaigns, Bombay Sapphire,
SANAM, Janice Sequeira, NH7 Weekender, OnePlus, Medimix, Venusia, Swiggy,
Prime Video stand-up, live comedy, Hizzouse and Win Theory.

Cocoa Butter retains Duplicity, Lateasha's Superlatives, Tamar Braxton,
How Churchy Are You? and the food exchanges as separate labelled series.
Tasty retains Lost In Translation, I Draw You Cook and recipe collections.
TruNativ retains Marine Collagen, Fiber, Sweet and brand/range work.
Film-release collections pair identified trailers and social promotions.
Venusia's two supplied product posters identify the same brand; Medimix's
three related films share their own collection.

## Source basis

The production package `Creative_Production_Package_All_Projects.zip` supplies
the Aarti/Sorted episode register, BuzzFeed film/channel register, TruNativ
campaign register, Hizzouse release register and the included artwork.
Existing source URLs, embeds and project IDs are preserved. Only selected
artwork is published; the working package and private registers are not copied
into the public site.

Supplied identity and packaging references are labelled as references.
Reconstructed production drawings and templates are labelled as planning
studies. Programme-wide financial or audience outcomes are not assigned to
individual videos. Hizzouse episode links come from the retained public release
register; artwork is supplied for the first two episodes, with text fallbacks
for the rest.

## Behaviour and validation

Each collection frame contains visible asset thumbnails, plus a link to the
complete collection. Subgroup previews are selected before extra items from the
same subgroup. No embedded players load inside the collection thumbnails;
explicit selection opens the existing project player and consent flow.
Closing a film opened from a collection returns to that collection. Collection
and extra-asset deep links are prerendered for GitHub Pages.

Campaign search includes parent names, collaborators, series, asset titles and
scope. Brand filtering and A–Z sorting operate at collection level.
`scripts/validate-campaigns.mjs` rejects missing or duplicate references,
unassigned brand assets, invalid sources and absent artwork. Regression tests
compare non-campaign scene items, layout, theme and art with the previous
desktop/mobile section snapshots. Existing scroll, orbit, player-budget and
mobile design-lock tests also remain in the test suite.
