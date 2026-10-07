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
// Shared with the startup generator of public/lucide/*.svg, so the static files
// and this route's fallback responses are byte-identical.
import { iconNameToImportKey, renderLucideSvg } from '../../../lib/lucide-svg';

/** @returns {number} finite positive integer, or fallback when invalid */
function parsePositiveInt(value, fallback, max = 4096) {
    if (value == null || value === '') return fallback;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num) || num > max) {
        return fallback;
    }
    return num;
}

// Every response depends on the query; without this the build tries to prerender the route
// and the catch below logs Next's DYNAMIC_SERVER_USAGE signal as "Error rendering icon".
export const dynamic = 'force-dynamic';

// react-doctor-disable-next-line react-doctor/server-auth-actions
export async function GET(request) {
    try {
        const { searchParams, pathname } = new URL(request.url);
        // Reached via the /lucide/<strokeWidth>/<Name>.svg rewrite in next.config.js
        // (no static file for it): the handler sees the original URL, not the
        // rewritten query, so take both values from the path.
        const lucidePath = pathname.match(/^\/lucide\/(\d+)\/([A-Z][A-Za-z0-9]*)\.svg$/);
        if (lucidePath && !searchParams.has('icon')) {
            searchParams.set('strokeWidth', lucidePath[1]);
            searchParams.set('icon', lucidePath[2]);
        }
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
