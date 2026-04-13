'use client';

import { useMemo } from 'react';

export function IconFromSet({ icon, isXmlSvg, InlineIcon, AnimatedIconComponent, width, height, size, _strokeWidth, color, cleanedClassName, rest, fill }) {


    const maskUrl = useMemo(() => {
        if (!icon || isXmlSvg || InlineIcon || AnimatedIconComponent) return null;
        let url = `/api/api.icon?icon=${icon}`;
        if (width) url += `&width=${width}`;
        if (height) url += `&height=${height}`;
        if (size) url += `&size=${size}`;
        if (_strokeWidth) url += `&strokeWidth=${_strokeWidth}`;
        if (fill) url += `&fill=${fill}`;
        return url;
    }, [icon, isXmlSvg, InlineIcon, AnimatedIconComponent, width, height, size, _strokeWidth, fill]);

    if (!maskUrl) return null;

    const resolvedWidth = width || size || 24;
    const resolvedHeight = height || size || 24;
    const { style: restStyle, ...restWithoutStyle } = rest;

    return (
        <span
            style={{
                ...restStyle,
                display: 'inline-flex',
                width: resolvedWidth + 'px',
                height: resolvedHeight + 'px',
                minWidth: resolvedWidth + 'px',
                minHeight: resolvedHeight + 'px',
                backgroundColor: color || 'currentColor',
                maskImage: `url(${maskUrl})`,
                WebkitMaskImage: `url(${maskUrl})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskMode: 'alpha',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskMode: 'alpha',
                flexShrink: 0,
            }}
            className={cleanedClassName}
            {...restWithoutStyle}
        />
    );
}

export function XmlIcon({ origIcon, width, height, size, color, cleanedClassName, rest }) {

    const result = origIcon
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