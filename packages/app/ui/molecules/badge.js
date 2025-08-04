import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting } from 'app/lib/util';
const badgeTheme = appSetting('theme', 'badges');

function Badge({
    className = '',
    variant = "default",
    density, 
    children,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();

    return (
        <View
            className={`u-badge-base  ${badgeTheme['u-badge-base']} ${badgeTheme['u-badge-base-' + effectiveDensity]} ${badgeTheme['u-badge-' + variant + '-' + effectiveDensity]} ${className}`}
            {...props}
        >
            <Text
                className={`${badgeTheme['u-badge-text-' + effectiveDensity]} ${badgeTheme['u-badge-text-' + variant + '-' + effectiveDensity]}`}
            >
                {children}
            </Text>
        </View>
    );
}

export default Badge; 