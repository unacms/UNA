# UNA 15 and desktop app review

A living scorecard. The scoreboard shows the baseline, the score now and the target; every change
of a score is a row in the score history, and the log says what was done, so the numbers show
whether the work is paying off. Scores are 1 to 10 and are opinions backed by the
evidence listed under each metric.

Security findings are named here only in general terms. Their details live in the private security
repository and in the local commits that fixed them.

- Branch reviewed: `desktop-api-v2` (local only) against `origin/master`
- Master at baseline: version constant `15.0.0-RC4`, RC3 released 2026-10-21

## Scoreboard

| # | Metric | Baseline (2026-11-10) | Now | Target for v16 |
|---|---|---|---|---|
| 1 | Parity with UNA and NEO | 4 | 4 | 7 |
| 2 | Desktop structure | 6 | 6 | 8 |
| 3 | Code cleanliness (duplication, reinvention) | 5 | 7 | 8 |
| 4 | Type safety and tests | 8 | 8 | 9 |
| 5 | Accessibility | 8 | 8 | 9 |
| 6 | Shell and web view security | 7 | 8 | 9 |
| 7 | API v2 design and reuse of UNA systems | 7 | 8 | 8 |
| 8 | API v2 security | 6 | 8 | 9 |
| 9 | House rules (AGENTS.md) | 8 | 8 | 9 |
| 10 | Performance | 6 | 7 | 8 |
| 11 | Translations | 2 | 6 | 7 |
| 12 | Delivery and client projects | 2 | 4 | 7 |
| 13 | UNA 15 release readiness (master) | 6 | 6 | 9 at final |

### Score history

| Date | Metric | Change | Why |
|---|---|---|---|
| 2026-11-10 | 8 API v2 security | 6 to 7 | Edited text is filtered; request params are kept from the site's older code (`209c24a9bd`). |
| 2026-11-10 | 3 Code cleanliness | 5 to 6 | One modal dialog, one error reader, one storage helper in the desktop app (`256d1817de`). |
| 2026-11-10 | 8 API v2 security | 7 to 8 | Every operation is rate limited per profile or guest address, with 429 and Retry-After (`223aa80f4b`). |
| 2026-11-10 | 7 API v2 design | 7 to 8 | Shared endpoints out of Timeline, query params checked by the router, versioning rules, and a test that ties the committed OpenAPI file to the code (`e552d0d666`). |
| 2026-11-10 | 10 Performance | 6 to 7 | The route table is kept between requests; a request loads one endpoint class (`223aa80f4b`). |
| 2026-11-10 | 11 Translations | 2 to 6 | The app's own words go through a translation layer on both sides, in five languages, with a check that fails on a missing text or on English written into the UI (`5456caecea`). |
| 2026-11-11 | 6 Shell and web view security | 7 to 8 | The page holds no token and has no network of its own: Rust sends its API requests, to the site's API only (`a6ada89eb6`). |
| 2026-11-11 | 3 Code cleanliness | 6 to 7 | One frame for seven detail panes and one Copy Link handler for twelve files (`4baa43094c`). |
| 2026-11-11 | 12 Delivery and client projects | 2 to 3 | One brand folder holds the name, identifier, link scheme, keychain service and icons, read by both sides (`9e28519cb9`). |
| 2026-11-11 | 12 Delivery and client projects | 3 to 4 | An installed build updates itself to a signed newer one on the person's say-so, run end to end on a Mac, and refuses a doctored feed; the address and key are the brand's (`f1e528cbcf`). |

## What each score rests on, and what moves it

*Snapshot as of 2026-11-11 (last score update). Subsequent Lane A items completed on `master` (per-section `ListRoute`, `src/lib/dates.ts`, lazy editor/task chunks, section registry, shell hooks, query-key factories, route codecs) are recorded in [Plan after the merge](#plan-after-the-merge-revised-2026-11-12) and the [Log](#log) below and are awaiting a re-score.*

### 1. Parity with UNA and NEO: 4
- 15 of the 35 app-enabled modules have API v2 endpoints and a desktop feature. Inside those, reading
  is at 85 to 90%.
- Rough coverage against the site: browsing 50%, creating and editing 40%, social actions 45%,
  settings 20%, administration under 5%, commerce 0%.
- 168 API operations; the app never calls 12 of them.
- Moves it: real-time updates, the Messenger module, creating and managing groups and events,
  account settings, repost / favourite / report, comment attachments, a fallback for pages the app
  cannot draw.

### 2. Desktop structure: 6
- No import cycles in 194 files.
- `src/shell/shell.tsx` (882 lines) runs the whole window and imports about 25 feature modules.
- `src/lib/router.ts` knows every feature: `ListRoute` is one bag of optional fields.
- 165 cross-feature imports; `components/activity-card.tsx` imports 10 feature modules.
- Moves it: a section registry, focus and command hooks out of the shell, routes as a union per
  section, query-key factories.

### 3. Code cleanliness: 7 (was 5, then 6)
- Almost no dead code (6 dead exports).
- Done 2026-11-10: the modal dialog block (7 copies) is one `Dialog`; 139 `(e as Error).message`
  casts are one `errorMessage()`; the localStorage wrappers of 11 files are one helper.
- Done 2026-11-11: the detail panes' frame (toolbar, More menu, live region, loading, gone and
  failed states) is one `DetailShell` for seven panes; the Copy Link handler of twelve files is
  one `useCopyLink`. The task and thread panes keep frames of their own, as they differ in what
  they draw.
- Still copied: date helpers in 9 files.
- PHP: `_formErrors`, `_takeUploads`, `_audience`, `_existing` and the storage-error mapping are
  duplicated across endpoint classes that share no base class.
- Moves it: one place for dates, a common PHP endpoint base class.

### 4. Type safety and tests: 8
- TypeScript `strict` with `noUncheckedIndexedAccess`, no `any`, no `@ts-ignore`.
- 1011 desktop tests, 130 Rust tests, 337 API v2 tests.
- Done 2026-11-10: the API tests make the people and groups they act as and remove them; no
  skip depends on local data any more (72 skip points to 56, all of them things a site cannot
  do), and the suite has no failing test on the local site.
