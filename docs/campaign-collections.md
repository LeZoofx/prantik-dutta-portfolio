# Campaign collections

Campaigns uses shared brand, channel and programme collections in Explore, the
Overview scroll and the Campaigns work-index filter. Other category lists and
the original project records stay in place. `ai-sheldon` retains its stable ID
and seek annotations; its public name and brand are The Product Report.

`content/campaign-families.json` orders seven portfolios: TruNativ, BuzzFeed,
Sorted / Aarti, Creator Engine, Entertainment, Brand campaigns, and Festivals
& live. Each collection has one parent. Explore and Overview use the same
family order and never mix unrelated families on one scene.

`content/campaigns.json` defines the 26 collections, labelled series, scope
and source-specific evidence. It links 91 primary projects and 11 artwork
records from `content/campaign-assets.json` (102 distinct linked assets). Independent AI
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
TruNativ retains Nutrition Magnified, Marine Collagen, Fiber, Sweet and
brand/range work.
Film-release collections pair identified trailers and social promotions.
Venusia's two supplied product posters identify the same brand; Medimix's
three related films share their own collection.

## Source basis

The production package `Creative_Production_Package_All_Projects.zip` supplies
the Aarti/Sorted episode register, BuzzFeed film/channel register, TruNativ
campaign register, Hizzouse release register and the included artwork.
Existing project IDs remain stable. Only selected
artwork is published; the working package and private registers are not copied
into the public site.

Supplied identity and packaging references are labelled as references.
Reconstructed production drawings and templates are labelled as planning
studies. Programme-wide financial or audience outcomes are not assigned to
individual videos. The eight retained Hizzouse releases now link to their matching official
Jay & Silent Bob YouTube uploads, with current titles and thumbnails verified
through YouTube oEmbed. Original release titles stay in the descriptions.
Nutrition Magnified’s three films and Sweet Escape use the direct YouTube
links in the TruNativ campaign audit, checked against the official channel.
These twelve films are primary portfolio records and appear in YouTube as
well as their campaign collections. Sweet Escape retains its brand category
with a supplementary YouTube category. The remaining extra records are
artwork, not films hidden from the main index.

## Behaviour and validation

Collection frames use a large cover with overlapping smaller frames, stamped
counts and kinetic titles. Their colours, borders and fonts inherit the
existing art styles. The Overview index adds a large family heading above
the channel/campaign hierarchy. Each frame links to the complete collection
and individual preview assets. Subgroup previews are selected before extra items from the
same subgroup. No embedded players load inside the collection thumbnails;
explicit selection opens the existing project player and consent flow.
Closing a film opened from a collection returns to that collection. Collection
and extra-asset deep links are prerendered for GitHub Pages.

Campaign search includes parent names, collaborators, series, asset titles and
scope. Brand filtering and A–Z sorting operate at collection level.
`scripts/validate-campaigns.mjs` rejects missing or duplicate references,
unassigned brand assets, invalid sources, absent artwork and incomplete or
duplicate family assignments. Supplementary YouTube categories require actual
YouTube sources. Regression tests
compare non-campaign scene items, layout, theme and art with the previous
desktop/mobile section snapshots. Existing scroll, orbit, player-budget and
mobile design-lock tests also remain in the test suite.
