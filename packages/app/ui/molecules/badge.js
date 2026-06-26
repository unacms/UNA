import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link'
import { useTheme } from 'app/design/theme'
import { useResolveClassNames } from 'uniwind'

const badgeTheme = appSetting('theme', 'badges');
const badgeSizes = appSetting('theme', 'badge_sizes');

const colorMapping = {
    // Exact color names to Tailwind classes
    emerald: { bg: 'bg-emerald-600/20  ', text: 'text-emerald-700 dark:text-emerald-300' },
    purple: { bg: 'bg-purple-600/20', text: ' text-purple-700 dark:text-purple-300' },
    red: { bg: 'bg-red-600/20', text: ' text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-600/10', text: ' text-blue-600 dark:text-blue-400' },
    green: { bg: 'bg-green-600/20', text: ' text-green-700 dark:text-green-300' },
    yellow: { bg: 'bg-yellow-600/20', text: ' text-yellow-700 dark:text-yellow-300' },
    orange: { bg: 'bg-orange-600/20', text: ' text-orange-700 dark:text-orange-300' },
    teal: { bg: 'bg-teal-600/20', text: ' text-teal-700 dark:text-teal-300' },
    sky: { bg: 'bg-sky-600/20', text: ' text-sky-700 dark:text-sky-300' },
    indigo: { bg: 'bg-indigo-600/20', text: ' text-indigo-700 dark:text-indigo-300' },
    pink: { bg: 'bg-pink-600/20', text: ' text-pink-700 dark:text-pink-300' },
    rose: { bg: 'bg-rose-600/20', text: ' text-rose-700 dark:text-rose-300' },
    gray: { bg: 'bg-gray-600/20', text: ' text-gray-700 dark:text-gray-300' },
    slate: { bg: 'bg-slate-600/20', text: ' text-slate-700 dark:text-slate-300' },
    zinc: { bg: 'bg-zinc-600/20', text: ' text-zinc-700 dark:text-zinc-300' },
    neutral: { bg: 'bg-secondary-foreground/20', text: ' text-muted-foreground ' },
    stone: { bg: 'bg-stone-600/20', text: ' text-stone-700 dark:text-stone-300' },
    amber: { bg: 'bg-amber-600/20', text: ' text-amber-700 dark:text-amber-300' },
    lime: { bg: 'bg-lime-600/20', text: ' text-lime-700 dark:text-lime-300' },
    cyan: { bg: 'bg-cyan-600/20', text: ' text-cyan-700 dark:text-cyan-300' },
    violet: { bg: 'bg-violet-600/20', text: ' text-violet-700 dark:text-violet-300' },
    fuchsia: { bg: 'bg-fuchsia-600/20', text: ' text-fuchsia-700 dark:text-fuchsia-300' },
};

const isTruthyFlag = (value) => value === true || value === 1 || value === '1'

// Icon ignores layout/font utilities; pass only text-* tokens so Uniwind can
// resolve a stroke color on native (otherwise Icon falls back to colors.default ≈ black).
const extractTextColorClasses = (className = '') =>
    className
        .trim()
        .split(/\s+/)
        .filter((token) => token.startsWith('text-') || token.startsWith('dark:text-'))
        .join(' ')

const rawColorValue = (color) => {
    if (!color || typeof color !== 'string') return null
    const value = color.trim()
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return value
    if (/^rgba?\(/i.test(value)) return value
    return null
}

function BadgeIcon({ icon, size, textColorClass, rawColor }) {
    const { colors } = useTheme()
    const iconColorClass = extractTextColorClasses(textColorClass) || 'text-primary'
    const hasTextColorClass = /\b(?:dark:)?text-/.test(iconColorClass)
    const resolved = useResolveClassNames(iconColorClass)
    // Web SSR: resolving text-* to inline color can fall back to primary and mismatch hydration.
    // Inline Lucide icons inherit stroke via currentColor + className (see iconset.web.js).
    const color = hasTextColorClass
        ? 'currentColor'
        : (rawColorValue(rawColor) || resolved?.color || colors.primary)

    return <Icon icon={icon} size={size} className={iconColorClass} color={color} />
}

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
        // PERSONAL BADGE, SPECIFIED BY USER
        const imgSize = size && badgeSizes[size]?.icon_size || 14;
        const containerSize = size && badgeSizes[size]?.container || 'min-w-5 h-5';
        const roundedSize = size && badgeSizes[size]?.rounded || 'rounded';
        return (
            <Link href={data.badge_link}>
                <View className={`${containerSize} ${roundedSize} relative overflow-hidden bg-muted items-center justify-center ${className}`}>
                    <Image
                        width={imgSize}
                        height={imgSize}
                        view="cover"
                        src={data.badge_url}
                        alt={data.badge_url.title_attr}
                    />
                    <View
                        pointerEvents="none"
                        className={`absolute inset-0 ${roundedSize} shadow-xs dark:shadow-xs-deep`}
                    />
                </View>
            </Link>
        );
    } else {
        data.icon = data.icon || 'CheckMark';

        const isIconOnly = isTruthyFlag(data.is_icon_only) || isTruthyFlag(data.icon_only)
        const hasIcon = !!data.icon && isNaN(data.icon)
        const hasImage = !!data.icon_url
        const hasText = data.text && !isIconOnly
        const hasBoth = hasIcon && hasText || hasImage && hasText
        const sizeSize = size && badgeSizes[size]?.icon_size || 14

        // Apply theme or data.color for text/icon color
        const mappedColor = data.color && colorMapping[data?.color?.toLowerCase().split("-")[0]]
        let backgroundClass, textColorClass
        if (mappedColor) {
            backgroundClass = mappedColor.bg
            textColorClass = mappedColor.text || 'text-white'
        } else {
            backgroundClass = badgeTheme['u-badge-' + variant]
            textColorClass = badgeTheme['u-badge-' + variant + '-text'] || badgeTheme['u-badge-text-' + variant] || ''
        }

        // UNA icon-only badges: show the icon/image alone, no pill background.
        if (isIconOnly && (hasIcon || hasImage)) {
            const iconOnlyContent = hasIcon ? (
                <BadgeIcon icon={data.icon} size={sizeSize} textColorClass={textColorClass} rawColor={data.color} />
            ) : (
                <Image
                    width={sizeSize}
                    height={sizeSize}
                    src={data.icon_url}
                />
            )
            const href = data.badge_link || data.link
            if (href) {
                return (
                    <Link href={href} className={className}>
                        {iconOnlyContent}
                    </Link>
                )
            }
            return (
                <View className={`items-center justify-center ${className}`}>
                    {iconOnlyContent}
                </View>
            )
        }

        // Build base classes; default padding/rounding only if size not provided
        const baseClasses = `items-center flex-row web:inline-flex`
        const containerSize = size && badgeSizes[size]?.container || ''
        const roundedSize = size && badgeSizes[size]?.rounded || 'rounded-md '
        const pad = size && ((hasText || hasBoth) ? badgeSizes[size]?.wide_padding : badgeSizes[size]?.padding) || ''
        const containerClasses = `${baseClasses} ${containerSize} ${pad}`.trim()
        const defaultPadNoSize = !size ? 'px-1' : ''

        return (
            <View className={`${containerClasses} ${backgroundClass} ${defaultPadNoSize} ${rounded ? (typeof rounded === 'string' ? rounded : 'rounded-full') : roundedSize} ${className}`}>
                {hasIcon && <BadgeIcon icon={data.icon} size={sizeSize} textColorClass={textColorClass} rawColor={data.color} />}
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