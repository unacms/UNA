# UNA desktop app

> **Preview, not for production.** The app and the API it uses (v2) are still changing. A site
> has to turn API v2 on for it (Studio > API > Settings, "API v2 (preview)"; off as installed);
> until then the app says the site has it turned off. NEO's web and mobile apps do not use v2.

A Tauri 2 app for any UNA network, on [API v2](../../docs/api-v2.md): feeds, posting with photos and videos,
comments, reactions, profiles with follows and friends, notifications (with OS notifications)
and conversations.

- UI: React + Vite + TypeScript, NEO's palette in light and dark. The typed client is
  `una-api` in this folder.
- Not part of NEO's yarn workspaces: this folder (`neo/desktop`) is a workspace root of its own
  (the app, with `una-api` as its one workspace), with its own `yarn install`, lint, types and
  tests. NEO's install, lint, typecheck and builds (web, iOS, Android) do not know it, so they
  are what they are without the desktop app. It reads one NEO file, in a test
  (`src/lib/rich-html.test.ts` runs NEO's mention conversion on the app's HTML).
- Sign-in (`src-tauri/src/auth.rs`): the system browser opens the site's OAuth 2 page, where the
  person allows the app for their account (the site always asks, since the app has no
  secret). Like a site session, the app then acts as whichever profile the account uses on the
  site at the time: switching profiles on the site switches the app too, and the app's profile
  switch (`PUT /me/active-profile`) switches the site. The code comes back to a loopback port, PKCE (S256) guards the exchange (RFC 8252).
  The listener reads each connection with a 5 s timeout, answers stray requests and keeps
  waiting; "Cancel sign-in" stops it. Tokens live in the OS keychain on the Rust side; the web
  view never holds a token, neither the access token nor the refresh token: Rust attaches the
  access token to each request itself (below).
  Sign-out waits for a refresh in flight, forgets the session at once, then revokes the refresh
  token and the access token in the background (5 s each), so a slow or unreachable site never
  keeps the app signed in.
- The page has no network of its own. Its API requests go to Rust (`api_request`,
  `src-tauri/src/api.rs`; `src/lib/rust-fetch.ts` is the `fetch` the API client uses), which
  takes the session the page names (site and generation), checks that the address is that
  site's API (`{site}/api/v2` and below: no other path, no other host, no user or password in
  it), attaches a current token of that session and sends it. The page chooses the method, the
  path, the body and a few headers (`Accept`, `Accept-Language`, `Content-Type`, the conditional
  ones); `Authorization`, `Cookie` and anything else it sets are dropped, and it gets no
  `Set-Cookie` back. A redirect is followed only into the API again. The answer's status and
  headers come back at once and the body in pieces on a channel, so a streamed reply reads as
  it is written; aborting a request stops it in Rust (`api_abort`). A session that is over gets
  no request at all, and a 401 renews the session in Rust before the page hears of it. Rust
  looks the site up itself before sign-in (`discover_site`). There is no HTTP plugin and no
  cookie jar; the CSP's `connect-src` is IPC only (`devCsp` adds Vite's HMR socket). Images and media load over https, `data:`,
  `blob:` and the app's own `una-media` scheme, in `csp` and `devCsp` alike (no plain http, so
  post HTML on any site can't make the page send requests to services on the user's machine,
  and `tauri dev` loads pictures the way the bundle does). A local development site's pictures (plain http on `localhost`, `127.0.0.1` or
  `*.localhost`, the hosts `auth.rs` lets sign in over http) would be blocked anyway: the
  bundled page is a secure context and WebKit blocks them as mixed content (checked in the
  bundled build: no request reached the site). Every picture's `src` comes from `mediaSrc`
  (`src/lib/media.ts`): a local http picture of the signed-in site's own origin becomes
  `una-media://localhost/?u=<url>` (`http://una-media.localhost/` on Windows), and Rust
  (`src-tauri/src/media.rs`) fetches it only from that origin, for the app's own web views,
  following redirects on that origin, images and videos only, up to 25 MB. Post HTML can carry
  pictures: RichText (DOMPurify, `src/components/rich-text.tsx`) keeps `img` with `src`, `alt`,
  `width` and `height`, and each `src` goes through `mediaSrc` too, so a post can make a reader's
  app fetch a picture from any https host (as the site's own page does; the host sees the
  reader's address). It keeps no `style`, no event handler, and no `data-*` or `aria-*` attribute
  but a mention's `data-profile-id`: the app steers by its own (`data-pane`,
  `data-tauri-drag-region`). A picture refused or failing to load
  shows the profile's monogram or a generated cover band, never a broken image. Links open in the browser (opener scoped to
  http and https), and a link that can't open shows a message.
- The keychain is read after the window shows (`AuthState::pending`, `ensure_loaded`): the page
  shows "Signing in…" and asks for the session, and only that first command reads it, off the
  main thread, once for every caller. A read that fails (access denied, locked) deletes nothing:
  the sign-in screen says "UNA couldn't read your sign-in from the keychain" with Try again, the
  poller waits, and the next command reads again. The keychain trusts the app's code signature,
  so sign the debug bundle with a stable identity (an Apple Development certificate:
  `APPLE_SIGNING_IDENTITY="Apple Development: <name> (<id>)" yarn tauri build --debug --bundles
  app`, or `codesign --force --deep --sign` the bundle afterwards) and "Always Allow" survives
  rebuilds; an ad-hoc signature changes with every build and asks again.
- Remaining risk: the access token reaches the web view, so script injected through post HTML
  (DOMPurify is the only defence) could read it. It could not send it with `fetch` (CSP, and the
  plugin only reaches the site itself), but `img-src https:` lets it out in an image URL. A site
  allowed in this run stays allowed after sign-out until the app restarts (capabilities can't be
  removed). The fix is for Rust to attach the token to requests itself, as uploads already do.
- Plugins: opener, http, notification (used from Rust only), dialog, store, log, single-instance
  (with its deep-link feature), window-state, autostart and deep-link (both Rust-side but the
  autostart switch). The
  dialog plugin only asks before a delete (`ask()`, which is its `message` command): the
  capability grants `dialog:allow-message` and no file dialogs; the photo picker opens from Rust.
  The store plugin holds the drafts (`drafts.json`), which Rust opens at start: the page gets
  get-store, get, set, delete, entries and save, never `load`, whose path would reach any file.
  Those permissions reach every store that is open, so the settings are not one: Rust keeps
  them (`settings.json` in the app data folder, `src-tauri/src/settings.rs`), every window reads
  them with `get_settings` and only the main window changes them (`set_setting`), so a window of
  its own can't turn off OS notifications or change what closing the window does.

## Window, navigation and shortcuts

- The window starts hidden with NEO's background colour (`#FAFAFC`, `#0A0A0C` in dark mode, set
  from Rust by the window theme) and Rust shows it once the page's first render is committed
  (`showWindow` from a mount effect, not from `requestAnimationFrame`, which a hidden web view
  may never run, calls `page_ready`; the page has no show or focus permission); Rust shows it
  anyway after 3 s so a crashed page never leaves an invisible app. Started at login with
  `--hidden` (Settings > Start at login) it stays closed until the tray, the Dock, a second
  launch or a link opens it (`tray.rs`). window-state restores size and position
  but not visibility (`StateFlags::all() & !VISIBLE`).
- macOS: overlay title bar (`titleBarStyle: Overlay`, `hiddenTitle`, traffic lights at 18,24,
  centred on the 44 px top bar). The page draws under it: `data-titlebar="overlay"` on `<html>`
  leaves room for the traffic lights in the top bar, and the bars and pane headers carry
  `data-tauri-drag-region` (`core:window:allow-start-dragging`, `allow-internal-toggle-maximize`
  for a double click). Windows and Linux keep native decorations and get no drag regions; the
  top bar starts at the window's edge there.
