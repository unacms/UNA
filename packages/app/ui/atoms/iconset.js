'use client';

import { IconSet as IconMap } from 'app/customization/icons';
import { useTheme } from 'app/design/theme';
import { useMemo } from 'react';
import { cssInterop } from 'nativewind';
import { SvgXml } from 'react-native-svg';

export function IconFromSet({ icon, width, height, size, _strokeWidth, color, cleanedClassName, rest }) {
    const { colors } = useTheme();
    const resolvedWidth = width || size;
    const resolvedHeight = height || size;
    const resolvedSize = size || (resolvedWidth && resolvedWidth === resolvedHeight ? resolvedWidth : undefined);

    const IconComponent = useMemo(() => {
        const IconComponent2 = IconMap[icon];
        if (!IconComponent2) return null;

        IconComponent2.displayName = icon;
        return cssInterop(IconComponent2, {
            className: {
                target: 'style',
                nativeStyleToProp: {
                    color: true,
                    width: true,
                    height: true,
                },
            },
        });
    }, [icon]);

    if (!IconComponent) {
        console.log('Icon not found:', icon);
        return null;
    }

    return (
        <IconComponent
            color={color || colors.default}
            width={resolvedWidth}
            height={resolvedHeight}
            size={resolvedSize}
            strokeWidth={_strokeWidth}
            className={cleanedClassName}
            {...rest}
        />
    );
}

export function XmlIcon({ origIcon, width, height, size, color, cleanedClassName, rest }) {
    return <SvgXml xml={origIcon} width={width || size} height={height || size} color={color} />;
}