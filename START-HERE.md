# Your portfolio is live

This folder contains the actual website, all recovered project posters, and the automation that publishes it to GitHub Pages. It has Overview and Explore views. Both include the complete collection, grouped by category, with brand filtering and sorting. Explore travels through a repeating low-poly scene; All work also provides the searchable index. The main scroll activates several muted videos as they enter view (three on larger screens, two on phones); a poster and Play button remain available when the provider or browser blocks autoplay. Sound is always your choice.

## Your website and editing links

**Website: [lezoofx.github.io/prantik-dutta-portfolio](https://lezoofx.github.io/prantik-dutta-portfolio/)**

Your complete project is at **[github.com/LeZoofx/prantik-dutta-portfolio](https://github.com/LeZoofx/prantik-dutta-portfolio)**. The source, fonts and all 78 recovered project posters are uploaded. The opening selection starts with Darlings and shuffles through Netflix, Prime Video, Mumbai Indians, Lollapalooza and A*Pop work. GitHub Pages is enabled and the first live deployment succeeded on 27 September 2026 (India time). There is no remaining setup step.

Committing an edit publishes the website automatically. For a manual rebuild, open **[Publish portfolio](https://github.com/LeZoofx/prantik-dutta-portfolio/actions/workflows/deploy.yml)**, select **Run workflow**, keep **main**, and press the green **Run workflow** button. Wait for its green check before checking the updated site.

Keep the source repository private on a qualifying GitHub plan, and the portfolio website public. A private personal repository requires GitHub Pro for Pages; on GitHub Free, making the source private unpublishes its Pages site. Verify the plan before changing visibility. Browser-delivered HTML, CSS, JavaScript and media remain readable even with a private repository. Keep repository collaborators empty unless you explicitly trust them. Publishing, project editing and image recovery also check that the person running them is the repository owner.

The site has no public admin page and no password or publishing token in its browser code. Editing happens inside your authenticated GitHub account.

## Add or update your work

1. Open **[Add or update a project](https://github.com/LeZoofx/prantik-dutta-portfolio/actions/workflows/update-project.yml)** in your repository.
2. Select **Run workflow**.
3. Enter a title, project URL and category. Add your role, description and AI disclosure where applicable.
4. Select **Feature on the home page** if desired. A new featured project moves to the front; featured work leads the opening selection.
5. Leave **project_id** empty to add work. To update an existing project, copy its ID from the end of its website address, such as `social-short-format-03`.
6. Press **Run workflow**. GitHub saves the change, rebuilds the site and publishes it. Wait for a green check under Actions.

When updating a project, enter all the optional text you want to keep: empty optional fields clear the existing text. YouTube posters are fetched automatically. Instagram and Drive additions use a typographic poster until you add an image in `public/media` and set that project's `poster` field in `content/projects.json`.

The scrolling client/collaborator list is editable in `content/clients.json`. Floating objects reveal extra films on hover, scroll-over or tap.

The opening shuffle has its own short list in `content/showcase.json`: each entry contains an existing project ID, a short display title and a label. The first entry appears first on a fresh visit. The opening shuffles approximately every two seconds, and an animated thumbnail strip exposes the complete archive. Change this list to curate the shuffle; it does not remove anything from the full archive. The two résumé results in the opening are Trunativ’s 5.2M views in one month and Schbang’s 305% viewership growth. The project count updates automatically.

To update your biography, contact details or disciplines, open `content/site.json` in GitHub, click the pencil, change the text between quotation marks and commit. The site publishes automatically. To remove a project, delete its complete object from `content/projects.json`; use GitHub's Preview changes to check the edit. Ask me to handle this if you prefer.

## Publish a separate copy from your computer (optional)

Your existing repository is already published. The following script is only for creating a separate copy under a new repository name. Install the official **Node.js LTS**, **Git**, and **GitHub CLI** from their respective sites: https://nodejs.org/ · https://git-scm.com/ · https://cli.github.com/ .

Unzip the project. Open a terminal in the `prantik-portfolio` folder and run:

```sh
node scripts/publish.mjs portfolio-copy
```

The script opens GitHub's secure web sign-in when needed, checks that your personal account has GitHub Pro, creates a new private repository with the supplied name, uploads this folder, enables GitHub Pages and starts publishing. It never replaces an existing repository. No npm installation is needed for this publishing step; GitHub installs build dependencies itself. Run it from a fresh unzipped copy.

If GitHub asks for its one-time Pages setting, open **Settings → Pages → Build and deployment → Source → GitHub Actions**, then **Actions → Publish portfolio → Run workflow**. The deployment output supplies the final website URL.

## Preview on your computer

In that same folder:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To build the production files, run `npm run build`. The resulting `dist` folder is the static website; opening `index.html` as a local file will not run its JavaScript correctly, so use the preview command or GitHub Pages.

## A few content notes

- The migration preserves 79 project records: 42 original embedded videos and 37 linked image projects. It includes 78 local project posters; one stand-up video has a typographic fallback.
- Original AI disclosures are preserved. The source showreel was under maintenance, so its page directs visitors to existing projects.
- Some source links and videos can require a provider login or can stop working later. Each project keeps an original-source link as a fallback. Two original brand TinyURLs could not be resolved during migration and are preserved as supplied.
- Generic source titles remain where the old site did not supply a specific title. Per-project credits have not been invented. Replace these through the editing workflow when convenient.
- WebGL uses the full 3D renderer. If a browser cannot create WebGL, Explore retains all work and its varied layouts when WebGL is unavailable. Reduced-motion and data-saving settings turn off automatic playback; visitors can still press Play. The category controls and project links also work with a keyboard.
- **[Restore missing portfolio images](https://github.com/LeZoofx/prantik-dutta-portfolio/actions/workflows/recover-media.yml)** can recover missing original posters. It also attempts genuine higher-resolution YouTube posters. Existing images remain available if a larger original cannot be fetched; it never enlarges a small image to pretend it is high resolution.

## Official references

- GitHub Pages workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub repository creation: https://cli.github.com/manual/gh_repo_create
- GitHub Pages setup API: https://docs.github.com/en/rest/pages/pages

See `docs/BUILD-NOTES.md` for technical details and verification limits.


Positioning and rotating results are editable in `content/positioning.json`. Brand and collaborator assignments live in `content/project-brands.json`. Keep numerical claims tied to their source. Public project totals are intentionally omitted.

### Reach figures

The site combines verified public YouTube counters in `content/video-metrics.json` with career results in `content/positioning.json`. Publishing automatically attempts to refresh those counters; a Monday rebuild keeps the public snapshots current. If YouTube is unavailable, the previous dated values remain. The source button beside the result ticker explains the totals. You can run `npm run refresh:metrics` locally before publishing. No API key or password is required.

### Art and typography

`src/artStyles.ts` controls the visual sequence and short poster copy. `src/style-worlds.css` contains the twelve visual treatments. `content/clients.json` remains the only client-name list; the website distributes it into three scrolling rows automatically.
