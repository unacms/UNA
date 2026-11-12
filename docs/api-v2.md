# UNA API v2

A REST API at `/api/v2`, next to the existing `api.php` (v1), which is unchanged. Each site
publishes its OpenAPI 3.1 document at `/api/v2/openapi.json`, and `GET /api/v2` tells a client
what the site is and how to sign in.

> **Preview, not for production.** API v2 is a draft (`2.0.0-draft`): shapes and paths may still
> change. It is off as installed: an administrator turns it on in Studio > API > Settings ("API v2
> (preview)", the option `sys_api_v2_enable`), and until then every `/api/v2` request, a preflight
> too, answers 503 `api_v2_disabled` with no CORS headers. Nothing on the site depends on it: the
> site's pages and the NEO web and mobile apps use `api.php` (v1), which is unchanged and works
> the same with v2 on or off. The desktop app is the first client of v2 and the only one that
> needs it; NEO moves to v2 once it covers what v1 does.
>
> The web server must send `/api/v2` and everything under it to `api_v2.php` with the rest of
> the path in `_q`. The `.htaccess` in the package, `scripts/docker-compose/nginx.conf` and
> `scripts/Caddyfile` have the rule. A site with its own nginx or Caddy configuration, or an
> `.htaccess` kept from before 15.0.0, needs it added by hand before v2 answers:
> `RewriteRule ^api/v2(/(.*))?$ api_v2.php?_q=$2 [QSA,L]` (Apache), or
> `rewrite "^/api/v2(/(.*))?$" /api_v2.php?_q=$2 last;` (nginx).
>
> Code that v2 shares with the site and API v1 asks `bx_is_api_v2()` (true only in an `/api/v2`
> request with v2 on) before it does anything v2 wants differently: reading small tables whole,
> reusing a private file's link, breaking ties of a second by id in lists of comments and
> connections, the shown size of a turned photo, extra keys in a timeline item. Everywhere else
> that code does what it does on a site without API v2.

## Conventions

- Resource URLs and HTTP methods with their meaning: `GET /feeds/home`, `POST /feed-posts`,
  `PUT /content/{id}/reaction`, `DELETE /activities/{id}`.
- JSON bodies (`application/json`), checked against the operation's schema before the
  endpoint runs. Unknown fields are refused.
- Query params are checked the same way, before the endpoint runs: a required one left out is
  422 `required`, a value that does not fit its schema (not one of an enum's values, not an id,
  not a number, longer than allowed) is 422 with the param's name as `field`, and every invalid
  param comes in one answer. An empty value is a param left out, a param given as a list
  (`?a[]=1`) is refused, and a param the operation does not declare is ignored. `limit` and
  `cursor` keep their own rules, below.
- Real status codes. Errors are RFC 9457 problem documents (`application/problem+json`) with a
  stable `code` for programs and `errors` for invalid fields; `type` is `urn:una:problem:<code>`,
  the code as it is:
  `{"type": "urn:una:problem:validation_failed", "title": "Unprocessable Content", "status": 422, "code": "validation_failed", "errors": [{"field": "body", "code": "required", "message": "Is required"}]}`.
  Problems carry `Cache-Control: no-store` and no ETag.
- Lists are pages `{items, next_cursor}`. `next_cursor` is always there (required in the schema) and `null` on the last page; clients should still take it absent as the end.
  Pass `next_cursor` back as `cursor` until it is null;
  `limit` is 1-50 (20 by default); a number out of range is clamped into it (0 is 1, 500 is 50),
  and only a non-number is 422. Cursors are opaque: an endpoint may switch from
  offsets to keys without clients noticing. Feed cursors are offsets today, so a post that comes between two pages can show again at the top of the next one;
  notification cursors are keys (the last event id). A page can hold fewer items than `limit` and still have a
  `next_cursor`: feeds and notifications leave out what the viewer may not see, and a cursor
  holds where the scan of the database got to, not how many items were shown.
- A profile inside another resource (an author, actor, participant, member, search result) is
  a `Profile` (`id`, `kind`, `handle`, `display_name`, `about`, `status`,
  `avatar`, `cover`, `created_at`) with v2's `module` and `url` as optional fields. Embedded, it
  shows what an author unit on the site shows: the name, the picture (when the viewer may see
  it), the handle and the page, with `about` empty and `cover` null, since only the profile
  module's view check shows those. `created_at` is when the profile was made; embedded, only
  for a viewer who may open the profile's page (the module's `checkAllowedView`), and
  `1970-01-01T00:00:00Z` (unknown) otherwise and for the site's own profile, which has no date
  (the field is required in `Profile`, so it cannot be left out). The full profile
  comes from `GET /profiles/{id}`, after that check, and from `GET /me` for the account's own
  profiles; only those add `about_truncated` and `avatar_large`. There is no `ProfileSummary`
  any more. An anonymous post has no author and no actor.
- Image links (`avatar`, `cover`, media URLs) are absolute and the same from request to request:
  a link to an image copy the site has not made yet (`image_transcoder.php`) is sent without its
  `t=<time>` parameter, which only keeps browsers from caching it
  (`BxDolApiV2Map::stableUrl`, applied by `absoluteUrl`), and a private file's token is reused
  for a period of half the storage's token life (`BxDolStorage::getFileUrlByIdShared`, which the
  transcoders use too), so the same answer keeps its ETag and a GET writes at most one token row
  per file and period. A request's own `api` parameter, which would put the site in its API
  mode, where the transcoders link the original uploads, is dropped first (`api_v2.php`), so
  links are to the copies whatever the query or form says.
- A `Profile` has `avatar` (100x100) and `avatar_large` (200x200, for heroes and 2x screens), both
  null when there is no picture.
- A `Profile` (embedded and full, and so a `Group`) has `badges` when the profile has any,
  and no `badges` field when it
  has none: `ProfileBadge{id, name, icon, color, image?, icon_only?}` for each badge of
  Studio > Badges given to the profile, the ones the site shows next to the name (the profile
  module's `get_badges`: every badge of the module given to the profile's entry, to any viewer),
  in the site's order (oldest badge first). `name` is the badge's text in the viewer's language
  (`_t`); `icon` a Lucide name, the badge's icon code as the site's Lucide set reads it
  (`BxBaseIconsetLucide::getLucideName`: a Lucide name, or a Font Awesome one it maps,
  `shield-alt` to `shield`), null for none, an uploaded image, an emoji or HTML; `color` hex,
  from Studio's Tailwind colour name (`blue-600`) or an `rgb()` value, `#9333ea` (`purple-600`,
  as the site draws it) when none is set. `image`, only for a badge whose icon is a picture
  uploaded in Studio (a file of `sys_images`, whose id the badge keeps as its icon), is the
  absolute URL of the site's 180x180 square copy of it (`sys_icon_apple`, through
  `BxDolApiV2Map::absoluteUrl` like the other images), never the upload itself, so an SVG,
  which has no such copy, gets none; clients draw it
  instead of `icon`, which is then null. `icon_only: true`, only for a badge set to show as its
  icon only (`is_icon_only`), means the site shows the icon or picture without the text; `name`
  is still sent, for screen readers and tooltips. The `get_badges` alert, which may replace a
  profile's badges HTML on the site, is not followed. A page reads its profiles' badges in one query
  (`BxDolApiV2Map::primeBadges`, `BxDolBadgesQuery::getByProfileIds`), called by each endpoint
  that lists profiles (feeds, comments, notifications, messages, discussions, members,
  connections, search, `/me`).
- `GET /api/v2` carries `branding` (`Branding`), the same for guests and members, built only from
  what Studio > Designer stores: `name`, `short_name` and `description` from the PWA settings,
  `mark`, `mark_dark`, `logo` and `logo_dark` as the site's header picks them (the template's
  upload, then Designer's, then SVG code; SVG code is sent as a `data:image/svg+xml;base64` URI,
  and left out above 65,536 characters; null where the header would show only the template's
  built-in image, which is UNA's generic logo, not the community's), `logo_aspect` for an
  uploaded logo, `icon` (the 180x180 home screen icon, the site's or the template's; until the
  site has made that size it is a transcoder link, which becomes the stored copy's link once
  it is made) and `accent`, the theme colour set in Designer as `#RRGGBB` (null when
  none is set, since the template's own `theme-color` is a title-bar colour and not a brand
  colour, or when it is not a hex colour). A client derives readable shades from `accent`
  itself; a white or grey one says the site has no colour of its own.
- `GET /api/v2` also lists `modules` (v2 only): `ModuleInfo{module, tag, title, kind}` for each
  module with paths in this site's API (`bx_spaces`, `spaces`, `Spaces`, `space`). Each endpoint
  class says it (`apiV2ModuleInfo()`; BxDolApiV2Router::hooks), and only enabled modules have an
  endpoint class, so no module is named in a list anywhere. A client shows a section only for a
  module listed here, instead of probing a path and taking a 404 as "absent", and routes a
  profile of kind `group` by its `module`: a space is `group` like a group (`ProfileKind`
  has no more kinds), and its paths are the ones of the module listed with that
  name (`GET /spaces/{id}`, not `GET /groups/{id}`, which is 404 for it).
- Ids are decimal strings; dates are ISO 8601 in UTC.
- An Item's id (`/content/{id}`) is the id of the Timeline event that shows it, for a feed post
  and for content of other modules alike. A Comment's id is UNA's unique comment id
  (`sys_cmts_ids`), the same for every comment system, so `/comments/{id}` needs no item;
  `target_id` is the Item it is on and `parent_id` the comment it answers. `/comments/{id}`
  finds the comment's comments object, the event that shows that object, and checks that the
  viewer may see that event. Replies are listed under the comment they are shown under: the
  Timeline nests one level, so `GET /comments/{top}/replies` is the whole thread under a
  top-level comment, oldest first, and `depth` and `parent_id` say who answers whom.
- A comment is written as `body` (plain text, kept as written: a literal `<` stays text, each
  line a paragraph) or as `body_html` (HTML as the site's comment editor writes it: paragraphs,
  line breaks, links, mentions as `<a class="bx-mention-link" data-profile-id>`, hashtags), one of
  them (422 for both or neither). Either goes through the comment form, as one from the site:
  its `XssHtml` pass (clear_xss, which leaves an administrator's HTML as it is, as on the site),
  its checks, and the metatags object's `metaAdd`, so mentions notify and hashtags are indexed.
  A text-only comments object stores `body_html` as its text. An edit replaces the whole text:
  a plain-text `body` for a comment with links, mentions or formatting is 409
  `formatted_text` (it would lose them), `body_html` is not. `viewer.can_edit` and
  `viewer.can_delete` say what PATCH (with `body_html`) and DELETE would accept: a comment with
  replies can be deleted only by a moderator (409 `has_replies`).
- Activities and Items carry `version`, 24 hex digits of a sha256 of the activity (or item) as
  this viewer sees it, without its view counts, the storage tokens of private file links and
  the times in links of copies not made yet, so it changes when anything shown changes (a reaction, a comment count, an edit, the
  viewer's own state) and stays the same from request to request otherwise. v2 has no `POST /sync` (no held
  entities), so a client may compare it itself. Items have it too (optional in the schema).
- `viewer` is null for guests, on Activities and Items alike.
  `Activity.viewer` is `ActivityViewer` (`reposted`: the viewer reposted what it shows to their
  own timeline; `can_repost`: the Timeline's repost check, public and members-only items only).
  `Item.viewer` is `ItemViewer` (`reaction`, `favorited`, `can_react`, `can_comment`,
  `can_edit`, `can_delete`); `favorited` is the viewer's favorite of content of a module with a
  favorites object (`OBJECT_FAVORITES`), always false for feed posts, which have none. The
  repost lookup reads the event the site's repost button would repost, without the site's
  `getReposted`, which inserts a missing system event (a GET writes nothing). A feed page reads
  what the viewer reposted and favorited in one query each (`BxTimelineDb::getRepostedIds`,
  `BxDolObjectQuery::getPerformedObjects` per module), not one per activity.
- `Comment.viewer` is `ItemViewer` too, null for guests: `reaction` (the viewer's
  reaction to the comment, from the comments object's reactions, read for a page in one query),
  `favorited` (always false: comments have no favorites), `can_react`, `can_comment` (may
  reply), `can_edit` and `can_delete` (as above).
- `Item.kind` is `feed_post` for the Timeline's posts, and for another module's entry
  what its ApiV2 class says (`apiV2ItemKind($sModule)`: Posts `post`, Discussions
  `discussion`), else `content`; `module` names the module. `Item.entry_id` (v2 only) is the
  entry's id in its module's own paths for a module whose class says they take its content ids
  (`apiV2ItemEntry($sModule)`: the text and files bases, so Posts, Videos, Photos, Albums,
  Files, Polls, Tasks and Discussions): `GET /posts/{entry_id}` opens the post an item shows.
  It is left out for feed posts and for contexts (whose paths take profile ids). `Item.links` is
  `LinkPreview[]`, from a feed post's attached links (`state` always `ready`, `site_name` the
  host, an `image` of 0 by 0: the site keeps no name or size); `[]` for other content.
- `GET /reactions` is a `string[]`: the reaction names `PUT /content/{id}/reaction`
  takes, the site's default first (Studio's default reaction, else the one the reaction button
  shows before a vote, else the first), then the others in their order. Their titles, emoji,
  `per_user` and `any_emoji` are in `GET /reactions/details` (`ReactionKinds`, v2 only, in the
  same order), which the desktop app reads. Each kind there also has `icon`, a Lucide name: the
  reaction's Lucide or Font Awesome icon as the site's Lucide set maps it (as a badge's), and for
  the Font Awesome faces Lucide has no icon for, the face NEO's web set draws (`laugh-squint` is
  `laugh`, `surprise` is `smile`, `sad-tear` is `frown`); null for none. `color` is the
  reaction's colour as hex (UNA's `col-red1` classes, `template/css/colors.css`), null for none.
  `display` is how the site draws its reactions, `icon` or `emoji`: by most of the reactions'
  Icon / Emoji / Image choice in Studio's reactions list (`use`; an image counts as an icon).
- 409 `comments_disabled` / `reactions_disabled`: the item's comments or reactions object is
  turned off on the site (every comment and reaction operation can answer it).
