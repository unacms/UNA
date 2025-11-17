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
        ...domProps
    } = props;
    if (onPress && !domProps.onClick) domProps.onClick = onPress;
    return domProps;
}

export const Text = ({
    children,
    className,
    fontFamily = '',
    numberOfLines,
    ...rest
}) => {
    /* const finalClassName = [className, fontFamily].filter(Boolean).join(' ') || undefined*/
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
export const H1 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h1' : NativeText

    return (
        <HeadingComponent className={`text-3xl lg:text-4xl tracking-tight font-bold text-foreground text-balance mb-2  ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h1' : NativeText
    return (
        <HeadingComponent className={`text-xl lg:text-2xl font-bold tracking-tight py-3 text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h2' : NativeText

    return (
        <HeadingComponent className={`text-xl xl:text-2xl font-bold tracking-tight my-2 text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h3' : NativeText

    return (
        <HeadingComponent className={`text-lg lg:text-xl font-bold tracking-tight py-1 text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h4' : NativeText

    return (
        <HeadingComponent className={`text-base lg:text-lg font-semibold tracking-tight text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h5' : NativeText
    return (
        <HeadingComponent className={`text-lg sm:text-xl font-semibold tracking-tight text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className, fontFamily = '', ...rest }) => {
    const HeadingComponent = isWeb ? 'h6' : NativeText
    return (
        <HeadingComponent className={` text-base sm:text-lg font-semibold tracking-tight text-foreground ${className || ''} ${fontFamily || 'font-main'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}
