'use client'

import { IconSet } from 'app/icons';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo } from 'react';
import SvgIcons from  'app/icons-svg';

export function Icon(props) {
    const { colors } = Theme();

    let { icon, className, color, size, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let  ic = a;

    const InlineIcon = SvgIcons[icon];

    const processedIcon = useMemo(() => {
        return icon.replace('far ', '').replace('fa-', '').replace('fa ', '').split(' ')[0];
    }, [icon]);


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
            className={className} 
            {...rest} 
        />
    );
}

