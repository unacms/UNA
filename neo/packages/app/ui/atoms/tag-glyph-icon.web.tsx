import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import type { ComponentType } from 'react';
import type { GlyphData } from 'tagsets';
import type { TagGlyphIcon, TagGlyphIconProps } from './tag-glyph-icon.types';

const TAGS: Record<string, ComponentType<any>> = { path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse };

/**
 * Web: an `Icon` component for one tagsets glyph, drawn like a Lucide icon (24 grid, 2px round strokes).
 * Uses the square `fixed` form, or `hug` where the glyph has none. As with the inline Lucide icons
 * (`default/icons-svg.web.js`), a wrapping span carries the icon's class (`text-*` colour, layout) and the
 * strokes use `currentColor`; an explicit `color` wins.
 */
export function makeTagGlyphIcon(glyph: GlyphData): TagGlyphIcon {
    const variant = glyph.fixed ?? glyph.hug;
    // The drawing never changes, so each element gets a key from the glyph once.
    const elements = variant.node.map(([tag, attrs], i) => ({ key: `${glyph.id}-${i}`, Tag: TAGS[tag], attrs }));

    function TagGlyph({ width, height, color, strokeWidth, className }: Readonly<TagGlyphIconProps>) {
        const size = height || width || 24;
        const explicitColor = color && color !== 'currentColor' ? color : undefined;

        return (
            <span
                className={className}
                style={{ display: 'inline-flex', flexShrink: 0, ...(explicitColor ? { color: explicitColor } : null) }}
            >
                <Svg
                    width={width || size}
                    height={size}
                    viewBox={`${variant.x} 0 ${variant.width} 24`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth || 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {elements.map(({ key, Tag, attrs }) => (Tag ? <Tag key={key} {...attrs} /> : null))}
                </Svg>
            </span>
        );
    }
    TagGlyph.displayName = glyph.component;

    return TagGlyph;
}
