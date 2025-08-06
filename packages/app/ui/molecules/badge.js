import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
const badgeTheme = appSetting('theme', 'badges');

function Badge({
    className = '',
    variant = "default",
    density, 
    children,
    ...props
}) {


    return (
        <View
            className={`u-badge-base ${badgeTheme['u-badge-base']} ${badgeTheme['u-badge-' + variant]} ${className}`}
            {...props}
        >
            <Text className={`${badgeTheme['u-badge-text']} ${badgeTheme['u-badge-text-' + variant]}`} >
                {children}
            </Text>
        </View>
    );
}

export default Badge; 