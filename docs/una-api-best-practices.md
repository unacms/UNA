# UNA CMS API Best Practices

This document outlines best practices for UNA CMS backend developers to ensure robust API responses that work correctly with the NEO frontend application.

## Overview

NEO fetches page data from UNA using the `get_page_by_request` endpoint. This data includes page metadata, blocks configuration, and user context. Issues arise when blocks assume user authentication without proper null checks.

## Critical Issue: Guest User Context

### The Problem

When a non-logged-in (guest) user requests a page, UNA still processes ALL configured blocks, including those that require user context. If a block's code assumes a logged-in user without checking, it causes fatal PHP errors.

**Example failure (BxMessengerTemplate.php:2735):**
```php
// BAD - crashes when user is not logged in
$user->isOnline()

// GOOD - check user exists first
$user && $user->isOnline()
```

### Impact

When a block crashes:
1. UNA returns HTML error page instead of JSON
2. NEO cannot parse the response
3. The entire page fails to render (even static content like splash screen)
4. Users see a blank page

## Best Practices for Block Development

### 1. Always Check User Authentication

```php
// In any block that uses user context
public function serviceGetBlockContacts() {
    $oProfile = BxDolProfile::getInstance();
    
    // Guard clause - return empty/default if no user
    if (!$oProfile) {
        return array('content' => '', 'menu' => '');
    }
    
    // Safe to proceed with user operations
    $bOnline = $oProfile->isOnline();
    // ...
}
```

### 2. Block Visibility Configuration

Configure blocks to only appear for appropriate user states:

```php
// In block configuration
'visible_for' => BX_DOL_PG_MEMBERS, // Only show for logged-in users
// OR
'visible_for' => BX_DOL_PG_ALL,     // Show for everyone (must handle guest case in code)
```

### 3. Graceful Degradation in Templates

```php
// In template methods
public function getContacts() {
    $oProfile = $this->_getProfile();
    
    // Return empty state instead of crashing
    if (!$oProfile || $oProfile === false) {
        return $this->_getEmptyState();
    }
    
    // ... rest of implementation
}
```

### 4. Service Method Safety

All service methods called via API should be defensive:

```php
public function serviceGetBlockContactsMessenger() {
    // Check module is enabled
    if (!$this->isEnabled()) {
        return '';
    }
    
    // Check user context
    $iProfileId = bx_get_logged_profile_id();
    if (!$iProfileId) {
        return ''; // Return empty for guests
    }
    
    // Proceed safely
    return $this->_oTemplate->getContacts();
}
```

## API Response Structure

### Expected Success Response

```json
{
    "data": {
        "title": "Page Title",
        "description": "Page description",
        "uri": "/page-uri",
        "url": "https://site.com/page-uri",
        "page_name": "home",
        "page_type": "home",
        "logged": 0,
        "blocks": {
            "block_name": { ... }
        }
    },
    "code": 200
}
```

### Error Response (What NOT to Return)

```html
<!-- This breaks NEO frontend parsing -->
<br />
<b>Fatal error</b>: Uncaught Error: Call to a member function isOnline() on false...
```

## Page-Specific Recommendations

### Home Page (Splash Screen)

The home page for guests should:
- Only load blocks that work without authentication
- Exclude messenger, notifications, and user-specific blocks
- Use `visible_for` to hide authenticated-only blocks

**Recommended UNA Studio Configuration:**
1. Go to Studio → Pages → Home
2. For each block, set visibility:
   - `sys_login_form` → All visitors
   - `messenger_contacts` → Members only
   - `notifications` → Members only

### Profile Pages

- Always check if viewing own profile vs. others
- Handle private/blocked profile states

### Content Pages

- Check content permissions before rendering
- Return appropriate empty states for restricted content

## Testing Checklist

Before deploying block changes:

- [ ] Test with logged-out user (guest)
- [ ] Test with logged-in user  
- [ ] Test with different permission levels
- [ ] Verify JSON response is valid (no PHP errors in output)
- [ ] Check response in browser dev tools Network tab

## Debugging

### Enable API Debugging

```php
// In api.php or module
if (defined('BX_DOL_DEBUG') && BX_DOL_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Don't output to response
    ini_set('log_errors', 1);     // Log instead
}
```

### Check Logs

```bash
# UNA error log location (varies by setup)
tail -f /var/log/apache2/error.log
# or
tail -f /var/www/vhosts/site/logs/error.log
```

## Frontend Workaround

NEO includes a frontend workaround for API failures on the home page. When UNA returns an error, the splash screen renders with static content. However, this is a safety net - the root cause should be fixed in UNA.

```javascript
// apps/next/app/[...path]/page.js
// Handles API errors gracefully for home page
const hasApiError = data?.code === 500 || data?.code === 503;
if (hasApiError && isHomePage) {
    // Render splash with fallback data
}
```

## Summary

| Do | Don't |
|---|---|
| Check `$oProfile` before using | Assume user is always logged in |
| Return empty content for guests | Let PHP errors reach output |
| Use `visible_for` block settings | Show user-only blocks to guests |
| Log errors, don't display them | Output HTML errors in API responses |
| Test with guest users | Only test authenticated flows |

## Contact

For questions about NEO frontend integration, refer to the project documentation or contact the development team.