- The window's chrome (`src/shell/top-bar.tsx`, `bottom-bar.tsx`, `layout.tsx`), as Linear has
  it: a top bar across the window (the traffic lights' room, the sidebar's toggle, History,
  Back and Forward over the sidebar's width, then the tabs over the content), the sidebar, the
  content in an inset rounded container (10 px corners, a hairline edge, 8 px from the window's
  edge) whose panes scroll on their own, and a bottom bar across the window (the network's
  footer links on the left, the agent chats on the right). The bars and the sidebar are on the
  window's material; the content is opaque. The bars stay whatever the sidebar does (names,
  icons only, hidden), so nothing is ever under the traffic lights: the controls take the
  sidebar's width, or more when the sidebar is an icon rail or hidden.
- Footer links: GET /navigation's `footer` (Studio > Navigation > Footer, `sys_footer`; docs/api-v2.md
  says what counts). A page of the site (About, Terms, Privacy) opens in the content pane, drawn
  from its text blocks (`text.html`, GET /layout/blocks/{id}/text, through RichText), as a
  sidebar row opens it (nothing beside it); a link to another site opens in the browser; a link
  to the site the app can't show is left out; the copyright notice is text. A site without
  GET /navigation has none.
- Layout (`src/shell/`): sidebar navigation, a list pane and a detail pane, each a named region
  with its own heading. From 1100 px wide the three sit side by side; narrower, an open detail
  covers the list, which stays mounted (and keeps its scroll) but is `inert`. Opening a section
  focuses its heading, opening a detail focuses the detail's heading (unless a field in it took
  focus, like a new message's box), closing it returns focus to what had focus when it opened.
  F6 skips the detail pane while it is empty. The sidebar is an icon rail (56 px, Lucide icons
  from `lucide-static`, `components/icon.tsx`; each name is its button's accessible name and
  tooltip) below 820 px; Cmd+\ (View > Toggle Sidebar, or the top bar's toggle) switches between
  names and icons at any width, remembered on this computer for wide windows; Cmd+Ctrl+S (View >
  Hide Sidebar) hides it altogether, and the toggle or Cmd+\ brings it back as it was. Back and Forward in the View menu are off
  when there is nothing to go back or forward to (`set_nav_state`, kept per window: a window of
  its own reports its history too, and the menu shows the focused window's).
- Gone items: a deleted post is dropped from every feed, the detail cache and history (the
  route's `forget`), so Back cannot reopen it; a post the site answers 404/403 for shows as no
  longer available instead of the copy a feed had. Switching the acting profile resets every
  cached query but `['me']` and starts history and scroll memory over: UNA profiles are
  separate identities.
- Router (`src/lib/router.ts`, `navigation.tsx`): a typed route (`{ list: { section, feed? }, detail }`)
  with a string form (`/home/post/12`, `/messages/conversation/7`) for history and later deep
  links, an in-memory back/forward history, and scroll positions remembered per list and per
  detail.
- Tabs (`src/lib/tabs.ts`, `shell/tab-strip.tsx`), as a browser has them: each tab is its own
  route with its own Back and Forward and scroll positions (`TabsProvider` gives the router the
  shown tab's history, and the panes mount anew for another tab), named and drawn with its
  page's title and its section's icon. The tabs, the one shown, the tabs closed lately (20) and
  the places visited lately (History, 15) are kept per network in localStorage
  (`una-desktop-tabs:<site|account>`), each tab with the last 30 entries of its history, so the
  next launch opens them again; a una:// link opens in the tab shown. Another profile acting
  starts over with one tab. Keys: Cmd+T New Tab (Home), Cmd+W Close Tab (the last tab stays;
  in a window of its own Cmd+W closes the window), Cmd+Shift+T Reopen Closed Tab, Cmd+Shift+W
  Close Window (the app's own item: Rust closes the focused window), Cmd+1 to 8 the tabs and
  Cmd+9 the last one (the page's keys, in no menu), Cmd+Shift+[ and ] the tab before and after
  (Window menu). The strip is the ARIA tab pattern: a tablist named Tabs, the shown tab in the
  tab order with its close button after it, arrows, Home and End show the tab reached, Delete
  closes, Option+Shift+Left and Right move it, Shift+F10 or a right click opens its menu
  (Duplicate Tab, Move Tab to New Window for a tab showing a detail or a page, Close Tab, Close
  Other Tabs); a middle click closes, a drag moves. The content is the tab panel. Tabs narrow to
  96 px, then the strip scrolls (a wheel scrolls it sideways), the shown tab kept in view. The
  strip shows with one tab too, as Linear's and a browser's do, so New Tab is always where it
  will be; one tab has no close button. Cmd+click or Cmd+Enter on a post, conversation, profile
  or group (anything that opened in a window before) opens it in a new tab behind the one shown
  ("Opened in a new tab" is said); with Option too, in a window of its own
  (`lib/open-in-window.ts`). History (the clock) is a menu of the places visited lately in this
  network, one opens in the tab shown.
- Commands (`src/lib/commands.json`) are read by both the native menu (`src-tauri/src/menu.rs`)
  and the key handling (`src/lib/shortcuts.ts`, `command-bus.ts`), so a shortcut is defined
  once. macOS gets App, File, Edit (predefined items, so copy and paste work), View, Window and
  Help menus; their accelerators take the keys first, and clicks reach the page as a `menu`
  event. Windows and Linux get no menu bar and the page handles the same keys with Ctrl. Keys:
  Cmd+Option+1…5 sections (Ctrl+Alt elsewhere, which is AltGr on some layouts: there the
  sidebar and the palette are the way), Cmd+1…9 tabs, Cmd+T, Cmd+W and Cmd+Shift+T tabs, Cmd+F Search, Cmd+K the command palette, Cmd+N new post, Cmd+[ and Cmd+]
  (and the mouse's back and forward buttons) back and forward, F6 and Shift+F6 between panes,
  Cmd+R refresh, Esc closes the detail pane, ? shows the shortcut sheet, Cmd+, Settings, Cmd+\
  the sidebar, Cmd+Ctrl+1…9 the networks (Ctrl+Shift+1…9 on Windows and Linux, which have no
  Cmd key to spare, and where Ctrl+Alt is AltGr, which types [ ] { } on many layouts; the
  Window menu names them). File has Add Network… and Sign Out and
  View the three themes, which the palette also runs. Esc and ? do nothing while a text field has focus, and no
  window key works while a dialog is open; a menu command chosen then closes the sheet first.
  Single-key shortcuts (j, k, l, e, ?, …) can be turned off in Settings > Keyboard (WCAG
  2.1.4); Esc and the shortcuts with Cmd or Ctrl keep working.
- Tokens (`src/styles/tokens.css`): NEO's palette unchanged, desktop surfaces and states, a type
  scale (13 px chrome, 15 px post text) and a 4 px spacing scale. Light and dark follow the OS
  unless Theme: Light or Theme: Dark is chosen (`src/lib/theme.ts`: `data-theme` on `<html>`,
  remembered in localStorage on this computer, and `setTheme` on the window, so the title bar and
  the background Rust paints match; capability `core:window:allow-set-theme`).

## Sidebar

The sidebar is the network's own: UNA's Apps Sidebar menu (`sys_apps_sidebar`), which a site
owner edits in Studio > Navigation, from `GET /navigation?platform=desktop-app`. It is a menu of
the apps' own: the site's own menus, which the site and NEO (API v1) read, are not changed for
it. Its first group is the Apps Menu (`sys_apps_menu`: Home, Explore, Profile, Messages,
Notifications, Connections), then the site menu headed Browse, then the contexts one belongs
to. Where each part is edited, which item fields count and how a module adds an item are in
[docs/api-v2.md](../../docs/api-v2.md), "Navigation: how the apps' sidebar is built and edited
in Studio"; the server's side is `template/scripts/BxBaseApiV2Navigation.php`.

- Icons: a row's icon is the site's (Studio's Lucide name), animated as NEO's and UNA's menus are:
  xymbols' animated icons (`components/animated-icon.tsx`, `xymbols` 0.6.0, one small module per
  icon), which move when the row is pointed at or focused and fill while it is current. The tab
  and the pane's title take the current row's icon too. The app's own icon for each section and
  for a site icon it cannot draw is one table, `src/lib/section-icons.ts`.
- `src/lib/site-navigation.ts` reads it (`useSiteNavigation`, query key `navigation`, kept with
  the network's offline data, so the last answer shows on the first frame) and turns it into
  rows (`sidebarModel`): each item's `target` becomes a list route (`targetList`): a section of
  the app (`conversations` is Messages, `videos`, `photos`, `albums` and `files` are Media's tabs,
  a module's `mine`, `popular`, `new` or `joined` view the section's feed where it has one,
  Connections' views its tabs, Persons' `persons` People at `recent`, `active`, `online` or
  `friends`), one's own Profile, someone's profile, a context's page, or the
  site's page (`/page?path=…`, drawn from its blocks by `features/page-blocks/site-page.tsx`
  through `GET /layout/resolve`). An item none of these fits is left out, with a note in the
  developer console, and so is one that goes where a row above it goes. `currentRow` picks the
  row the content pane shows (the most specific one; a group's or someone's page only its own).
- `src/shell/sidebar-navigation.tsx` draws it: each group of the site's under its heading (its
  Studio title: none for the Apps Menu, Browse for the site menu), Member Memberships (and
  Member Following, where the owner turns it on) as a folding heading per module with one's
  contexts (their pictures; Cmd+click or Cmd+Enter opens one in a new tab,
  Cmd+Option+click or a double-click in a window of its own) and Browse. Icons are Studio's (Lucide names; `components/site-icon.tsx`
  loads one the app's set lacks from the bundled Lucide, or draws the place's own icon).
  Notifications, Messages and Connections show the sync's live counts, other items the site's
  counter. A row navigates the content pane and closes what is beside it, as every sidebar row.
- The app's own, not in the site's menus: the network switcher, the search field (a Search row
  in the icon rail), the profile menu and Settings at the foot, and the Tasks section (My
  tasks, My timers, task contexts), drawn where the site menu's Tasks item is. Member Avatar is
  the profile button at the foot.
- A site without `GET /navigation` (404), and a network whose first answer has not come, get the
  fixed sidebar of `app.tsx` (Home, Explore, Notifications, Messages, Profile, Connections, the
  modules' sections, Groups and Spaces).

## Settings, several networks, offline reading

- Settings (`src/features/settings/`, Cmd+, or the gear at the sidebar's foot, route
  `/settings/settings/<part>`): the parts are listed in the list pane, the open one is in the
  detail pane. Account: the networks signed in to (Switch, Add network…, Sign out of this
  one) and the account's profiles (Edit profile, Act as). Appearance: the theme (System, Light,
  Dark: `data-theme` and the window's theme). Notifications: OS notifications on or off, and
  whether closing the window keeps the app running (both kept by Rust,
  `src-tauri/src/settings.rs`; sync.rs and tray.rs ask it each time).
  Keyboard: single-key shortcuts on or off, and the shortcut list. Start at login
  (tauri-plugin-autostart, a Launch Agent on macOS, with `--hidden`). About: the version and the
  update channel (Stable, automatic updates not set up). Settings live in `src/lib/settings.ts`
  (`SettingsStore`: loaded at start, a change applies at once and is then kept; localStorage
  outside the app).
- Edit profile (`edit-profile.tsx`, `PATCH /profiles/{id}`): name, about (plain text, lines are
  paragraphs), picture and cover. Photos upload with the purpose `profile`, which the site keeps
  for the acting profile's module, so the pictures of another profile of the account change after
  acting as it. Only what changed is sent; the site's reasons show next to the field
  (`aria-invalid`, `aria-describedby`) and focus goes there; an upload no save took is deleted.
- Several networks (`src-tauri/src/auth.rs`): each sign-in is a session of one site and one
  account, its key `site|account`, kept in the keychain under that key with a list of the keys
  and the active one (the single session of earlier versions moves in at start). Up to nine;
  `list_sessions`, `switch_session` and Add Network (the sign-in screen with Back). Only the
  active session has a token: a request of the page names its session (site and generation),
  and Rust's own requests (uploads, the sync) take the active one with its own site, so a site
  never gets another site's token (Rust tests). Switching is a new generation, as a sign-in:
  windows of their own close, the sync starts over, the page starts over at Home (or where the
  link that switched points). Signing out of one makes the next one active. The switcher at the
  top of the sidebar (`shell/network-switcher.tsx`) is an ARIA menu button: the networks
  (the open one checked, each with its keys), Add network…, Settings…; arrows, Home, End, Esc.
  The macOS Window menu names them (`menu.rs show_networks`). A site allowed in this run stays
  in the HTTP scope until the app restarts (capabilities can't be removed); its token does not.
- Offline reading (`src/lib/persist.ts`): what was read last (the account, the first two pages of
  each feed and list, posts, profiles, notifications, conversations, groups) is kept in IndexedDB,
  one entry per network key, saved a second after the last change, and brought back before
  anything is asked of the site; so with the network off a restart opens on the Home feed it had,
  under an offline banner (`role="status"`; React Query sends nothing until the network is back).
  Kept data is a week old at most and of this app version; one network's is never read for
  another, and signing out deletes it.
- Deep links (`una://open?path=/home/post/12`, with `&site=` for another network signed in to;
  `src-tauri/src/deep_link.rs`, `src/lib/deep-link.ts`): tauri-plugin-deep-link registers the
  scheme (macOS from the bundle, Linux at start, Windows at start in development); a link that
  starts a second instance on Windows or Linux reaches this one through single-instance. Rust
  checks the scheme and length and keeps them until the page takes them (`take_deep_links`); the
  page reads the path with the route parser and opens only a route it knows, here or after
  switching to that network; a link never acts, and a network not signed in to is not
  opened. The OAuth redirect stays on the loopback port.

## Command palette and search

- The palette (`src/features/palette/`, Cmd+K from any pane) is a modal `<dialog>` with the ARIA
  combobox pattern: the field is `role="combobox"` with `aria-activedescendant`, the results a
  `listbox` of `group`s (Recent, Go to, Commands, People, Groups, Posts, Search). Focus stays in
  the field: ↑ ↓ (and Page Up/Down) move the active option, which is tinted with the accent bar,
  Enter or a click runs it, Esc or a click outside closes it and focus goes back to where it was
  before the palette opened (also before a choice runs, so a detail it opens returns there on
  close). The number of results is said in a polite live region; Tab stays in the field.
- What it offers (`commands.ts`, tested on its own): every section and feed, the commands from
  `commands.json` that act from anywhere (new post, refresh, back and forward, the themes, the
  shortcut sheet, the site, report an issue, sign out), Switch to each other profile of the
  account, and with words typed people (`GET /search/profiles`), groups (`GET /search/groups`,
  left out on a site without the Groups module) and posts (`GET /search/content`), five or so
  of each, asked 200 ms after the last key; the last answer stays while the next one loads so
  the groups don't jump. Matching ignores case and accents and ranks the whole label, its start,
  a word's start, other words ("compose", "dark mode", "log out"), inside, then letters in order.
  The last entry is the full search. People, groups, posts and searches chosen are listed under
  Recent the next time, for this session and per profile.
- Search (`src/features/search/search-view.tsx`, sidebar, Cmd+F, route `/search?q=…&tab=posts`):
  a field and tabs (People, Posts, Groups) with their counts; typing replaces the route after a
  300 ms pause (Back does not step through each key), a tab change adds to history. People and
  groups are lists of names that open the profile in the detail pane; posts are a feed
  (FeedList: virtualized, j and k, page by page) that does not poll for new ones
  (`FeedSource.poll`). Cmd+F again focuses the field and selects its words.

## Feeds

- Home has three feeds (Following, For you, Hot) and Explore two (Latest, Hot), as tabs in the
  list pane's header (`src/features/feed/feed-tabs.tsx`; arrow keys switch). The feed is part of
  the route (`/home?feed=hot`), so Back returns to it and each feed keeps its own scroll.
- The list (`feed-list.tsx`) is the ARIA feed pattern, virtualized with `@tanstack/react-virtual`:
  only the posts near the viewport are in the DOM, each an `<article>` with `aria-posinset` and
  `aria-setsize` (-1 while more pages may follow). Measured heights are kept per feed, and the
  next page loads as the end comes into view ("Loaded 20 more posts" is announced).
- Keys (`src/lib/use-list-navigation.ts`, `list-commands.tsx`): j and k (and ↓ ↑, Home, End,
  Page Down and Page Up on a post) move between posts, Enter or o opens one in the detail pane,
  . shows new posts. j, k, o and . come from commands.json like other keys but only act while
  focus is in the list pane (WCAG 2.1.4); Tab enters the feed at the active post.
- Current data without jumps (`use-feed.ts`): the loaded pages never refetch on their own; a
  query polls the first page every minute and on focus. Posts already shown take its counts and
  reactions in place; newer ones wait behind a "N new posts" pill at the top, which (or .)
  starts the list at the polled page and focuses the first post. Your own new post goes on top of
  Following at once.
- Reactions (`reaction-button.tsx`) change every cached copy of the item at once and are taken
  back if the site refuses; then the site's own counts replace the guess. The other reactions are
  a menu (`reaction-picker.tsx`): focus moves into it, arrow keys, Home and End move, Esc or Tab
  closes it and focus goes back to its button (Esc does not also close the detail pane).
- Media (`media.tsx`) have their box before they load: one item takes the aspect ratio of the
  API's `width` and `height` (4:3 when unknown), several sit in square cells; images load lazily
  and decode async. The site keeps no alt text, so the group is labelled ("2 photos").
- Thread (`src/features/thread/`): a post opens in the detail pane with its full text, large
  photos and its comments; the open post is tinted and ringed in the list (`aria-current`).
  Photos are buttons that open a lightbox (a modal `<dialog>`: ← → Home End go through the
  photos, Esc or Close closes it, focus goes back to the photo, app shortcuts are off meanwhile).
  Comments (`comment-tree.tsx`) list the top-level ones; "Show N replies" loads a thread
  (`GET /comments/{id}/replies`) only when opened, and a deeper reply says whom it answers. Reply,
  Edit and Delete sit under each comment as the API allows (`viewer.can_edit`, `can_delete`, the
  item's `can_comment`; the API says false for what it would refuse: a comment with replies
  for its author, a comment with links or formatting for a plain-text edit); one reply box or
  edit is open at a time, and what was typed in a box it closes is kept for when it opens again
  ("draft kept" is announced). Cmd/Ctrl+Enter sends, Esc or Cancel puts it away (asking first
  when that throws away typed text) and focus goes back to its button. A delete also drops the
  replies the site deletes with the comment, and reloads a list with more pages, whose offset
  cursor would skip a comment. Deletes ask first with the system dialog
  (`confirmAction` in `native.ts`; `window.confirm` in a plain browser). Results are announced
  in a polite live region; after a change the item's comment count comes back from
  `GET /content/{id}` and updates every copy of the post (only that count, so a reaction on its
  way is not undone). Esc closes the pane and focus goes back to the post's row,
  found by id when the virtualized list drew it anew.
- Profiles (`src/features/profile/`): every author's name (posts, comments, messages, lists)
  is a button that opens the profile in the detail pane (`profile-link.tsx`; the picture next
  to it opens it too with a click, but is not a second tab stop; a notification's picture is a
  button of its own). The name and picture it was opened from show at once. The profile
  (`profile-view.tsx`) has the cover, picture, name, handle, about, counts, how the viewer
  relates ("Follows you", "Wants to be your friend") and the relation buttons
  (`relation-buttons.tsx`): Follow or Unfollow, Add friend, Cancel request, Accept and Decline,
  Remove friend (asks first: friends follow each other on UNA, so both follows end too) and
  Message, which opens a new conversation. A button keeps its place while its label changes, so
  focus stays on it; a request on its way keeps its size (aria-disabled, not disabled) and the
  result is said in a live region; a refusal shows the site's reason. Tabs (in the route:
  `/home/profile/8/friends`): Posts (the timeline; arrow keys and Enter, j and k stay with the
  list pane), and Friends, Followers and Following when the site lets the viewer open them
  (`connections.lists`; follow lists are private on UNA unless a module makes them public).
  Counts the viewer may open are buttons to their tab. Graph logic (what each relation offers,
  the relation and counts right after an action) is in `graph.ts`, with tests.
- Connections (`features/connections/connections-page.tsx`, route `/connections`, a tab as
  `?tab=requests|sent|following|followers`, Friends not written out): the site's Connections
  pages as a page in the content pane, a sidebar row whose badge is the friend requests waiting
  (the sync's count). Friends, Requests (Accept, Decline; its count on the tab), Sent (Cancel:
  GET /me/friend-requests/sent, DELETE /profiles/{id}/friend), Following and Followers; an
  organization without friends has the last two only. Rows (`profile/connections-list.tsx`) have
  the badges after the name, a More menu on one's own lists (Send Message, Remove friend after
  asking, Unfollow), Up/Down/Home/End between the names and j, k, o from the list pane; a name
  opens the profile's page. The sidebar row opens at Requests while some wait, at Friends
  otherwise, and keeps its tab when pressed inside Connections. Notifications' "N friend
  requests · Review" row and the own profile's Friend requests button go to the Requests tab,
  and the older `…/friend-requests` path (a una:// link) reads as it. One's own profile's
  Friends, Followers and Following tabs link to the matching tab.
- People (`features/people/people-page.tsx`, route `/people`, a tab as
  `?feed=active|online|friends`, Recent not written out): the network's people directory, as the
  site's People pages (Persons' `persons-home`, `persons-active`, `persons-online`) list them,
  from `GET /persons?view=recent|active|online`, and one's own friends (`GET
  /profiles/{id}/friends`, the Friends tab, left out for a profile without friends). The site
  menu's People opens it at Recent, and so does Your friends' Browse people; All your friends
  (when there are more than the sidebar's 10) opens Friends. Rows are Connections' (the badges,
  when one joined where the site says, the keys, a name opening the profile's page; on Friends
  the More menu). A network without Persons says it has no people directory, Friends still
  there. Connections stays a section of its own (requests, following, followers).
- Sidebar rule: a row is a section and nothing else (`NavItem` has no way to open a detail), and
  pressing it shows that section in the content pane with nothing open beside it. Details that
  are a part of one section (a part of Settings, a new conversation) bring their section with
  them in the main window (`pageRoute`), so they never stand beside another section's list.
- Keys on what has focus (`src/lib/focused-entry.ts`): `l` presses the focused post's reaction
  toggle, `c` opens its thread with the comment box focused (or focuses it in the thread), `p`
  opens the author of the focused post or comment, `r` opens the reply box of the focused
  comment, or focuses the open thread's comment box or the open conversation's reply box. Like
  j and k they come from commands.json, press the same buttons a click would, and do nothing
  while a text field has focus.
- Requests: GETs are conditional (`src/lib/etag-fetch.ts`): the last JSON body of each URL is
  kept in memory for the session with its ETag, sent back as If-None-Match, and a 304 is answered
  from it. Since the ETag hashes what the site would send now, a 304 always means the kept body
  is current.

## Messages and windows of their own

- The inbox (`src/screens/messages.tsx`) lists conversations newest first with their unread
  counts; New message (Cmd/Ctrl+Shift+N, also in the File menu and the palette) opens a new
  conversation beside it.
- A conversation (`src/features/messages/conversation.tsx`) is a chat: a focusable `role="log"`
  with the newest message at the bottom, where it opens. Pages come newest first from the API
  (`GET /conversations/{id}/messages`, keyset cursor), kept in one cache entry
  (`thread-cache.ts`): the 15 s poll and the sync ask for the first page only and put it on top,
  so pages loaded further back stay and replies that arrive never open a gap. Older messages
  load when the top comes into view (or with Load older messages), and the message being read
  stays where it is: WebKit has no CSS scroll anchoring, so `anchor.ts` notes the first message
  in view and its offset before the page goes in and sets `scrollTop` after it is drawn. Days
  are separated (`days.ts`, headings), one's own messages sit on the right, a run of one author
  folds the name and picture, the messages unread when it opened follow a "New" line, and
  replies that come while one reads further up wait behind "N new messages". Opening reads the
  conversation (`POST /conversations/{id}/read`). People (N) lists who is in it; who started it
  may add people (a recipient field) and take them out, anyone may leave (asked first).
- The composer (`message-composer.tsx`): Enter sends, Shift+Enter starts a new line (not while
  an IME composes), photos picked, pasted or restored from the draft upload with the purpose
  `message` (a reply) or `conversation` (the first message), photos only (`photoUploader`).
  The site needs text with every message, so photos alone wait for a few words. Drafts last
  (`conversation:<id>`, `message-to:<profile>`, `message-new` with its recipients).
- Recipients (`recipient-field.tsx`): chips with Remove buttons and an ARIA combobox that finds
  people as one types (`GET /search/profiles`, 200 ms after the last key; no groups, not the
  viewer); arrows move, Enter adds, Esc closes the list, Backspace in the empty field takes the
  last chip off.
- Cmd+Option+Enter (Ctrl+Alt+Enter on Windows and Linux) or Cmd+Option+click on a
  conversation, post, profile name or group opens it in a window of its own
  (`lib/open-in-window.ts`, Rust `src-tauri/src/windows.rs` `open_window(route)`), as File >
  Open in New Window and a tab's Move Tab to New Window do; Cmd+Enter or Cmd+click alone opens a
  new tab. The open conversation has a button for it too. Rust takes only detail routes of those four kinds (checked in `check_route`), gives each
  route one window (opening it again brings it forward), puts the route in the address's
  fragment (`index.html#window=...`) and on macOS lets these windows be tabs of one another.
  The page there (`src/secondary.tsx`) shows only that detail, signed in through the main
  window's session; Esc or Close closes the window, Cmd+[ and Cmd+] go back and forward, and
  site links open inside it. These windows (labels `win-*`) get `capabilities/secondary.json`:
  the site's requests (the runtime site capability names them too), the token, uploads for a
  reply, drafts, the delete question, links and the theme, but no sign-in or sign-out, no new
  windows, no show, focus or dragging, no tray, badge or notifications. The app's commands are
  listed in `build.rs` (`AppManifest::commands`) so each capability grants them one by one; a
  Rust test runs `open_window` from such a window through the real ACL and sees it refused.

## Live events

With a sockets server on the site (Studio > Settings > Sockets: Soketi), the app hears what
changes instead of waiting for its polls. `GET /api/v2/realtime` says where the server is and
which public channels carry what (docs/api-v2.md); Rust holds the one WebSocket
(`src-tauri/src/realtime.rs`, Pusher's protocol), so the page opens none. A window names the
channels it wants (`realtime_watch`: public names only, checked in Rust) and hears their events
(`realtime`). Events carry ids, so the page reloads what changed through the API:

- the feed (`activities`): a new post shows the "new posts" pill at once (the first page is
  checked at most every 3 s, `use-feed.ts`), a removed one leaves the feed, an edited one that is
  open loads again;
- an open post's comments (`Item.live.comments`): its comments and count load again (at most
  every second, `comment-tree.tsx`), in the main window and in a window of its own;
- the viewer's connections (`connections`): Rust polls the sync at once (the friend requests
  badge), and the page reloads friend requests and the connections lists (`shell.tsx`).

The connection opens again after a growing pause when it drops, and anew for another sign-in,
network or acting profile. Without a sockets server everything works as before, by polling
(`src/lib/realtime.ts`). To check the Rust side against a real server:
`REALTIME_CHECK_URL='ws://127.0.0.1:6001/app/<key>?protocol=7' cargo test against_a_sockets_server -- --ignored --nocapture`,
then send an event to `bx_timeline_0`.

## Notifications, badges and the tray

- One sync (`src-tauri/src/sync.rs`, GET /api/v2/sync) replaces the unread queries: it runs in
  Rust, so it keeps going while the window is hidden or closed to the tray (a hidden web view
  stops its timers, and WebKit suspends it after a few minutes). Every 30 s while the window
  has focus, 60 s otherwise, at once when the window gets focus and when the page asks
  (`sync_now`: at sign-in and sign-out, after marking read, reading a conversation, answering
  a friend request or switching profiles); it doubles its wait from 30 s up to 10 minutes while
  the site fails. It sends the last cursor and ETag, so nothing new costs a 304 with no body, in
  the page's language. Each answer goes to the page as a `sync` event (`lib/sync.ts`,
  `lib/sync-provider.tsx`): the sidebar's Notifications and Messages badges and the friend
  requests count come from it, new notifications go on top of the inbox's lists, and a list
  whose count changed elsewhere (read on the site, a message, a request) is fetched again; a
  lower count within a minute of marking read here is taken as that, so the lists keep their
  rows (shown read) and focus. A change in unread messages also refetches the open
  conversation, which then marks the new message read. Outside the app the page polls
  GET /sync itself with the same intervals.
- An answer belongs to the sign-in it was asked with (`AuthState::generation`, changed on every
  sign-in and sign-out, kept by a refresh): one that arrives after a sign-out or another
  sign-in, on the same site too, is dropped, and a new sign-in starts the cursor, ETag and
  remembered notifications over.
- The unread count (notifications and messages) is on the Dock icon on macOS and the launcher
  on Linux (`set_badge_count`), and on Windows, which has no badge count, an overlay icon on
  the taskbar button drawn in Rust (`badge.rs`: a red disc with the number, 9+ past nine).
- OS notifications (`tauri-plugin-notification`, from Rust) only for new unread notifications
  and only while the window is not focused (`sync::to_notify`): who did it as the title, what
  happened as the body; more than three at once are one "N new notifications". A click brings
  the window back and opens what the notification is about (`open-notification` event, with
  the profile it was shown for, read from the cursor), the notifications for the summary one.
  After a profile switch (a `reset` answer) the shown ones are forgotten, and a click on one
  shown for another profile opens the notifications instead of opening and marking read that
  profile's item (`clickedNotification`). While the window has focus the page announces new ones
  in a polite live region instead (`announcementFor`), never both. The page itself has no
  notification permission.
- The tray (`tray.rs`): Open UNA, New Post and Quit UNA, under a row that says how many are
  unread; the icon gets a red dot while something is, the count shows next to it on macOS and
  in its tooltip on Windows. A left click opens the window (Linux reports no clicks on the
  icon: the menu is the way in).
- Closing the main window hides it on macOS (the app stays in the Dock; a click on the Dock
  icon brings it back) and Windows (in the tray); on Linux it quits, since there may be no tray.
  Cmd+Q, the app menu's Quit and the tray's Quit end the app. Settings > Notifications changes it.
- The inbox (`src/features/notifications/`) is in the list pane: All and Unread tabs (in the
  route: `/notifications?filter=unread`), the notifications as the API sends them (grouped as
  on the site), newest first, virtualized as a feed of articles. j and k (and the arrow keys,
  Home, End, Page Up and Down on a row) move, Enter, o or a click opens what one is about in
  the detail pane and marks it read (with the older ones: UNA keeps one read marker), e marks
  the focused one read and Shift+E all of them ("Mark all as read" too, which stays in place,
  aria-disabled, when nothing is unread). Letter keys follow Shift, not Caps Lock: with Caps
  Lock on, e still marks one. When the focused row leaves the list (read, in the Unread tab),
  focus moves to the row now in its place, or to the list heading. Only a loaded page is
  announced ("N notifications loaded"), not the ones the sync puts on top. Every notification
  says what it is about (`object_kind`, `lib/targets.ts`): a post opens its thread, a comment
  or reply opens the thread with that comment focused and its replies open
  (`/notifications/post/12/comment-99-in-55`; comments and that thread's replies load page by
  page until the comment is there, up to ten pages, and when it can't be shown that is said
  and focus goes to the comments heading; a new target on an open post opens its thread
  too), a profile, group or follow the profile, a
  message the conversation; the few the app has no place for open on the site and say so.
- Links: a link to the signed-in site that shows a post, profile, group or conversation
  (GET /links/resolve, `lib/link-opener.ts`) opens in the app, anywhere a link is clicked;
  every other link opens in the browser. Answers are kept for the session.

## Compose, uploads and drafts

- The compose sheet (`src/features/compose/compose-sheet.tsx`) is a modal `<dialog>` named "New
  post": Cmd+N anywhere, or Home's "What's new?", opens it with the cursor in its text box, and
  focus goes back to what opened it when it closes (Esc or Close; neither closes it while a post
  is being sent, so the site's answer is seen there). Cmd/Ctrl+Enter posts. It has
  the text, an attachment tray, "Add photos or videos", who can see it and where to post: Your
  timeline or one of one's groups the site lets one post in (`usePostContexts` in `pickers.tsx`,
  from GET /me/groups `viewer.can_post`; not drawn without any). A post in a group takes the
  group's audience (the audience picker is off). Posted, the post goes on top of Following (and
  of the group's feed) and "Posted" is announced.
  The sheet belongs to the acting profile: switching profiles closes it, stops its uploads on
  their way and opens the other profile's own draft next time (`ComposeProvider` keys the sheet
  by site and profile; the composers start over when their draft key changes).
- Attachments (`attachments.ts`, `attachment-tray.tsx`): each file uploads as it is added, with a
  progress bar (`<progress>`, named for the file), Retry when the site refused it (its reason is
  shown) and Remove, which stops an upload on its way or deletes an unused upload on the site;
  focus moves to the next Remove, or to "Add photos or videos". Post waits until every upload is
  done (the reason is shown next to it). A photo the page has the bytes of shows its local
  picture at once, others the site's copy once uploaded. Up to 20 per post. The site keeps no
  alt text for these files, so there is no field for one. A video the site is still converting
  is asked about again (GET /uploads/{id}, from 3 s doubling to 30 s) until it is ready, and
  "<name> is ready" is announced.
- Uploads go out from Rust (`src-tauri/src/upload.rs`): a multipart POST /uploads streamed from
  disk with the access token attached there, progress over a `Channel`. The page never names a
  file: it gets an opaque handle for files picked in the dialog Rust opens (as a sheet on the
  window), for files dropped on the window (Rust records the paths from the window's own drop
  event and takes each once, within two minutes) or for bytes it has itself (a pasted image, at
  most 50 MB, sent as a raw IPC body). Dropping files anywhere on the window opens the sheet with
  them. Three uploads send at once over one client, the others wait; there is no total timeout
  (a long video takes as long as it takes): an upload fails when the connection takes no bytes
  for two minutes, or the site does not answer five minutes after the body is out. reqwest's
  `read_timeout` is not used: it is one timer from the request to the response headers. Outside the app (`vite dev` in a browser) the page picks with a file input and sends the
  file itself.
- Lasting drafts (`src/lib/drafts.ts`): the new post (text, audience, context and its finished
  uploads), the comment box and reply boxes of a post, and a conversation's reply or a new
  message are kept as they are typed (300 ms after the last key, and at once when the box goes),
  in the store plugin's `drafts.json` (opened by Rust at start; the page only looks it up with
  `getStore`, so it can't open any other file), or localStorage in a browser. They are keyed by site,
  acting profile and target, come back after a restart, and are deleted once sent (or thrown
  away). A draft untouched for 30 days is dropped; uploads come back only while the site still
  has them (45 minutes; the site deletes unused uploads after its ghost lifetime, an hour by
  default), and each is checked with the site (GET /uploads/{id}) when the draft comes back:
  one the site deleted sooner leaves the tray and is named. Edits of a comment are drafts for
  the session only.
- Editing one's own post: "Edit" on a post (`viewer.can_edit`, feed posts only) opens an editor
  in its place in the thread pane (from a list, it opens the thread with the editor;
  `post-editor.tsx`). Plain posts (paragraphs and line breaks, as the app writes them) edit as
  text; a post with links or formatting written on the site can change only who sees it, since
  plain text would lose them. A post in a group or event keeps the group's audience. Only what
  changed is sent (PATCH /feed-posts/{id}); Cmd/Ctrl+Enter saves, Esc anywhere in the editor
  (its buttons too) or Cancel puts it away (asking first when that throws changes away), focus
  goes back to Edit and "Post saved" is announced. Single-key commands are off while focus is in
  the editor (`data-own-keys`, `lib/shortcuts.ts`). Without a text box, focus goes to "Who can
  see it" (or the note, in a group). A post's text can't be emptied here: Save is off and says
  so, since the site keeps the old text.

## Groups

- `src/features/groups/`: the sidebar's Groups (`sidebar-groups.tsx`) lists the groups one is in
  (GET /me/groups, one page of 50, most recently joined first) and Browse groups, under a
  heading that folds them away (a disclosure button with `aria-expanded`, remembered in
  localStorage on this computer). A site without the Groups module answers 404 for the paths, and
  then there is no Groups section (and the browse list says the network has none).
- A group opens its feed in the list pane and the group in the detail pane (route
  `/groups/group/67?group=67`; `/groups` is the browse list). The group view
  (`group-view.tsx`): cover, picture, name, its privacy and member count, the viewer's place
  (Owner, Member, Request sent ...), about, Join / Ask to join / Accept invitation and Decline /
  Cancel request / Leave group as the API allows (`join-button.tsx`; leaving asks first, the
  button keeps focus while the site answers, the result is announced), Show posts, New post in
  group (the compose sheet with the group chosen) and the members, page by page. A closed group
  seen from outside shows its name and picture and says only members see its posts and members;
  where joining needs the site (questions or a payment) it says so and offers the site. After a
  change one's groups, the browse list, the members and the group's feed load again.
- The browse list (`group-list.tsx`, GET /groups) has Join next to each group one is not in. The
  group's feed is its profile timeline (`['feed', 'profile', id]`, as a profile's posts), drawn
  only when the viewer may see it. Search, the palette, post authors and site links open a
  group as a group (`useOpenProfile`, `targetRoute`), and a profile route that turns out to be a
  group (a notification says profile for both) is replaced by the group's.

## Agent chats

- `src/features/agents/`: the network's AI agents (UNA's core agents, Studio > Agents) through API
  v2's `agents` routes (docs/api-v2.md, "Agents"). `GET /agents` says which agents this viewer may
  talk to and the default one; where there is none (or the site has no such route) nothing of
  this is drawn: no Agent button, no chat history, no tabs.
