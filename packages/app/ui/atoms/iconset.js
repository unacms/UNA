'use client';

import { IconSet as IconMap } from 'app/customization/icons';
import { useTheme } from 'app/design/theme';
import { useMemo } from 'react';
import { useResolveClassNames } from 'uniwind';
import { SvgXml } from 'react-native-svg';

export function IconFromSet({ icon, width, height, size, _strokeWidth, color, cleanedClassName, rest }) {
    const { colors } = useTheme();
    const resolvedClassStyle = useResolveClassNames(cleanedClassName || '');
    const { color: classColor, width: classWidth, height: classHeight, ...styleFromClassName } = resolvedClassStyle || {};
    const { style: restStyle, ...restWithoutStyle } = rest || {};
    const resolvedWidth = width || size;
    const resolvedHeight = height || size;
    const resolvedSize = size || (resolvedWidth && resolvedWidth === resolvedHeight ? resolvedWidth : undefined);

    const IconComponent = useMemo(() => {
        return IconMap[icon] || null;
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
            style={[styleFromClassName, restStyle].filter(Boolean)}
            {...restWithoutStyle}
        />
    );
}

export function XmlIcon({ origIcon, width, height, size, color, cleanedClassName, rest }) {
    return <SvgXml xml={origIcon} width={width || size} height={height || size} color={color} />;
}