- Done 2026-11-10: `.github/workflows/desktop.yml` checks the app (types, lint, tests, build),
  the API client (generated types against the OpenAPI file, the file's lint) and the shell
  (rustfmt, clippy with warnings as errors, tests on macOS, Linux and Windows). Every step
  passes by hand on macOS and in Linux containers from a fresh install.
- Gaps: the workflow has not run on GitHub, since this branch is local, and nothing has compiled
  the shell on Windows; the seeded API suite has not run on an actual fresh install; three test
  files match CSS source text; three tests are load- or order-sensitive.
- Moves it: the first green run of the workflow on GitHub, Windows included. The score stays at
  8 until then.

### 5. Accessibility: 8
- ARIA patterns, focus return, reduced motion, forced colours, a single-key toggle.
- Not yet checked with a real screen reader.
- Moves it: a VoiceOver and NVDA pass, one live region per window (60 `role="status"` regions today).

### 6. Shell and web view security: 8 (was 7)
- Good: RFC 8252 sign-in (loopback, S256 PKCE), no token ever leaves Rust, per-window and
  per-command permissions, strict CSP.
- Done 2026-11-11: the page no longer gets the access token. Rust sends its API requests: it
  checks the address is the site's API and nothing else, attaches the token, drops the page's
  `Authorization` and `Cookie`, follows a redirect only into the API. The HTTP plugin and its
  site-wide scope are gone.
- Open: no navigation guard; Rust's other clients (uploads, downloads, the sync, sign-in) each
  build their own, with their own redirect rules; bundled TLS roots instead of the OS trust
  store.
- Fixed 2026-11-10: the sanitiser no longer lets `data-*` and `aria-*` through; a refresh the site
  only turns away no longer signs the user out.
- Moves it: a navigation guard; one shared HTTP client; the OS trust store.

### 7. API v2 design and reuse of UNA systems: 8 (was 7)
- Attribute-driven routes feed the dispatcher and the OpenAPI document; idempotency, ETags and the
  problem model are coherent.
- Writes go through forms, ACL checks, comments, votes, storage and connections.
- Done 2026-11-10: uploads, comments and reactions are three system endpoint classes; the Timeline
  class (2042 to 1317 lines) keeps feeds and feed posts. No route or schema changed.
- Done 2026-11-10: the router checks every declared query param against its schema before the
  endpoint runs (about 110 params on this site), with the validator request bodies use.
- Done 2026-11-10: `docs/api-v2.md` has the rules for versions and changes, and
  `ApiV2SpecFileTest` fails when the code serves anything the committed OpenAPI file does not say.
- Open: deprecation cannot be expressed in code yet (no `deprecated` flag on operations, no
  Deprecation and Sunset headers); the endpoints' own query checks
  are now duplicates to remove; an Item id is still a Timeline event id, so comments and
  reactions by Item need the Timeline; the test runs in CI only once this branch is on master.
- Moves it past the target: the deprecation flag and headers; removing the duplicate checks.

### 8. API v2 security: 8 (was 6, then 7)
- Fixed 2026-11-10: edited text is filtered as new text is (one confirmed hole); the site's older
  code no longer sees request params an endpoint did not declare.
- Added 2026-11-10: rate limits on every operation, counted per profile or guest address in
  one-minute windows (general 600, write 120, search 120, link preview 30, agent chat 20, upload
  120), set in Studio, answered with 429 and Retry-After.
- Open: a guest's limit is only as good as the client address the site reads, which needs a trusted
  proxy list (unacms/UNA#6270, open on master since 2026-11-10; it brings back #5845); session mode
  skips a profile-status check that token mode makes; loose redirect matching for non-loopback
  OAuth clients.
- Moves it: #6270 merged and brought into this branch, the two smaller items, an outside review.

### 9. House rules: 8
- Migrations exist for every install and language change; no runtime schema changes; nothing under
  `upgrade/files/`.
- Open: ORDER BY fragments built in 5 endpoint classes; one raw query in a template class;
  `mb_*` functions used directly in places; comments that cite an outside project.
- Moves it: move the fragments into Db classes; scrub the comments.

### 10. Performance: 7 (was 6)
- Good: feeds are batched; GETs carry ETags; feed and inbox are virtualised.
- Done 2026-11-10: the route table is kept in the database cache by enabled modules and revision,
  and rebuilt when an endpoint file changes; a request loads only the class it runs. Medians on the
  local site: the table 2.89 ms to 1.18 ms, a small request 13.9 ms to 11.1 ms.
- Open: the navigation cache key scans four tables; the app is one bundle with no lazy loading; no
  memoisation of rows.
- Moves it: lazy-load the editor, palette and tasks; memoise rows; a cheaper navigation cache key.

### 11. Translations: 6 (was 2)
- Done 2026-11-10: every text of the app goes through `t()` / `tn()` (i18next, the English text
  as the key), on the page and in Rust (menu bar, tray, dialogs, reasons). English, Russian,
  German, Spanish and French, each language's count forms included; the language is the system's
  or the one chosen in Settings, and the site is asked for the same one.
- A test reads the source on both sides and fails on a call that is not a literal, a text a
  language lacks or no longer needs, a translation with other placeholders, and English written
  straight into what is drawn. It runs with the other tests.
- 2026-11-11: the project owner used the app in Russian and found it fine.
- Gaps: German, Spanish and French were written by the model and no native speaker has read
  them; the Language choice (Settings > Appearance) was hard to find, and it is not in the
  command palette or the menu bar as the themes are; a few fallbacks still put an English noun
  into a sentence; no right-to-left language; stored tab titles keep the old language until
  shown again.
- Moves it: a native read of the German, Spanish and French files, the fallback nouns as whole
  sentences.

### 12. Delivery and client projects: 4 (was 2, then 3)
- Done 2026-11-11: the hardened runtime is on and the local build is signed by Tauri as a
  release is; `scripts/check-signature.sh` checks a build as Gatekeeper will. A release workflow
  (`desktop-release.yml`) builds macOS, Windows and Linux installers, signs macOS with a Developer
  ID and notarises it, signs Windows with Azure Trusted Signing, checks both, and keeps the
  installers as artifacts. A tag fails without the signing secrets.
- Gaps: the workflow has not run; no Developer ID certificate or Azure signing account exists for
  the project yet (only the Apple Developer account holder can create the certificate). No
  crash reporting.
- Done 2026-11-11: the updater. The app checks a `latest.json` named in `brand.json` at start and
  daily (Settings can turn it off) and on request, offers what it finds, and installs only on the
  person's Install and Restart; packages must carry the brand's update signature and name the
  version announced. A tag drafts a GitHub release with the update packages and the feed;
  publishing it moves the feed. Run end to end on a Mac with a local feed; not yet through GitHub.
- Done 2026-11-11: name, identifier, link scheme, keychain service, issues address and icons are
  in `neo/desktop/brand/` (`brand.json`, `icons/`, `app-icon.png`), which the page, Rust and
  the bundle config read; `node brand/apply.mjs` writes it into `tauri.conf.json`, and tests on
  both sides fail when they disagree. Texts take the name as `{{app}}`.
- Gaps: a client project still edits files in the upstream tree, so a sync with upstream can
  conflict in `brand/`; there is no separate fork repository or override file yet.
- Only macOS has been run; the shell's checks pass on Linux and its Windows code type-checks
  (2026-11-11, in a container: the GNU target, not the MSVC release build). Version is 0.1.0 in
  three files, unrelated to UNA's.
- Moves it: the signing and update secrets and a first signed, notarised release run through
  GitHub; the app run on Windows and Linux, an update included.

### 13. UNA 15 release readiness: 6
- Good: CI is green on master; 201 PHP test files; the migrations system and its check; the
  RC3 to RC4 pack is merged.
- Risk: 280 commits and 58 modules changed in the three weeks after RC3; the RC4 milestone has 41
  open issues, most of them long-lived work rather than blockers; migrations run only on the `dev`
  channel; NEO has 14 test files and its typecheck and lint are not clean.
- Moves it: the release plan below.

## Release plan for 15.0.0

1. **Feature freeze on master with a named merge window.** Only fixes land, plus the feature work
   already in flight that the team names up front (the AI agents work first).
2. **Triage every open issue, not only the RC4 milestone.** Proposal in the next section; owners
   confirm.
3. **Cut RC4** once the merge window closes, then soak it.
4. **Test upgrade paths** on copies of real client databases: RC3 to RC4 to final, and 14.0.x to
   15.0.0.
5. **Decide the migrations story for stable sites.** Migrations run only on the `dev` channel and
   the signed manifest is not built.
6. **Security pass** through the private repository.
7. **NEO gates:** freeze or clear the typecheck and lint baseline; add smoke tests for guest and
   member flows (#5799).
8. **Docs and packaging:** upgrade guide, release notes, a note for client forks, version bump,
   final packs, tag.

## Issue triage proposal (2026-11-10)

517 issues are open: 41 in "15.0.0-RC4 Vega", 90 in "16.0 Nova", 309 in "Future", 76 with no
milestone. Read from titles, plus the body where a title was unclear. Owners should confirm.

**Fixes to ship in RC4**

| Issue | What | Assigned |
|---|---|---|
| #5830 | AI agents: failed streamed answers look complete | AlexTr |
| #5733 | AI agents: flood check drops legitimate replies | romanlesnikov |
| #5734 | AI agents: keep the session out of the query string and HTML | AlexTr, romanlesnikov |
| #5701 | AI agents: delete chat files, then the storage | AlexTr |
| #5735 | Studio: regressions after the remake | andreyasko |
| #6261 | Process `enable-app.sql` during a module's update | AlexTr, AntonLV |
| #6017 | Recheck signed transcoder links | AlexTr, andreyasko |
| #5434 | Events: shifted time | AlexTr |
| #5562 | Wiki issues | AlexTr |
| #5579 | Accessibility: label in name | AntonLV |
| #4749 | Persisting media attachments | nobody |
| #4663 | PHP error when processing big videos | nobody |
| #4666 | Docs pages: embeds lose their images | nobody |
| #4399 | Artificer: popup input focus on mobile | nobody |
| #5986 | Timeline: post stays disabled when a link preview fails (no milestone yet) | nobody |

**Feature work for the merge window**

| Issue | What | Assigned |
|---|---|---|
| #5654 | AI agents improvements, with the agents work still local | AntonLV, romanlesnikov |
| #5832 | Installer: a starter set of apps by default | AlexTr, AntonLV |
| #5833 | NEO: navigation and Home follow the installed modules (no milestone yet) | romanlesnikov |
| #5425 | Tasks stage 2: only what is already in flight | AntonLV, andreyasko |
| #5164 | Notifications layout: only what is already in flight | andreyasko |

**Looks done on master: verify and close**
- #5752 Neuron AI 3 to 4 (merged as #6185)
- #4375 Non-crawlable links (#6084, #6251)
- #5282, #4980: umbrella layout tickets; close or split what is left

**Operations before final**
- #5795 Google API keys and #5796 Mapbox tokens: rotation is done; the per-app key restrictions are
  not.
- #5284 OneSignal: decide whether the new API key is needed before final.

**Move to 16.0**
- #5096 and #5794 Tailwind 4, #5095 intervention-image 3, #2984 WebP, #5484 server-side image
  processing, #5193 responsive image variants
- #5753 search, #4826 HTMX stage 2, #5000 Workspaces, #4844 Reputation, #4557 recommended groups,
  #4599 repeated events
- #4478 remote Tailwind compiler, #4476 deprecated browser APIs, #4430 and #5089 ghost files,
  #4425 Day.js, #3666 number separators, #5011 accented slugs

**Needs information**
- #5598 profile and cover picture conflict (not reproduced)
- #5952 NEO Market file versioning, #5836 emoji picker for reactions

**Parked**
- 49 of the 50 open bugs outside the RC4 milestone date from 2017 to 2023 and have not moved since
  June. They stay where they are.

## Plan after the merge (revised 2026-11-12)

API v2 and the desktop app are on master as previews since unacms/UNA#6307 (2026-11-12). The
earlier plan for a local branch (do not push, cut PRs at ship time, rebase onto 15.0.0) is void.

### Rules for every further change

- **A branch off `origin/master` and its own PR.** Never from the local `desktop-api-v2`: its tree
  equals master but its 337 commits of private history must not be pushed.
- **API v2 is off as installed** (`sys_api_v2_enable`). No item may assume a site has it on.
  Railway previews and api.unacms.app have it off (`scripts/railway/configure.php` turns on
  `sys_api_enable` only).
- **With v2 off the site is as before.** Behaviour v2 wants differently goes behind
  `bx_is_api_v2()`, with a case in `ApiV2SharedCodeTest`. A refactor of shared code cannot be
  gated and needs its own classic-path test. The gate is per request, so it cannot cover events
  the classic site would send (sockets for notifications and messages): those need their own
  switch and a test that nothing is sent with it off.
- **Navigation changes go into the apps' own menus only** (`sys_apps_sidebar`, `sys_apps_menu`,
  `sys_profile_memberships`). The sidebar's Browse group still reads the site menu.
- **Each PHP PR carries** its migration, a regenerated `openapi.json` and `schema.ts`, tests, and
  passes SonarCloud and the review bot. Russian module strings migrate from the Russian module.
- **Breaking API changes land while the version is `2.0.0-draft`.** Decide whether 15.0.0 counts
  as "ships in a UNA release"; if not, the docs should say "until it leaves preview".

### Two lanes until 15.0.0 final

- **Lane A, safe now: `neo/desktop`-only PRs.** They skip PHPUnit and cannot change a site.
- **Lane B, after final or with the release owner's say-so:** anything with PHP in shared
  classes, install SQL or language strings. Each such PR adds to what the RC4-to-final update
  pack must carry.

### Release items the merge created (owner: release)

1. The RC4-to-final system and module packs must carry API v2's tables, options, three menus,
   menu items, the Tasks index and the strings. Migrations run only on the `dev` channel.
2. `/api/v2` has a rewrite rule in `.htaccess` and the docker nginx file only. `scripts/Caddyfile`
   has none, and no doc tells an nginx or upgraded Apache site to add it.
3. `neo/desktop` is already in the unacms/neo mirror client projects fork, with UNA's identifier
   and update address in `brand/`. Decide whether the mirror carries it while it is a preview.
4. API v2 tests now gate every master PR. Fix or quarantine the known order-sensitive ones (four
   query-count tests after the migrations tests; `testPrivatePhotosKeepTheirLinksAndEtag`).
5. `BxDolAiTriggerChat::stream` was restructured with no gate: a 15.0.0 regression risk to test.

### Work, in order

Lane A (desktop only):
1. Say "API v2 is turned off on this site" (the app reads any 503 as "no API v2"; the README
   claims otherwise), in five languages, and handle the switch going off mid-session.
2. Article edit form on `updatePost` (the API is there, the app has no editor).
3. Search tabs for the seven unused per-module search routes.
4. Structure work under metric 2, lazy loading, date helpers.
5. Docs-only PR: the untracked `tmp/seed/count-queries.php` cited 7 times, fetch-spec needs v2
   on, the README's stale Windows and Linux lines.

Lane A status (2026-11-21): all five are merged. 1 #6315, 2 #6316, 3 #6317, 4 #6398 to #6446,
5 #6312 (with release item 2, the Caddyfile rule).

Lane B (PHP), in dependency order:
1. Page fallback: `url` and `omitted` on `ResolvedPage`, "Open on the site" in the app. First,
   because on a site with Messenger the merged app's Messages item points at a page it cannot
   draw, and because it covers the 20 app-enabled modules with no endpoints.
2. Settle Item identity (an Item id is a Timeline event id), then content report, favourite,
   repost on `/content/{id}`. None has a write operation today.
3. A common PHP endpoint base (`_formErrors`, `_takeUploads`, `_audience`, `_existing` are
   copied across 9 endpoint files) before more write endpoints.
4. Create and manage groups, spaces and events (today: read and membership only).
5. Account settings: email, password, site language, notification preferences.
6. Messenger (`bx_messenger` has no endpoint class; "Messages" in the app is Conversations,
   which NEO does not show at all). Decide: its own tag, or behind the Conversation shapes.
7. Sockets for notifications and Conversations messages (a classic-site change, see the rules).
8. Comment attachments; Organizations (a profile module, cheap on the existing base).

Shipping (unchanged): certificates, the update key in the release secrets, a first release run,
Windows and Linux at run time. Hold the first `desktop-v*` tag until the brand decision above.

## Log

### 2026-11-10: baseline
- Reviewed by five parallel passes (desktop frontend, Tauri shell and delivery, API v2 PHP, parity,
  release readiness) with spot-checks of the main findings. The release-readiness pass was redone
  from git and GitHub and is shallower: docs, repository clutter and NEO's lint baseline were not
  audited. No PHP suites were run for the review itself.

### 2026-11-10: first fixes (commits `209c24a9bd`, `3e91d9fef7`)
- API v2 security 6 to 7: edits are filtered; request params are kept from the site's older code.
- Shell and web view security stays 7: the sanitiser gap and the refresh sign-out are fixed; the
  token in the web view is the item that holds the score.
- One API test (`testChoicesTheContextsOwnTypesAndLabels`) errors on rows of the local database.

### 2026-11-10: master merged in (commit `a6e5fdd459`)
- 28 commits of master, with RC4's upgrade pack and migrations. The local test database is at
  15.0.0-RC4 (85 migrations applied; a dump was taken first).
- OAuth: master rewrote the consent flow. Its version is the base now, with only the PKCE fields and
  the consent page's two info lines kept on top. The branch's request-bound consent token is gone:
  master's token is per account and session.
- Hashtags: master now suggests only hashtags of public, active content. `GET /hashtags` did not
  have that rule and would have shown hashtags of private posts. It has it now, with a test.
- Seven branch migrations were renumbered because master's RC4 migrations took their numbers.
- No score changes. Two test-isolation findings for metric 4:
  - four API query-count tests fail when the migrations tests run before them in the same process
    (they pass alone and in the API-only run);
  - `compose.test.tsx` "stops an upload that is taken off" failed in 2 of 5 desktop runs under load.

### 2026-11-10: the private fix for master's edit path
- A private pull request now filters values in the site's own edit service, which closes on
  master the hole the API fix of this morning closed on the branch. It is under review: one side
  effect on date fields was sent back to its author.
- For this branch, once that fix is on master and merged in: the edit service will run each
  value's filter itself, so the calls to `BxDolApiV2Forms::dbPassed` before `serviceEditEntity`
  (Forum, Tasks, Profiles, the base text class, Posts) filter twice. Remove them then, keeping the
  filtered value only where the code compares it with what is stored.
- The branch stays unpushed until that fix has shipped.

### 2026-11-10: classic-site fixes sent to master for RC4
- Each was checked on current master and has a test that fails there and passes with the fix.
- unacms/UNA#6263 Tasks: assignees are told when a task expires or is completed (the alerts read
  the assignment the wrong way round); deleting a budget entry takes minutes, not hours, off the
  total; the delete check counts the action.
- unacms/UNA#6264 Timeline: a post added through the `add` service is stored as a common post.
- unacms/UNA#6265 Conversations: an edit no longer puts the conversation back, unread, in the
  Inbox of a recipient who had moved it to Trash or Spam.
- When they merge and master is merged in again, the branch's own copies of these fixes merge
  away.

### 2026-11-10: desktop duplications removed (commit `256d1817de`)
- `components/dialog.tsx`, `lib/errors.ts` and `lib/storage.ts` replace the three most copied
  blocks; the lightbox, compose sheet and palette keep their own open and focus rules and share
  only the open and close calls. No existing test was edited; 23 tests were added (920 in all).
- Code cleanliness 5 to 6.
- Seen while testing: `connections.test.tsx` "is a page of tabs" failed once in a full run under
  load and passed alone, a second load-sensitive desktop test beside the compose upload one.

### 2026-11-10: more fixes sent to master for RC4
- unacms/UNA#6267 Timeline: a failed link preview no longer keeps the post form locked
  (issue #5986).
- Private: a second fix is open in the security repository for the link action. As with the
  first, nothing about it is described here.

### 2026-11-10: rate limits and a kept route table (commits `223aa80f4b`, `a616973974`)
- API v2 counts requests per profile or guest address in six buckets and answers 429 with
  Retry-After over the limit; the limits are Studio settings and the counts are pruned by cron.
  One statement per request; a database error lets the request through.
- The route table is kept between requests and checked against the endpoint files' times and sizes.
- API v2 security 7 to 8, Performance 6 to 7.
- Found while checking: `SystemSqlDefaultsTest` had failed since master was merged in. Master puts
  Log in and Sign up first in the site menu (orders 1 and 2) and this branch's Explore sat at 2;
  it is at 3 now, with a migration.
- Tests: `--filter ApiV2` 311 with the one known local error, `MigrationsDbTest` 22, desktop tsc
  clean against the regenerated API types.
- Next on the list: the app waits and retries on 429; the trusted proxy list goes to master as its
  own pull request, since the site's address reading is shared with the classic site.

### 2026-11-10: the app waits out a short 429
- `lib/rate-limit-fetch.ts`: a 429 with a Retry-After of 5 seconds or less is waited out and the
  request sent once more; a longer one passes through and the pane shows the API's message.
  Requests the shell sends itself (uploads, sync, token refresh) are not covered yet.
- 9 tests added (929 in all). No score change: this closes the gap the rate limits opened.

### 2026-11-10: uploads, comments and reactions out of the Timeline class (commit `87070c0eca`)
- Twelve operations moved unchanged into `BxBaseApiV2Uploads`, `BxBaseApiV2Comments` and
  `BxBaseApiV2Reactions`; they reach the Timeline through hooks and do not name it. The served
  document matches the committed one apart from the site's title and address.
- Three tests added (API v2: 314). No score change yet (metric 7 stays at 7; one of four open
  items closed).
- Seen once: `ApiV2Test::testPrivatePhotosKeepTheirLinksAndEtag` failed in one full run and
  passed alone and in the next two full runs. Unexplained; a third load- or order-sensitive test.

### 2026-11-10: the trusted proxy list sent to master
- unacms/UNA#6270 brings back #5845 on current master: proxy headers count only from private
  addresses and the proxies listed in a new Security setting, and X-Forwarded-For is read from the
  right. Three migrations added (the option and its strings). 87 unit tests; Auto-fix is on.
- Analytics already reads the headers this way with its own list and is unchanged.
- No score change until it is merged and this branch has it.

### 2026-11-10: the router checks query params (commit `58ffebc918`)
- A request's query is checked against what its operation declares before the endpoint runs:
  required, enum, pattern, length and range, with every invalid param in one 422. The rules are
  kept with the route table, so a request builds no schemas for it.
- No existing test changed its result: the endpoints already refused the same values one by one.
  22 tests added (API v2: 336).
- No score change (metric 7 stays at 7): the versioning policy or the spec check is what moves it.

### 2026-11-10: versioning rules and a check of the committed spec (commit `e552d0d666`)
- `ApiV2SpecFileTest`: every operation, component and tag the site serves must be in
  `neo/desktop/una-api/openapi.json` word for word, and a site with every module may not find
  more in the file than it serves. Checked by changing the file three ways.
- `docs/api-v2.md`, "Versions and changes": what is compatible, what is breaking, deprecation,
  security fixes, and the file as the record. The deprecation period was set the same day:
  three UNA minor releases and no less than twelve months.
- API v2 design 7 to 8, its target. API v2 tests: 337.

### 2026-11-10: API tests seed their own data (commit `48a3559abd`)
- `tests/integration/api/ApiV2Seeds.php`: people with their own accounts, administrators, groups,
  notifications and conversations, made through the site's own forms and services and removed
  after the class (and at the end of the process if it dies). Seeding is the default;
  `UNA_TEST_SITE_DATA=1` uses the site's data as before. Both modes: 337 tests, none failing.
- The Tasks test that failed on the local database is fixed. Accounts, profiles, groups, feed
  events, notifications, connections and uploads are unchanged after a run.
- Left: two `sys_keys` rows per run from a test not traced yet; the Events, Spaces and Tasks
  tests still make their contexts with their own helpers; log tables still grow.
- No score change: metric 4 waits for CI.
- The API items of the v16 list (step 2) are all done. Next is step 3, the desktop foundations:
  CI, translations, the token kept in Rust, the pane shell, one brand config.

### 2026-11-10: CI for the desktop app, the API client and the shell (commits `d6b5660eda`, `ddefc70abb`)
- `.github/workflows/desktop.yml`, on a PR or a push to master that touches the app or
  `neo/desktop/una-api`, and by hand. One job for the app and the API client: `src/schema.ts`
  is what `openapi.json` generates, the OpenAPI file's lint, types, ESLint with no warnings, 929
  tests, the build. One job for the shell on macOS, Linux and Windows: rustfmt, clippy with
  warnings as errors, the tests. Unlike NEO's lint and typecheck, nothing is compared with the
  base branch: it is all clean and fails on any error.
- What the checks turned up: the shell had never been formatted (now rustfmt with 160 columns,
  266 lines changed, no behaviour change), and clippy failed on one unused item on macOS and four
  more on Linux, all code that only the macOS menu or the tests use.
- `ci.yml`: a PR that changes only `neo/` skips PHPUnit, except when it changes the API client's
  OpenAPI file, which `ApiV2SpecFileTest` compares with the PHP code.
- The tests' waits (Testing Library's one second) are four seconds, for loaded machines and CI
  runners.
- Checked by hand on macOS, and in containers from a copy of the tracked files: the app job from
  a fresh `yarn install` on Node 24, the shell job on Rust's Debian image (112 tests; macOS has
  113). Not checked: the workflow on GitHub's runners, and Windows at all.