- The bottom bar's right end (`agent-dock.tsx`), as Linear's: a tab for each chat open in this
  window (up to eight; a disclosure button that shows its panel or puts it back, and a close
  button), the Agent button (a new chat with the default agent, `POST /agents/{id}/chats`) and
  Chat history (a menu of the viewer's earlier chats with it, the latest first; one opens as a
  tab). The open chats, the one shown and whether its panel is wide are kept on this computer
  per network and acting profile (`una-desktop-agent-chats:<site|account>|<profile>`).
- A chat's panel (`agent-panel.tsx`) floats over the content at its bottom-right corner (a
  non-modal dialog named after the chat): the title (the agent's, else the first thing written,
  else New chat), More (New Chat, Copy Conversation, Close Chat), Minimise (back to its tab; Esc
  too, focus to the tab), Expand (the panel takes the content's container; Make smaller) and
  Close (focus to the Agent button). The conversation is a log: the person's words on the right,
  the agent's drawn as the app draws rich text (the site's HTML of its Markdown, through
  RichText). The reply box is the rich editor in its mini mode (no mentions or hashtags);
  Cmd+Enter (Ctrl+Enter) or Send sends. The reply streams in as the agent writes it
  (`POST .../messages`, Server-Sent Events read as Rust passes the body on in pieces,
  `streamReply` and `parseSse`): plain text while it comes (the log is aria-busy, "<agent> is
  writing…" until the first words), then the chat as the site keeps it replaces it, with the
  reply's HTML, and "<agent> replied" is said. Stop ends it ("Stopped", the words so far kept on
  screen; the site keeps neither). RUN_ERROR (no model set up, the model failed, a limit) shows
  its message as an alert; a refusal before the run (too long) puts the words back in the box.
  Every open chat keeps its panel mounted, hidden but the shown one, so a reply goes on while its
  chat is minimised.

