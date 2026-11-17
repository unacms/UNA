/**
 * The loaders of the icons a site may name (every Lucide icon) and of xymbols' animations, one
 * small module each. The two maps hold about 4,000 entries, over a third of what the app would
 * otherwise parse before its first paint, so they are a module of their own that `site-icon.tsx`
 * and `animated-icon.tsx` import when an icon first asks for one.
 */
import type { AnimatedIconData } from 'xymbols/animated';

const LUCIDE = import.meta.glob<string>('../../node_modules/lucide-static/icons/*.svg', { query: '?raw', import: 'default' });
const XYMBOLS = import.meta.glob<AnimatedIconData>(['xymbols-dist/generated/animated/*.js', '!**/index.js'], { import: 'default' });

/** Lucide's icons by name: the markup of the SVG file. */
export const lucide = byName(LUCIDE, '.svg');
/** xymbols' animations by Lucide name. */
export const animated = byName(XYMBOLS, '.js');

function byName<T>(glob: Record<string, () => Promise<T>>, extension: string): Map<string, () => Promise<T>> {
    return new Map(Object.entries(glob).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -extension.length), load]));
}