- No score change: metric 4 moves with the first green run on GitHub.
- Next in step 3: translations, the token kept in Rust, the pane shell, one brand config.

### 2026-11-10: the app's own words in five languages (commit `5456caecea`)
- A translation layer for the desktop app only: i18next, as NEO uses, with the English text as
  the key, so English needs no file and the existing tests read as before. UNA's language keys
  and NEO's files stay what they are; what a network says still comes from the network, asked
  for the same language.
- About 1,770 texts and 104 texts with a count moved, in 149 files; the finder of English
  written straight into the UI went from 843 places to none. Rust's menu bar, tray, dialogs and
  reasons read the same files and are built again when the language changes.
- Settings > Appearance has a Language choice. English, Russian, German, Spanish, French.
- A check in the test suite keeps it so (see metric 11). It found, on the way, three places that
  located a control by its English label and two where the page recognised a Rust message by
  its English wording; all five are fixed.
- For English readers: quantities of 1,000 and more now have their separator, and dates follow
  the app's language.
- Checked: 975 desktop tests, 119 Rust tests on macOS and 118 in the Linux container, lint and
  types; the sign-in screen in Russian in a browser; the installed app's menu bar in Russian.
  Not checked: the signed-in screens in another language by sight (the screen could not be
  captured), and the translations by a native reader.