## Tasks

- `src/features/tasks/`: the sidebar's Tasks section (`sidebar-tasks.tsx`): My tasks, My timers and
  the contexts one has tasks in (GET /me/task-contexts), each unfolding to its lists with their
  open counts. Routes: `/tasks` (Assigned), `?role=created`, `?feed=completed`,
  `?view=timers`, `?context=725` and `&list=4|inbox` (`router.ts` `tasksPage`).
- The board (`task-board.tsx`, its logic in `board.ts`) lists tasks as Linear lists issues:
  grouped by state, priority, list or none (groups fold; their counts come from GET
  /tasks/facets, so they count every task, not only the pages loaded), ordered by due date,
  priority, newest or last updated (both kept in localStorage), filtered as the site's Tasks page
  filters (type, priority, estimate, state, label, assignee; one of its saved filters), the active
  filters as removable chips. Rows are dense: priority, a state menu, title, type and labels, time
  against the estimate, a running timer, due date and assignees. In a context a + on each group
  adds a task with that group's state, priority or list. A side panel (a container query) counts
  them by list (or context), label, priority and assignee.
- A task's detail (`task-pane.tsx`, `task-props.tsx`) has a Properties panel: each property a
  native menu (`task-actions.ts` `propertyEntries`, the current value checked), S, P, A, L, E, T
  and D open them while focus is in the task, J and K go through the list beside it ("3 / 26",
  `setTaskOrder`). Time: spent against the estimate, the viewer's timer (start, pause, resume,
  log, clear) and Log time. Changes show at once and go back when the site refuses
  (`changeTask`). My timers is `task-timers.tsx`.

