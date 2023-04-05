import * as IconSet from "@phosphor-icons/react";
import { appSetting } from 'app/lib/util'

export function Icon(props) {
    let { icon, className, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }
    
    const IconComponent = IconSet[ic];

    return !IconComponent ? <></> : <IconComponent className={className} {...rest} />
}
