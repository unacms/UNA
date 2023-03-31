import * as IconSet from "phosphor-react-native";
import { appSetting } from 'app/settings'

export function Icon(props) {
    let { icon, className, ...rest } = props

    let a = icon.split(' ')[0];
    let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }
    
    const IconComponent = IconSet[ic];

    return !IconComponent ? <></> : <IconComponent className={className} {...rest} />
}