- 404 means there is no such thing (or it was deleted); 403 that the viewer may not see or do it.
- `Media`: `id`, `kind` (`image` or `video` here; the schema lists
  `audio` and `file` too), `mime`, `size` (bytes), `state`, `original_name` (the name it was
  uploaded with), `url` (the original file; a private file's link carries a storage token,
  reused for a few minutes; a post's private original goes only to its owner, as the site shows
  everyone else only copies, and an original keeps the camera's metadata, its location included:
  for others `url` is the largest copy, `variants.large`, else the next there is; a message's
  photos and the viewer's own uploads go to everyone who sees them, as on the site),
  `download_url` (the same link: UNA
  has no separate download link, and sends files other than images, videos and audio as
  downloads), `duration_ms` (always null: UNA keeps no video length) and `variants`, the copies
  by name: `thumb`, `medium` and `large` for a photo (the Timeline's `photos_view` 300 wide,
  `photos_medium` 600 wide and `photos_big` 1000x1000; a message's or profile's photo has its
  module's thumbnail as `thumb` and the original as `medium` and `large`), `mp4` and `poster`
  for a video once converted (`variants` is `{}` while it is `processing`). Each `Variant` has
  `url`, `width` and `height`; UNA keeps no sizes of its copies, so these are the original's
  size fitted into the copy's transcoder box (never enlarged), or 0 when the original's size
  or the transcoder is not known (copies made by other modules). `thumb_url` and `large_url`
  are gone. A client shows `medium` in a feed and `large` full-screen, plays `mp4` (never the
  original while it converts), and falls back to the nearest copy, then `url`. `size` and
  `mime` are 0 and `application/octet-stream` for a file of no known storage.
- A post's `Media` carry `width` and `height`: the original file's size in pixels as it is shown,
  read from its storage row (null when the site doesn't know it). The copies in `variants` keep
  that aspect ratio, so a client can reserve the box before the image loads. A
  photo uploaded through API v2 has its EXIF orientation applied (a portrait phone photo is taller
  than wide, as its copies are); a video's size is that of its first frame, which ffmpeg already
  turns. A photo uploaded on the site or through API v1 stores the sensor's size, as it does on
  a site without API v2 (`BxDolImageResize::getImageSize` applies the orientation only in an
  API v2 request), so for those that are turned a quarter the two are swapped: a client should
  still fit the image in the box it reserved. The timeline's
  own photos and videos and the covers of content modules have it; images a module builds its
  own way (galleries) may not. UNA keeps no alt text for these files, so `Media` has none.
  `Media.mime` is the original's type and `state` is `ready`, or `processing` for a video the
  site has not converted yet (its `variants` are empty until then). It is read without the
  transcoder's outdated check (`isFileReady($id, false)`), so a GET never deletes transcoded
  copies; it costs two queries per Timeline video. A file of a known storage has the
  id `(storage object id << 32) | file id`, the same as the upload it was, so photo and video
  ids no longer collide.
- Uploads (tag `uploads`): `POST /uploads` takes one `file` as multipart/form-data and answers
  201 `Media`. Photos go to the Timeline's photo storage (`bx_timeline_photos`) and videos to
  its video storage, by the file name's extension; the content must be of that kind too
  (`finfo`), or 415. The storage's own checks apply: its extensions (415), the membership's
  and the storage's size limits and quotas (413 `file_too_big`, `quota_exceeded`), as for the
  post form, whose uploader the ghost row names. An upload is a ghost of the viewer's profile,
  as an upload on the site is, until a post takes it: `POST /feed-posts` with `media_ids` (in
  display order; the text may then be left out). An id that is not an upload of the viewer's,
  or one a post took already, is 422 on `media_ids[i]`. One no post takes is deleted after the
  site's ghost lifetime (`sys_storage_ghost_lifetime`, an hour by default). `GET /uploads/{id}`
  says whether a video is ready, `DELETE /uploads/{id}` takes one off a post being written
  (409 `attached` once a post has it); both answer 404 for anyone else's. Deleting a post
  (`DELETE /activities/{id}`) deletes its files, as the site does. Upload tokens (v1) are not
  needed: the bearer token says whose upload it is.
- `links` on `POST /feed-posts` (and `POST /posts`, v2 only) attaches up to five links with
  their previews, as the site's post forms attach them: the Timeline's form takes them as one
  comma-separated value (a comma in a URL is sent as %2C) and reads each page
  (`addAttachLink`), the Posts module's add then links each one read the same way
  (`addAttachLink`, `saveLink`; 422 `unsupported` where its posts take no links). Only absolute
  http(s) links to public addresses (`BxDolApiV2Map::links`: `bx_remote_url_is_allowed`, which
  the fetch repeats for each redirect with the address pinned); another is 422 on `links[i]`
  (`invalid`, `not_allowed`). A link alone is a feed post, as on the site.
- Editors (tag `editor`, `BxBaseApiV2Editor`): `GET /hashtags?q=&limit=` is what the site's
  editor suggests after `#` (`BxDolMetatags::getMetatagsDataByTerm`), as `Hashtag{tag, count,
  url}`: the keywords of every metatags object of an enabled module that start with `q` (LIKE
  wildcards in it are text), labels left out where only hashtags are keywords
  (`sys_metatags_hashtags_only`), the most used first, at most `limit` (8, up to 20), in one
  bounded query over all keyword tables (`BxDolMetatagsQuery::keywordsGetByTermAll`, a UNION ALL
  with LIMIT; the site's own reads every matching row of each table). Four queries in all.
  Guests get them, as the site's suggestions; as there, keywords of content the viewer may not
  see are suggested too (a keyword is not the content). `url` is the hashtag's page, the `href`
  of a picked hashtag (`<a class="bx-tag-link" dchar="#" href>#tag</a>`). `GET /links/preview?url=`
  (members only) is a link's `LinkCard` from the site's default embed provider
  (`BxDolEmbed::getData`, as `embed.php` reads it, kept in `sys_embeded_data` for
  `sys_embed_lifetime` days): the built-in provider reads the page itself (bx_get_site_info,
  through bx_file_get_contents' SSRF guard) and keeps its picture in `sys_images`; Microlink
  and Peekalink read it in the background (`state` `pending` first); providers that draw cards
  only in the browser (Embedly, oEmbed) give the host alone. The URL is checked first with the
  site's own `bx_remote_url_is_allowed` (private, loopback, link-local, reserved and shared
  addresses are 422 `not_allowed`). Three queries for a card the site has. `POST /uploads/inline`
  (tag `uploads`) stores a picture for a text as `upload_inline` does: in `sys_images_editor`,
  public, the viewer's, its ghost row dropped (`afterUploadCleanup`), with the storage's type,
  size and quota checks (415, 413) and the content sniffed (`getimagesize`, `finfo`); `url` is
  the `sys_images_editor` transcoder's copy (1600px at most) for JPEG and PNG, the file
  otherwise, with the size it is shown at.
- `PATCH /feed-posts/{id}` (`FeedPostChanges`: `body_html`, `audience`, at least one) edits a
  feed post through the Timeline's edit form, after its `isAllowedEdit` check (one's own post
  where the site lets authors edit, any for moderators; reposts and other modules' content are
  403). It answers the post as it is now. The post keeps its media and its location (the edit
  form would read the location from the request and so drop it: `editApiV2Post` leaves it
  alone); the site keeps the old text when the new one is empty. A post in a context keeps the
  context's audience (422).
- Follows and friends (tag `graph`) are UNA's `sys_profiles_subscriptions` and
  `sys_profiles_friends` connections, changed only through the connection objects' own actions
  (`actionAdd`, `actionRemove`), so the site's checks (the membership's `connect` action, the
  profile view check), alerts and notifications apply. `POST /profiles/{id}/follow` and
  `/friend` and their DELETEs are idempotent; one's own profile answers 409 `own_profile`.
  `POST /friend` sends a request or accepts the other side's (`FriendResult.status`
  `requested` or `friends`); `DELETE /friend` cancels, declines or ends a friendship. As on the
  site, friends follow each other: accepting adds both follows and ending the friendship removes
  them. Groups and modules with friends off answer 403 `friends_unavailable`.
  `GET /profiles/{id}/connections` has the counts, `viewer` (a `Relation`, with `can_follow` and
  `can_befriend` saying what a POST would do; `blocking` and `muting` are always false, UNA has
  neither) and `lists`: who follows a profile and whom it follows are private unless the profile
  module's "public subscriptions" options say otherwise (the owner always sees them); friends
  are listed to anyone who may see the profile. Lists are `Connected{profile: Profile,
  since}`, newest first, each page one query; `GET /me/friend-requests` lists requests waiting
  for the viewer and `GET /me/friend-requests/sent` the ones the viewer sent that wait for an
  answer (the site's Sent Requests), each of the acting profile only; `DELETE /friend` on one of
  those cancels it. Relations (`sys_profiles_relations`: husband, sister and the like between
  friends, off by default) are not in v2 yet. Following (list and count) holds people and organizations only, as the site's
  Following block: the groups, events and other contexts a profile follows (joining a group
  follows it) are left out, so a public following list never tells who is in a secret group.
- `GET /me/recommendations/friends` (Friend Suggestions) and `GET /me/recommendations/follows`
  (Who to Follow) list the site's recommendations for the acting profile (v2 only): the
  `sys_friends` and `sys_subscriptions` recommendation objects, as the site works them out (by
  a transient cron job after a new friendship and when the profile is saved), best match first,
  as `Suggestion{profile, score}` pages with an offset cursor (one query, then the profiles,
  primed at once). Active profiles only, never the viewer; Who to Follow holds profile modules
  only, as the site's block. The friends, followers and following lists read their profiles at
  once the same way (`BxBaseApiV2Profiles::summaries`).
- `PATCH /profiles/{id}` (`ProfileChanges`: `display_name`, `about`, `avatar_id`, `cover_id`, at
  least one) edits a profile of one's own through the profile module: its `checkAllowedEdit`
  (a profile of the viewer's account, any for moderators; others 403) and, for the cover,
  `checkAllowedChangeCover`. A profile of the viewer's account is found whatever its status
  (waiting for approval, suspended), as the site lets its owner edit it; others not active are
  404 as in `GET /profiles/{id}`. The name and about go through the module's edit form
  (`edit_entity`), after the form's own checker of the name (`ProfileName`, a group's `Length`),
  which `edit_entity` alone would skip; only what changes is sent. `about` is plain text, each
  line a paragraph (as comments are), so an about with links or formatting written on the site
  answers 409 `formatted_text`. `Profile.about` carries at most 1000 characters (a longer one is
  cut, ending in …, and `about_truncated` is true); editing such an about here would replace the
  whole description with its start, so it answers 409 `too_long` (edit it on the site). Where
  the module keeps the last name apart (persons: `last_name`, when its input is in the edit form
  or the profile has one), the name the site shows is two fields: `display_name` is 422
  `not_editable` unless it is the name as shown (no change). `avatar_id` and `cover_id` are uploads of purpose `profile`
  (`POST /uploads`), which go to the storage of the acting profile's module, so a profile of
  another module of the account (an organization) takes ones uploaded while it acts; the upload
  must be a ghost of one of the account's profiles that nothing else took (422 otherwise). It is
  set with the module's `update_image` service (its alert and the site's "changed picture"
  post), and null takes it off. A file replaced or taken off stays with the profile, as the
  site's edit form keeps it: the earlier "changed picture" and "changed cover" posts find their
  file by id and would vanish from every feed (with their comments) without it. Everything that
  can refuse (the edit and cover checks, the fields, the uploads, the storages `update_image`
  uses) is checked before anything is written. A site that approves profile edits makes the profile pending
  again. A fix in the base form came with it: an edit with values taken from the entry (as
  `edit_entity` does) gave the profile's picture to every file the entry had in that storage in
  turn (its old pictures and covers, each with a "changed picture" post); `processFiles` now
  takes a single stored value as that one file.
- `GET /profiles/{id}/actions` (v2 only, `ProfileAction[]`) is the More of a profile's or a
  context's page: the items of the module's `<module>_view_actions_all` and
  `<module>_view_actions_more` menus (what the cover block gives api.php's apps as its
  `actions_menu`) that are active in the apps and visible to the viewer (the menus' own checks,
  `getMenuItemsNames` in the menu's API mode), each with the action the apps do for it, and only
  those: `report` (`choices` are the site's `sys_report_types`, `done` once the viewer reported
  it) and `edit` (an `edit-<module>-profile` item of a person or an organization the viewer may
  edit: PATCH /profiles/{id}). The hero's own (Follow, Join ...) have their paths; the rest
  (membership levels, badges, deleting, inviting, notes, audit, a context's editing) is the
  site's and left out. `POST /profiles/{id}/report` (`ProfileReport{type, text}`) is the report
  object's own `report()` in its API mode, so the moderators get what the site's Report sends
  them; a second report is 409 `already_reported` (the site's button would take it back).
- `Profile.handle` is the profile page's SEO link (`lily-carter` in
  `/view-persons-profile/lily-carter`), null while SEO links are off. It is unique within a
  profile module; `GET /profiles/by-handle/{handle}` (case-insensitive) takes the oldest
  profile when two modules share one.
- Notifications say what they are about, so a client opens them itself: `object_kind` and
  `object_id` are `content` (an Item id), `profile` (a profile id; groups and other contexts
  too), `conversation` (a conversation id) or `comment` (a Comment id, with `item_id`, the Item
  it is on, and for a reply `thread_id`, the top-level comment `GET /comments/{id}/replies`
  lists it under); `other` (null id) has no place in the API, open `url`. The
  comment kinds (`social.comment`, `social.reply`, `discussions.reply`) are about the Item the
  new comment is on: `object_kind` `content`, `object_id` and `item_id` the Item, `thread_id`
  for a reply, the new comment in `data.comment_id`.
  They are read with
  what UNA knows about the event's unit (`BxDolApiV2Targets`): a connection (follow, friend) is
  the other profile; a comment or reply (the unit is a comments object), the core's `comment`
  alert, and votes, reactions and reports whose object is a comment (`sys_cmts_ids`) are the
  comment; otherwise the content the Notifications module checks the event against
  (`BxNtfsConfig::getContentModule`, `getContentObjectId`). A profile module's entry is its
  profile; a module's other content is what its own ApiV2 class says
  (`apiV2ContentTarget($sModule, $iContentId)`: Conversations answer for theirs), then the
  Timeline, which answers for its own events and the content of any module it shows (the event
  the entry was added with). Only a module's own comments object (`CNF['OBJECT_COMMENTS']`)
  is on its entries; notes and media comments are `other`. A message in a conversation is the
  conversation. A target says where to look: the resource checks, as always, whether the
  viewer may see it.
- `Notification`: `kind` (the map below), `actor`, `actors`, `data` (an object, `{}` when the kind carries nothing) and
  `updated_at`, plus v2's `source` (UNA's `<unit>.<action>`, what `kind` was before), `module`,
  `text`, `url` and the target fields above. v2 does not coalesce, so `actors` is 1 and
  `updated_at` is `created_at`. A kind says what happened to the recipient, so the events UNA
  sends about what someone else owns (a comment on a post of someone the viewer follows, a
  reaction to a friend's post) are `other`. The map (`BxNtfsApiV2::_kind`; a module's ApiV2
  class may answer for its own units with `apiV2NotificationKind($aEvent, $aTarget, $iViewerId)`):
  - `sys_profiles_subscriptions.connection_added` to the one followed: `graph.followed`;
    `sys_profiles_friends.connection_added` to the other side: `graph.friend_requested` for a
    request (`content.request` 1), `graph.befriended` once accepted.
  - A reactions vote object's `doVote` (`<module>_reactions`, `sys_cmts_reactions`) on the
    recipient's item or comment: `social.reacted`, `data.kind` the reaction of the vote's track
    row (`subobject_id`; the page's rows are read in one query; a reaction taken back since,
    whose row is gone, is `other`). Likes (`doVote` of a likes object) and scores (`doVoteUp`,
    `doVoteDown`) have no kind and are `other`.
  - `meta_mention.added` to the one mentioned: `social.mentioned`.
  - A comments object's `commentPost` on the recipient's item: `social.comment`; `replyPost` to
    the author of the comment answered: `social.reply`; `data.comment_id` is the new comment.
    The core's `comment.added` (the "also commented" notice to the item's other commenters) is
    `other`: its recipient is not the item's author.
  - The Discussions module's comments (`bx_forum.commentPost`, `replyPost`), to the author and
    those following the discussion: `discussions.reply`, `data.comment_id` and `data.title`.
  - A group's `join_request` to those who manage it: `groups.join_requested`, its actor the one
    who asks (not the group, the alert's sender); `join_invitation_notif` to the invited:
    `groups.invited`; `fan_added` to the new member: `groups.approved` (to other members and
    followers: `other`). `data.group_id` is the group's profile id. Only modules with an ApiV2
    class (Groups) have these; other contexts' are `other`.
  - `bx_timeline.repost` of the recipient's post: `timeline.reposted`, `data.activity_id` the
    repost.
  - `invites.joined` never comes: UNA's Invites has no "someone you invited joined" notice.
  For `graph.*` and `invites.joined` the person is the `actor` (the follower, the one asking to
  be friends, the new friend, the new member); `groups.*` carry the group in
  `data.group_id` and as `object_id`.
  `object_id` is what `object_kind` names. For comment, reaction, mention and repost kinds that
  is the object (the Item, or for a reaction to or mention in a comment, the comment); for
  graph kinds it is the other profile and for groups kinds the group.
- `GET /sync` (tag `realtime`) is one poll for badges and new notifications: `badges`
  (`notifications`, `messages`, `friend_requests`, each the count of its own endpoint, present
  when the site has the module) and `changes`, the notifications newer than the cursor
  (`{type: "notification", id, version, data: Notification}`, `version` a
  digest of the notification), newest first. At most 20 go in one answer; when more came it
  says `more: true`, and its cursor goes on below the last one sent, so syncing again at once
  brings the rest, part by part, and nothing is skipped (`BxNtfsApiV2::_sync`). Pass back
  `cursor`; the first sync only starts one, and a cursor of another profile answers
  `reset: true`. The answer is the same while nothing
  changes, so a repeat with `If-None-Match` is 304 with no body. Each part comes from an
  endpoint class that defines `apiV2Sync($iViewerId, $aCursor, $bReset)`
  (`BxDolApiV2Router::hooks`), so a site without a module has no badge for it. Its operationId is
  `pollSync`, and it answers a `SyncResponse` without held entities or list heads, so `lists`
  is `{}`:
  `changes` are `Change`s (a client skips a `type` it does not know), `lists` a map of
  `ListUpdate` and `badges` a map of integers, which v2 names (`Badges`). There is no
  `POST /sync` (holds, the `home` head, `gone` tombstones): a client polls `GET /sync`
  and reloads what it holds, and hears what changes in between over the site's sockets
  (`GET /realtime`, below). When nothing is new it
  costs a few count queries and one for the newest notification id; notifications are prepared
  only when there are new ones.
- `GET /realtime` (tag `realtime`) says where to listen for live events, so a client need not
  wait for its next poll: the site's sockets server (Studio > Settings > Sockets: Soketi, which
  speaks Pusher's protocol) as `url` (a `ws` or `wss` address with the app key and protocol 7)
  and `key`, and the public channels for what a client shows, by what they carry: `activities`
  (the Timeline's `bx_timeline_0`: `added`, `edited`, `deleted` with the Activity's `id`; a
  comment on a feed post sends `edited` there too) and, for a signed-in viewer, `connections`
  (`sys_connections_<profile id>`: `changed` when one of the viewer's friendships or follows does).
  An Item's comments come on its own channel, `Item.live.comments` (`cmts_<system>_<id>`:
  `comment_added`, `comment_edited`, `comment_deleted`), null without a sockets server. Each
  endpoint class names its own channels (`apiV2RealtimeChannels($iViewerId)`), so a site without
  the Timeline has no `activities`. The secret never leaves the site (`BxDolSockets::getClientConfig`).
  Anyone may listen to these channels, so events carry ids, never content: a client loads what
  changed through the API. The data of UNA's events comes encoded twice (`sendEvent` takes JSON
  text and the Pusher library encodes it again): decode a string that is JSON text once more.
  Without a sockets server `enabled` is false and a client polls `GET /sync` alone; notifications
  and messages have no events yet, so their badges still come from the poll.
- `GET /links/resolve?url=` maps a link to this site (permalink, SEO link or page.php, read as
  the site reads them: `BxDolPermalinks::unpermalink`) to `LinkTarget` (`content`, `comment`,
  `profile`, `group`, `conversation`, with the same ids as above) when it is the view page of
  one entry of a module (`CNF['URI_VIEW_ENTRY']`) that still exists; anything else, or another
  site, is 404. Anyone may ask about any link, so a link to what the viewer may not see is 404
  too, the same as a link to nothing: an endpoint class that knows a target says whether the
  viewer may see it (`apiV2TargetVisible($aTarget)`: the Timeline for Items, as
  `GET /content/{id}` would show them; Conversations for conversations, only to those in them;
  the groups base for the contexts of its module, hidden where `GET /{tag}/{id}` is 404: a
  secret group or space to those outside it, one that is not active).
  http and https links of the site's host and port count as the site. A `profile` or `group`
  target has `module` (v2 only), the profile's module, so a link to a space opens the space.
  `group` is every context: groups, spaces and events alike.
- People (tag `persons`, `BxPersonsApiV2` on `BxBaseModProfileApiV2`, so the path exists only
  while Persons is enabled): `GET /persons` is the site's people directory, a page of embedded
  `Profile`s (`Page_Profile`) with an offset cursor, in a `view`: `recent` (the default, People's
  Recent, `persons-home`: newest first), `active` (`persons-active`: the most recently signed in
  first) or `online` (`persons-online`: with a session in the site's online time, the newest
  first); the profile id breaks ties, so pages don't overlap. It is the module's own search
  result in the mode of that browse block, so its conditions hold (active persons, unconfirmed
  accounts left out where the site hides them) and its browse check (`checkAllowedBrowse`, which the `check_allowed_browse` hook may make refuse: 403).
  As on the site, a person whose privacy keeps the page from the viewer is listed with the name
  and, when the viewer may see it, the picture (`created_at` unknown); GET /profiles/{id}
  answers 403 for one. A page is one query for the list, one for the count, one for the profile
  rows (`BxDolProfileQuery::primeByContentAndType`) and the summaries' primed reads
  (`BxBaseApiV2Profiles::summaries`): about 20 for a page of 50. The viewer's friends are
  `GET /profiles/{id}/friends`; organizations have no such list yet.
- Search (tag `search`, `BxDolApiV2Search`), `q` 1-100 characters (422 otherwise):
  `GET /search/profiles` (people and organizations) and `GET /search/groups` (Groups' own
  class, so it exists only while the module is enabled) answer up to `limit` (20)
  `Profile` (embedded, as above), found by each profile module's quick search (`searchByTerm` over
  `FIELDS_QUICK_SEARCH`, active profiles, most recently active first, at most 50 per module)
  and ranked: the exact handle (`profileIdByHandle`) or the whole name, then names that start
  with `q`, then a word that does, then the rest; the view check runs in that order and stops
  at `limit`. A profile is listed when the module's `checkAllowedView` allows it, or when only
  its privacy step refused, the viewer's membership level has the module's `view entry`, and
  the privacy is partly visible (`isPartiallyVisible`: a closed group, a person for friends
  only), as the site shows those pages with a name and picture; a secret group, a private
  person, a members-only one for guests, and every profile of a module the viewer's level may
  not view is not found. GET /profiles/{id} still answers 403 for a partly visible one (the
  desktop app then shows the name and picture from the search with the site page). The
  profile paths (`GET /profiles/{id}`, its timeline, connections and lists) answer 404, as for
  an id that is no profile, for a profile that is not active (suspended, waiting for approval)
  unless the viewer is that profile or may edit any of its module's (the site's
  `_isAvailablePage`), and for a secret group the viewer may not see.
  `GET /search/content` (the Timeline's, since hits are Activities) searches the site's search
  sections for the API (`sys_api_search_sections`) that are enabled content modules (not
  profiles or contexts): each with its own search object (`BxDolSearch` sections, their
  searchable fields, statuses and conditions) and the keyword, newest first across sections
  (a merge: each page takes the newest of every section's next rows, and the cursor keeps
  where each section got to, so nothing repeats or is skipped; each section is read by date,
  then id, so entries of the same second keep their order from page to page). The search
  objects read without the request's own query params, so the site's search params
  (`per_page`, `start`, `<section>_mode`, `ownerName`, `userID`, `api`) change nothing. `kind` names one module
  (422 for one that is not searched). A hit is
  a `Hit` (`id`, `kind`, `author`, `card`, `published_at`, all from `activity.object`:
  `kind` is the Item's kind: `feed_post`, `post`, `discussion` or `content`) plus `module` (the module it was found in,
  which the `kind` filter takes), `content_id` (the same as `id`, deprecated) and `activity`:
  the Timeline event that shows the entry (the event itself for a feed
  post, the one the entry was added with otherwise), after the same check as
  `GET /content/{id}`, so an entry the viewer may not see, or one no event shows, is left out
  and a page can be short. The site's keyword search reads private rows too and leaves the
  check to whoever shows them; this is that check. The timeline has `GlobalSearch = 0` (the
  site's own search page leaves it out) but is in `sys_api_search_sections` by default.
- Groups (tag `groups`, `BxGroupsApiV2`, so they exist only while the Groups module is
  enabled; the work is in `BxBaseModGroupsApiV2`, which spaces, events and other context
  modules can extend with their own paths). A group is a profile: `Group.id` is its profile
  id, its feed is `GET /profiles/{id}/timeline` and a post goes into it with `POST /feed-posts`
  `context_id`, after the Timeline's own destination check (the group's post privacy and
  roles), so a non-member's post into a members-only group is 403. `Group` is the `Profile`
  plus `visibility` (`public`, `members`, `closed`, `secret`, `context` for a group inside
  another context, `other`), `join_policy` (`open` or `approval`), `member_count`,
  `content_visible` and `viewer` (`GroupViewer`: `status` `active`, `pending`, `invited` or
  `none`, `role` owner, admin, moderator or member, and `can_join`, `join_on_site`,
  `can_leave`, `can_post`, `can_edit` as the module checks them; null for guests). How much a
  viewer sees is the module's view check: all of it, or for a closed group seen from outside
  its name and picture only, as the site shows that page (`content_visible` false, `about`
  empty, no cover; its feed and members are 403); a secret group is 404 to all but its members
  and invitees, as if it did not exist. A group that is not active (suspended, waiting for
  approval) is 404 too, to members as well, unless the viewer may edit any group, as the site
  hides its page; lists leave it out. The operations run without the request's own query
  params: the module's checks read `key` (an invitation link's), so a stray one would hide a
  real invitation; each invitee's invitation is found by profile. Membership is the module's fans connection, changed
  only through its actions: `POST /groups/{id}/membership` joins an open group or one that
  invited the viewer (`JoinResult.status` `active`; an invitation of the invites table is
  accepted with the module's own `processInvite`) and asks the admins of the others
  (`pending`; the module's `join_request` alert notifies them); joining follows the group, as
  on the site. 403 when the module refuses (`checkAllowedFanAdd`: a ban, the membership level),
  409 `questionnaire_required` or `paid_join` when joining needs the site's questions or a
  payment. `DELETE` leaves, withdraws a request or declines an invitation, after
  `checkAllowedFanRemove`; both are idempotent. The POST body (`JoinRequest`: an
  optional `token` from an invite link, at most 255 characters) may be left out. Other fields are ignored (other v2 request bodies are stricter:
  an unknown field is 422 `unknown_field`). The token is checked and not used:
  the viewer's own invitation is found by profile, so a token (someone else's invitation key,
  or a stray one) neither hides one nor grants one. `GET /me/groups` is a plain array,
  not a page: the 200 most recently joined active memberships (secret groups too; each `Group`
  costs a dozen queries); `GET /groups` the module's browse list (its search
  result in `recent` mode, newest first, by id within a second): public groups, members-only
  ones for members and closed ones, never secret ones. `GET /groups/{id}/members` is
  `Member{profile: Profile, role, status, since}`, newest first, to those who see the
  content; the roles of a page are read in one query. Each `Group` of a list still runs the
  module's checks for its `viewer` (a dozen queries), so list pages of 50 cost hundreds. There is no `post_policy`: UNA's post privacy has more choices than
  members or admins, so this API gives `viewer.can_post`. `Group.content_kinds`
  (v2 only) lists the tags of the modules whose content may go into contexts of the module
  (`discussions`: GET /discussions?context_id= and POST /discussions with `context_id`), from
  each endpoint class that defines `apiV2ContextContent($sContextModule)` (Discussions asks its
  privacy, `serviceCheckAllowedAddInContext`, as the site's add form offers the context). It is
  the same for every context of a module and read once per request; whether the viewer may add
  something is that endpoint's own check. A client shows a tab for each.
- Spaces (tag `spaces`, `BxSpacesApiV2` on the same base, only while the Spaces module is
  enabled) are contexts like groups: `GET /me/spaces`, `GET /spaces`, `GET /spaces/{id}`,
  `POST` and `DELETE /spaces/{id}/membership`, `GET /spaces/{id}/members` and
  `GET /search/spaces` behave exactly as their group paths, through the module's own checks,
  connection and search. `Space` is `Group` plus `parent_id` (the space it is in, by profile id,
  from the module's `parent_space`; null for a top level space and for one whose parent the
  viewer may not know of, a secret or inactive one) and `child_count`. `GET /spaces/{id}/spaces`
  is a page of its subspaces, newest first: the module's browse list (`recent` mode, with its
  privacy conditions) with the parent as one more condition, so secret subspaces are not listed
  (their members find them in `GET /me/spaces`); 404 and 403 as `GET /spaces/{id}` for the
  parent, and 403 for a closed space seen from outside, whose page on the site shows outsiders
  its info and members, not its subspaces (`child_count` is then 0).
  `GET /spaces?top_level=true` is the module's `top_level` mode (spaces in no other space) and
  `?parent_id=` the same as the subspaces path; both together are 422. `child_count` is what the
  subspaces path lists to the viewer, counted for a whole page in one query (the same browse
  list's joins and conditions, over every space of the page, grouped by the parent:
  `BxSpacesDb::getApiV2ChildCounts`); whether the viewer may know a parent is checked once per
  distinct parent of the page. These paths follow those of groups.
  The groups base keeps the shared work: `_browse` takes the search mode and more conditions,
  `_prime` reads what a page of contexts needs at once (their member counts,
  `BxDolConnection::getConnectedContentCounts`, and the viewer's connections with them both ways,
  `BxDolConnection::primeConnections`, kept where `isConnected` reads them, so the module's own
  checks need no query for them either, and the viewer's invitations, each in one query),
  `_contextSchema` builds a module's own
  shape from Group's, and problems name the module's own noun (`API_NOUN`: "The space was not
  found"). A context in another context (an event in a group: `allow_view_to` the group's
  negative id) that the viewer may not see is hidden, 404, when the viewer may not know of the
  context it is in either (a secret one from outside), and a link to it resolves to nothing; it
  is 403 only when that context may be known (a closed group from outside).
  A list filtered by a context (`GET /events?context=`, `GET /discussions?context_id=`,
  `BxDolApiV2Targets::viewableContext`) answers 422 `not_found` on the param sent for an id that
  is no context and for one the viewer may not know of (a secret one from outside: the same
  answer, so it never tells that one exists), and 403 only for a context the viewer may know of
  but not see into (a closed one from outside).
- Events (tag `events`, `BxEventsApiV2` on the groups base, only while the Events module is
  enabled) have `GET /events`, `GET /events/{id}`, `PUT` and
  `DELETE /events/{id}/rsvp`, `GET /events/{id}/attendees`, with `GET /me/events` and
  `GET /search/events` (v2 only). An event is a context profile (Profile.kind `group`, module
  `bx_events`), so `Event.id` is its profile id; its feed is
  `GET /profiles/{id}/timeline` and posts go into it with `context_id`. `Event` has the event's
  fields (title, summary, `body_html` on single answers, author, context_id, audience, state,
  moderation, cover as Media copies, media always empty, starts_at, ends_at, all_day always
  false, timezone, location in one line from the module's locations, online_url and capacity
  always null, going_count, comments_enabled, featured, stats, published_at), plus what a
  context has (module, handle, avatar, badges, visibility, join_policy, content_visible,
  content_kinds, url) and `content_id`, the Item whose comments and reactions are the event's,
  on single answers only and only when the viewer may open it: the site's Item of an added
  event (as of a group or space) has the context profile's `me only` privacy, so it is its
  author's alone and null for everyone else, whose event comments stay on the site.
  `starts_at` is nullable: the site may keep an event without a date. A closed event seen from
  outside has its name, dates, place and picture, as its closed page on the site, and no text,
  cover or `content_id`. `viewer` is EventViewer (`rsvp` going while a member, the
  reaction and favorite of the event's own objects on single answers only, null and false in
  lists, can_react and can_comment, false whenever the answer has no `content_id` since both go
  through that Item, can_edit, can_delete) with GroupViewer's membership fields. Going is joining: `PUT .../rsvp`
  `{"status":"going"}` runs the groups base's join (an approval event makes `viewer.status`
  pending and leaves `rsvp` null) and answers the Event; `maybe` is 422 `unsupported` (the site
  keeps no such answer); `DELETE` leaves, withdraws or declines. An event that
  has ended is not refused (the site lets one join it). Attendees are the members, the first to
  join first, each `going` with its `role`; `status=maybe` is an empty page; 403 for a closed
  event from outside, as members are for groups. Lists are the module's search result:
  `when=upcoming` (the default) its `upcoming` condition (not ended, or still repeating, from
  the mode's intervals join) by start ascending, `past` its negation (ended and not repeating
  any more: the site's own Past page also lists events that still repeat) by start descending,
  events without a date included, as on that page; `from` and
  `to` (v2 only) keep the events that overlap that time, the conditions of the module's date
  filter. Without `context` the lists have the module's browse privacy (public, members-only for
  members and closed events, never secret ones, never events in a context, as the site's browse
  pages); `context` (also as `context_id`) is the module's `context` mode, to those who may see
  the context's content (422 as above, and `invalid_value` for a context of a kind that keeps no
  events, such as an event; 403); `author` the author's public events.
  `GET /me/events` is the module's `joined_entries` mode with active memberships only (secret
  events included), `when` as above. A page reads its going counts, the viewer's answers and
  invitations and the events' places in one query each (`_prime`; locations through
  `BxDolMetatags::locationsGetMultiple`), and the reaction and favorite only on single answers.
  Each Event of a list still runs the module's view, join and delete checks, its cover's
  transcoder copies and the embedded Profiles (picture, link, handle: about seven queries an
  event for its cover and twenty for each new Profile): measured on the local site, a page of 5
  events costs about 280 queries, against 335 before.
  Repeating events show their first time; their later times are not listed. `apiV2ItemKind`
  makes an event's Item `event`, `apiV2ContextContent` puts `events` in `content_kinds` of
  contexts the module's privacy lets events go into, and the base's join notifications are
  `groups.*` with the event as `group_id`. Reminders stay `other`.
