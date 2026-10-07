// Lucide SVG rendering shared by the /api/icon route and the static icon
// generator (lib/generate-lucide-icons.js), so both produce identical files.
// CommonJS because next.config.js requires it at startup.

/** Map PascalCase Lucide export names to icon-nodes keys (e.g. Share2 → share-2). */
function iconNameToImportKey(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
        .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
        .toLowerCase();
}

const camelToKebab = (string) =>
    string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function escapeAttr(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderIconNode(iconNode) {
    return iconNode
        .map(([tag, attrs]) => {
            const attrString = Object.entries(attrs)
                .filter(([key]) => key !== 'key')
                .map(([key, value]) => `${camelToKebab(key)}="${escapeAttr(value)}"`)
                .join(' ');
            return attrString ? `<${tag} ${attrString}/>` : `<${tag}/>`;
        })
        .join('');
}

function renderLucideSvg(iconNode, { width, height, color, strokeWidth, fill }) {
    const children = renderIconNode(iconNode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${escapeAttr(width)}" height="${escapeAttr(height)}" viewBox="0 0 24 24" fill="${escapeAttr(fill)}" stroke="${escapeAttr(color)}" stroke-width="${escapeAttr(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}

module.exports = { iconNameToImportKey, renderLucideSvg };
