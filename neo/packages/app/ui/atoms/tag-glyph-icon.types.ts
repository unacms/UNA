import type { ComponentType } from 'react';

/** The props `Icon` passes to an inline icon component (see `InlineIcon` in `icon.tsx`). */
export type TagGlyphIconProps = {
    width?: number | string;
    height?: number | string;
    color?: string;
    strokeWidth?: number;
    className?: string;
};

export type TagGlyphIcon = ComponentType<TagGlyphIconProps>;