- Videos (tag `videos`, `BxVideosApiV2` on the files base, only while the Videos module is
  enabled) have `GET /videos`, `GET /videos/{id}`, `POST /videos`, `PATCH`
  and `DELETE /videos/{id}`, with `GET /search/videos` (v2 only). A video is a
  `FileItem` of kind `video` (title, excerpt, `text_html` on single answers and null in lists,
  media, embed_url, album_id always null, author, audience, context_id, state, moderation,
  links, comments_enabled, featured, stats, viewer, published_at, created_at, updated_at) plus
  `module`, `content_id` (the Item whose comments and reactions are the video's, as a
  discussion's), `url` and `embed_player_url` (v2 only: the https address of the other site's
  player, from the frame the module's embed provider gave, to show in a frame). An upload's
  `media` is Media with the module's own copies: `mp4` (the HD copy for an original as high as
  the HD box, once made), `poster` and `thumb` (a smaller still for lists, a v2 extra), the
  picture its author chose being both stills; `processing` with no `variants` until the cron
  has converted it, and the video's `state` `processing` with it. The original (`url`) only
  for its owner: everyone else gets the mp4 there (`BxDolApiV2Map::videoMedia`, with
  `$bOwnerOnly`, since the module keeps its uploads public), with `mime` the copy's type and
  `original_name` empty and `size` 0 (the upload's name often tells who or where). `duration_ms` is the entry's
  `duration` (seconds its author may give), null otherwise. A link's `media` is null, its
  `embed_url` the address and `links` its preview (the chosen picture as its image).
  **v2 differs:** `comments_enabled` is always true (the site can't turn comments off for one
  video: `false` in a write is 422 `unsupported`); `published_at` is when it was added; the
  site's category is the add form's first one; a video still being converted
  is seen by its author and moderators only (404 to others, as on the site), and listed in
  their `?author=` list of it (with one whose converting failed, `state` `hidden`).
  A video (or discussion: the text base does it) in a secret context is 404 on `GET`, `PATCH`
  and `DELETE` to those who may not know of that context (`BxDolApiV2Targets::visible` of the
  context, as Spaces and Events answer), never listed for them, and `?context=` of that
  context is 422 `not_found`; one in a closed context from outside is 403.
  Lists are the module's search result in the mode of the sort or filter (`recent`, `updated`,
  `popular`, `top` and `featured` as `sort`, the mode's own order with the id breaking
  ties; `author`; `context`, also as `context_id`, through `BxDolApiV2Targets::viewableContext`
  as Discussions), with its privacy conditions (the site's browse pages list no videos that are
  in a context; `context` lists those), and every video goes through the module's view check.
  `reaction`, `favorited`, `can_react` and `can_comment` are read on single answers only.
  A new video is an upload of purpose `video` (`POST /uploads`: the module's video storage,
  videos only, put in its transcoders' queue at once, `BxDolApiV2Map::queueVideo`, as its pages
  queue them) or `embed_url` (a link its embed providers know, else 422 `unsupported_link`),
  through the module's add form (`entity_add`, with the source and the main file the form reads
  from the request set for the call: `BxBaseModFilesApiV2::_withPost`), so its checks, alerts,
  the Timeline and the ACL counter are the site's; edits go through its edit form the same way,
  with the video's source, file and picture as they are. A page of videos reads its rows
  (`BxBaseModGeneralDb::getContentInfoByIds`), its Items (`BxDolApiV2Targets::primeContent`,
  the Timeline's `apiV2ContentTargets`: one query for the page), its uploads' rows and which
  copies the transcoders made with those copies' rows (`BxDolStorage::primeFileRows`,
  `BxDolTranscoder::primeFiles`, inside the file rows and transcoder handler scopes of
  `BxDolStorageQuery` and `BxDolTranscoderQuery`, the copies' last access times with them),
  the privacy rows the view check reads (`BxDolPrivacy::primeObjects`), the pages' SEO links
  (`BxDolPageQuery::primeSeoLinks` in its SEO links scope) and its authors' profile rows,
  entries, privacy, avatar copies and page links (`BxDolApiV2Map::primeProfiles`) at once.
  Measured with a query counter on a local site, a page of 20 videos costs 46
  queries for a guest, 56 for the admin (profile 1) and 53 for a member (profile 4, 18 videos):
  205, 203 and 197 before the profiles, privacy and links were read at once, 679 when each
  file was read on its own.
  `apiV2ItemKind` makes a video's Item `video`, and `apiV2ContextContent` puts `videos` in
  `content_kinds` of contexts the module's privacy lets videos into.
- Photos (tag `photos`, `BxPhotosApiV2` on the files base, only while the Photos module is
  enabled) have `GET /photos`, `GET /photos/{id}`, `POST /photos`, `PATCH` and
  `DELETE /photos/{id}`, with `GET /search/photos` (v2 only). A photo is a `FileItem` of
  kind `photo` with the same v2 extras as a video; its `media` has the module's copies `thumb`
  (its 300x200 preview), `medium` (gallery) and `large` (cover), and the original only for its
  owner (`BxDolApiV2Map::photoMedia`: an original keeps the camera's metadata). `POST /photos`
  takes up to 20 uploads of purpose `photo` (the module's storage, photos only) and makes one
  photo for each, in their order, as the site's upload form does (its checks, one entry per
  upload, the ACL counter of each, its after-add work and alert), answering 201 with the
  FileItems in that order; `title` is every photo's (each file's name otherwise, as the site's
  own form titles them: that name is then seen by whoever sees the photo, though `media`
  gives `original_name` to its owner only) and `text_html` every photo's text, filtered as the
  edit form's text field filters it. The form checks the membership level's limit for each
  upload and stops at it: the answer is then still 201, with the photos made, and the uploads
  not taken are those no photo's `media.id` is (a photo's media id is its upload's id); they
  stay the viewer's, to send again later or delete (the desktop app keeps them in its tray and
  says "3 of 8 photos were added").
  **v2 differs:** the category is the upload form's first, `comments_enabled` false is 422.
  Lists, single answers, edits, deletes, search, secret and closed contexts are the text
  base's, as for videos. A page reads its uploads' rows and copies at once
  (`_primeMedia`), and a copy's link no longer looks at the original
  (`BxDolTranscoderImage::getCopyUrl`, for a caller that knows the source's type: getFileUrl
  read a token for each private original and each copy). Measured with
  a query counter on a local site, a page of 20 photos costs 38 queries for a
  guest, 45 for the admin (profile 1) and 47 for a member (profile 4, 18 photos); one photo
  costs the same, and the token lookups made it 94 for 14 photos before. An owner's originals
  are private files whose links are reused tokens: a page reads them in one query and makes
  the missing ones in one more (`BxDolApiV2Map::primeOwnOriginals`,
  `BxDolStorage::primeFileUrlsShared`, `BxDolStorageQuery::primeTokensSince`), where each
  file read (and once wrote) its own before. A member's own list, `GET /photos?author=<self>`,
  is 48 queries for 1, 3 or 20 asked (profile 210, 3 photos; 41 for profile 4), not more per
  photo; no seeded member has 20 photos of their own. A single answer is mapped as a page of
  one (`_one`: the same scopes and priming), so `GET /photos/18` is 37 queries for a guest
  (51 before). `GET /search/photos?q=a&limit=20` is 74 for a guest (17 hits) and 92 for a
  member (18), 86 and 116 before: the hits' contexts, the viewer's membership of each and
  their role there are read at once (`BxDolApiV2Targets::primeContexts`,
  `BxDolConnection::primeConnections`, now also for guests, `BxBaseModGroupsDb::primeRoles`);
  what is left grows with the number of different contexts on the page, not with its hits
  (a group module's ACL actions, invitations and admins).
  `apiV2ItemKind` makes a photo's Item `photo`, and `apiV2ContextContent` puts `photos` in
  `content_kinds` of contexts the module's privacy lets photos into.
- Files (tag `files`, `BxFilesApiV2` on the files base, only while the Files module is enabled)
  have `GET /files` (listFiles), `GET /files/{id}` (getFileItem), `POST
  /files` (createFiles), `PATCH` (updateFileItem) and `DELETE /files/{id}` (deleteFileItem),
  with `GET /search/files` (v2 only). A file is a `FileItem` of kind `file` with the
  same v2 extras as a photo; its `media` (`BxDolApiV2Map::fileMedia`) has `kind` by its type
  (`image`, `video`, `audio`, else `file`), the module's copies where it makes them (an image
  of the types it previews, jpg, png and gif: `thumb`, its 300x200 preview, and `medium`, its
  500 wide gallery copy; a video's `mp4` and `poster` once converted) and **the original for
  everyone who may see the file**, with its name and size: unlike a photo's, the site's own
  download is its view check (`download-file`), so `url` and `download_url` are the stored
  file (a private one's link carries a reused token valid for a few minutes: a client asks
  for the file again right before a download that waited). The site makes no still of a PDF
  or other document (its preview page shows them through an outside viewer), so they have no
  `variants`. `POST /uploads` takes the purpose `file`, any type the module's storage takes
  (its extension rules and size limits; a name saying image or video must be one, 415
  otherwise), and `POST /files` makes one file for each of up to 20 such uploads, in their
  order, through the module's upload form, as Photos does (the shared
  `BxBaseModFilesApiV2::_createFromUploads`): titles from the file names without their
  extensions, the description, the audience or context, the level's limit stopping part way
  with 201. A video among them goes into the queue of the module's video transcoders, as its
  page does when it first shows one; a GET never queues one. A video file's `state` is
  `processing` while that queue has it (a page reads where its videos are in one query,
  `BxDolTranscoderQuery::primeQueue`), `failed` when converting it failed, and `ready` with
  no `mp4` when nothing converts it (one added on the site whose page never showed it): it is
  a download then. Folders and bookmarks stay on the site: lists show the
  files only (never a folder, wherever a file is filed; the module's search result without
  its file manager mode), `GET /files/{id}` of a folder is 404. `GET /files` without `author`
  or `context` has the files outside contexts only, as the site's browse pages: those in a
  public group are in its list, their author's and search. **v2 differs:** `author` lists
  a profile's files in contexts too (the site's author page shows those outside contexts);
  the category is the upload form's first; `comments_enabled` false is 422.
  A page reads its files' rows, copies and links at once (`_primeMedia`, with
  `BxDolStorage::primeFileUrlsShared` for every file, since every viewer gets the original's
  link). Measured with a query counter on a local site, a page of 20 files is
  40 queries for a guest, 42 for the admin (profile 65) and 47 for a member (profile 4), the
  same as a page of 1 (40) or 5 (41 to 46); a profile's own list of 17 is 43, a search page
  of 16 hits 40, a space's list 52 for 1 and 55 for 3 (an image whose copies are not made yet
  costs a query a copy until they are), `GET /files/{id}` 40 for a guest and 50 for its owner.
  Files in contexts cost a few queries per context module, not per context: the checks of
  an entry in a context ask who manages that context's content, those admins' roles and fan
  connections, and the viewer's invitation, which `BxDolApiV2Targets::primeContexts` has the
  groups base read for all the page's contexts at the first check that asks
  (`BxBaseModGroupsDb::primeContextsLater`, `BxDolConnection::primeConnectionPairs`, and
  `getContentInfoByProfileId` from the rows `primeContentInfos` read). A guest's search page of
  11 hits in 4 contexts of 2 modules is 61 queries (77 when each context was read on its own),
  a member's of 12 is 78 (94).
  `apiV2ItemKind` makes a file's Item `file`, and `apiV2ContextContent` puts `files` in
  `content_kinds` of contexts the module's privacy lets files into.
