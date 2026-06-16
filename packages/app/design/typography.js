import { Text as NativeText, Platform } from 'react-native'
import { decodeText } from 'app/lib/util'

const isWeb = Platform.OS === 'web'
// Use DOM element on web so Tailwind classes apply without NativeWind babel
const Text_ = isWeb ? 'span' : NativeText

function sanitizeWebTextProps(props) {
    if (!props || !isWeb) return props;
    const {
        accessible,
        accessibilityRole,
        accessibilityLabel,
        accessibilityHint,
        allowFontScaling,
        ellipsizeMode,
        numberOfLines,
        selectable,
        textBreakStrategy,
        maxFontSizeMultiplier,
        onPress,
        onLongPress,
        onTextLayout,
        ...domProps
    } = props;
    if (onPress && !domProps.onClick) domProps.onClick = onPress;
    return domProps;
}

const getSpacing = (top, bottom, isfirst, islast) => {
    if (isfirst === undefined && islast === undefined) {
        return `${top} ${bottom}`
    }
    const isFirst = isfirst === 'true' || isfirst === true
    const isLast = islast === 'true' || islast === true

    const t = isFirst ? 'mt-0 pt-0' : top
    const b = isLast ? 'mb-0 pb-0' : bottom
    return `${t} ${b}`
}


export const Text = ({
    children,
    className,
    fontFamily = '',
    numberOfLines,
    ...rest
}) => {
    const baseClassName = className || '  '
    let finalClassName = `${baseClassName} ${fontFamily || 'font-main'}`.trim()
    const spreadProps = isWeb ? sanitizeWebTextProps(rest) : rest
    const content = typeof children === "string" ? decodeText(children) : children;

    if (numberOfLines && isWeb)
        finalClassName += ' line-clamp-' + numberOfLines;

    return (
        <Text_ {...spreadProps} {...(!isWeb ? { numberOfLines } : {})} className={finalClassName} >
            {content}
        </Text_>
    )
}

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h1' : NativeText
    const spacing = getSpacing('pt-8', 'pb-6', isfirst, islast)

    return (
        <HeadingComponent className={`text-4xl lg:text-5xl tracking-tight font-semibold text-foreground text-balance ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h1' : NativeText
    const spacing = getSpacing('pt-0', 'pb-2', isfirst, islast)

    return (
        <HeadingComponent className={`text-2xl lg:text-3xl font-bold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h2' : NativeText
    const spacing = getSpacing('pt-6', 'pb-4', isfirst, islast)

    return (
        <HeadingComponent className={`text-2xl font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h3' : NativeText
    const spacing = getSpacing('pt-4', 'pb-2', isfirst, islast)

    return (
        <HeadingComponent className={`text-lg lg:text-xl font-bold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h4' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent className={`text-base lg:text-lg font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h5' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent className={`text-lg sm:text-xl font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }) => {
    const HeadingComponent = isWeb ? 'h6' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent className={` text-base sm:text-lg font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}
