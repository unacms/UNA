import { Text as NativeText, Platform } from 'react-native'
import { appSetting, decodeText, normalizeClasses } from 'app/lib/util'
import * as React from 'react'

const Text_ = NativeText
export const Text = React.forwardRef<NativeText, any>(({
    children,
    className,
    fontFamily,
    style: propStyle,
    ...rest
}, ref) => {
    const isWeb = Platform.OS == 'web'
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const isUseCustomFont = appSetting('native', 'use_custom_font')
    let finalClassName = normalizeClasses(
        `${className} ${isUseCustomFont ? fontFamily || isUseCustomFont : ''}`
    )
    const fontStyle =
        !isWeb && isUseCustomFont
            ? { fontFamily: fontFamily || isUseCustomFont }
            : {}
    const combinedStyle = [fontStyle, propStyle]
    return (
        <Text_ {...rest} className={finalClassName} style={combinedStyle} ref={ref}>
            {correctedChildren}
        </Text_>
    )
})

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
    const finalClassName = normalizeClasses(
        `text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 web:duration-300 ${
            isfirst === 'true' ? 'mt-0' : 'mt-4'
        } ${islast === 'true' ? 'mb-0' : 'mb-4'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
    const finalClassName = normalizeClasses(
        `text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-6'
        } ${islast === 'true' ? 'mb-0' : 'mb-3'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h2' : NativeText
    const finalClassName = normalizeClasses(
        `text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-6'
        } ${islast === 'true' ? 'mb-0' : 'mb-3'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h3' : NativeText
    const finalClassName = normalizeClasses(
        `text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-5'
        } ${islast === 'true' ? 'mb-0' : 'mb-2'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h4' : NativeText
    const finalClassName = normalizeClasses(
        `text-xl sm:text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-4'
        } ${islast === 'true' ? 'mb-0' : 'mb-2'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h5' : NativeText
    const finalClassName = normalizeClasses(
        `text-lg sm:text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-4'
        } ${islast === 'true' ? 'mb-0' : 'mb-1'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className, isfirst, islast, ...rest }) => {
    const correctedChildren =
        typeof children === 'string' ? decodeText(children) : children
    const HeadingComponent = Platform.OS === 'web' ? 'h6' : NativeText
    const finalClassName = normalizeClasses(
        ` text-base sm:text-lg font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 ${
            isfirst === 'true' ? 'mt-0' : 'mt-4'
        } ${islast === 'true' ? 'mb-0' : 'mb-1'} ${className || ''}`
    )
    return (
        <HeadingComponent className={finalClassName} {...rest}>
            {correctedChildren}
        </HeadingComponent>
    )
}