- Albums (tag `albums`, `BxAlbumsApiV2` on the text base, only while the Albums module is
  enabled) have `GET /albums`, `GET /albums/{id}`, `POST /albums`, `PATCH` and
  `DELETE /albums/{id}`, `GET` and `POST /albums/{id}/items`, with `GET /search/albums` (v2
  only). An album is an `Album` (title, excerpt, `text_html` on single answers, `preview`:
  the media of its first four items in its order, the first its cover, author, audience,
  context_id, state, moderation, links always empty, comments_enabled, featured, `stats` with
  `items`, comments, reactions and views, viewer, dates) plus `module`, `content_id` (its Item:
  comments and reactions) and `url`. Its items are `FileItem`s in the order its page shows them
  (the ghosts' order, as the module orders them), photos (`thumb` the square preview, `medium`
  the browse copy, `large` the big one) or videos (the module's mp4 and stills), the original
  only for its owner. `POST /albums` goes through the module's add form with up to 50 uploads
  of purpose `album` (its storage) as its items, each titled with its file name; `POST
  /albums/{id}/items` through its Add images form (the uploads become the album's ghosts after
  its others: `BxAlbumsDb::setGhostsOrderLast`), only by the album's author where their level
  lets them edit it (403 for anyone else, moderators too, before anything changes: the site's
  form takes its author's uploads only, and a moderator's would be left with nowhere to go),
  answering the new items; when the form does not take them all it is 422 and the uploads it
  left are the viewer's again, taken by nothing. Uploads of purpose `album` are open to who
  may make an album or has one (`apiV2UploadAllowed`), so a member whose level makes no more
  albums still adds to theirs. **v2 differs:** an item's `id` is the album's own media id (`album_id` the album's), so
  `GET /photos/{id}` does not answer for it; an item has no Item (`content_id` null), so its
  comments and likes stay on the site (`stats.reactions` is its likes); its viewer's `can_edit`
  and `can_delete` are the album's, and v2 has no path to edit or delete one item yet; the
  uploads are photos only (the site's pages add videos too). An item is seen by whom its album
  is: `GET /albums/{id}/items` answers as `GET /albums/{id}` (403, and 404 in a secret context).
  A page of albums reads its previews (one `UNION ALL` of a bounded query per album,
  `BxAlbumsDb::getMediaPreviews`), its counts of items (`getMediaCounts`) and the previews'
  files and copies at once: 40 queries for a guest's page of 3 albums, 47 for the admin's 4 and
  49 for a member's 3, the same for one album; a page of 7 items costs 33 for a guest and 35
  for its owner (profile 6), who gets the originals, whose tokens are read at once (35 for 1,
  3 or 7 asked; 41 to 48 before). No viewer sees 20 albums on the seeded site, so no page of
  20 albums was measured. `GET /albums/18` is 39 queries for a guest and 50 for its owner (70
  and 94 before: a single answer read its previews' rows three times and each copy's handler
  alone; it is a page of one now).
  `apiV2ItemKind` makes an album's Item `album`, and `apiV2ContextContent` puts `albums` in
  `content_kinds` of contexts the module's privacy lets albums into.
- Tasks (tag `tasks`, `BxTasksApiV2` on the text base, only while the Tasks module is
  enabled). A task is an entry of the module
  in a context (its privacy is the context's negative profile id), in one of the context's task
  lists or in none, which the site calls its Inbox (`list_id` null). `GET /task-lists?context_id=`
  gives the context's lists as its Tasks page shows them (the Inbox first, `id` null, then the
  lists in the order they were made, each with its active and open counts in one query:
  `BxTasksDb::getListCounts`), the site's priorities and states (`TaskChoice`: the form's
  pre-values; a state says whether the site counts it as done) and whether the viewer may add
  lists. `POST`, `PATCH` and `DELETE /task-lists` go through the site's list form: who may post
  in the context may add and rename lists (as that form checks), its administrators delete
  them. **v2 differs:** deleting a list deletes each of its tasks through the module (its
  comments, files and feed activity with it, each counted in the level's delete limit; refused
  before anything changes when one may not be deleted, though a 409 from the module's delete
  partway leaves the tasks before it deleted), where the site's own delete removes the tasks'
  rows only. List and task titles are 3 to 160 characters in the schema, as the site's forms
  take them (their own checks still apply).
  `GET /tasks` lists active tasks with the module's privacy, open ones first, then those due
  soonest (none last), then the first added: `context_id`, `list_id` (or `inbox`), `assignee`
  (a profile or `me`), `author` and `state` (`open`, `completed`, `all`). `GET /me/tasks` is the
  viewer's open assigned tasks in that order, which the desktop app groups by due date.
  Assignments are the module's connection `bx_tasks_assignments` (initiator the profile, content
  the task): an assignee filter joins it (`_browseRows` takes joins and restrictions on other
  tables now), and a page reads its tasks' assignees and lists in one query each
  (`getAssigneesByTasks`, `getListsByIds`). An assignee's or an author's list across contexts
  is not limited to public content (that would leave out every task in a context): its SQL keeps
  the privacy values of the tasks in contexts whose content the viewer may see
  (`BxTasksDb::getPrivacyValuesOfTasks`, then `viewableContext` per context) and, outside any,
  the site's public groups, so a page and its `next_cursor` never count a task the viewer may not
  see (a closed or secret group's), and each task still goes through the view check. Cursors are
  offsets in that order, which completing or adding a task changes: the app loads a list again
  from its first page before the next one after such a change. `POST /tasks` goes through the add form as the context's Tasks
  page fills it (its context; insert with the list, then `onPublished`: metas, the `added`
  alert, GitHub), after the level's add check, the module's contexts and the context's post
  privacy. **v2 differs:** tasks are added in contexts only, as the site's task lists hold them
  (its other add page makes one outside any, which v2 shows with `context_id` null but does not
  make). `assignee_ids` must be members of the context (its fans, as the form's suggestions);
  the viewer alone by default, as the form has it (for moderators the form's own assignee input
  is set to them, so one pass of alerts goes out). `PATCH /tasks/{id}` checks everything first,
  the edit form's checks of a new title or text included (so a refused title does not leave the
  task completed and the change logged):
  `completed` through the module's set_completed, list, priority, state, due date and assignees
  through its set_property, for who manages the task (its author, moderators, the context's
  administrators and its assignees, as `isAllowManage`; `viewer.can_complete`), title and text
  through its edit form's body display for its editors (`viewer.can_edit`). The module tells the
  assignees and the author (its `complete` and `onExpired` read the assignees the wrong way
  round, as tasks a profile of the task's id is assigned to, and are fixed on this branch to
  read the connection's initiators, as the rest of the module does) and logs every change as a
  comment of the site's robot, keeping a language key and its markers: Comments of the robot on
  a comments object that shows text its own way (`getViewText`) are given as the site shows them
  (`Eric completed the task`), not as that code, with `author` null, `automated` true (v2 only)
  and no reply, reaction, edit or delete for the viewer, as the site shows them without a header
  or actions. **v2 differs:** the site's web forms show the due date, the assignees and the state
  of a new task to moderators and administrators only (form levels 192), while its set_property
  service, which its own app client uses, lets whoever manages the task set them; v2 follows the
  service. A state the site counts as done completes the task and another reopens it, as on the
  site; completing it leaves its state as it is. Assignment, completion and expiry notifications
  stay kind `other` with their `source`. Measured with a query counter on a
  local site, a context's page costs the same for 1 task, 10 or 20 (66, 67 and 67 queries for a
  member, profile 4, 62 for a guest with 20), a page of 20 search hits 86 for the admin and 122
  for a member (18 hits): what grows is the number of different contexts on the page (a group
  module's ACL actions, invitations and admins), not its tasks. The app's Tasks tab reads every
  list's tasks in one `GET /tasks?context_id=&state=all` page and groups them by list: 24 + 67
  queries for a space with an Inbox and two lists, where a request per list cost 24 + 3 x 67.
  `/me/tasks` is 97 for a member's 9 tasks in 3 contexts (11 of them for its privacy in SQL),
  `GET /tasks/{id}` 83 (it reads the viewer's reaction, comment and delete rights),
  `GET /task-lists` 24.
  `apiV2ItemKind` makes a task's Item `task`, and `apiV2ContextContent` puts `tasks` in
  `content_kinds` of contexts the module's privacy lets tasks into.
  Types, estimates, labels, filters, counts, contexts and time (v2 only, what the site's Tasks
  page offers): a `Task` has its `type`, `estimate` (`TaskChoice` with `points`; the site's task
  list shows a point as an hour), `labels` (the site's stickers, a set; `TaskChoice` with a
  `color`), `time_spent` (seconds: the time object's sum, the task's `time` minutes) and the
  viewer's `timer` (`TaskTimer`: running or paused, what it has counted), and
  `viewer.can_track_time`. A page reads its contexts' own types and labels
  (`bx_tasks_pre_values`, `BxTasksDb::getPreValuesByContexts`) and the viewer's timers on its
  tasks in one query each. `GET /tasks/choices?context_id=` is the site's pre-lists in their
  order, a context's own active types and its labels where it has them, as its form offers them;
  a colour that is not `#hex`, `rgb()` or `rgba()` is null (the site's colour field takes any
  text). `POST /tasks` takes `type_id`, `estimate_id` and `label_ids` through the add form and a
  `state_id` with the due date; `PATCH` takes them through set_property (null clears a priority,
  a type or an estimate), and `label_ids` through the module's `setStickers`. set_property takes
  no stickers, as on master (the site edits them in its full edit form only), so the site and
  API v1 are unchanged; `BxTasksModule::setStickers` is no service, only v2 calls it, it asks
  the same manage check and logs the labels by their titles
  (`_bx_tasks_txt_msg_edit_stickers`, `_none`; module migrations `2026110900`/`2026110901`).
  Lists take `type_id`, `priority_id`, `estimate_id`, `state_id` and `label_id` (comma-separated,
  any of them), several `assignee`s and `list_id`s, `filter_id` (one of `GET /task-filters`: the
  site's saved filters its filter menu offers there, system, the context's and the viewer's own)
  and `sort` (`due`, `priority`, `created`, `updated`; open ones first in each); `GET /me/tasks`
  takes `role` (`assigned`, `created`) and the same filters. One condition builder,
  `BxTasksDb::getTasksFilterSql`, writes them for the search result's `restriction_sql`
  (`_browseRows` takes it now) and for `GET /tasks/facets` and `/me/tasks/facets`
  (`getTaskFacets`: one UNION ALL query of GROUP BYs by state, priority, type, estimate, list,
  sticker set, context and assignee), so a group header's count is the count of what the list
  shows; a saved filter keeps its own SQL (the module's condition builder, over a subquery). Across
  contexts a filter or the counts need an assignee or an author, whose tasks are read in the
  contexts the viewer may see, as before. `GET /me/task-contexts` is the site's Groups/Spaces
  menus of its Tasks page: the contexts one added or was assigned tasks in (one query over all
  kinds), whose content one may see, with their lists and counts (two more queries).
  `GET /me/timers` is My Timers; `POST /tasks/{id}/timer` `{action}` (start, pause, resume,
  clear, log) goes through `serviceProcessTimer` for who manages the task (a profile runs one timer
  at a time; logging rounds up to the minute, as on the site, and needs the time object's report
  check, as the site's Log does). `POST /tasks/{id}/time` logs minutes on a day with a note
  through the time form, as `BxTasksTime::_report` does (its table and inputs as
  `BxDolReport::_getFormObject` sets them, `putReport`, the context's budget); `GET
  /tasks/{id}/time` gives everyone's records to who passes the site's `report_view` check
  (moderators and administrators as installed) and one's own to the others, with the totals.
  Measured on the local site (profile 4 unless said): `GET /tasks?context_id=` 56 queries for 1
  task, 57 for 10, 58 with five filters; a guest's 49; `/me/tasks` 61 for 1, 73 for 9 tasks in two
  contexts; `/tasks/facets` 15, `/me/tasks/facets` 23; `/me/task-contexts` 52 for 2 contexts, 55
  for 3 (profile 65); `/me/timers` 49; `/tasks/choices` 14; `/task-filters` 16;
  `/tasks/{id}/time` 41; `GET /tasks/{id}` 63.
  Budgets (v2 only, the site's Budget page of a context: its summary block and its Budget
  table): a context's budget is time. Its entries (`bx_tasks_budget_track`, the budget form) are
  whole hours, a note, who added them and when; its total and spent time are the module's
  `bx_tasks_budget` row, in minutes: an entry adds its hours to the total, changing one changes
  it by the difference and deleting one takes its hours off, and time logged on the context's
  tasks (a timer's Log, `POST /tasks/{id}/time`, through `spendBudgetByContentId`) adds to the
  spent time. `GET /task-contexts/{id}/budget` is `TaskBudget` (`total_seconds`,
  `spent_seconds`, `remaining_seconds`, `remaining_percent` as the site's summary works it out,
  null without a total); `GET /task-contexts/{id}/budget/entries` the entries newest first
  (keyset paging, `q` on the note), `POST` there adds one and `PATCH`/`DELETE
  /task-budget-entries/{id}` change and delete one, through the site's form displays
  `bx_tasks_budget_add` and `_edit` (`hours` not 0, fewer than 0 takes hours off; the note is
  plain text, kept escaped). Only the context's administrators and the site's see a budget and
  change it, as on the site (`isAllowManageByContext`): 403 for anyone else, 404 for no such
  context (or entry) or a secret one the viewer may not know of. `TaskContext.can_view_budget`
  says where the apps show it. **UNA change:** the site's Budget table took an entry's hours
  instead of its minutes off the total when it deleted one; it takes `60 * hours` now. The
  entries table has an index on its context (module migration `2026110940`). Measured on the
  local site (profile 65): the budget 30 to 44 queries (most of them the context's summary),
  the entries 32 to 36 for 1 or 50 (their authors in one go), with `q` 32; `/me/task-contexts`
  takes one more query per context for a member (the context's `is_admin`).
- Polls (tag `polls`, `BxPollsApiV2` on the text base, only while the Polls module is enabled),
  in `Poll` (`id`, `content_id`, `question`, `options[{id, title, votes}]`, `voters`,
  `hidden_results`, `results_visible`, `viewer{voted, can_vote}`) and `PollVote{option_id}`. A
  poll is an entry of the module: its text is the question (`question` as plain text,
  `text_html` on single answers), its subentries the answers in their order. **v2 differs:** a
  poll is not put on another item: `POST /polls`
  takes `NewPoll` (2 to 10 answers, none empty or given twice, `hidden_results`) with an
  `audience` or a `context_id`, through the site's poll form (its category, its default for
  keeping who voted for what from others); `content_id` is the Item that shows the poll (its
  comments and reactions are the poll's), null when the Timeline shows none; v2 adds `module`, `image` (the picture its author chose, as the module's copies),
  `author`, `audience`, `context_id`, `state`, `moderation`, `stats`, `url`, the dates and
  `viewer.can_delete`; `votes` is null while results are hidden.
  Answers: the module takes **one answer per voter**, never changed or taken back: the answer's
  vote object (`bx_polls_subentries`) has IsUndo off and its isPerformed covers every answer of
  the poll. `PUT /polls/{id}/vote` goes through that vote
  object (its ACL check `vote entry`, counters, alerts and socket event) and answers the poll
  with the vote counted; 409 `already_voted` for a second vote (the same answer too), 409
  `not_open` for a poll that is pending, hidden or rejected (its author and moderators still
  see it; `viewer.can_vote` is false there, as the site shows no vote form), 422
  `unknown_option` for an answer of another poll, 403 for a level that may not vote. Results are
  shown as the site's results block decides: to everyone, or only to who has voted when the
  poll hides them (`voters` is always given). Guests get `viewer` null and vote on the site.
  `GET /polls` (`sort`, `author`, `context`) and `GET /search/polls` are v2's, for the Polls of
  a profile's or a context's page (the module lists its polls on both). A page reads its
  answers and the viewer's votes in one query each (`BxPollsDb::getSubentriesByEntries`,
  `getPerformedValuesByEntries`) and its rows at once (`getContentInfoByIds` with the salt the
  module's `getContentInfoById` adds, so the base reads them in one query). The feeds' Item of a
  poll has `kind` `poll` and `Item.poll` (left out on other items): the Timeline reads the Polls of a page at once through the hook `apiV2ItemPolls`, and
  `Item.version` changes with a vote (a poll's view count is left out of it). `Poll` is in
  `BxDolApiV2Map::pollSchemas()`, which the Timeline's schemas give too, since `Item` names it
  on a site without Polls. Measured with a query counter on a local site, a page
  of 20 polls is 48 queries for a member (profile 4), 45 for the admin and 39 for a guest;
  `GET /polls/{id}` 65 (the view count, the viewer's reaction, favourite and comment rights).
  `apiV2ItemKind` makes a poll's Item `poll`, and `apiV2ContextContent` puts `polls` in
  `content_kinds` of contexts the module's privacy lets polls into.
- Posts (tag `posts`, `BxPostsApiV2` on the text base, only while the Posts module is enabled),
  in `Post`, `NewPost`, `PostChanges` and `PostCategory`: `GET /posts` listPosts
  (`sort` recent, updated, popular, top or featured, `author`, `context`, `category`), `GET /posts/{id}`
  getPost, `POST /posts` createPost, `PATCH /posts/{id}` updatePost, `DELETE /posts/{id}`
  deletePost, `GET /me/posts` listMyPosts and `GET /posts/categories` listPostCategories, plus
  v2's `GET /search/posts`. A post is an entry of the module: `title` (3 to 160 characters, as
  its form takes it), `summary` (the abstract its author wrote, else the start of the text),
  `body_html`, its `category`, `cover` (the module's preview, gallery and cover copies; the
  original to its owner only) and who sees it. Its comments and reactions are those of its Item
  (`content_id`), and the feeds' Item of a post names it (`Item.entry_id`). Writing goes through
  the site's post form after its add and edit checks: a cover is an upload of purpose
  `post_cover` (the module's cover storage) that the form's cover field and thumb choice take;
  `category_id` is one the form offers, required where the form requires a category (422
  `required` without one, as on this site); `audience` or `context_id` as on the other text
  modules. Every value an edit saves goes through the db pass of its form input first (the site's
  HTML filter for `body_html`): the module's edit hands values to the form's update as they are.
  `comments_enabled` false needs the form's switch to be visible to the viewer's level, not only
  present in the form. Link previews are of http and https links only. **v2 differs:** the site keeps no drafts and no revisions (`revision`
  is always 1; `/me/posts` lists every state of one's own posts without `state`, and `draft` and `deleted` give an empty page); a post is published at once
  (`status` other than `published` and `publish_at` are 422: the site's form schedules for
  administrators only), but a post scheduled on the site is `scheduled` with its `publish_at`
  (the module's `awaiting` with a time to come) and seen by its author only; photos, videos,
  polls and anonymous posts are added on the site (`media_ids`, `poll` and `anonymous` are not
  taken, and the cover changes on the site); `comments_enabled` changes only where the site's
  form offers it to the viewer (administrators: form levels 192); `slug` is the category's value
  (the site keeps none); `poll` is always null; and in lists `body_html` is null and
  `media` and `links` are empty (single answers read the attached photos and videos and the
  link previews, one query per storage). An anonymous post names its author to its author only.
  A page reads its covers' rows and copies at once and its categories from the site's cached
  list (the add form only for writing and `GET /posts/categories`), so its cost does not grow
  with the page: measured with a query counter on a local site, a page of 20
  posts is 47 queries for a member (profile 4), 43 for the admin and 39 for a guest (5 posts:
  47 too); `GET /posts/{id}` 65 (the view count, two photos' storages, the links, the viewer's
  reaction, favourite and comment rights); `/me/posts` 59 for 4 posts; `GET /search/posts` 85
  for 20 hits. `apiV2ItemKind` makes a post's Item `post`, and `apiV2ContextContent` puts `posts`
  in `content_kinds` of contexts the module's privacy lets posts into.
- The text and files bases. `BxBaseModTextApiV2` (modules/base/text) holds what a text module's
  endpoints share: its search result in any mode with a stable order and more restrictions
  and joins (`_browseRows`), a page's visible rows read at once (`_visibleContents`), keyword search
  pages, the id and context checks, posting into a context, an entry that exists for the viewer
  (404 for a hidden one or one whose context is gone), the view check and counting a view,
  deleting through the module with its ACL counter, the audience of a privacy value, the
  entry's url and Item, form errors by a field map, and the hooks `apiV2ItemKind`,
  `apiV2ModuleInfo` and `apiV2ContextContent` from its `API_TAG` and `API_KIND`; its problems
  name the module's noun (`API_NOUN`). It also holds the lists (`_list`: the sorts, author
  and context), single answers (`_get`), search pages (`_search`), edits through the module's
  edit form (`_update`), adding through its add form (`_add`, `_withPost`), taking an upload
  (`_takeUpload`, `apiV2UploadAllowed`: who may add one), ContentState and Moderation,
  the viewer's ItemViewer (`_itemViewer`) and a page's priming (`_items`: Items, SEO links and
  authors at once, `_primeMedia` for the module's files) of a module whose class maps its rows
  to its own shape (`_item`); a single answer is a page of one (`_one`). Discussions use its
  checks, Albums all of it (Album). Audiences: a new entry or a `PATCH` may have only an
  audience whose privacy group the site has turned on (Studio > Privacy: `members` is off on a
  default install, and an entry for members only was seen by nobody but its author); another
  one is 422 on `audience` (`_privacyOf`), and `GET /api/v2` lists those it offers in each
  text module's `ModuleInfo.audiences`, from which the desktop app builds its choice. A
  `PATCH` of what an entry already is (its audience unchanged) answers 200: the module's edit
  says it failed when no row changes, so such values are left out.
  `BxBaseModFilesApiV2` (modules/base/files) adds FileItem (`_item`, `fileSchemas()`,
  which Albums' items use too); a module's class says how its media are read (`_media`,
  `_primeMedia`) and makes its own `POST` (one entry per upload: `_createFromUploads`). Videos, Photos and Files are on it.
- Conversations (tag `conversations`, `BxCnvApiV2`, only while the Conversations module is
  enabled) exist only for those in them: for anyone else, guests too, a conversation and every
  path under it is 404. A conversation's first message is its `body` and `media`; replies are
  the module's comments. `GET /conversations/{id}/messages` is newest first: the first page
  holds the newest replies, each next page those before it, by a keyset cursor (the comment id;
  the comments query's `before` key, `BxDolCmtsQuery::getComments`), so replies that come while
  someone reads older pages shift nothing; `before` (a message id) starts a page before a
  message a client knows. Ordered by date and then id, so replies of one second keep their
  order. `Conversation.last_message` (v2 only) is the newest
  message for a list row: the newest reply the viewer may see (the highest comment id, so a
  deleted last reply leaves the one before it), or the first message when there are none.
  "May see" is what `GET /conversations/{id}/messages` lists to that viewer: a reply waiting for
  approval or hidden by a moderator counts only for its author and for moderators, one by an
  inactive profile only when it has replies, and the content filter applies. Its `created_at`
  is the row's time: `last_reply_at` keeps a deleted reply's time and orders the inbox.
  Its `text` is plain text in one line, cut to 200 characters (multibyte-safe, with an ellipsis), "" for a message
  without text; `has_media` and `media_kind` (`photo` when all its files are images, `file`
  otherwise) say what it carries instead; `by` is who wrote it, the viewer too. The inbox reads
  the newest replies of a page, with their files counted, in one query
  (`BxCnvDb::getLastReplies`). A new message changes it; clients see that by reading the inbox
  again (the desktop app does when GET /sync's `messages` badge changes, and every 30 s).
  `Conversation.unread` counts the messages the viewer has not read, the first one too
  (the newest that many are unread); `POST /conversations/{id}/read` reads them all and
  `DELETE` marks it unread again (the module's `markUnread`; one unread already, as a
  conversation just received is, answers 204 too, though `markUnread` reports an error when
  its update changes no row). Photos: `POST /uploads` with
  `purpose` `message` (a reply's, stored where the site's reply form puts them: the comments
  object's storage, `sys_cmts_images`, and linked to the comment as `BxBaseCmtsForm` does) or
  `conversation` (the first message's: the module's own `bx_convos_files`, taken by its add
  form's `processFiles`), then `media_ids` on `NewMessage` or `NewConversation`, in display
  order; the storage's checks apply (photos only, 415 for a video; a purpose the site has no
  storage for is 422 on `purpose`), an upload of another
  purpose, someone else's or one taken already is 422 on `media_ids[i]`, and the site still
  needs text with every message. Who may upload is who may start a conversation, or post
  replies (the comments' `comments post` action). These uploads are private files, as a
  post's: their links carry a token. `POST /conversations/{id}/participants` adds people, only
  for who started it where the site lets them edit it (`can_add_participants`; the site's edit
  form has the recipients for the author only), through the edit form's own
  `updateParticipants` with the author's own folder, as its `update` passes, so those the viewer
  may not contact are left out (422 when that leaves nobody new). `updateParticipants` now
  leaves those in it already alone: before, each one whose row was in another folder (Trash,
  Spam) got a second row in the given folder, unread again, through `conversationToFolder`'s
  INSERT IGNORE on (collaborator, folder, conversation), on the site's edit form too; `DELETE /conversations/{id}/participants/{profile_id}` with one's own id leaves
  (`can_leave`, the module's delete check; the conversation goes for good, as deleting it from
  the trash does on the site, and with the last one out it is deleted), with another's id it
  takes them out (who started it only). As on the site, a reply brings who started it back in.
  `PATCH /conversations/{id}/messages/{message_id}` (`MessageChanges{body}`, HTML) edits a reply
  through the comment form, as the site's edit does, for its author only and only where the
  module's own edit check lets them (`BxCnvCmts::isEditAllowed`: administrators alone on a site
  as installed, so for everyone else it is 403 and `Message.can_edit` false); its photos stay,
  and the first message, which is the conversation's own text, is not edited here.
  Recipients for a new conversation are found with `GET /search/profiles`; those the viewer may
  not contact are left out when it starts (422 when nobody is left). `POST /uploads` purposes
  of other modules come from endpoint classes that define `apiV2UploadStorages()` and
  `apiV2UploadAllowed($sPurpose)` (`BxDolApiV2Router::hooks`).
- Discussions (tag `discussions`, `BxForumApiV2`, only while the Discussions module, bx_forum,
  is enabled). A `Discussion` is an entry of the module: `title` (text as typed, a `<`
  included), `body` (plain text) and `body_html` (the site's HTML), `summary` (the start of the
  text, for lists), `author` (null for an anonymous one), `category`, `audience` (`public`,
  `members`, `friends`, `context` with `context_id` for one in a group, `private` for the
  author only or another privacy), `stats` (`replies`, `views`), `sticky`, `locked`,
  `resolved` (null unless it is a question), `last_reply_at` and `last_reply_by` (null without
  replies) and `viewer` (`can_edit`, `can_edit_text`, `can_delete`, `can_reply`; null for
  guests). Its replies are not a shape of their own: they are the module's comments, which the
  Timeline shows on the Item the discussion was added with, so `content_id` is that Item and
  `GET`/`POST /content/{content_id}/comments`, `/comments/{id}/replies`, `PATCH` and `DELETE
  /comments/{id}` and the reaction endpoints work as for a post (a locked discussion refuses
  replies: the module's comments say so). A discussion the Timeline shows nothing for has a
  null `content_id`, and its replies are on the site only. `GET /discussions` is the module's
  browse list (its search result: active entries, its privacy conditions, without the
  request's own params), most recently replied to first (`sort=latest`, the module's
  `lr_timestamp`; `sort=new` by when it started), the id breaking ties, each one through the
  module's view check, so a page can be short; `category` keeps one category, `context_id` one
  group's discussions (403 when the viewer may not see that group's content). As on the site,
  discussions in groups are not in the list without `context_id`. `GET /discussions/categories`
  is what the add form offers (`DiscussionCategories{categories, can_create}`). `GET
  /discussions/{id}` counts a view, as the site's page does (once a day per viewer); one that
  is hidden or waits for approval is 404 to all but its author, moderators and the admins of
  its group (`isEntryActive`), one the viewer may not see 403. `POST /discussions` goes through
  the module's own add (`entity_add`: the form's checkers, its alerts, the Timeline item, the
  author's subscription) after `checkAllowedAdd`, whose ACL action it then counts; `body` is
  plain text, one paragraph per line; `context_id` needs the group's post privacy
  (`checkAllowedPostInProfile` for bx_forum) and the module's own `check_allowed_add_in_context`,
  and is never sent with `audience` (422). `body_html` instead of `body` is the text as the
  site's editor writes it (formatting, lists, quotes, code, links, mentions, hashtags, pictures),
  which the add form filters and indexes as one from the site; one of them, with some text in
  it. `PATCH` changes `title`, `body` or `body_html`, and `category_id` through `edit_entity`
  after `checkAllowedEdit` (one's own, moderators, the group's admins); a plain-text `body`
  for a text with links, mentions or formatting is 409 `formatted_text`, as comments are, and
  `body_html` replaces it. `DELETE` is the module's delete (its replies and its Timeline item go with it) after
  `checkAllowedDelete`. `GET /search/discussions` is the module's keyword search (its
  searchable fields: the title, the text and the replies' text by default) through the same
  merge as `/search/content`, newest first, each hit through the view check. The module keeps
  no per-viewer read state (its views are counted at most once a day), so there is no unread
  flag. List and search items are whole `Discussion`s, their text included (`body`,
  `body_html`): a client shows an opened one from the list at once and then refreshes it, so
  there is no separate list shape; rows that need less read `summary`. `viewer.can_reply` is
  the module's comment check (false for a locked one, and while the Timeline shows no Item for
  it). A discussion in a group that was deleted (deleting a group leaves its discussions,
  their privacy still the group's id) is 404 to everyone and in no list.
- Pages: `GET /layout/resolve?path=&platform=` (`resolvePage`: `ResolvedPage`
  with `layout`, `cells` and `ResolvedBlock`s with `kind`, `endpoint`, `paged` and a
  `BlockDesign`) is the page a path on the site shows, as Studio's Pages builder sets it up
  (`BxBaseApiV2Layout`). `/` is the home page (`sys_home`, what the site shows at its root to
  guests and members), `/page/<uri>`, `/<uri>` and `page.php?i=<uri>` (or an SEO rewrite) any
  other page; the query's other values are the page's `params`. A page the viewer's level may
  not see is 404. The layout comes from the page's layout columns (`sys_pages_layout_columns`):
  the center column is `main` (the left one where there is none), a column beside it `side`, or
  `left` and `right` in `three_columns`; UNA's full-width rows are the cells `top` and `bottom`
  (v2 only). Its blocks are those of `sys_pages_blocks` in a cell (not cell 0) that are on in the
  apps (`active_api`, "Active in API"), visible to the viewer's level, of enabled modules (the
  block's and its service call's), in their order. A block is given only when the API feeds it:
  a service block whose call an endpoint class maps (`apiV2PageBlock($aCall, $aContext)`: the
  call's module, method, params and class, and the page's object, viewer, params and cell;
  answering `kind`, `endpoint`, `query` and maybe `module`), to a GET route this site serves,
  to guests only when it takes them, with a query of the parameters the route declares (enum
  values among its values). Paged routes outside `main` get `limit=5` unless the block says
  (its `per_page`). A text block written in Studio, a language string (`lang`: the site's About,
  Terms and Privacy pages) or HTML (`html`), is `text.html`, its content read from
  `GET /layout/blocks/{id}/text` (`getBlockText`, `BlockText{id, title, html}`: the language
  string or the HTML with the site's markers, `{site_title}` and the like, and macros filled in,
  as the site's page shows it; 404 for a block that is no text block on in the apps, or one on a
  page or for a level the viewer may not see; a client sanitizes the HTML as it does a post's).
  Raw code, forms and calls or menus no class maps are left out. "Hidden on" is
  `design.hidden_on` (`phone`, `tablet`, `desktop`, `mobile-app`), and the title's, background's
  and padding's (for parts the block's design box has: `design.frame`); a block hidden on every
  screen of the platform is left out (web and `desktop`: the three widths; `native`: the mobile
  app). Blocks carry no `data` or `error` (the client reads `endpoint`,
  under the API's base), there is no `splash`, `title_key` is null (titles are translated),
  `uri` is the page's path, `module` names who feeds a block and `platform` takes `desktop`.
  The kinds: Timeline's feed blocks are `timeline.public` (Home's public feed), `timeline.home`,
  `timeline.hot`, `timeline.for_you` and `timeline.profile` (on a page with `profile_id`), and
  the Create Post block `timeline.compose` (no endpoint); the system's Friends of the viewer
  `graph.friends`, Friend Suggestions `graph.friend_suggestions`, Who to Follow
  `graph.follow_suggestions`; a text or files module's Recent, Updated, Popular, Top and
  Featured blocks `<tag>.list` with that `sort` (Featured Posts is `/posts?sort=featured`),
  where its list takes it; a context module's newest `<tag>.list` and the viewer's own
  `<tag>.joined` (`/me/groups`), Events' upcoming and past `events.list` and the viewer's
  `events.joined`. Resolving costs a few queries (the page's blocks in one, the rest cached).
  Paths also take the site's SEO links of a page with a value (`/view-persons-profile/lily-carter`,
  a profile's `url`): the link's value becomes the page's param (`id`), as the site reads it.
  Menu blocks are mapped too (the call is `menu`, the menu object): a text module's Categories
  (`<module>_categories`) is `<tag>.categories`, `/<tag>/categories?counts=true` (Posts
  Categories `posts.categories`, Discussions Categories `discussions.categories`: each category
  with `count`, as the site's block counts them, in one query; a client links each to
  `/<tag>?category=<id>`). On a profile's or context's page (its `profile_id`, or its module's
  content `id`: `BxBaseApiV2Layout::pageProfileId`), Info is `profile.info`
  (`GET /profiles/{id}/info`, v2 only: `ProfileInfo{fields: InfoField[]}`, the module's view
  form as the site's Info block shows it to the viewer, without the name, files, maps and custom
  rows; `value` is the site's text and `datetime` a date field's moment), a person's or an
  organization's Friends `graph.friends` of that profile, a group's or space's Members
  `groups.members` and `spaces.members` (`/{tag}/{id}/members`), an event's Participants
  `events.members` (`/events/{id}/attendees`), and its timeline `timeline.profile`.
  Featured Discussions is `discussions.list` with `sort=featured` (GET /discussions takes
  `featured`: featured ones, the last featured first). Admins, locations, calendars and menus of
  other modules are not mapped yet and are left out. API v2 has no page defaults of its own: it
  changes no row of `sys_pages_blocks` or `sys_objects_page` in install SQL or migrations, so a
  block is in the cell and on the screens the site's page has it, and an owner moves or hides it
  in Studio > Pages. As installed: a person's and an organization's Friends is in the main
  column and shows on every screen (so its route has no `limit`), a group's and space's Members
  and an event's Participants show on every screen, and Featured Posts and Featured Discussions
  are off in the apps (the apps list the latest entries).
- Navigation: `GET /navigation?platform=` (`getNavigation`, v2 only: `Navigation{menu, platform,
  groups: NavigationGroup[], footer: NavigationItem[]}`) is the apps' sidebar and footer links, built from the site's Apps Sidebar menu
  (`sys_apps_sidebar`, a menu of the apps' own: `BxBaseApiV2Navigation`). Guests get the groups guests may see. Each group is a top-level
  item of that menu (`kind` `items`, `profile` or `followings`); each `NavigationItem` has a
  stable `id` (`<set>:<module>:<name>`), `title`, a Lucide `icon`, the site `link`, `counter`,
  `target` (`NavigationTarget{kind: section|profile|context|page, section, view, id, module,
  path}`), its submenu as `tabs`, and in `followings` the followed `contexts`
  (`NavigationContext{id, kind, module, display_name, avatar}`). `footer` is the site's footer
  menu's items for the apps. How it is built and edited: "Navigation: how the apps' sidebar is
  built and edited in Studio" below.
- Agents (`BxBaseApiV2Agents`, tag `agents`, v2 only): the site's AI agents (core `BxDolAi*`,
  Studio > Agents) the viewer may chat with, the viewer's chats with them, and a turn with the
  reply streamed. Through the classes the site's chat widget (`sys-ai-chat/{id}`,
  `BxDolAiTriggerChat`) uses, so its rules hold.
  - `GET /agents` (`listAgents`, guests too): `AgentList{items: Agent[], default_id}`. An agent is
    listed when it is active, meant for people (trigger `manual` or `message`) and the viewer may
    interact with it (`BxDolAi::canChatDirectly`: its "Visible for" levels, `acl_levels`;
    administrators may talk to every one). `Agent{id, name, title, description, icon, operator,
    default, max_input_chars}`. `default_id` is the operator agent
    (`sys_agents_operator_agent`) when the viewer may talk to it, else the first, else null: a
    client then shows no agent chat. Queries: a guest 3, a member 5 or 6.
  - `GET /agents/{id}/chats` (`listAgentChats`): the viewer's own chats with the agent
    (`BxDolAiChat::listOwnAgentChatThreads`), the latest first, at most 50, as
    `AgentChat{id, title, preview, status: open|closed, closed_reason, messages_count,
    created_at, updated_at}`. `id` is the chat's nonce (`?chat=` of the site's widget, 8 to 64
    of `A-Za-z0-9_-`), or `default` for the thread the widget talks to before a New chat. Chats
    in a context (a group's agent block) are the site's and left out. 9 queries.
  - `POST /agents/{id}/chats` (`createAgentChat`): a new empty chat (a new nonce; its history row
    at once, as the widget's New chat), 201 with its `Location`.
  - `GET /agents/{id}/chats/{chat}` (`getAgentChat`): `AgentChatThread{chat, messages:
    AgentMessage[]}`, oldest first, `AgentMessage{id, role: user|assistant, text, html}`: the
    agent's Markdown as written and as HTML (Parsedown in safe mode, as an agent's reply becomes
    a Messenger message), the person's text as paragraphs; tool results and the hidden bootstrap
    turns are left out. A chat that is not the viewer's (another's nonce) is 404. 10 queries.
  - `POST /agents/{id}/chats/{chat}/messages` (`sendAgentMessage`, `NewAgentMessage{text}`, at
    most the agent's `max_input_chars`, 8000 without): the turn, through
    `BxDolAiTriggerChat::streamTo` (the session and turn limits, the input limit, the history,
    the agent's tools), answered as Server-Sent Events while the agent writes
    (`text/event-stream`; the spec's `sse:AgentEvent` response). Each event is `data: <JSON>`, an
    AG-UI event (`AgentEvent{type, ...}`), the ones the site's widget reads: `RUN_STARTED`,
    `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT` (`delta`: the next piece of Markdown),
    `TEXT_MESSAGE_END`, tool calls, `CUSTOM` `chat_actions` (buttons) and `chat_session`
    (`value.closed`), then `RUN_FINISHED`, or `RUN_ERROR` with `message` (no model set up, the
    model failed, a limit). Closing the connection stops the reply. A chat not started yet is
    started by its first message.
  - Guests get the agents their level may talk to; the chat routes need a sign-in (401): v2 keeps
    no guest session that a guest's chat would belong to.
  - Streaming in v2: an endpoint returns `BxDolApiV2Response::stream(function ($fWrite) {...})`;
    the router sends its headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache,
    no-transform`, `X-Accel-Buffering: no`), then each piece the writer gets, flushed at once with
    no output buffer or compression. It has no ETag and is never kept for an `Idempotency-Key`
    (the key is let go). The stream reports its own errors: the status is out by then.
- Caching: a JSON answer of 200 to GET (or HEAD) of at most 1 MiB carries a weak
  `ETag: W/"<hex>"` (32 hex digits of the body's SHA-256) and `Cache-Control: private, no-cache`,
  for guests too, with `Vary: Authorization, Cookie, Accept-Language, Origin` (texts are in the
  viewer's language, the CORS headers follow the request's origin).
  `If-None-Match` is compared weakly (`W/` ignored on both sides) and may be a list or `*`; a
  match is 304 with no body and no Content-Type, its ETag, Cache-Control and Vary kept.
  Problems, writes, other statuses and larger bodies carry no ETag
  (`BxDolApiV2Router::answer`, `etagMatches`).
- `Idempotency-Key` (`BxDolApiV2Idempotency`): a signed-in POST,
  PUT, PATCH or DELETE with the header is recorded in `sys_api_idempotency` by credential (the
  sha256 of the bearer token or of the session cookie, so a key belongs to the session that
  sent it) and key before it runs, with a fingerprint (sha256 of method, path, query and raw
  body). A repeat with the same request gets the stored answer again, status, its headers
  (Content-Type, Location, ETag, Cache-Control, Vary, Retry-After, WWW-Authenticate) and body,
  with `Idempotent-Replayed: true`; the same key with another request
  is 422 `idempotency_key_reused`; one while the first still runs is 409
  `idempotency_in_progress` with `Retry-After: 1`, however long the first runs: it holds a
  named lock on its key in the database (`GET_LOCK`), which the server lets go when the
  request's connection ends, and which the request lets go itself when it ends in any way PHP
  can see. A claim left pending for a minute whose lock is free (a
  request that died) runs again; the first request, should it end after that, changes nothing
  (its answer is kept, or its key let go, only while the claim is still its own). A key is 1 to
  255 visible ASCII characters (400 `invalid_idempotency_key` otherwise, checked only where a
  key is used: a guest's or an upload's bad key is ignored like any other). Answers of 5xx, 408, 409, 425 and 429, answers that set
  a cookie and answers over 1 MiB are not kept, and the key is let go, so a retry runs; other
  problems (403, 404, 422) are kept like any answer. Guests' keys and multipart requests
  (`POST /uploads`) are ignored. Keys last a day: `BxDolCronPruning` deletes older ones. The
  spec lists the header as the `idempotencyKey` parameter of every signed-in write. CORS allows
  the header and exposes `Idempotent-Replayed`. The desktop app sends no key yet, since it does
  not retry writes.
- Requests are rate limited: one over its limit is 429 `rate_limited` with `Retry-After`. See
  "Rate limits" below.
- CORS names the request's origin back (`Access-Control-Allow-Origin: <origin>`, never `*`,
  with `Vary: Origin`) when it is an allowed one, and never allows credentials, so a cookie
  session stays same-site. Allowed (`BxDolApiV2Router::corsOrigin`): the site's own origin, the
  origins listed in Studio > API > Origins (`sys_api_origins`: a web app of another origin that
  calls the API with a bearer token is added there), the desktop app's page
  (`tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`) and a page served
  from the same computer (`localhost`, `127.0.0.1`, `[::1]`, any port: an app in development).
  A page of any other origin gets no CORS header, so its browser keeps the answer from it; a
  preflight is 204 either way. Clients that are not pages in a browser (the desktop app, whose
  requests go out from Rust, servers, scripts, mobile apps) send no `Origin` and are not
  affected. Only while the API and API v2 are on: with either off no CORS header is sent and
  OPTIONS is a 503 like any other method.

## Navigation: how the apps' sidebar is built and edited in Studio

`GET /navigation` gives the apps their sidebar from UNA's menus, so a site owner edits it in
Studio and the desktop app follows. The code: `template/scripts/BxBaseApiV2Navigation.php` (the
route, the target rules, the cache) and `BxBaseMenu::getMenuItemsForApps()` with its versions in
`BxBaseMenuAppsSidebar` and `BxBaseMenuProfileFollowings` (the menus' own checks). The desktop app
draws it in `neo/desktop/src/shell/sidebar-navigation.tsx` (its README says how, "Sidebar").

### The apps' sidebar has menus of its own

The sidebar is not built from the menus the site and API v1 use. The site menu (`sys_site`), the
member menu (`sys_profile_stats`) and the Site Panel (`sys_site_panel`) are what the site draws
and what NEO reads through API v1 (`system/get_menu`, the profile menu block); API v2 adds no
item to them and changes none, so a site with API v2 on shows there what it shows with it off.
What the sidebar needs beyond them is in three menus that nothing else reads:

- **Apps Sidebar** (`sys_apps_sidebar`, `BxTemplMenuAppsSidebar`): the sidebar's groups.
- **Apps Menu** (`sys_apps_menu`, `BxTemplMenuAppsMenu`): its first group, one's main places.
- **Profile Memberships** (`sys_profile_memberships`, `BxTemplMenuProfileMemberships`): the
  contexts one belongs to.

The site menu is read too, as the Browse group, as the site has it: what is "Active in apps"
there is what NEO shows, and the desktop app shows the same.

### Where to edit it

Studio > Navigation (`studio/builder_menu.php`), menu **Apps Sidebar** (`sys_apps_sidebar`, set
`sys_apps_sidebar`). Each of its top-level items is a group of the apps' sidebar, in its order:

| Sidebar item | Group `kind` | Its items come from | Edit them in Studio > Navigation |
| --- | --- | --- | --- |
| Member Avatar (`member-avatar`) | `profile` | the viewer | (no items) |
| Apps Menu (`apps-menu`) | `items` (no heading) | menu `sys_apps_menu` | Apps Menu: Home, Explore, Profile, Messages (Conversations' item, or Messenger's while Messenger is enabled), Notifications, Connections, with their counters. Home and Explore are for guests too |
| Public Menu (`public-menu`) | `items` (headed Browse) | menu `sys_site_in_panel`, which reads set `sys_site` (the site menu) | Site Menu, as the site and NEO have it: Home, each module's home (People, Posts, Groups, Discussions, Events, Photos, Videos, Spaces, Tasks ...), About; Log in and Sign up for guests |
| Member Menu (`member-menu`) | `items` | menu `sys_profile_stats` | Profile Stats, the site's member menu, as the site and NEO have it. Off in the apps as installed |
| Member Memberships (`member-memberships`) | `followings` | menu `sys_profile_memberships` (`BxTemplMenuProfileMemberships`) | Profile Memberships: an item per context module, titled for the apps' sidebar (Your friends, Your organizations, Your groups, Your events, Your spaces, Your courses); its contexts are those the viewer belongs to: the module's confirmed members (its `OBJECT_CONNECTIONS`, `bx_groups_fans` ...), or friends (`sys_profiles_friends`) for a module without one; one's own groups are among them, as their author is their first member; the newest first, at most 10 a module, `more_contexts` when there are more, `all_target` where all of them open (All your groups: the module's section at `joined`; All your friends: People at `friends`, the section of Persons' tag `persons`; Connections at `friends` on a site whose Persons has no API) |
| Member Following (`member-followings`) | `followings` (headed Following) | menu `sys_profile_followings` (`BxTemplMenuProfileFollowings`) | Profile Following: the same, with the contexts the viewer follows (`sys_profiles_subscriptions`). Off in the apps as installed |

As installed the order is Member Avatar, Apps Menu, Public Menu, Member Menu, Member Following,
Member Memberships. An owner turns a group on or off with the item's "Active in apps", reorders
the groups, or adds an item with another menu as its submenu. An edit to Apps Sidebar or Apps Menu changes the apps'
sidebar only. An edit to the site menu or to Profile Stats changes the site and NEO as well.

A top-level item of another submenu is a group of that menu's items; one without a submenu but
with a link is a group of that one item.

The apps' footer bar is `footer`: menu **Footer** (`sys_footer`, set `sys_footer`,
`BxTemplMenuFooter`), its items active in the apps, by the same rules as the sidebar's (below)
and in its order. About, Terms and Privacy are pages of the site whose blocks are language
strings, so they open in the apps as those pages (`target` `page`, drawn from their text
blocks); a link elsewhere has only its `link`; an item that is text on the site (the copyright
notice "(c) 2026 Site. All rights reserved.", or a line the owner adds with no link) has its
words as `title` and neither. The footer's tools (`BxBaseMenuFooter::TOOLS`: language,
template, colour scheme, sounds, Powered by) are the site's and left out; the apps have their
own. It is kept as the sidebar's menus are (per membership level).

A group's heading is the sidebar item's Title (Studio > Navigation > Apps Sidebar, the item's
Title; an empty Title draws no heading). As installed the first section is the Apps Menu, one's
main places, with no heading: Home, Explore, Profile, Messages, Notifications and Connections;
the site menu follows as the discovery section, headed Browse (an app shows a place once, so the
site menu's own Home is not repeated). Member Memberships has none: each of its modules is a
section of its own, under its item's title (Your friends, Your groups ...), edited in Studio >
Navigation > Profile Memberships, where a module's item is turned off for the apps with "Active
in apps".

The site's member menu (Member Menu, Profile Stats) is off in the apps' sidebar as installed:
most of its items open what the Browse group already opens (one's own posts, albums, groups ...
are each section's Mine or Joined view; Following and Followers are Connections' tabs). An owner
who wants it in the apps turns the Apps Sidebar's Member Menu item on; which of its items show
is then Profile Stats' own "Active in apps", the same switch NEO follows.

### What decides an item

The menu classes decide, as for the site's own menus (`getMenuItemsForApps()` is getCodeAPI()'s
API mode, so a class's own `_isVisible()` and `_getMenuItem()` apply):

- **Active in apps** (`active_api`): off leaves the item, or a whole group, out. "Active"
  (`active`) is the site's only; the site draws neither Apps Sidebar nor Apps Menu, so there it
  does nothing.
- **Visible for** (`visible_for_levels`): the viewer's membership level; guests are level 1.
- **Custom visibility** (`visibility_custom`): the item's service call (Friend requests only
  where friends are on, for example).
- **Hidden on** (`hidden_on`): an item hidden on the platform's screen is left out: `desktop`
  for the desktop app (`platform=desktop-app`), `mobile-app` for `native`, all three web screens
  for `web`. `hidden_on` lists the screens the others are hidden on, for a client that follows
  its width.
- **Order**: Studio's order.
- **Title**: in the viewer's language, plain text. An item without one is left out.
- **Icon**: a Font Awesome name (`file-alt`) or a Lucide one; `icon` is the Lucide name the
  site's Lucide set draws (`BxBaseIconsetLucide::getLucideName`), null for an image or HTML.
- **Link** and markers: `{member_id}`, `{member_url}` and the menu's other markers are
  replaced, and `link` is absolute; a script (`javascript:`) has none.
- **Addon**: the counter, where the menu shows counters (the Apps Menu, the Member Menu):
  `counter` is read for the viewer (kept 60 seconds for a menu kept per profile). The site menu
  shows none. The apps' live unread counts come from GET /sync.
- **Submenu**: an item's submenu (a module's Latest, Popular ...) is its `tabs`, one level.
- **Config API** (`config_api`): `config` (`{"button":true}` for Log in and Sign up).

### Where an item opens: `target`

`BxBaseApiV2Navigation::target()` is the one place that decides it, in this order:

1. The endpoint classes' `apiV2NavigationTarget(array $aItem, array $aPage)` hook, the class of
   the item's module first (`BxDolApiV2Router::hooks`). `$aItem` has `module`, `name`, `set`,
   `link`, `link_code` (the link as Studio has it) and `viewer_id`; `$aPage` is the site page
   the link is (`path`, `uri`, `params`, `module`, `object`, `fragment`), or [] for none. It
   answers `['kind' => 'section'|'profile'|'context'|'page', 'section' => ..., 'view' => ...,
   'id' => ..., 'module' => ...]`, or null. The system's own (in `BxBaseApiV2Navigation`): the
   home page is `home`, `explore` is `explore`, `friend-suggestions` is `connections`, and a
   profile module's friends, friend requests and following pages of one's own (`profile_id` the
   viewer) are `connections` at `friends`, `requests`, `following` or `followers`.
   Notifications (`BxNtfsApiV2`) answers `notifications` for its page, Conversations
   (`BxCnvApiV2`) `conversations` for its folders, Persons (`BxPersonsApiV2`) `persons` at
   `recent`, `active` or `online` for its People pages (`persons-home` and its submenu's
   `persons-active`, `persons-online`).
2. A profile's or a context's page (its module's `URI_VIEW_ENTRY`, by id or SEO link): that
   profile (`profile`; `context` for a group, space or event).
3. A page of a module with an API (its `apiV2ModuleInfo()` tag): the section of that tag, at the
   view the page is by the module's config: `URL_HOME` (none), `URL_POPULAR` (`popular`),
   `URL_NEW` (`new`), `URI_AUTHOR_ENTRIES` (`mine`), `URI_JOINED_ENTRIES` (`joined`),
   `URI_FOLLOWED_ENTRIES` (`followed`), `URI_FAVORITES_LIST` (`favorites`), the last four only
   with the viewer's own `profile_id`. An item of such a module with no link (Member
   Following's) is its section.
4. Any other page of the site: `page`.

Each target then gets `path` when its page resolves for the viewer (GET /layout/resolve finds it,
the viewer may see it, and it has a block the API feeds), so a client without a screen of its own
for a section draws that page. A `page` without a `path` is nowhere: `target` is null, and a
client that can't open the `link` leaves the item out (the desktop app does).

### A module's own item

A module (a third-party one too) whose item belongs with one's main places adds it to the Apps
Menu (set `sys_apps_menu`) in its `install/sql/enable.sql` and turns it on for the apps in
`install/sql/enable-app.sql` (`active_api` 1), with a migration for sites that have the module
(`migrations/README.md`); Conversations, Messenger and Notifications do. An item it has in the
site menu for the site and NEO (its home) shows in the Browse group with no more work. It does
not add an item to the site menu or to Profile Stats for the apps' sidebar only: those are the
site's and API v1's. Where it opens: nothing to do when its link is the module's home,
popular, new, own or joined page and the module has an ApiV2 class with `apiV2ModuleInfo()`;
otherwise its ApiV2 class implements `apiV2NavigationTarget()` for its own items (checking
`$aItem['module']`), or leaves it to a `page` (which needs blocks the API feeds,
`apiV2PageBlock()`).

### What is the apps' own

Not in the menus, drawn by the app: the network switcher, the search field, Settings and the
profile menu at the foot, and the Tasks section's My timers and task contexts (where the site
menu's Tasks item is). The desktop app keeps its fixed sidebar for a site without
GET /navigation (404).

### Caching

Each submenu's items (without counters) are kept in the content cache per the menu's own cache
mode, as its HTML is on the site (Studio > Navigation > Menus: `per_acl` for the site menu, per
membership level and administrator or not; `per_user` for the Apps Menu and the Member Menu, per
profile; `off`: read each time), per language and platform. The key starts with `menu_<object>`, so Studio's
clearing of a menu's caches clears it, and has a digest of `sys_menu_items`, `sys_objects_menu`,
`sys_objects_page`, the apps' `sys_pages_blocks` and `sys_revision` (one query), so any change,
even straight in the database, makes a new one; an entry lasts an hour at most (a language
string changed in Studio shows within it). A per-profile menu's counters are kept 60 seconds;
the followed contexts are read each time. The answer has an ETag, so an unchanged sidebar is a
304. Queries (counted on a local site, `platform=desktop-app`): a guest 5; a member about 120 to
140 with the menus kept (most of it the followed contexts' names and pictures, and the counters
once a minute), a few hundred once after a change.

## Auth

- `Authorization: Bearer <token>`: an access token from the OAuth 2 server module (`bx_oauth`)
  with the `api` scope. The request acts as the account's current profile, for that request only
  (`glForceCurrentProfileId`); no session starts and the session cookie is ignored. The profile
  chosen on the consent page only says which account the token belongs to: like a site session,
  the token follows the account's current profile, so a switch on the site switches the token
  and `PUT /me/active-profile` switches the site. It answers 204 with no body; a
  client reads `GET /me` after it. Switching to the profile already active is a 204 too.
- No Bearer token: the site's session cookie, for the site's own pages. Writes must then come
  from the site's origin (scheme, host and port all the same) or one in `sys_api_origins`.
  Other `Authorization` schemes, such as HTTP Basic in front of a staging site, are ignored.
- Neither: a guest. `auth: 'required'` operations answer 401.
- `PUT /me/active-profile` switches only between profiles of the token's account (403
  otherwise), even for admins, who can switch to anyone's profile on the site.

Native apps sign in with the authorization code flow and PKCE (S256) in the system browser, and
get the code back on a loopback port (RFC 8252). `bx_oauth` has the client `una-desktop` (no
secret) built in for this (`BxOAuthUserCredentialsStorage::NATIVE_APP_CLIENTS`: its title, its
redirect, its grant types `authorization_code,refresh_token` and its scope `api`). It has no row
in `bx_oauth_clients`, so Studio > OAuth2 lists only the clients the site made, and
`/m/oauth2/com`, which wants a registered client for "public" services, does not take its id. It
is the one client the OAuth server treats as a native app, with rules of its own:

- PKCE is required, S256 only. The challenge is kept with the code, and the token endpoint
  (`/m/oauth2/token`) wants its `code_verifier`.
- Its redirect `http://127.0.0.1/callback` matches that address and path on any port, and only that.
- An authorize error with a valid redirect goes back to the app (`error`, `error_description`,
  `state`), which is waiting for it.
- Its consent page says what the `api` scope allows and where the browser goes back to.
- The server knows it only while API v2 is on. With API v2 off the id is like any other:
  `/m/oauth2/auth` and `/m/oauth2/token` answer as for a client id that does not exist, or, on a
  site that registered a client of its own under that id, as for that client, with none of the
  rules above. With API v2 on the id is the native app's, whatever the table has, and it is
  matched as written (`UNA-Desktop` is no client). An access token given before the switch still
  works at `/m/oauth2/api` until it expires (an hour).

Every other OAuth client goes through `/m/oauth2/auth` and `/m/oauth2/token` as it did before API
v2, with a secret or without one: a `code_challenge` is ignored, a registered redirect matches as
a prefix, an authorize error is shown on the site, and the consent page is the same.
`tests/integration/modules/boonex/oauth2/OAuthAuthorizeTest.php` pins both. The `api` scope is
`una-desktop`'s own (its built-in definition); it is not in `bx_oauth_scopes`, so a client
registered for no scopes can't ask for it.

The authorize endpoint (`/m/oauth2/auth`) issues a code only for a profile of the signed-in
account, chosen on its consent page and sent back by a POST that carries the page's CSRF token
(bound to the account and its session). A GET never names the profile. A client with no secret
can't prove who it is (RFC 8252 8.6), so it always gets the consent page; confidential clients
(with a secret) keep the old shortcuts (one profile, or connected before). Sign-out should revoke
the refresh token (`token_type_hint=refresh_token`) and then the access token at
`/m/oauth2/revoke`.

## Rate limits

Every request is counted for who sent it, in the bucket of its kind, and refused once the
bucket's limit for the minute is reached (`BxDolApiV2RateLimit`, called by the router after
authentication and before anything of the request runs).

| Bucket | What is counted in it | Requests a minute | Setting |
| --- | --- | --- | --- |
| `general` | every GET that is in no other bucket | 600 | `sys_api_v2_rate_limit_general` |
| `write` | POST, PUT, PATCH and DELETE | 120 | `sys_api_v2_rate_limit_write` |
| `search` | `GET /search/*` and `GET /hashtags` | 120 | `sys_api_v2_rate_limit_search` |
| `preview` | `GET /links/preview`, which makes the site read a page | 30 | `sys_api_v2_rate_limit_preview` |
| `agent` | `POST /agents/{id}/chats/{chat}/messages`, which a language model answers | 20 | `sys_api_v2_rate_limit_agent` |
| `upload` | `POST /uploads` and `POST /uploads/inline` | 120 | `sys_api_v2_rate_limit_upload` |

- Who: the profile a signed-in request acts as (a token and a cookie session of the same
  profile share its counts), or a guest's address, as `getVisitorIP()` gives it; an IPv6 address
  counts as its /64 network. A member is never counted with the guests of the same address, and
  each bucket has its own count. A guest whose address the site does not know (`0.0.0.0`) is not
  counted: all such guests would share one count.
- A request is counted in one bucket: the one its operation names (`limit:` on
  `BxDolApiV2Operation`), otherwise `write` or `general` by its method. HEAD counts as GET,
  OPTIONS is never counted, and neither is a request that fails before its operation is known
  (404, 405) or before it is authenticated (401).
- Windows are minutes of the clock. A client may send its limit in each, so twice the limit
  can pass around the turn of a minute.
- The refusal: 429, a problem document with `code` `rate_limited`, and `Retry-After`, the
  seconds until the next minute starts (1 to 60). Nothing of the request has run, and its
  `Idempotency-Key` is not claimed, so it can be sent again as it is. CORS exposes
  `Retry-After`. The document lists 429 for every operation.
- Settings: Studio > API > Settings. "API v2: limit the number of requests"
  (`sys_api_v2_rate_limit`, on by default) switches all of it off; each bucket's limit is a
  number of requests a minute, 0 for no limit in that bucket.
- Counts are rows of `sys_api_rate_limits`, one per subject (a keyed digest, so no address is
  stored) and bucket: counting is one statement and no read, a request over the limit changes
  nothing, and `BxDolCronPruning` deletes the rows of minutes that passed. The site's cache is
  not used for them: it has no atomic increment, and its default engine keeps entries as PHP
  files. When the count cannot be kept (the table is missing before its migration ran), the
  request runs.

## Versions and changes

The path carries the major version (`/api/v2`). The document's `info.version`
(`BxDolApiV2Router::VERSION`) is `2.MINOR.PATCH`. It is `2.0.0-draft` until the API ships in a UNA
release, and until then anything may change. From 2.0.0 on:

- **Compatible changes** raise MINOR and may ship in any UNA release: a new operation; a new
  optional query param or request field; a new field in a response; a new value in a list that
  says what a thing is (`kind`, `module`, a target's kind, a notification's type); a new problem
  `code` for a case that did not exist. A client must therefore ignore response fields and values
  it does not know, and treat an unknown `kind` as something it cannot show.
- **Breaking changes** are everything a working client could trip on: removing or renaming an
  operation, a param, a field or a value a request may send; making something optional required;
  changing a type, a format or what a value means; refusing a request that was valid; changing
  the status or the problem `code` of an existing case. They wait for the next major version
  (`/api/v3`, served beside v2), or go through deprecation.
- **Deprecation**: the old form keeps working beside the new one for at least three UNA minor
  releases and no less than twelve months, is marked `deprecated` in the document, and is named
  in the release notes of the release that deprecates it and of the one that removes it. (Not
  built yet: a `deprecated` argument of `BxDolApiV2Operation` and the `Deprecation` and `Sunset`
  response headers.)
- **A security fix** may break a client without the wait. The release notes say what changed.
- **PATCH** is for fixes that change no shape: behaviour brought in line with the document, and
  wording.

`neo/desktop/una-api/openapi.json` is the record of the API: the clients' types are generated
from it. `ApiV2SpecFileTest` fails when the code serves anything the file does not say, or says
differently, so a change to the API always shows as a change to that file in the pull request,
where it is read against the rules above. To take the file again after a change that is meant,
from a site with API v2 turned on and every module that has an API enabled:

```bash
cd neo/desktop/una-api && UNA_URL=http://localhost:8088 node scripts/fetch-spec.mjs && yarn generate
```

A site lists only the modules it has installed, so on a site with fewer the test checks the part
that site serves. The previous API (`api.php`, v1) is not covered by these rules.

## Adding an endpoint

1. Put a public method on an endpoint class and describe it with `#[BxDolApiV2Operation(...)]`:
   method, path, a camelCase `id` (the operationId: generated clients and MCP tools use it as the
   name), `summary`, `tag`, `auth`, `body` (a schema name), `responses` and `paged`; and `limit`
   when its requests belong in another rate limit bucket than its method's (`search`, `preview`,
   `agent`, `upload`).
2. Return an array (200), or a `BxDolApiV2Response` (`created`, `noContent`, `stream` for
   Server-Sent Events, declared as `responses: [200 => 'sse:<schema>']`). Throw
   `BxDolApiV2Problem` for errors.
3. Declare its schemas in the class's static `schemas()`, as JSON Schema arrays. Reuse shared ones
   (`Profile`, `Id`, `Problem`) by `$ref`.
   Declare every query param it reads in `params`, with a schema: the router checks the request
   against it (`BxDolApiV2Router::checkQuery`), so the endpoint reads values that already fit.
   The schema of a query param is kept with the route table, so it must not depend on the site's
   settings; describe such a param as a plain string and check it in the endpoint.
4. Call the module's own code for the work; v2 maps, it doesn't reimplement permissions.

System endpoints are `template/scripts/BxBaseApiV2*.php`, listed in `BxDolApiV2Router`. A module
adds `classes/<ClassPrefix>ApiV2.php` declaring `<ClassPrefix>ApiV2`; the router finds it while the
module is enabled, so a site's API lists only what it has installed (Timeline, Notifications and
Conversations do this). Its `apiV2ModuleInfo()` puts it in `GET /api/v2`'s `modules`, so clients
find it without probing; a context module extends `BxBaseModGroupsApiV2` (Groups, Spaces, Events), a
text module `BxBaseModTextApiV2` (Discussions, Albums, Tasks, Polls, Posts) and a file module `BxBaseModFilesApiV2` (Videos, Photos, Files), and a
module whose content can go into contexts says so with `apiV2ContextContent()`. A module whose
uploads go into its own storage names it in `apiV2UploadStorages()` (a purpose, the storage, `kind`
`video` with its `transcoders` for videos, `file` for any type with its `transcoders` and `image_exts`, `image` with its `thumb` and `view` copies for
photos) and says who may upload in `apiV2UploadAllowed()`. A module whose Pages builder blocks the API can feed
says which, and from which route, in `apiV2PageBlock()` (GET /layout/resolve).

Uploads, comments and reactions are system endpoints, since they work on the site's own storages,
comments objects (`BxDolCmts`) and reactions objects (`BxDolVoteReactions`) for every module:
`BxBaseApiV2Uploads` (`/uploads`), `BxBaseApiV2Comments` (`/content/{id}/comments`,
`/comments/{id}`) and `BxBaseApiV2Reactions` (`/reactions`, `/content/{id}/reaction`). They ask
the module that shows Items, the Timeline, for what only it knows, through hooks of its class:
`apiV2Item($iId)` (the Item of an id with its comments and reactions objects, read by
`BxDolApiV2Targets::item()`), `apiV2ItemIdsByComments()` (the Items that may show a comment's
entry), `apiV2ReactionsObject()` (whose list of reactions `GET /reactions` gives) and, for a feed
post's media, `apiV2PostUploadStorages()` with `apiV2PostUploadMedia()`. While the Timeline is
off the paths stay: uploads for the other modules' purposes work (`post` is 503
`uploads_unavailable`), there is no Item to comment on or react to (404), and `GET /reactions`
is empty.

The router does not read the classes on every request. Its route table (each operation's
attribute, class and method, and which classes have which `apiV2...()` method) is kept in the
database cache under a name made of the enabled modules, `sys_revision` and the list of system
endpoint classes, with the
modification times and sizes of the files it was read from: it is built again when a module is enabled or
disabled, after an update, and when one of those files changes, so an edited endpoint shows at
once. A request then loads only the class it runs, plus the classes of the hooks it calls;
`schemas()` are built only to check a JSON body and for the document. Two things follow: a
method other endpoints call through `BxDolApiV2Router::hooks()` is public and named
`apiV2...`, and a module's first `ApiV2.php` file, added by hand to an enabled module, is seen
within an hour or when the cache is cleared.

## Checking

- `tests/units/inc/ApiV2PartsTest.php`: validator, cursors, problems (their `urn:una:problem:`
  type), pages that require `next_cursor`, ETags (weak comparison, lists, `*`, the 1 MiB limit,
  none for writes, problems and other statuses, 304 without Content-Type), Idempotency-Key
  rules (keys, scopes, fingerprints, which answers are kept), origins, loopback rules, links
  read relative to the site's root; the route table (the kept one is the one read from the
  classes, its name changes with the modules and the revision, a changed or missing file makes
  it stale, hooks are the classes that have the method) and the rate limits' arithmetic
  (windows, Retry-After, subjects, the bucket of every operation).
