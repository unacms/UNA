/**
 * Tailwind v4: `theme` from `app/design/tailwind/theme.js` (deepmerge includes
 * `app/customization/design/tailwind/theme.js`). Loaded via @config from `global.css`.
 */
const { theme } = require('app/design/tailwind/theme');

module.exports = {
    darkMode: ['class', '[theme="dark"]'],
    important: 'html',
    theme,
};
