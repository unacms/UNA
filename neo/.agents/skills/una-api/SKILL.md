---
name: una-api
description: How UNA CMS services must behave for NEO (guest-safe blocks, JSON-only responses, api.php contract) and how NEO calls them. Use when editing UNA PHP blocks or services that NEO renders, adding a new UNA endpoint for NEO, or debugging a blank or maintenance-mode NEO page caused by an API failure.
---

# UNA API for NEO

NEO renders pages that UNA describes. Each app has one catch-all route that asks UNA for the page (`system/get_page_by_request/TemplServicePages`) and renders its blocks. The rest of the data comes from UNA services called through `api.php`. When a service prints a PHP fatal or an HTML error page instead of JSON, NEO can't render the page.

UNA's PHP code is the rest of the UNA repo, one level above `neo/`. Paths below that start with `api.php`, `inc/` or `modules/` are UNA paths. Client forks of unacms/neo don't contain them.

## The api.php contract

- Route: `/api.php?r={module}/{method}/{class}`. The class defaults to `Module`; system services use `Templ*` classes, for example `system/get_page_by_request/TemplServicePages`.
- Parameters: repeated `params[]=...`, or one JSON array `params=[...]`.
- Only services the module marks safe (`is_safe_service`) or public (`is_public_service`) can be called. Anything else returns 403 `{status: 403, error}` unless `sys_api_access_unsafe_services` is on.
- Success: `{status: 200, module, method, params, data, hash}`. NEO reads `data`.
- A service that returns `['error' => ..., 'code' => ..., 'desc' => ...]` produces HTTP 500 with `{status, error, data}` (plus `code` when given).
- Page blocks arrive in `data.elements`, keyed by cell (`cell_center`, ...).

## How NEO calls it

- Client code calls UNA through `fetcher` from `app/lib/fetcher` (`packages/app/lib/fetcher.ts`):
  - `fetcher(path)` does a GET.
  - `fetcher([path, token, body])` POSTs `body`.
  - It appends `&lang=`, so the path must already contain `?r=`.
  - On web it calls same-origin `/api/...`; `apps/next/proxy.js` forwards that to UNA, adds `Authorization: Bearer UNA_API_KEY` and passes the viewer's cookies.
  - Native calls `UNA_URL` directly with an `Origin: APP_ORIGIN` header and the session cookie. Native has no API key.
  - If the body isn't JSON, `fetcher` returns `{}`, so a broken service shows up as missing data, not as an error.
- Many endpoints come from UNA data rather than code: `'/api.php?r=' + data.request_url`. Fixed ones live in `appSetting('urls', ...)` (`packages/app/settings/configs.js`).
- Three places skip `fetcher` on purpose:
  - The web page shell (`apps/next/app/[...path]/page.js`) fetches the page JSON on the server with the API key and the viewer's cookies.
  - AI chat streaming (`ui/molecules/ai-agent/helper.js`) reads server-sent events.
  - Direct file uploads (`lib/util/upload.ts`).
- If the page JSON can't be parsed, the web shell logs the PHP output and renders the page as `page_status: 503`. `Layout` then shows the maintenance screen for the whole page. The home page falls back to a static splash. Fix the PHP; the fallback is only a safety net.

## Guests: the usual cause of broken pages

For a guest, UNA evaluates every block whose `visible_for_levels` includes the guest level. A block that calls a method on a missing profile then fatals, and the whole page response stops being JSON.

```php
// Bad: fatal for guests
$oProfile = BxDolProfile::getInstance();
$bOnline = $oProfile->isOnline();

// Good: getInstance() returns false for guests
$oProfile = BxDolProfile::getInstance();
if (!$oProfile)
    return '';
$bOnline = $oProfile->isOnline();
```

- Guard every profile or user access: `BxDolProfile::getInstance()` returns false for guests, and so does `bx_get_logged_profile_id()`.
- Return empty content (`''` or an empty array) for guests instead of throwing.
- Block visibility is the `visible_for_levels` bitmask in `sys_pages_blocks`. Bit `2^(level_id - 1)` enables a member level; the guest level is id 1, so bit value 1 (`inc/classes/BxDolAcl.php`). Members-only blocks use `2147483646` (every level except guest). Give a block guest visibility only when its code handles guests.
- Don't confuse this with `BX_DOL_PG_MEMBERS` / `BX_DOL_PG_ALL`: those are content privacy groups (`inc/classes/BxDolPrivacy.php`), not block visibility.

## Checks for a UNA change NEO uses

- Load the page as a guest and as a member, and as a member of a restricted level if the block is restricted.
- In the network tab, every `api.php` response body is JSON with no PHP warnings or HTML in it. Turn `display_errors` off for API traffic and read the server error log instead.
- New services NEO calls must be marked safe or public, or the call returns 403.