- `tests/integration/api/ApiV2Test.php`: the document is consistent (unique operationIds, every
  `$ref` resolves, path params declared), and real HTTP responses match the published schemas.
  It also covers branding (the template's icon with nothing uploaded, an uploaded mark's URL, SVG
  code as a data: URI and too big or not SVG left out, the accent as #RRGGBB or null, the same block
  for a guest and a member), the consent page (no GET approval, CSRF, own profiles only, escaping), paging
  past hidden feed events and notifications, anonymous posts and embedded profile summaries,
  follows, friend requests (sent, listed, accepted, declined, ended) and their refusals, private
  follow lists and profiles by handle, uploads (stored as ghosts, taken by a post, refused for
  type, content, size and unknown fields, someone else's upload 422 in a post and 404 to read or
  delete, gone with the post), post edits (as the author, refused for another member and a
  guest), notification targets (a comment, a reply with its thread, a reaction, a follow),
  notification kinds (the kinds for a comment, a reply, a reaction with its name, a follow, a friend
  request and its acceptance, a repost, a discussion reply with its title and a group join
  request by the one asking; `other` for events about what someone else owns; `data` an object),
  ETags over HTTP (a guest's answer is `private, no-cache`, 304 for the tag, its strong form,
  a list and `*`, with no body or Content-Type; none on problems or writes), a last page's
  `next_cursor: null`, Idempotency-Key (a post replayed with the same answer and Location and
  posted once, another body 422, a problem and a 204 replayed, 409 while pending and a run
  again after a minute, pruning after a day, guests and uploads ignored, invalid keys 400),
  `/sync` (badges equal to the unread endpoints, 304 on a repeat, new notifications after the
  cursor, reset for another profile's cursor, 401 for guests) and `/links/resolve` (posts,
  profiles for members and guests, groups, a conversation for one in it and 404 for a guest and
  a member outside it, the same as a missing one, a private post 404 to others, refusals) and
  search (the whole name and the handle first, a members-only profile not found by guests,
  groups, content hits of public, members-only and private posts for their author, a guest
  and another member, paging one hit at a time, refusals) and groups (groups each test makes
  through the module's add service and deletes: joining an open group, listed in /me/groups,
  members with roles, leaving; a closed one shows its name only and a join is pending; a post
  with `context_id` in the group's feed and refused for those outside; secret groups 404 to
  others and listed for their owner, and to the profile paths; an invitation accepted with
  POST and declined with DELETE by the invitee alone, whatever `?key=` says; a suspended group
  404 to its member, another person and a guest; browsing page by page; the paths gone from the document
  for a site without Groups) and conversations (newest-first pages, a reply that comes between
  pages shifting nothing, `before`, read and unread again and unread twice, 404 to a member outside it and 401
  to guests for every path; photos for the first message and a reply, uploads of another
  purpose, someone else's or taken ones 422, videos 415; adding and taking out people, only by
  who started it, with the rows of those in it already left in their folder, and leaving). Ranking, the merge of sections, group visibility, upload ids and which
  modules' endpoint classes the router lists have unit tests.
