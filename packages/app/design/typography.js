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
    const configuredFont = appSetting(isWeb ? 'web' : 'native', 'use_custom_font')
    const hasCustomFont = !!configuredFont
    const baseClassName = className || 'text-foreground text-base'
    const finalClassName = `${baseClassName} ${hasCustomFont ? (fontFamily || configuredFont) : ''}`.trim()
    const fontStyle = (!isWeb && hasCustomFont) ? { fontFamily: fontFamily || configuredFont } : {}
    const spreadProps = isWeb ? sanitizeWebTextProps(rest) : rest
    const content = typeof children === "string" ? decodeText(children) : children;
    return (
        <Text_ {...spreadProps} className={finalClassName} style={fontStyle} >
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
        <HeadingComponent className={ `text-2xl lg:text-3xl font-bold tracking-tight text-foreground lg:leading-10 text-balance py-3 web:duration-300 ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
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
        <HeadingComponent className={`text-xl lg:text-2xl font-bold tracking-tight py-2 text-foreground ${className || ''}`} {...(Platform.OS === 'web' ? sanitizeWebTextProps(rest) : rest)}>
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
