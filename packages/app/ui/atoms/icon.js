'use client'

import { IconSet } from 'app/icons';
import { findIconFromRemote, appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo } from 'react';
import SvgIcons from  'app/icons-svg';

export function Icon(props) {
    const { colors } = Theme();

    let { icon, className, color, size, strokeWidth, ...rest } = props
    strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const processedIcon = findIconFromRemote(icon);

    const InlineIcon = SvgIcons[icon];

    /*const processedIcon = useMemo(() => {
        return icon.replace('far ', '').replace('fa-', '').replace('fa ', '').split(' ')[0];
    }, [icon]);*/


    const IconComponent = useMemo(() => IconSet[processedIcon], [processedIcon]);
    if (InlineIcon)
        return <InlineIcon width={props.width || size} height={props.height || size} color={color} />;

    if (!IconComponent) {
        console.log('Icon not found:', processedIcon);
        return null; // return null and not an empty element
    }

    return (
        <IconComponent 
            color={color || colors.default} 
            size={size} 
            strokeWidth={strokeWidth}
            className={className} 
            {...rest} 
        />
    );
}

