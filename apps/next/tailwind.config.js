/**
 * Legacy Tailwind v3-style JS config: `theme` from `app/design/tailwind/theme.js`
 * (deepmerge includes `app/customization/design/tailwind/theme.js`).
 *
 * NOT CURRENTLY LOADED BY ANY BUILD. Tailwind v4 does not auto-discover
 * `tailwind.config.js` — it must be pulled in explicitly with `@config`, and no
 * `@config` directive exists in this repo. Both platforms are CSS-first and take
 * their tokens from `app/design/styles/theme.css` (`@theme inline`):
 *   - web    → `app/design/styles/global.css`
 *   - native → `apps/expo/global.combined.css` (uniwind)
 *
 * So adding a token here alone has no effect. Add it to the `@theme inline` block
 * in `design/styles/theme.css` — that is what generates the utility on both
 * platforms. (A `shadow-block-outline` entry added only here silently rendered
 * nothing until it was mapped in `theme.css`.)
 */
const { theme } = require('app/design/tailwind/theme');

module.exports = {
    darkMode: ['class', '[theme="dark"]'],
    important: 'html',
    theme,
};
