import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link'

const badgeTheme = appSetting('theme', 'badges');
const badgeSizes = appSetting('theme', 'badge_sizes');

export default function Badge({ data, variant = "default", size = '', rounded = false, children, className = '' }) {
    // Handle case where children are passed instead of data object
    if (children && !data) {
        const containerClasses = size && badgeSizes[size]?.container || '';
        const pad = size && (children ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const defaultPadNoSize = !size ? 'px-1' : '';
        return (
            <View className={`u-badge-base ${badgeTheme['u-badge-base']} ${badgeTheme['u-badge-' + variant]} ${containerClasses} ${pad} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : (size && badgeSizes[size]?.rounded || 'rounded-md')} ${className}`}>
                <Icon icon="BadgeCheck" size={size && badgeSizes[size]?.icon_size || 16} className={`${badgeTheme['u-badge-text-' + variant]}`} />
                <Text className={`${badgeTheme['u-badge-text']} ${size && badgeSizes[size]?.text || ''} ${badgeTheme['u-badge-text-' + variant]}`} >
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
            <Link href={data.badge_link}><View className={`rounded-full w-5 h-5 overflow-hidden ${className}`}><Image
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
        
        // Build base classes; default padding/rounding only if size not provided
        const baseClasses = `items-center flex-row`;
        
        // Container sizing and padding from size map
        const containerSize = size && badgeSizes[size]?.container || '';
        const pad = size && ((hasText || hasBoth) ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const containerClasses = `${baseClasses} ${containerSize} ${pad}`.trim();
        const defaultPadNoSize = !size ? 'px-1' : '';
        
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
            <View className={`${containerClasses} ${backgroundClass} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : ((size && badgeSizes[size]?.rounded) || 'rounded-md')} ${className}`}>
                {hasIcon && <Icon icon={data.icon} size={size && badgeSizes[size]?.icon_size || 14} className={textColorClass} />} 
                {hasText && <Text className={`${badgeTheme['u-badge-text']} ${size && badgeSizes[size]?.text || ''} ${textColorClass}`} >
                    {data.text}
                </Text>}
            </View>
        );
    }
}