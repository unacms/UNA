import { Text as NativeText, Platform } from 'react-native'
import { appSetting, decodeText, htmlDecode, normalizeClasses } from 'app/lib/util'
import * as React from 'react'

// Use DOM element on web so Tailwind classes apply without NativeWind babel
const Text_ = Platform.OS === 'web' ? 'span' : NativeText

function sanitizeWebTextProps(props) {
    if (!props || Platform.OS !== 'web') return props;
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

export const Text =({
    children,
    className,
    fontFamily = '',
    ...rest
}) => {
    const isWeb = Platform.OS == 'web'
    const finalClassName = [className, fontFamily].filter(Boolean).join(' ') || undefined
    const spreadProps = isWeb ? sanitizeWebTextProps(rest) : rest
    const content = typeof children === "string" ? decodeText(children) : children;
    return (
        <Text_ {...spreadProps} className={finalClassName} >
            {content}
        </Text_>
    )
}

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
       
    return (
        <HeadingComponent className={ `text-3xl lg:text-4xl tracking-tight font-bold text-foreground text-balance ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
    return (
        <HeadingComponent className={`text-xl lg:text-2xl font-bold tracking-tight py-3 text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h2' : NativeText

    return (
        <HeadingComponent className={`text-xl xl:text-2xl font-bold tracking-tight text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h3' : NativeText
    
    return (
        <HeadingComponent className={`text-lg lg:text-xl font-bold tracking-tight py-1 text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h4' : NativeText
         
    return (
        <HeadingComponent className={`text-base lg:text-lg font-semibold tracking-tight text-foreground`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h5' : NativeText
    return (
        <HeadingComponent className={`text-lg sm:text-xl font-semibold tracking-tight text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className,  ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h6' : NativeText
    return (
        <HeadingComponent className={` text-base sm:text-lg font-semibold tracking-tight text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}
