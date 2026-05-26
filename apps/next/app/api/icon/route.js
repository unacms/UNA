import dynamicIconImports from 'lucide-react/dynamicIconImports.mjs';

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

        const loader = dynamicIconImports[iconNameToImportKey(iconName)];
        if (!loader) {
            return new Response('', { status: 404 });
        }

        const mod = await loader();
        const iconNode = mod.__iconNode;
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