- `tests/integration/api/ApiV2SpacesTest.php` (on `ApiV2TestCase`, which holds what the API v2
  test classes share: the server, requests, schema checks, tokens): the spaces paths and the
  `modules` entry only while bx_spaces is enabled, joining an open space and asking to join a
  closed one, secret spaces 404 to others, not listed or counted under their parent and found
  by their owner, subspaces newest first page by page, `parent_id` and `top_level`, posts into
  a space from members only, `content_kinds` for spaces and groups, a link to a space resolved
  with its module (a secret space's link 404 to a guest and an outsider, resolved for its owner),
  a closed space's subspaces 403 from outside, child counts per parent on one page, and search. Spaces are made through the module's add service and deleted
  after, subspaces first.
- `tests/integration/api/ApiV2EventsTest.php`: the events paths and the `modules` entry only
  while bx_events is enabled, upcoming soonest first and past latest first page by page, `from`
  and `to`, the author and context filters and their refusals, going to an open event and asking
  to come to an approval one, `maybe` 422, withdrawing, attendees first to join first, `GET
  /me/events` with active memberships only, a secret event 404 to others, a closed one's name
  and dates without its text, the Item of an event for its author alone, `events` in a group's
  `content_kinds`, and search. Events are made through the module's add service and deleted after.
- `tests/integration/api/ApiV2VideosTest.php`: the videos paths and the `modules` entry only
  while bx_videos is enabled, an upload of purpose `video` processing (a photo 415), a video
  made from it processing and seen by its author only, its title from the file name, an upload
  taken once and only by its owner, the 422s of a body, deleting, a published video to others
  and guests without the original, a private one 403 and out of others' lists, edits and their
  refusals, `recent`, `updated`, `popular`, `top` and `featured` page by page by author, a
  new upload listed for its author alone, an Idempotency-Key replay of `POST /videos`, videos in
  a secret group (404, unlisted, `?context=` 422) and a closed one (403), adding into a group
  one may not know of (422), see in (403) or post in (403), a link to a
  video elsewhere (skipped without the network) kept through an edit, search with privacy, and
  `videos` in contexts' `content_kinds`. Videos are made through the API and deleted after
  through the module, with their places in the transcoders' queue.
- `tests/integration/api/ApiV2PhotosTest.php`: the photos paths and the `modules` entry only
  while bx_photos is enabled (POST answering an array of FileItems), an upload of purpose `photo`
  (a video 415), one photo per upload in their order titled with their file names and with the
  text, the 422s of a body and an upload taken twice, others and guests given copies only
  (no original, its name or size), edits (the picture kept, private then 403 and unlisted) and
  deleting, `recent`, `popular` and `featured` page by page, a photo in a secret group (404,
  unlisted, `?context=` 422, adding there 422) listed for its members, search with privacy and
  `photos` in `content_kinds`; the level's limit reached part way (201 with the photos made,
  the upload left still the viewer's and taken later), and an owner's original the same reused
  token link alone and on a page, twice.
- `tests/integration/api/ApiV2FilesTest.php`: the files paths (their operation ids) and the
  `modules` entry only while bx_files is enabled, an upload of purpose `file` (a PDF is `file`
  with no copies, a PNG `image` with `thumb` and `medium`, a fake PNG 415), one file per upload
  in their order titled with their file names and with the description, the 422s of a body
  and an upload taken twice, others and guests given the original (its name, size and type,
  `download_url` the same link, which gives the bytes uploaded under their name), edits (the
  file kept, private then 403 and unlisted) and deleting, a folder 404 and never listed while
  a file in it is, `recent`, `popular` and `featured` page by page, a file in a secret group
  (404, unlisted, `?context=` 422, adding there 422) listed for its members and in its author's
  own list, search with privacy and `files` in `content_kinds`.
- `tests/integration/api/ApiV2AlbumsTest.php`: the albums paths and the `modules` entry only
  while bx_albums is enabled (FileItem there without Photos and Videos), the 422s of a body (the
  form's title length too), an album with three photos (its count, preview, text and Item),
  its items in order page by page with the original for its owner only, adding at its end in
  the order given (not by others, an upload once), others and guests given copies, a private
  album's items 403, edits, deleting with its items, a list's previews (four at most) and an
  empty album, an album in a secret group (404 for it and its items, adding 404) and search with
  privacy and `albums` in `content_kinds`; an administrator who may edit another's album
  refused adding to it before anything changed (their upload then makes an album of their
  own), and only the audiences the site offers (`members` 422 while its group is off, on POST
  and PATCH, the same value again 200). Albums are made through the API and deleted after.
- `tests/integration/api/ApiV2TasksTest.php`: the tasks paths and the `modules` entry only
  while bx_tasks is enabled; a group's lists (the Inbox, counts, the choices, adding, renaming by
  a member, deleting for its administrators only), adding tasks (a context and a title needed,
  assignees from its members, the viewer by default, a list of the context, an outsider 403),
  a list's tasks by due date and the Inbox, `tasks` in `content_kinds`; an assignee completing,
  reopening, clearing the due date and setting a done state, refused the title and deleting
  (nothing changed on a refusal), the logged changes given as text, the author reassigning and
  renaming, the former assignee refused; `/me/tasks` page by page (soonest first, no date last,
  completed ones apart, 401 for guests); tasks in a closed group (403) and a secret one (404,
  its lists 422), found by members only, a list in a secret group 404 to outsiders, deleted
  with its tasks by its owner (the Inbox's kept), and deleting a task. Groups, lists and tasks
  are made through the module's add service and the API and deleted after.
- `tests/integration/api/ApiV2AgentsTest.php`: the agents' paths and the event stream in the
  spec; who may chat with which agent (a guest, a member, an administrator; "Visible for", an
  agent off, an alert agent; the operator agent as the default only where the viewer may talk to
  it) and 403, 404 and 401 for the chats; a new chat with its `Location`, listed and read, not
  someone else's; a message's checks (empty, too long, missing, an agent the viewer may not talk
  to, a guest); a turn over HTTP on a model nothing answers (`text/event-stream`, no ETag,
  RUN_STARTED then RUN_ERROR, every event an AgentEvent); a turn with a reply in-process on
  NeuronAI's FakeAIProvider (`streamTo`: the deltas, RUN_FINISHED, the history keeps both, and
  GET reads them back with the reply as HTML and the chat titled); the listing's queries bounded.
  Agents, the model and their chats are deleted after.
- `tests/integration/api/ApiV2NavigationTest.php`: GET /navigation for a guest, a member and an
  administrator ("Visible for"), items off in the apps, "Hidden on" per platform, Studio's order
  and a change to it, the Apps Menu's items and where they open, one's groups in Member
  Memberships, the footer (About as its page, the copyright as text, a link elsewhere, the tools
  left out, "Active in apps" and "Hidden on"), the ETag, the queries of an answer, the helpers'
  rules, and that the site's own menus (`sys_site`, `sys_profile_stats`, `sys_site_panel`) have
  none of the apps' items. `tests/units/install/AppsSidebarSqlTest.php` checks the same in the
  install SQL and the migrations.
- `tests/integration/api/ApiV2LayoutTest.php`: GET /layout/resolve on the home page with
  blocks the test puts there and deletes after: a member's blocks (Friend Suggestions with its
  `limit`, the viewer's Friends, in their order) and a guest's (none of the members' ones, and
  not a guests' block whose route needs a sign-in); text blocks (`text.html`: a language string
  and HTML with `{site_title}` filled in, members-only text 404 to guests, raw code, a block off
  in the apps and a service block 404 at GET /layout/blocks/{id}/text); left out: another profile's friends, raw code,
  a menu, a block off in the apps, one taken off the page, blocks of a module that is not
  enabled (the block's or its call's), a call no class maps; Featured Posts for guests too;
  "Hidden on" as `design.hidden_on` and a block hidden on every screen left out on web and
  desktop but not in the mobile app (and the reverse), the parts of a design box without a
  title; paths (`/`, `/page/<uri>`, `page.php?i=`, the query as `params`), 422 and 404, an
  administrators' page 404 to guests; the layouts of UNA's columns; the suggestions (401 for
  guests, active profiles, never the viewer, the site's order page after page).
- `tests/integration/api/ApiV2PollsTest.php`: the polls paths only while bx_polls is enabled
  (`Poll` still there for `Item.poll`), the `modules` entry and the item kind; asking (a
  question and 2 to 10 different answers, 401 for guests), the answers in their order, one vote
  (the counts and the viewer's answer, 409 for a second one or the same again, 422 for an answer
  of another poll), what the author and a guest see, deleting by the author only; results hidden
  until one votes (`voters` still shown); `Item.poll` on the poll's item (and on no other item
  of a feed), its `version` changed by a vote; a poll in a secret group (404 to outsiders and
  guests, kept out of an author's list, its context 422, listed by its members, not with an
  audience as well); an author's polls page by page, search (not another's private one) and
  `polls` in `content_kinds`. Polls are made through the API and deleted after.
