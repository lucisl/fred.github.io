# Task 6 Report: Static Build, Deployment Migration, and Legacy Cleanup

## Delivered changes

- Added a deterministic Node 20 static builder at `scripts/build.mjs`. It removes only repository-local `dist/`, then copies `index.html`, `.nojekyll`, and `assets/`, and asserts the required entry files before succeeding.
- Added an empty `.nojekyll` and a minimal `.gitignore` containing only `dist/` and `.DS_Store`.
- Replaced the GitHub Pages build steps with Node 20, `npm test`, `npm run build`, and an upload of `./dist`. The `main` and manual triggers, permissions, concurrency group, and deployment job remain.
- Removed the listed tracked Hexo configuration, database, lockfile, scaffolds, source content, and Butterfly theme. The modified baseline `db.json` was deliberately deleted.
- Added an artifact-level test that runs the actual build script and checks the deployable file set.

The explicit scope override to keep current design/plan documents was honored: `docs/superpowers/plans/2026-04-13-personal-blog.md` and `docs/superpowers/specs/2026-04-13-personal-blog-design.md` remain present.

## Exact deployable artifact listing

`find dist -type f | sort` after the clean `npm run check` build:

```text
dist/.nojekyll
dist/assets/favicon.svg
dist/assets/js/app.mjs
dist/assets/js/json-core.mjs
dist/assets/js/router-core.mjs
dist/assets/js/timestamp-core.mjs
dist/assets/styles.css
dist/index.html
```

`dist/docs`, `dist/tests`, and `dist/source` do not exist.

## Verification evidence

- TDD red: `node --test tests/build.test.mjs` initially failed because `scripts/build.mjs` was missing.
- TDD green: the same test passed after the builder was added.
- `npm run check`: passed all 15 tests and rebuilt `dist/`.
- `git diff --check`: passed with no whitespace errors.
- Legacy-string audit over the static app, workflow, scripts, and tests: no `hexo`, `butterfly`, `fred's Blog`, or `Backend Engineer` matches.
- Git-history audit: all removed legacy top-level paths resolve from `HEAD`, so they remain recoverable.
- Desktop smoke test against `python3 -m http.server 4173 --directory dist`:
  - JSON format, copy, invalid JSON error, and clear succeeded.
  - `#timestamp` loaded and survived refresh; seconds timestamp `0` produced `1970-01-01T00:00:00.000Z`.
  - Timestamp copy, invalid-input error, UTC date-to-timestamp round trip (`0` seconds / `0` milliseconds), and clear succeeded.
  - No browser console errors were recorded.
  - Keyboard smoke test reached `#main-content` with low-level Tab/Enter. The browser automation locator's synthetic Enter did not dispatch the skip link's anchor default action, while a regular click did focus `#main-content`; this is recorded as a tooling limitation, not an application error.

## Scope and cleanup notes

- The legacy theme included an untracked nested dependency cache. It was removed together with the explicitly authorized `themes/` legacy path.
- Pre-existing untracked local directories (`.idea/`, `backup/`, `node_modules/`, and `public/`) were left untouched and are not part of the task commit.
