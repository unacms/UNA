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
    emerald: { bg: 'bg-emerald-600/20', text: 'text-emerald-600 dark:text-emerald-400' },
    purple: { bg: 'bg-purple-600/20', text: ' text-purple-600 dark:text-purple-400' },
    red: { bg: 'bg-red-600/20', text: ' text-red-600 dark:text-red-400' },
    blue: { bg: 'bg-blue-600/20', text: ' text-blue-600 dark:text-blue-400' },
    green: { bg: 'bg-green-600/20', text: ' text-green-600 dark:text-green-400' },
    yellow: { bg: 'bg-yellow-600/20', text: ' text-yellow-600 dark:text-yellow-400' },
    orange: { bg: 'bg-orange-600/20', text: ' text-orange-600 dark:text-orange-400' },
    teal: { bg: 'bg-teal-600/20', text: ' text-teal-600 dark:text-teal-400' },
    sky: { bg: 'bg-sky-600/20', text: ' text-sky-600 dark:text-sky-400' },
    indigo: { bg: 'bg-indigo-600/20', text: ' text-indigo-600 dark:text-indigo-400' },
    pink: { bg: 'bg-pink-600/20', text: ' text-pink-600 dark:text-pink-400' },
    rose: { bg: 'bg-rose-600/20', text: ' text-rose-600 dark:text-rose-400' },
    gray: { bg: 'bg-gray-600/20', text: ' text-gray-600 dark:text-gray-400' },
    slate: { bg: 'bg-slate-600/20', text: ' text-slate-600 dark:text-slate-400' },
    zinc: { bg: 'bg-zinc-600/20', text: ' text-zinc-600 dark:text-zinc-400' },
    neutral: { bg: 'bg-neutral-600/20', text: ' text-neutral-600 dark:text-neutral-400' },
    stone: { bg: 'bg-stone-600/20', text: ' text-stone-600 dark:text-stone-400' },
    amber: { bg: 'bg-amber-600/20', text: ' text-amber-600 dark:text-amber-400' },
    lime: { bg: 'bg-lime-600/20', text: ' text-lime-600 dark:text-lime-400' },
    cyan: { bg: 'bg-cyan-600/20', text: ' text-cyan-600 dark:text-cyan-400' },
    violet: { bg: 'bg-violet-600/20', text: ' text-violet-600 dark:text-violet-400' },
    fuchsia: { bg: 'bg-fuchsia-600/20', text: ' text-fuchsia-600 dark:text-fuchsia-400' },
};

export default function Badge({ data, variant = "default", size = 'sm', rounded = false, children, className = '' }) {
    // Handle case where children are passed instead of data object
    if (children && !data) {
        return <>strange bage</>
        /*const containerClasses = size && badgeSizes[size]?.container || '';
        const pad = size && (children ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const defaultPadNoSize = !size ? 'px-1' : '';
        const variantTextClass = badgeTheme['u-badge-' + variant + '-text'];
        return (
            <View className={` self-start web:inline-flex items-center flex-row ${badgeTheme['u-badge-' + variant]} ${containerClasses} ${pad} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : (size && badgeSizes[size]?.rounded || 'rounded-md')} ${className}`}>
                <Text className={`${badgeTheme['u-badge-text']} ${variantTextClass}`}>
                    <Icon icon="BadgeCheck" size={size && badgeSizes[size]?.icon_size || 16} className={`${variantTextClass}`} />
                </Text>
                <Text className={`${badgeTheme['u-badge-text']} ${variantTextClass} ${size && badgeSizes[size]?.text || ''}`} >
                    {children}
                </Text>
            </View>
        );*/
    }

    // Ensure data exists to prevent undefined errors
    if (!data) {
        return null;
    }

    if (data.badge_url) {
        // PERSONAL BADGE, SSPECIFIED BY USER
        return (
            <Link href={data.badge_link}><View className={`rounded-md bg-muted web:hover:bg-secondary w-5 h-5 p-0.5 overflow-hidden ${className}`}><Image
                width={16}
                height={16}
                className='rounded'
                src={data.badge_url}
                alt={data.badge_url.title_attr}
            /></View></Link>
        );
    } else {
        data.icon = data.icon || 'BadgeCheck';

        // Check what to display based on is_icon_only setting
        const hasIcon = !!data.icon && isNaN(data.icon); // Always show icon if it exists
        const hasImage = !!data.icon_url;
        const hasText = data.text && !data.is_icon_only; // Only show text if not icon-only mode
        const hasBoth = hasIcon && hasText || hasImage && hasText;

        // Build base classes; default padding/rounding only if size not provided
        const baseClasses = `items-center flex-row self-start web:inline-flex`;

        // Container sizing and padding from size map
        const containerSize = size && badgeSizes[size]?.container || '';
        const roundedSize = size && badgeSizes[size]?.rounded || 'rounded-md ';
        const sizeSize = size && badgeSizes[size]?.icon_size || 14
        const pad = size && ((hasText || hasBoth) ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || '';
        const containerClasses = `${baseClasses} ${containerSize} ${pad}`.trim();
        const defaultPadNoSize = !size ? 'px-1' : '';

        // Apply theme or data.color for background using color mapping
        const mappedColor = data.color && colorMapping[data?.color?.toLowerCase().split("-")[0]];

        let backgroundClass, textColorClass;

        if (mappedColor) {
            backgroundClass = mappedColor.bg;
            textColorClass = mappedColor.text || 'text-white';
        } else {
            // Fallback to theme settings
            backgroundClass = badgeTheme['u-badge-' + variant];
            const variantTextClass = badgeTheme['u-badge-' + variant + '-text'] || badgeTheme['u-badge-text-' + variant] || '';
            textColorClass = variantTextClass;
        }

        return (
            <View className={`${containerClasses} ${backgroundClass} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : roundedSize} ${className}`}>
                {hasIcon && <Text className={`${badgeTheme['u-badge-text']} ${textColorClass}`}>
                    <Icon icon={data.icon} size={sizeSize} />
                </Text>}
                {hasImage && (
                    <View className={`${size && badgeSizes[size]?.image_container || ''}`}>
                        <Image
                            width={sizeSize}
                            height={sizeSize}
                            src={data.icon_url}
                        />
                    </View>
                )}
                {hasText && <Text className={`${badgeTheme['u-badge-text']} ${textColorClass} ${size && badgeSizes[size]?.text || ''} `} >
                    {data.text}
                </Text>}
            </View>
        );
    }
}