- A test that failed about once in 25 runs is fixed: it removed an upload before the upload
  had started.
- Score: Translations 2 to 6. Next in step 3: the token kept in Rust, the pane shell, one brand
  config.

### 2026-11-11: the access token stays in Rust (commit `a6ada89eb6`)
- Before, the page asked Rust for the token, set the header itself and sent requests through
  the HTTP plugin, which could reach every path of the signed-in site. Now the page names its
  session and the request, and Rust (`api.rs`) checks the address is `{site}/api/v2` or below,
  attaches the token, sends, and passes the answer back, its body in pieces so a streamed reply
  still streams. Aborting a request stops it in Rust.
- Gone: the `access_token` command, the HTTP plugin on both sides, the runtime capability that
  scoped it to the site.
- A 401 renews the session in Rust with the token that was refused, before the page hears.
- Tests: Rust 119 to 129, three of them against a site on the same machine (the token is on
  the request and nothing of the page's is; a 401 renews first; a request for another path,
  host, method, sign-in or site is never sent). Desktop 975 to 993.
- Checked in the installed app: after the relaunch the site's log shows its API requests
  answered 200 and 304, none 401, and the screens load.
- Score: Shell and web view security 7 to 8. Next in step 3: the pane shell, one brand config.

### 2026-11-11: Russian checked by the owner
- The project owner used the app in Russian and found it fine; the open part of metric 11 is
  now the German, Spanish and French files and the fallback nouns.
