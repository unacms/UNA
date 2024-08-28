'use client'

import { IconSet } from 'app/icons';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';

export function Icon(props) {
    const { colors } = Theme();

    let { icon, className, color, size, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let  ic = a;
    /*let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }*/
    
    const IconComponent = IconSet[ic];

    if (!IconComponent)
        console.log('Icon not found:', ic);

    return !IconComponent ? <></> : <IconComponent color={color ? colors : colors.default} size={size} className={className} {...rest} />
}

