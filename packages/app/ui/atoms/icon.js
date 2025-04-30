'use client'

import { IconSet } from 'app/icons';
import { findIconFromRemote, appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo } from 'react';
import SvgIcons from  'app/icons-svg';
import { SvgXml } from 'react-native-svg';

export function Icon(props) {
    const { icon, className, color, size, strokeWidth, ...rest } = props
    const { colors } = Theme();
    const isXmlSvg = icon.startsWith('<svg');

    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const processedIcon = findIconFromRemote(icon);

    const InlineIcon = SvgIcons[icon];

    const IconComponent = useMemo(() => IconSet[processedIcon], [processedIcon]);
    if (InlineIcon)
        return <InlineIcon width={props.width || size} height={props.height || size} color={color} />;

    if (isXmlSvg) 
        return <SvgXml xml={icon} width={props.width || size} height={props.height || size} />

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

