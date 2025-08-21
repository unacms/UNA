import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link'

const badgeTheme = appSetting('theme', 'badges');
const badgeSizes = appSetting('theme', 'badge_sizes');

const colorMapping = {
                // Exact color names to Tailwind classes
                emerald: 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
                'emerald-600': 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
                purple: 'bg-purple-600/20 text-purple-600 dark:text-purple-400',
                'purple-600': 'bg-purple-600/20 text-purple-600 dark:text-purple-400',
                Purple: 'bg-purple-600/20 text-purple-600 dark:text-purple-400', // Handle capitalization
                red: 'bg-red-600/20 text-red-600 dark:text-red-400',
                'red-600': 'bg-red-600/20 text-red-600 dark:text-red-400',
                blue: 'bg-blue-600/20 text-blue-600 dark:text-blue-400',
                'blue-600': 'bg-blue-600/20 text-blue-600 dark:text-blue-400',
                green: 'bg-green-600/20 text-green-600 dark:text-green-400',
                'green-600': 'bg-green-600/20 text-green-600 dark:text-green-400',
                yellow: 'bg-yellow-600/20 text-yellow-600 dark:text-yellow-400',
                'yellow-600': 'bg-yellow-600/20 text-yellow-600 dark:text-yellow-400',
                orange: 'bg-orange-600/20 text-orange-600 dark:text-orange-400',
                'orange-600': 'bg-orange-600/20 text-orange-600 dark:text-orange-400',
                teal: 'bg-teal-600/20 text-teal-600 dark:text-teal-400',
                'teal-600': 'bg-teal-600/20 text-teal-600 dark:text-teal-400',
                sky: 'bg-sky-600/20 text-sky-600 dark:text-sky-400',
                'sky-600': 'bg-sky-600/20 text-sky-600 dark:text-sky-400',
                indigo: 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-400',
                'indigo-600': 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-400',
                pink: 'bg-pink-600/20 text-pink-600 dark:text-pink-400',
                'pink-600': 'bg-pink-600/20 text-pink-600 dark:text-pink-400',
                rose: 'bg-rose-600/20 text-rose-600 dark:text-rose-400',
                'rose-600': 'bg-rose-600/20 text-rose-600 dark:text-rose-400',
                gray: 'bg-gray-600/20 text-gray-600 dark:text-gray-400',
                'gray-600': 'bg-gray-600/20 text-gray-600 dark:text-gray-400',
                slate: 'bg-slate-600/20 text-slate-600 dark:text-slate-400',
                'slate-600': 'bg-slate-600/20 text-slate-600 dark:text-slate-400',
                zinc: 'bg-zinc-600/20 text-zinc-600 dark:text-zinc-400',
                'zinc-600': 'bg-zinc-600/20 text-zinc-600 dark:text-zinc-400',
                neutral: 'bg-neutral-600/20 text-neutral-600 dark:text-neutral-400',
                'neutral-600': 'bg-neutral-600/20 text-neutral-600 dark:text-neutral-400',
                stone: 'bg-stone-600/20 text-stone-600 dark:text-stone-400',
                'stone-600': 'bg-stone-600/20 text-stone-600 dark:text-stone-400',
                amber: 'bg-amber-600/20 text-amber-600 dark:text-amber-400',
                'amber-600': 'bg-amber-600/20 text-amber-600 dark:text-amber-400',
                lime: 'bg-lime-600/20 text-lime-600 dark:text-lime-400',
                'lime-600': 'bg-lime-600/20 text-lime-600 dark:text-lime-400',
                cyan: 'bg-cyan-600/20 text-cyan-600 dark:text-cyan-400',
                'cyan-600': 'bg-cyan-600/20 text-cyan-600 dark:text-cyan-400',
                violet: 'bg-violet-600/20 text-violet-600 dark:text-violet-400',
                'violet-600': 'bg-violet-600/20 text-violet-600 dark:text-violet-400',
                fuchsia: 'bg-fuchsia-600/20 text-fuchsia-600 dark:text-fuchsia-400',
                'fuchsia-600': 'bg-fuchsia-600/20 text-fuchsia-600 dark:text-fuchsia-400',
            };

export default function Badge({ data, variant = "default", size = 'sm', rounded = false, children, className = '' }) {
    // Handle case where children are passed instead of data object
    if (children && !data) {
        const containerClasses = size && badgeSizes[size]?.container || '';
        const pad = size && (children ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const defaultPadNoSize = !size ? 'px-1' : '';
        const variantTextClass = badgeTheme['u-badge-' + variant + '-text'] ;
        return (
            <View className={` self-start web:inline-flex items-center flex-row ${badgeTheme['u-badge-' + variant]} ${containerClasses} ${pad} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : (size && badgeSizes[size]?.rounded || 'rounded-md')} ${className}`}>
                <Text className={`${badgeTheme['u-badge-text']} ${variantTextClass}`}>
                    <Icon icon="BadgeCheck" size={size && badgeSizes[size]?.icon_size || 16} className={`${variantTextClass}`} />
                </Text>
                <Text className={`${badgeTheme['u-badge-text']} ${variantTextClass} ${size && badgeSizes[size]?.text || ''}`} >
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
            <Link href={data.badge_link}><View className={`rounded-md w-5 h-5 overflow-hidden ${className}`}><Image
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
        const baseClasses = `items-center flex-row self-start web:inline-flex`;
        
        // Container sizing and padding from size map
        const containerSize = size && badgeSizes[size]?.container || '';
        const pad = size && ((hasText || hasBoth) ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const containerClasses = `${baseClasses} ${containerSize} ${pad}`.trim();
        const defaultPadNoSize = !size ? 'px-1' : '';
        
        // Apply theme or data.color for background using color mapping
        const mappedColor = data.color && colorMapping[data.color];
        
        let backgroundClass, textColorClass;
        
        if (mappedColor) {
            // Use mapped color classes (may include bg-, text-, and dark: variants)
            const parts = mappedColor.split(/\s+/).filter(Boolean);
            const bgParts = parts.filter(part => part.startsWith('bg-') || part.startsWith('dark:bg-'));
            const textParts = parts.filter(part => part.startsWith('text-') || part.startsWith('dark:text-'));
            backgroundClass = bgParts.join(' ');
            textColorClass = textParts.join(' ') || 'text-white';
        } else {
            // Fallback to theme settings
            backgroundClass = badgeTheme['u-badge-' + variant];
            const variantTextClass = badgeTheme['u-badge-' + variant + '-text'] || badgeTheme['u-badge-text-' + variant] || '';
            textColorClass = variantTextClass;
        }
        
        return (
            <View className={`${containerClasses} ${backgroundClass} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : ((size && badgeSizes[size]?.rounded) || 'rounded-md')} ${className}`}>
                {hasIcon && <Text className={`${badgeTheme['u-badge-text']} ${textColorClass}`}>
                    <Icon icon={data.icon} size={size && badgeSizes[size]?.icon_size || 14} className={textColorClass} />
                </Text>}
                {hasText && <Text className={`${badgeTheme['u-badge-text']} ${textColorClass} ${size && badgeSizes[size]?.text || ''} `} >
                    {data.text}
                </Text>}
            </View>
        );
    }
}