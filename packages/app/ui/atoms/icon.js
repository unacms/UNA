'use client'

import { IconSet } from 'app/icons';
import { findIconFromRemote, appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo } from 'react';
import SvgIcons from 'app/icons-svg';
import { SvgXml } from 'react-native-svg';
import { cssInterop } from 'nativewind';

export function Icon(props) {
    const { icon, className, color, size, strokeWidth, ...rest } = props
    const { colors } = Theme();
    let isXmlSvg = false;

    if (typeof icon === 'string') {
        isXmlSvg = icon.startsWith('<svg');
    } else {
        console.log('Warning: Icon prop is not a string. Received:', icon);
    }

    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const processedIcon = findIconFromRemote(icon);

    const InlineIcon = SvgIcons[icon];

    //const IconComponent = useMemo(() => IconSet[processedIcon], [processedIcon]);

    const IconComponent = useMemo(() => {
        const IconComponent2 = IconSet[processedIcon];

        if (IconComponent2){
            IconComponent2.displayName = processedIcon;
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
        }
        return null;
    }, [processedIcon]);


    if (!icon)
        return null;

    if (InlineIcon)
        return <InlineIcon width={props.width || size} height={props.height || size} color={color} />;

    if (isXmlSvg)
        return <SvgXml xml={icon} width={props.width || size} height={props.height || size} color={color}/>

    if (!IconComponent) {
        console.log('Icon not found:', processedIcon);
        return null;
    }

    return (
        <IconComponent
            color={color || colors.default}
            size={size}
            strokeWidth={_strokeWidth}
            className={className}
            {...rest}
        />
    );
}