## Languages

The app's own words are in English, Russian, German, Spanish and French. What a network says
(its menus, errors and content) comes from the network, which is asked for the same language.

- **In code.** The English text is the key: `t('Sign out')`, `t('Signed in as {{name}}', { name })`,
  `tn(count, '{{count}} follower', '{{count}} followers')` for a text with a count,
  `t('Open', { context: 'state' })` where the same English means two things, and
  `rich(t('Read the <a>terms</a>'), { a: ... })` for a sentence with an element in it
  (`src/lib/i18n.ts`, `src/lib/i18n-rich.tsx`; i18next, as NEO uses). The first argument is always
  a literal, one whole sentence per call. Dates and numbers take `locale()` and `num()`. Rust has
  the same for the menu bar, the tray, file dialogs and the reasons it gives the page:
  `tr("...")`, `tr_vars`, `trn` (`src-tauri/src/i18n.rs`). A variable cannot be named `context`.
- **The files.** `src/locales/<code>.json`, one flat object per language, keyed by the English;
  a text with a count has one key per form the language uses (`_one`, `_few`, `_many`, `_other`).
  English has no file. Both sides read the same files.
- **Which language.** The system's first language the app has, or the one chosen in Settings >
  Appearance (`language` in settings; `una-desktop-language` in localStorage, read before
  anything is drawn). It never changes while a page lives: choosing another loads the window
  again, and Rust builds the menu bar and the tray's menu again. So `t()` is a plain function,
  also at module level.
