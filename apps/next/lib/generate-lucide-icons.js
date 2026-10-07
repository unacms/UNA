// Writes every Lucide icon as a static mask SVG to public/lucide/<strokeWidth>/<Name>.svg
// so web icons are served as plain static files (CDN, no proxy.js, no function).
// Runs from next.config.js on every `next dev` / `next build`; skipped while the
// stamp matches. The full set is generated (not just names used in code) because
// UNA can send any Lucide name at runtime. Anything not generated here — other
// stroke widths, `fill`, Lucide names added later — falls back to /api/icon via
// the `fallback` rewrite in next.config.js.
const fs = require('fs');
const path = require('path');
const { iconNameToImportKey, renderLucideSvg } = require('./lucide-svg');

// Integer stroke widths only: /api/icon treats anything else as 2.
const STROKE_WIDTHS = [1, 2, 3];
const OUT_DIR = path.resolve(__dirname, '../public/lucide');
// Bump when the output format changes so existing checkouts regenerate.
const GENERATOR_VERSION = 1;

const kebabToPascal = (key) =>
    key.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

function generateLucideIcons() {
    const iconNodes = require('lucide-static/icon-nodes.json');
    const iconAliases = require('../app/api/icon/icon-aliases.json');
    const { version } = require('lucide-static/package.json');

    const stampPath = path.join(OUT_DIR, '.stamp');
    const stamp = JSON.stringify({
        generator: GENERATOR_VERSION,
        lucide: version,
        strokeWidths: STROKE_WIDTHS,
        aliases: Object.keys(iconAliases).length,
    });
    try {
        if (fs.readFileSync(stampPath, 'utf8') === stamp) return;
    } catch {
        // no stamp yet
    }

    const resolve = (key) => iconNodes[key] || iconNodes[iconAliases[key]];

    const icons = new Map();
    // Names differing only in case (Grid2x2 / Grid2X2) share one file on
    // Windows/macOS, so both must be the same icon; all current ones are.
    const byLowerCase = new Map();
    for (const key of [...Object.keys(iconNodes), ...Object.keys(iconAliases)]) {
        const node = resolve(key);
        const name = kebabToPascal(key);
        // Keep only names the route itself resolves to the same icon.
        if (!node || !/^[A-Z][A-Za-z0-9]*$/.test(name) || resolve(iconNameToImportKey(name)) !== node) continue;
        const sameFile = byLowerCase.get(name.toLowerCase());
        if (sameFile && sameFile !== node) continue;
        byLowerCase.set(name.toLowerCase(), node);
        icons.set(name, node);
    }

    for (const strokeWidth of STROKE_WIDTHS) {
        const dir = path.join(OUT_DIR, String(strokeWidth));
        fs.mkdirSync(dir, { recursive: true });
        for (const [name, node] of icons) {
            // Same parameters /api/icon uses when only icon + strokeWidth are given.
            const svg = renderLucideSvg(node, { width: 24, height: 24, color: 'white', strokeWidth, fill: 'none' });
            fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
        }
    }
    fs.writeFileSync(stampPath, stamp);
}

module.exports = { generateLucideIcons };
