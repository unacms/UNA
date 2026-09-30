'use client';

import { useMemo, type CSSProperties } from 'react';
import type { IconCoreProps } from 'app/ui/atoms/icon';

/** Stroke width as /api/icon applies it: integer 1–64, anything else is 2. */
function maskStrokeWidth(strokeWidth: unknown) {
    const num = Number(strokeWidth);
    return Number.isInteger(num) && num > 0 && num <= 64 ? num : 2;
}

export function IconFromSet({ icon, InlineIcon, AnimatedIconComponent, width, height, size, _strokeWidth, color, cleanedClassName, rest, fill }: IconCoreProps) {
    // No size in the URL: the mask is a vector scaled by mask-size, so one file
    // serves every size. /lucide/* is static (apps/next/lib/generate-lucide-icons.js);
    // a custom `fill` still needs the dynamic route.
    const maskUrl = useMemo(() => {
        if (!icon || InlineIcon || AnimatedIconComponent) return null;
        const strokeWidth = maskStrokeWidth(_strokeWidth);
        if (fill) return `/api/api.icon?icon=${icon}&strokeWidth=${strokeWidth}&fill=${encodeURIComponent(fill)}`;
        return `/lucide/${strokeWidth}/${icon}.svg`;
    }, [icon, InlineIcon, AnimatedIconComponent, _strokeWidth, fill]);

    if (!maskUrl) return null;

    const resolvedWidth = width || size || 24;
    const resolvedHeight = height || size || 24;
    const { style: restStyle, ...restWithoutStyle } = rest as { style?: CSSProperties; [key: string]: unknown };
    const hasTextColorClass = /\b(?:dark:)?text-/.test(cleanedClassName || '');
    // Inherit fill from CSS `color` when text-* utilities are set. Resolving theme
    // tokens to inline backgroundColor in JS can differ between SSR and hydration
    // (default vs customization palette), causing hydration mismatches.
    const maskFill = hasTextColorClass ? 'currentColor' : (color || 'currentColor');

    return (
        <span
            style={{
                ...restStyle,
                display: 'inline-flex',
                width: resolvedWidth + 'px',
                height: resolvedHeight + 'px',
                minWidth: resolvedWidth + 'px',
                minHeight: resolvedHeight + 'px',
                backgroundColor: maskFill,
                maskImage: `url(${maskUrl})`,
                WebkitMaskImage: `url(${maskUrl})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskMode: 'alpha',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                flexShrink: 0,
            }}
            className={cleanedClassName}
            {...restWithoutStyle}
        />
    );
}

export function XmlIcon({ origIcon, width, height, size, color, cleanedClassName, rest }: IconCoreProps) {

    const result = (origIcon ?? '')
        .replace(/\swidth="[^"]*"/i, '')
        .replace(/\sheight="[^"]*"/i, '')
        .replace(/<svg(\s[^>]*)?>/i, `<svg$1 width="${width || size}" height="${height || size}">`);
    return (
        <span
            style={{ color, display: 'flex' }}
            className={cleanedClassName}
            {...rest}
            dangerouslySetInnerHTML={{ __html: result }}
        />
    );

}