- **The check.** `src/locales/locales.test.ts` reads the source, TypeScript and Rust, and fails
  when a call is not a literal, when a language lacks a text or keeps one nothing uses, when a
  translation has other `{{names}}` or `<marks>` than its English, and when English is written
  straight between tags or into `aria-label`, `title`, `placeholder`, `alt` (a line that is not
  words takes the comment `i18n-ok`). It runs with the other tests, so in CI too.
- **After adding or changing a text**, from `neo/desktop`: `node src/locales/extract.ts ru` (and
  `de`, `es`, `fr`) prints what that file lacks, with the English as the value, and names the
  keys nothing uses any more. `node src/locales/extract.ts --untranslated` lists English left in
  what is drawn.
- **Adding a language**: its file, a line in `RESOURCES` and `LANGUAGE_NAMES` (`src/lib/i18n.ts`)
  and in `FILES` (`src-tauri/src/i18n.rs`); the tests on both sides fail until the three agree.

## Tests

From `neo/desktop`, after `yarn install` there: `yarn test` (Vitest with jsdom and Testing Library: router,
shortcuts, scroll memory, the shell's regions, badges, focus and keys, list navigation, the
virtualized feed, the new posts pill, optimistic reactions, the reaction menu, conditional GETs,
the comment tree, the comment cache, the lightbox, the profile view and its relation buttons,
friend requests, graph logic, the keys on what has focus, lasting drafts across a restart of
the store, the attachment tray, the compose sheet, the post editor, every notification kind's
route, the page's half of the focus gate, sync answers in the caches, the inbox and its keys,
site links that open in the app, comments a post is opened for, palette matching, groups,
keys, recent entries and the palette in the shell (Ctrl+K, arrows, Enter, Esc and focus,
"theme", site results), search routes and the Search view, group routes and actions, the
sidebar's groups and a site without them, joining an open group, asking to join a closed one
and withdrawing, leaving after a question, posting into a group, a group opened as a
profile; settings kept across a restart, single keys off, the theme, the Settings parts, editing
a profile and the site's reasons by field, the network menu, the icon rail, the window's
chrome (the top and bottom bars with the sidebar's names, its icons and hidden; the footer's
links), tabs (the model: open, close, reopen, numbers, moves, per network across a restart; in
the shell: the keys, the tab pattern, Ctrl+click to a background tab), the offline
banner, the offline cache per network and its deletion at sign-out, the sidebar from the
site's menus (its groups and order, counts, the current row, a site page for an item without a
screen, items left out, the kept answer first, the fixed sidebar on a site without it, the
keyboard), the agent chats (the stream's frames, the open chats kept per network and profile, no
Agent button without an agent or the route, a chat started with its tab and panel, Ctrl+Enter
sending and the reply streaming in and then drawn from the site's HTML with the chat's title,
Stop, Minimise and Esc to the tab and back, Expand, Close, a run's error), and deep-link parsing and
targets), and
`cargo test --manifest-path neo/desktop/src-tauri/Cargo.toml` (auth helpers, the loopback
listener, the site capability, session keys, the keychain list and the move from one session,
two networks never getting each other's token, the menu table and its accelerators, the
network items, the tabs' items and keys, Close Tab closing a window of its own, the upload helpers: types, names, the drop record and chunked reads, the sync:
no OS notification while the window has focus, intervals and back-off, badge counts, the overlay
badge and the tray dot, settings defaults, the --hidden start and the deep-link queue).

