---
name: una-api
description: UNA CMS API contracts for NEO—guest-safe blocks, JSON responses, endpoint shape, and coordination with packages/app fetcher. Use when editing UNA PHP blocks/services, debugging blank pages from API failures, or integrating new UNA endpoints with the NEO monorepo.
metadata:
  author: neo
  version: "1.0.0"
---

# UNA CMS API — NEO integration

This skill describes how **UNA CMS** backends must behave so the **NEO** frontend (Yarn monorepo: `apps/next`, `apps/expo`, shared `packages/app`) receives **parseable JSON**, not PHP fatals or HTML error pages.

## NEO frontend expectations

- **All UNA API calls from app code** go through [`packages/app/lib/fetcher.js`](../../../packages/app/lib/fetcher.js) (`import { fetcher } from 'app/lib/fetcher'`). It normalizes hosts for web vs native (`use_proxy_web`, `use_proxy_native`, `UNA_URL`, `APP_URL`, etc.) and parses **JSON** responses.
- **Endpoint shape:** `/api.php?r=module/action/Template` with params as required by UNA (often `params[]=...` with JSON). Do not invent ad hoc REST shapes without aligning with existing NEO usage.
- **Page data:** NEO loads page payloads via UNA (e.g. flows using `get_page_by_request`). Responses must include page metadata, blocks configuration, and user context **without** assuming a logged-in user everywhere.

## Critical issue — guest (non-logged-in) users

UNA still evaluates **all** configured blocks for a page when the user is a **guest**. If any block assumes a logged-in user and calls methods on `false` / null, PHP throws.

### What breaks NEO

1. UNA returns an **HTML** error page (or PHP fatal output) instead of JSON.
2. `fetcher` / client code cannot parse JSON → whole route can fail.
3. Users may see a **blank page** (including static areas like splash).

**Example (anti-pattern):**

```php
// BAD — crashes when user is not logged in
$user->isOnline();

// GOOD — guard first
$user && $user->isOnline();
```

## Best practices for UNA blocks and services

### 1. Always guard user / profile context

```php
public function serviceGetBlockContacts() {
    $oProfile = BxDolProfile::getInstance();

    if (!$oProfile) {
        return array('content' => '', 'menu' => '');
    }

    $bOnline = $oProfile->isOnline();
    // ...
}
```

### 2. Block visibility (`visible_for`)

- Use `BX_DOL_PG_MEMBERS` for blocks that require a logged-in user.
- Use `BX_DOL_PG_ALL` only if the block code **explicitly** handles guests.

### 3. Graceful degradation in templates

Return empty states or safe defaults instead of throwing when profile/user is missing.

### 4. Defensive service methods

Check module enabled, then logged profile id (`bx_get_logged_profile_id()` or equivalent), return `''` or empty structures for guests when appropriate.

## API response shape

**Success** responses should be JSON NEO can consume, e.g.:

```json
{
  "data": {
    "title": "Page Title",
    "uri": "/page-uri",
    "logged": 0,
    "blocks": { }
  },
  "code": 200
}
```

**Never** return raw PHP error HTML inside an API response body for routes NEO expects as JSON.

## Page-specific notes

- **Home / guest splash:** Prefer blocks that work without auth; keep messenger, notifications, and user-only blocks on **members** visibility.
- **Profile / content:** Respect permissions; return empty or restricted states instead of errors.

## Testing checklist (UNA side)

- [ ] Logged-out (guest) session
- [ ] Logged-in user
- [ ] Different permission levels
- [ ] Network tab: response is JSON, no PHP error text in body

## Debugging on UNA servers

- Log errors; avoid `display_errors` on responses used as APIs.
- Use server error logs (paths vary by hosting).

## NEO frontend workaround (not a substitute for fixing UNA)

The web app may handle API errors on specific routes (e.g. home) with fallback UI—see **[`apps/next/app/[...path]/page.js`](../../../apps/next/app/[...path]/page.js)** for graceful handling when `data.code` indicates server errors. **Fix the root cause in UNA**; the workaround is a safety net.

## Summary

| Do | Don't |
|----|-------|
| Guard `$oProfile` / user before use | Assume user is always logged in |
| Return empty content for guests | Let PHP errors reach the response body |
| Configure `visible_for` appropriately | Expose member-only blocks to guests without safe code |
| Log errors server-side | Emit HTML fatal errors on JSON API routes |

## Related NEO docs

- Root agent guide: [`agents.md`](../../../agents.md) (UNA CMS API Integration, precedence).
- Project rules: [`.cursorrules`](../../../.cursorrules).
