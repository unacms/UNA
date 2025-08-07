import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link'

const badgeTheme = appSetting('theme', 'badges');

export default function Badge({ data, variant = "default", children }) {
    // Handle case where children are passed instead of data object
    if (children && !data) {
        return (
            <View className={`u-badge-base ${badgeTheme['u-badge-base']} ${badgeTheme['u-badge-' + variant]} `}>
                <Icon icon="BadgeCheck" size={16} className={`${badgeTheme['u-badge-text-' + variant]}`} />
                <Text className={`${badgeTheme['u-badge-text']} ${badgeTheme['u-badge-text-' + variant]}`} >
                    {children}
                </Text>
            </View>
        );
    }

    // Ensure data exists to prevent undefined errors
    if (!data) {
        return null;
    }

    if (data.badge_url) {
        return (
            <Link href={data.badge_link}><View className="rounded-full w-6 h-6 overflow-hidden"><Image
                view="cover"
                src={data.badge_url}
                alt={data.badge_url.title_attr}
            /></View></Link>
        );
    } else {
        data.icon = data.icon || 'BadgeCheck';
        return (
            <View className={`u-badge-base ${badgeTheme['u-badge-base']} ${data.color ? 'bg-'+data.color : badgeTheme['u-badge-' + variant]}`}>
                {data.icon && <Icon icon={data.icon} size={16} className={`${data.color ? 'text-white' : badgeTheme['u-badge-text-' + variant]}`} />}
                {!data.is_icon_only && <Text className={`${badgeTheme['u-badge-text']} ${data.color ? 'text-white' : badgeTheme['u-badge-text-' + variant]}`} >
                    {data.text}
                </Text>}
            </View>
        );
    }


}