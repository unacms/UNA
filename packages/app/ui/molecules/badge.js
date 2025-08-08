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
            <View className={`u-badge-base ${badgeTheme['u-badge-base']} gap-1 ${badgeTheme['u-badge-' + variant]} `}>
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
            <Link href={data.badge_link}><View className="rounded-full w-5 h-5 overflow-hidden"><Image
                view="cover"
                src={data.badge_url}
                alt={data.badge_url.title_attr}
            /></View></Link>
        );
    } else {
        data.icon = data.icon || 'BadgeCheck';
        
        // Check what to display based on is_icon_only setting
        const hasIcon = !!data.icon; // Always show icon if it exists
        const hasText = data.text && !data.is_icon_only; // Only show text if not icon-only mode
        const hasBoth = hasIcon && hasText;
        
        // Build base classes with theme settings
        const baseClasses = `items-center rounded-md flex-row h-5 px-1`;
        
        // Add gap-1 only when both elements are present
        const containerClasses = hasBoth ? `${baseClasses} gap-1` : baseClasses;
        
        // Apply theme or data.color for background using color mapping
        const colorMapping = badgeTheme.color_mapping || {};
        const mappedColor = data.color && colorMapping[data.color];
        

        
        let backgroundClass, textColorClass;
        
        if (mappedColor) {
            // Use mapped color classes (includes both bg and text)
            const parts = mappedColor.split(' ');
            backgroundClass = parts.find(part => part.startsWith('bg-')) || '';
            textColorClass = parts.find(part => part.startsWith('text-')) || 'text-white';
        } else {
            // Fallback to theme settings
            backgroundClass = badgeTheme['u-badge-' + variant];
            textColorClass = badgeTheme['u-badge-text-' + variant];
        }
        
        return (
            <View className={`${containerClasses} ${backgroundClass}`}>
                {hasIcon && <Icon icon={data.icon} size={14} className={textColorClass} />}
                {hasText && <Text className={`${badgeTheme['u-badge-text']} ${textColorClass}`} >
                    {data.text}
                </Text>}
            </View>
        );
    }
}