- The Language choice was hard to find: it is in Settings > Appearance, under the themes, and
  not in the command palette or the menu bar, where the themes also are.
- No score change.

### 2026-11-11: one frame for the detail panes (commit `4baa43094c`)
- `src/shell/detail-shell.tsx`: the toolbar (Open in New Window, More, Close), the live region,
  and the loading, gone and failed states of an item's detail pane. The post, poll, video,
  photo, album, file and discussion panes draw only their item now (2,219 to 1,821 lines).
- `src/lib/copy-link.ts`: one Copy Link handler instead of twelve.
- Left with frames of their own: the task pane (its Previous and Next buttons show before the
  task loads) and the thread pane (no More menu, no live region).
- No visible change; checked a poll in the installed app. 1,004 desktop tests (11 new).
- Score: Code cleanliness 6 to 7. Next in step 3: one brand config.

### 2026-11-11: one brand config (commit `9e28519cb9`)
- `neo/desktop/brand/`: `brand.json` (name, identifier, scheme, description, issues
  address), the icons and the in-app icon, with a README for client projects. `apply.mjs` writes
  the values into `tauri.conf.json` and `index.html`; `brand.mjs` refuses values a build cannot
  ship.
- Rust takes them at compile time (`build.rs`, `src/brand.rs`), the page from `src/lib/brand.ts`.
- 11 texts that named the app say `{{app}}` in the code and in all four languages.
- Today's values are unchanged, so settings, sign-ins and links carry on: the installed app is
  still signed in after the rebuild.
