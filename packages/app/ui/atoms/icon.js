import * as IconSet from "phosphor-react-native";
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';

export function Icon(props) {
    const { colors } = Theme();

    let { icon, className, color, size, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }
    
    const IconComponent = IconSet[ic];

    return !IconComponent ? <></> : <IconComponent color={color == '' ? colors.default : color} size={size} className={className} {...rest} />
}

