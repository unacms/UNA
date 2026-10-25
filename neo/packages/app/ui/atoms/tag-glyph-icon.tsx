import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import type { ComponentType } from 'react';
import type { GlyphData } from 'tagsets';
import { useTheme } from 'app/design/theme';
import { useIconClassColor } from 'app/ui/atoms/icon-class-color';
import type { TagGlyphIcon, TagGlyphIconProps } from './tag-glyph-icon.types';

const TAGS: Record<string, ComponentType<any>> = { path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse };

/**
 * Native: an `Icon` component for one tagsets glyph, drawn like a Lucide icon (24 grid, 2px round strokes).
 * Uses the square `fixed` form, or `hug` where the glyph has none. Colour comes from `color`, else the
 * `text-*` class, else the theme's default icon colour, as for Lucide icons (`IconFromSet`).
 */
export function makeTagGlyphIcon(glyph: GlyphData): TagGlyphIcon {
    const variant = glyph.fixed ?? glyph.hug;
    // The drawing never changes, so each element gets a key from the glyph once.
    const elements = variant.node.map(([tag, attrs], i) => ({ key: `${glyph.id}-${i}`, Tag: TAGS[tag], attrs }));

    function TagGlyph({ width, height, color, strokeWidth, className }: Readonly<TagGlyphIconProps>) {
        const classColor = useIconClassColor(className);
        const { colors } = useTheme();
        const size = height || width || 24;

        return (
            <Svg
                width={width || size}
                height={size}
                viewBox={`${variant.x} 0 ${variant.width} 24`}
                fill="none"
                stroke={color || classColor || colors.default}
                strokeWidth={strokeWidth || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {elements.map(({ key, Tag, attrs }) => (Tag ? <Tag key={key} {...attrs} /> : null))}
            </Svg>
        );
    }
    TagGlyph.displayName = glyph.component;

    return TagGlyph;
}