- Tests: desktop 1,011, Rust 130.
- Score: Delivery and client projects 2 to 3. Step 3 is done but for the CI workflow's first run
  on GitHub. Next is step 4, shipping: signing and notarisation, the updater, Windows and Linux.

### 2026-11-11: signing and notarisation, ready for the certificates
- `tauri.conf.json` turns the hardened runtime on and takes the identity from
  `APPLE_SIGNING_IDENTITY`. The installed app is now built that way, with the development
  certificate: it runs, keeps its keychain sign-in and reaches the site.
- `scripts/check-signature.sh`: the signature (deep, strict), the hardened runtime, no
  `get-task-allow`, and for a release the Developer ID certificate, the stapled ticket and
  Gatekeeper's verdict.
- `.github/workflows/desktop-release.yml`: universal macOS app and DMG, Windows NSIS and MSI, Linux
  deb and AppImage, kept as artifacts; nothing is published. A `desktop-v<version>` tag must match
  the three version files and must be signed. The README lists the secrets.
- Checked locally: a release build for Apple silicon, signed with the development certificate,
  passes the local signature check, and its DMG (5 MB) verifies. The DMG step needs `CI=true` on a
  Mac without Finder automation rights (it skips the Finder window layout); GitHub's runners set it.
- Not run: the release workflow itself, as no signing secrets exist yet and the branch is local.
- No score change: metric 12 moves with the first signed release run.

### 2026-11-11: master merged after the 15.0.0-RC4 release
- 23 master commits merged (the RC4 release, Tasks time tracking, the operator splash tool,
  trusted proxies, NEO header menus, xymbols language glyphs). Four conflicts, all this branch's
  own RC4 fixes that reached master after review: master's text kept.
- Master's edit service now runs each value through its form input's db pass, so the API no longer
  passes values before calling it (they were passed twice). `BxDolApiV2Forms::changed()` compares
  the passed form with the stored row and hands the service the values as they came.
- Master had two sets of migrations numbered 2026111010-12, which stops the migration runner and
  master's CI; the trusted-proxies set is 2026111013-15 here, and the same rename goes to master
  in its own PR.