### What CI runs

`.github/workflows/desktop.yml` runs on a PR or a push to master that touches this folder (the
app or `una-api`). Everything in it is clean and has to stay clean (no "no new errors"
comparison, unlike NEO's lint and typecheck). To run the same checks before a push:

| Check | Command | From |
|---|---|---|
| Client types match the OpenAPI file | `yarn generate`, then `git diff --exit-code src/schema.ts` | `neo/desktop/una-api` |
| The OpenAPI file is valid | `yarn lint-spec` | `neo/desktop/una-api` |
| Types | `yarn typecheck` | `neo/desktop` |
| Lint, no warnings (the app and `una-api`; `eslint.config.mjs` here) | `yarn lint` | `neo/desktop` |
| Tests | `yarn test` | `neo/desktop` |
| The web app builds | `yarn build` | `neo/desktop` |
| Rust format (`rustfmt.toml`: 160 columns) | `cargo fmt --check` | `src-tauri` |
| Rust lint, no warnings | `cargo clippy --all-targets --locked -- -D warnings` | `src-tauri` |
| Rust tests | `cargo test --locked` | `src-tauri` |

The Rust checks run on macOS, Linux and Windows, with the Rust version the workflow names
(`RUST_VERSION`). They need the `dist` folder to exist, not the built app. That the OpenAPI
file is what the PHP code serves is `ApiV2SpecFileTest`, in UNA's integration tests.

### The shell on Linux and Windows from a Mac

The Linux checks run in Docker: copy `neo/desktop` without `src-tauri/target`, `node_modules`
and `dist`, and in `rust:1-bookworm` install the Linux libraries the workflow lists, then from
`src-tauri` (after `mkdir -p ../dist && : > ../dist/index.html`) run `cargo fmt --check`,
`cargo clippy --all-targets --locked -- -D warnings` and `cargo test --locked`. The same
container type-checks the Windows code: add `gcc-mingw-w64-x86-64`, `rustup target add
x86_64-pc-windows-gnu`, and run clippy with `--target x86_64-pc-windows-gnu`. That is the GNU
target, not MSVC, which releases use: it checks the `cfg(windows)` code, not the MSVC build or
anything at run time.

## Run

Needs Rust 1.90+ and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). From
`neo/desktop` (its own install, not NEO's):

```bash
yarn install
VITE_UNA_URL=http://localhost:8088 yarn app
```

The site needs the OAuth2 server module (`bx_oauth`), which has the `una-desktop` client built in
(no row in its clients table), and the API turned on (Studio > API), API v2 too: while API v2 is
off the site's OAuth server does not know the `una-desktop` client, so nothing can sign in with
it. `VITE_UNA_URL` only pre-fills the address.

Build a bundle with `yarn app:build`.

## Releases

`.github/workflows/desktop-release.yml` builds the installers: a universal macOS app and DMG,
Windows NSIS and MSI, Linux deb and AppImage. It keeps them as the run's artifacts and publishes
nothing. A tag `desktop-v<version>` builds a release: the version must be the one in
`tauri.conf.json`, `package.json` and `Cargo.toml`, and the build fails without the signing
secrets. Run by hand from the Actions tab without the secrets, it builds unsigned installers for
a look.

- **macOS**: signed with a Developer ID Application certificate and the hardened runtime
  (`tauri.conf.json` `bundle.macOS`), notarised by Apple with an App Store Connect API key, the
  ticket stapled. Secrets: `APPLE_CERTIFICATE` (the certificate and its key as a `.p12`, base64),
  `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY` (`Developer ID Application: Name
  (TEAMID)`), `APPLE_API_ISSUER`, `APPLE_API_KEY` (the key id) and `APPLE_API_PRIVATE_KEY` (the
  `.p8` text). Only the Apple Developer account holder can create the certificate.
- **Windows**: signed with Azure Trusted Signing (`trusted-signing-cli` as Tauri's `signCommand`,
  every binary and installer). Secrets: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`,
  `AZURE_SIGNING_ENDPOINT`, `AZURE_SIGNING_ACCOUNT`, `AZURE_SIGNING_PROFILE`.
- **Linux**: not signed (deb and AppImage carry no signature by default).
- **Updates**: every update package (macOS `.app.tar.gz`, Windows setup and MSI, Linux AppImage
  and deb) is signed with the update key, and the app installs nothing that does not verify
  against `brand.json` `updatesPubkey`. Secrets: `TAURI_SIGNING_PRIVATE_KEY` (the private key file
  `tauri signer generate` wrote, its text) and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. A tag fails
  without them. UNA's key pair was made on 2026-11-11; the owner keeps the private key and its
  password, never in the repository. Losing the key means the installed apps can never update
  again (a new key needs a new `updatesPubkey`, which only a fresh install brings).

### Updates

The app asks `brand.json` `updatesUrl` for `latest.json` at start (after ten seconds) and once a
day, unless Settings > About turns that off, and whenever the person chooses Check for Updates…
(the app menu on macOS, the profile menu, the command palette, Settings > About). A version it
finds by itself is offered (an Update button at the sidebar's foot), never installed: Install
and Restart in the update dialog downloads it, checks the signature and starts the app again.
Development builds check only when asked. Everything goes through Rust (`src-tauri/src/updater.rs`);
the page gets no permission of the updater plugin.

The tag's run drafts a GitHub release `desktop-v<version>` with the installers, the update
packages, their `.sig` files and `latest.json` (`scripts/update-manifest.mjs`; what is new comes
from `release-notes/<version>.md` when it exists). Publishing the draft runs
`desktop-update-feed.yml`, which writes the published notes into `latest.json` and copies it to
the release `desktop-latest`, the fixed address UNA's apps read. An older version published later
does not move the feed back. The plugin also refuses to downgrade, and requires the signature to
name the version announced.

To try the whole flow on one machine: build a version (say 0.1.0), then build a higher one with a
throwaway key (`tauri signer generate`), serve `latest.json` and the package from a local server,
and pass `--config` with `plugins.updater.endpoints`, `pubkey` and
`dangerousInsecureTransportProtocol: true` to both builds (an `http://` address needs it; a
release never sets it, and `updater::tests` checks that).