- `tests/integration/api/ApiV2PostsTest.php`: the posts paths, the `modules` entry, the item
  kind, `apiV2ItemEntry` and the `post_cover` upload purpose only while bx_posts is enabled, and
  the categories; writing (a title of 3 to 160, text, what is not taken here: a schedule,
  anonymous, an unknown category, a cover that is no photo or no upload of one's own, 401 for
  guests), a cover, a summary and a category, the text and the cover's original for the author
  and copies only for others, no text in lists, the feeds' Item naming the post (`entry_id`),
  editing by the author only (the same again 200), deleting; `/me/posts` in every state (a
  scheduled post with its `publish_at`, seen by its author only, and a hidden one), `draft`
  empty, 401 for guests; a post in a secret group (404 to outsiders and guests, its context 422,
  listed by its members, its audience the context's); an author's posts page by page, search
  (not another's private one) and `posts` in `content_kinds`. Posts are written through the API
  and deleted after.
- `tests/integration/api/ApiV2RateLimitTest.php`: a bucket lets its limit through and refuses
  the next request (429, the problem, Retry-After), also for another operation of the bucket
  and for HEAD, while other buckets and OPTIONS go on; guests counted by address and members by
  profile, apart from each other; writes apart from reads, and a refused write claiming no
  Idempotency-Key; everything through while the switch is off or a bucket's limit is 0; the
  counter window by window; 429 in the document for every operation. `ApiV2TestCase` switches
  the limits off while a test class runs, since tests send more in a minute than a client may.
- `yarn lint-spec` (`@redocly/cli`, a pinned devDependency) on the document.

PHPUnit 13 needs PHP 8.4. Member cases use `UNA_TEST_USER_EMAIL` and skip without it.

## Clients

`neo/desktop/una-api` is a typed client generated from the document (`openapi-typescript` +
`openapi-fetch`); `neo/desktop` is a Tauri 2 desktop app built on it. The folder is a yarn
workspace root of its own, outside NEO's workspaces (`apps/*`, `packages/*`): NEO's install,
lint, typecheck and builds do not include it.
