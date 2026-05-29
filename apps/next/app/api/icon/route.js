// Single JSON module of every Lucide icon's node geometry (kebab-keyed), loaded
// once at module init. This replaces lucide-react/dynamicIconImports.mjs, whose
// ~1,960 dynamic import() entries forced webpack to wire up a lazy chunk per icon
// (16–18s route compiles) just to serve one icon per request.
import iconNodes from 'lucide-static/icon-nodes.json';
// icon-nodes.json holds the 1,711 canonical icons; dynamicIconImports also
// accepted ~249 deprecated v0 aliases (e.g. alert-circle → circle-alert). This
// map (generated from dynamicIconImports) preserves those so renamed names that
// the backend/settings still reference don't start 404-ing. Regenerate on a
// Lucide major upgrade.
import iconAliases from './icon-aliases.json';

/** Map PascalCase Lucide export names to dynamicIconImports keys (e.g. Share2 → share-2). */
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

/** @returns {number} finite positive integer, or fallback when invalid */
function parsePositiveInt(value, fallback, max = 4096) {
    if (value == null || value === '') return fallback;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num) || num > max) {
        return fallback;
    }
    return num;
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

// react-doctor-disable-next-line react-doctor/server-auth-actions
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const iconName = searchParams.get('icon');

        if (!iconName || !/^[A-Z][A-Za-z0-9]*$/.test(iconName)) {
            return new Response('', { status: 404 });
        }

        const key = iconNameToImportKey(iconName);
        const iconNode = iconNodes[key] || iconNodes[iconAliases[key]];
        if (!iconNode) {
            return new Response('', { status: 404 });
        }

        const size = searchParams.get('size');
        const width = searchParams.get('width');
        const height = searchParams.get('height');
        const strokeWidth = searchParams.get('strokeWidth');
        const fill = searchParams.get('fill');

        const resolvedSize = parsePositiveInt(size, 24);
        const resolvedWidth = parsePositiveInt(width, resolvedSize);
        const resolvedHeight = parsePositiveInt(height, resolvedSize);
        const resolvedStrokeWidth = parsePositiveInt(strokeWidth, 2, 64);

        const iconString = renderLucideSvg(iconNode, {
            width: resolvedWidth,
            height: resolvedHeight,
            color: 'white',
            strokeWidth: resolvedStrokeWidth,
            fill: fill?.trim() || 'none',
        });

        return new Response(iconString, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error rendering icon:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