- Tests: API 337 (none failing), migrations 22, install defaults 21, the edit service's 3, desktop
  1,011. Units: two failures that the merge did not cause: the known local-database
  `testGetBadgeLink`, and `ModuleHomeAppBlocksTest` (Featured Posts on the posts home in the apps,
  from this branch's 2026-11-09 page defaults, against master's #6167 rule).
- No score change.

### 2026-11-11: the updater
- Rust (`src-tauri/src/updater.rs`) checks and installs; the page asks it to (`check_update`,
  `install_update`, main window only) and gets no permission of the updater plugin. The address
  and public key are `brand.json` `updatesUrl` and `updatesPubkey`, written into `tauri.conf.json`
  by `apply.mjs`; another identifier with UNA's address is refused, so a client project cannot
  ship an app that would update to UNA's. UNA's address is the `desktop-latest` release's
  `latest.json`.
- The page (`src/lib/updates.ts`, `src/components/update-dialog.tsx`): a check 10 s after start
  and daily, unless Settings > About turns it off; what it finds is offered by an Update button at
  the sidebar's foot and said once in the window's live region, never installed. Check for
  Updates… in the app menu, the profile menu, the command palette and Settings > About opens the
  dialog: the version, the date, what is new (plain text), Later or Install and Restart, then a
  progress bar and the restart. Development builds check only when asked. 38 new texts, in all
  five languages.
- Releases: a tag builds signed update packages (`TAURI_SIGNING_PRIVATE_KEY` and its password,
  required for a tag) and drafts the GitHub release with the installers, the packages and
  `latest.json` (`scripts/update-manifest.mjs`). Publishing the draft runs
  `desktop-update-feed.yml`, which takes the published notes into the feed and copies it to
  `desktop-latest`; an older version never moves it back.
- The key pair was made; the private key and its password are with the owner, outside the
  repository.
- Checked end to end on this Mac with two release builds of a throwaway brand and key (so the
  owner's app and keychain were not touched) and a local feed: the automatic check opened
  nothing; Check for Updates… showed 0.1.1 with its notes; Install and Restart downloaded,
  verified, replaced the app and started it again as 0.1.1, which then found nothing newer. A feed
  that announced 0.1.2 for the 0.1.1 package was refused after the download, and the app stayed.
- Tests: desktop 1,011 to 1,032 (the store, the dialog, the feed script, Settings, brand
  checks), Rust 130 to 136.
- Not run: the release workflow (no secrets, branch local), Windows and Linux updates.
- No score change: metric 12 moves with a release that runs.

### 2026-11-11: the shell on Linux and Windows
- In a `rust:1-bookworm` container with all of `neo/desktop`: `cargo fmt --check`, clippy with
  no warnings and the Rust tests (135, all but one macOS-only) pass on Linux. The same container
  runs clippy for `x86_64-pc-windows-gnu`, which compiles every `cfg(windows)` path (the overlay
  badge, Mica, the Mark of the Web, the updater) with no warning. The MSVC target cannot be
  checked from a Mac without Microsoft's SDK; CI's Windows job builds it once the branch runs on
  GitHub. The recipe is in the desktop README (Tests).
- Fixed: a file downloaded under a name Windows keeps for devices (`CON`, `nul.txt`, `COM1`) or
  ending in a dot or space was suggested as it was, which Windows cannot save; it now gets a `_`
  in front, or loses the trailing dots and spaces.
- Read for Windows and Linux without finding more: paths are joined with `Path`, the web view's
  address differs by system already (`http://tauri.localhost` on Windows), deep links register
  through the installer on Windows and at start on Linux.
- Untested at run time (no Windows or Linux machine): the tray, the overlay badge, Mica, deep
  links and autostart, the keychain, downloads, and updates (NSIS and MSI in passive mode, an
  AppImage replacing itself, a .deb through pkexec).
- Score: Delivery and client projects 3 to 4, for the update run end to end on the Mac (previous
  entry). Next in step 4: the certificates and the update key in the release secrets, then a
  first release run; Windows and Linux on real machines.

### 2026-11-11: dark surfaces, one icon per place, feed cards (owner's feedback)
- Dark mode follows NEO's order: the chrome (sidebar, title and tab bars, bottom bar) is the
  darkest (NEO's page background, `neutral-950`), the content lighter (`neutral-900`), cards,
  fields and buttons on it lighter again. Before, the sidebar was the lightest. Secondary text is
  7.7 / 6.9 / 6.2:1 on the three; a post's capsules take `neutral-300` on cards (7.4:1), since
  the secondary grey was 4.28:1 there.
- Icons: Connections drew `users-round` in the sidebar (the site's) and `users` in its tab and
  title. Three icon tables are now one (`lib/section-icons.ts`), and the tab and the pane's title
  take the sidebar's current row's own icon. Sidebar icons are xymbols' animated icons, as in NEO's
  and UNA's menus: they move under the pointer or keyboard focus and fill on the current row;
  reduced motion keeps the fill only.
- Posts in feeds are cards, as in NEO: their own surface and ring, 9px apart, hover and selection
  tinting the card, keyboard focus ringing it.
- Tests: desktop 1,032 to 1,038. Not checked by eye in the app (no screen control for the test
  build); the owner looks at it next.
- No score change.

### 2026-11-12: live events over the site's sockets (v16 step 5, first part)
- API: `GET /realtime` says where the site's sockets server is (Soketi, Pusher's protocol: a ws
  or wss address and the app key, never the secret) and which public channels carry what, each
  endpoint class naming its own (`apiV2RealtimeChannels`): the Timeline's feed channel and the
  viewer's connections channel. `Item.live.comments` names an item's comments channel. The
  sockets class gives clients its config (`BxDolSockets::getClientConfig`); the comments and
  connections channel names are now one definition each (`BxDolCmts::getSocketNameOf`,
  `BxDolConnection::SOCKET_NAME`).
- Desktop: Rust holds one WebSocket to the active network's server (`realtime.rs`), subscribes
  to the public channels the windows name (checked: no private or presence channels, UNA's
  characters only), answers pings, reconnects with back-off and on a new sign-in, network or
  acting profile, polls the sync at once when the viewer's connections change, and passes each
  event (ids only) to the windows that asked. The page: a new post shows the "new posts" pill at
  once, a removed one leaves the feed, an open post's comments and count reload, friend requests
  and connections reload.
- Found on the way: UNA's sockets events reach clients encoded twice (sendEvent takes JSON text;
  the Pusher library encodes it again). The app decodes the second layer; documented for other
  clients.
- Not covered, because the site sends no events for them yet: notifications and messages (their
  badges still come from the 30 s poll), and reaction counts (the feed's poll).
- Tests: API 3 new (`ApiV2RealtimeTest`), 339 of 340 API v2 tests pass (the one failure is this
  worktree's missing storage folders for the branding test's upload, unrelated); desktop 1,038 to
  1,045; Rust 136 to 143, one of them a Pusher handshake against a server on this machine.
- Checked live: the Rust client against a real Soketi (a throwaway container), with the event
  sent the way the site sends it (UNA's Pusher PHP library): connected, subscribed, received and
  decoded. Not checked: the whole app against a site with sockets (the local site has none set,
  and its settings were left alone).
- No score change: metric 1 moves with the rest of step 5.

### 2026-11-12: merged to master, plan revised
- unacms/UNA#6307 merged API v2 and the desktop app as previews, v2 off as installed. Before the
  merge the branch was made identical to master with v2 off: the apps' own menus, page layouts
  left alone, a built-in OAuth client, shared PHP behind `bx_is_api_v2()`, CORS only for allowed
  origins, the app in `neo/desktop` as its own workspace.
- CI ran on GitHub for the first time: unit and integration tests on PHP 8.3 and 8.5, the
  desktop job, the shell on macOS, Linux and Windows (MSVC), SonarCloud, all green. Metric 4's
  condition is met; step 3 is complete. The release workflow has still not run.
- Review fixes on the way: an Idempotency-Key holds a database lock while its request runs; a
  Tasks budget entry and its total change in one statement; downloads write a temporary file each.
- Figures: 169 operations (was 168, `getRealtime`), the app calls 157; 15 of 35 app-enabled
  modules have endpoints. #6270 (trusted proxies) is merged, closing that item under metric 8.
- A review of this plan against the merged code (three surveys and a checker) found the items now
  under "Release items the merge created", and that the README's claim about a turned-off site
  is not true of the code. The plan section above replaces the local-branch plan.
- No score change in this entry; metric 4 and metric 13 are due a re-score with the owner.


### 2026-11-18: lazy chunks for icon loaders and translations (unacms/UNA#6398)
- Lane A item 4, first part. The startup chunk was 2.77 MB minified: 0.57 MB were the loaders
  of every Lucide icon and xymbols animation, 0.59 MB the four translations. Both are now chunks
  of their own; the entry loads the chosen language, then the app. Startup script 1.61 MB
  (gzip 681 KB to 469 KB).
- Still in the startup chunk: the rich editor (~300 KB) and the task views; the sidebar and
  the comment tree import them, so they wait for the structure work under metric 2.
- Found on the way, not fixed: a signed-in member's sidebar comes back in the language of the
  previous launch (guests get the requested one). Site side, lane B.
- No score change until it merges; metric 10's "no lazy loading" is half done.

### 2026-11-18: one module for dates (unacms/UNA#6399)
- #6398 merged (414d6f28a1). Lane A item 4, second part: `src/lib/dates.ts` holds every date
  and time text; formatters are made once per options and locale. 11 files lost an import from
  another feature or from the feed card (metric 2). 1264 tests.
- Left of item 4: the section registry, routes as a union, focus and command hooks out of the
  shell, then the editor and task views as lazy chunks.

### 2026-11-18: section registry (unacms/UNA#6405)
- #6399 merged (8edb38e57a). Lane A item 4, third part: `src/lib/sections.ts` (name, icon,
  Browse label per section) and `src/shell/section-panes.tsx` (each section's list pane), both
  `Record<Section, …>`. The shell lost 20 feature imports; the tab strip, the window title, the
  Browse labels and the sidebar rows read the registry. 1267 tests.
- Left of item 4: routes as a union per section, focus and command hooks out of the shell,
  query-key factories, then the editor and task views as lazy chunks.

### 2026-11-18: list routes as a union per section (unacms/UNA#6408)
- #6405 merged (8d4ef988ab). Lane A item 4, fourth part: `ListRoute` is a union, one member per
  section (`SectionFields`, `SectionRoute<S>`); other sections' fields are typed as absent, so
  reads keep working and a wrong construction does not compile. `filterRoute` added; each
  section's pane takes its own route. 1271 tests.
- Not done here: the path writing and parsing of each section is still one function in
  `router.ts` (a codec per section would finish metric 2's "router knows every feature").
- Left of item 4: focus and command hooks out of the shell, query-key factories, then the
  editor and task views as lazy chunks.

### 2026-11-18: focus and command hooks out of the shell (unacms/UNA#6413)
- #6408 merged (a5d91d9ea1; it also set App's session ref with the commit, which ended the
  flaky sign-out test). Lane A item 4, fifth part: `shell/use-shell-focus.ts` and
  `shell/use-shell-commands.ts`; `shell.tsx` is 437 lines (was 797). 1271 tests.
- Left of item 4: query-key factories, a path codec per section, then the editor and task
  views as lazy chunks.

### 2026-11-18: query keys made by their owners (unacms/UNA#6417)
- #6413 merged (85fede9995). SonarCloud notes two S3776 smells it made visible: the command
  handler (complexity 52) and the focus effect (45), both moved unchanged; splitting them is
  open.
- Lane A item 4, sixth part: the 95 hand-written query keys are helpers of the module that owns
  the data, longer keys built from the prefixes; a lint rule refuses a key written at a call.
  One dead invalidation (`['tasks', 'mine']`) removed. 43 files, 1271 tests.
- Left of item 4: a path codec per section, the two S3776 splits, then the editor and task
  views as lazy chunks.

### 2026-11-18: shell commands as a table, focus rules per case (unacms/UNA#6425)
- #6417 merged (892d128063). The two S3776 functions of #6413 are split: `COMMANDS` table and
  `runFamily` in `use-shell-commands.ts`, `moveFocus` and three case functions in
  `use-shell-focus.ts`. No behaviour change, 1271 tests.
- Left of item 4: a path codec per section, then the editor and task views as lazy chunks.

### 2026-11-18: editor and task views load after start (unacms/UNA#6428)
- #6425 merged (400055979a). Lane A item 4, last of metric 10's lazy loading: startup script
  1,556 KB to 911 KB minified (gzip 454 to 267 KB); editor chunk 408 KB, task views 71 KB.
  `lib/lazy-module.ts` (React `use`), `rich-editor/lazy.tsx` (RichEditor placeholder,
  useEditor/withEditor/loadedEditor), `tasks/lazy.tsx`; preload after the first frame in boot.tsx.
- Traps: React 19 never wakes a component suspended on a promise whose `status` was pre-set to
  `pending` (leave it to React); RTL's plain `render` does not draw a suspending component (use an
  awaited act). test-setup loads both parts in beforeAll (after the file's vi.mocks).
- Left of item 4: a path codec per section.

### 2026-11-18: a path codec per section (unacms/UNA#6430)
- #6428 merged (ef378b2c1e). Lane A item 4, last part: `QUERY_CODECS` in router.ts, one
  write/read pair per section (8 codecs, `Record<Section, QueryCodec>`), `oneForm`, and
  `parseRoute` = `parseList` + `parseDetail`. Kept the lenient default-feed read. 1277 tests.
- Item 4 is done once this merges. Open: two S3776 notes (comment composer 28, post editor 20)
  on code only renamed in #6428; codecs still live in router.ts, not in the features.

### 2026-11-21: Suggestions tab, consent without a profile, realtime freeze (unacms/UNA#6502, #6525, #6527)
- #6446 (composer and post editor in smaller parts) and #6430 merged: lane A item 4 is done.
- #6502: Connections has a Suggestions tab (the site's friend suggestions, with Add friend).
- #6525 (lane B, the owner asked for it now): a signed-in account with no profile is offered
  Create profile on the OAuth consent page and comes back to connect. `OAuthAuthorizeTest` no
  longer deletes every `una-desktop` token on the site, which signed out local apps.
- #6527: the app froze after sign-in because `realtime.rs` took the state lock twice in one
  statement; a Rust test covers it.
- The local site moved to Kiri (compose project `una-desktop`, :8098). Not checked by a person
  yet: the Suggestions tab in the rebuilt app (needs a fresh sign-in).
- Open: a refused refresh on first launch may still leave the app on "Signing in…".
- Lane A item 5 turned out to be done by #6312 on 11-12 (no script cited, spec recipe says v2
  on, README says what CI runs on Windows and Linux; the platform lines were checked against
  the shell code again today and match). Release item 2 (Caddyfile rule) went in with it.
  Lane A is complete; what is left is lane B (after final) and shipping.