`scripts/check-signature.sh path/to/App.app` checks a macOS build the way Gatekeeper will: the
signature, the hardened runtime, no development entitlement, the Developer ID certificate, the
stapled ticket and Gatekeeper's verdict (`--local` stops before the last three, for a build signed
with a development certificate). The release workflow runs it on every macOS build it signs.

## Not done yet

- The release workflow has not run yet: there is no Developer ID certificate, Azure signing
  account or update key in the repository's secrets, so no update has gone through GitHub.
- Photos in comments, reposts and pins. Live events cover the feed, an open post's comments and
  one's connections; notifications and messages have no events on the site yet, so their badges
  come from the 30 s poll, and reaction counts from the feed's poll. Deep links from the site's own pages (a site link as `una://`) and "Copy app link".
- Settings for sounds, density and reading size. Deep links on macOS work only from an installed
  bundle.
- Windows and Linux have not been run by a person. CI builds, lints and tests the shell on
  macOS, Linux and Windows (the MSVC target) on every pull request; untested at run time: the
  Windows overlay badge, Mica, the tray on both, deep-link and autostart registration, the Mark
  of the Web on downloads, the keychain (Credential Manager, Secret Service), and updates (the
  NSIS and MSI installers in passive mode; an AppImage replacing itself; a .deb asking for pkexec).
