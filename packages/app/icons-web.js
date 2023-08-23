'use client'

import { IconSet as IconSetDedault } from './icons-web.default';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { Airplane}  

from "@phosphor-icons/react";

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects change some specific static components here if needed

const IconSet = {
	'Airplane': Airplane,
	...IconSetDedault
}

export default function Icon(props) {

    
    const { colors } = Theme();
    let { icon, className, color, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }
    
    const IconComponent = IconSet[ic];
    if (!IconComponent)
        console.log('Icon not found:', ic);

    return !IconComponent ? <></> : <IconComponent color={color == '' ? colors.default : color} className={className} {...rest} />
}