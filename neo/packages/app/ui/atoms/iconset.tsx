'use client';

import { IconSet as IconMap } from 'app/customization/icons';
import { useTheme } from 'app/design/theme';
import { useMemo } from 'react';
import { useResolveClassNames } from 'uniwind';
import { SvgXml } from 'react-native-svg';
import type { ComponentType } from 'react';
import type { IconCoreProps } from 'app/ui/atoms/icon';

const iconMap = IconMap as unknown as Record<string, ComponentType<any> | undefined>;

export function IconFromSet({ icon, width, height, size, _strokeWidth, color, cleanedClassName, rest, fill }: IconCoreProps) {
    const { colors } = useTheme();
    const resolvedClassStyle = useResolveClassNames(cleanedClassName || '');
    const { color: classColor, width: classWidth, height: classHeight, ...styleFromClassName } = resolvedClassStyle || {};
    const { style: restStyle, ...restWithoutStyle } = rest || {};
    const resolvedWidth = width || size;
    const resolvedHeight = height || size;
    const resolvedSize = size || (resolvedWidth && resolvedWidth === resolvedHeight ? resolvedWidth : undefined);

    const IconComponent = useMemo(() => {
        return (icon && iconMap[icon]) || null;
    }, [icon]);

    if (!IconComponent) {
        return null;
    }

    return (
        <IconComponent
            color={color || classColor || colors.default}
            width={resolvedWidth || classWidth}
            height={resolvedHeight || classHeight}
            size={resolvedSize}
            strokeWidth={_strokeWidth}
            // lucide spreads props over its `fill="none"` default; an explicit
            // undefined wipes it and react-native-svg then fills black.
            {...(fill != null ? { fill } : null)}
            style={[styleFromClassName, restStyle].filter(Boolean)}
            {...restWithoutStyle}
        />
    );
}

export function XmlIcon({ origIcon, width, height, size, color }: IconCoreProps) {
    return <SvgXml xml={origIcon ?? null} width={width || size} height={height || size} color={color} />;
}