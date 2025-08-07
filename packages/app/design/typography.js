import { Text as NativeText, Platform } from 'react-native'
import { appSetting, decodeText, normalizeClasses } from 'app/lib/util'
import * as React from 'react'

const Text_ = NativeText

export const Text =({
    children,
    className,
    fontFamily = '',
    ...rest
}) => {
    const isWeb = Platform.OS == 'web'
    const isUseCustomFont = appSetting('native', 'use_custom_font')
    const finalClassName = `${className} ${isUseCustomFont ? fontFamily || isUseCustomFont : ''}`
    const fontStyle = (!isWeb && !!isUseCustomFont) ? { fontFamily: fontFamily || isUseCustomFont } : {}
    return (
        <Text_ {...rest} className={finalClassName} style={fontStyle} >
            {children}
        </Text_>
    )
}

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
       
    return (
        <HeadingComponent className={ `text-3xl sm:text-4xl font-bold tracking-tight text-foreground web:duration-300 ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h1' : NativeText
    return (
        <HeadingComponent className={`text-3xl lg:text-4xl font-bold tracking-tight text-foreground ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h2' : NativeText

    return (
        <HeadingComponent className={`text-2xl sm:text-3xl font-bold tracking-tight text-foreground ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h3' : NativeText
    
    return (
        <HeadingComponent className={`text-xl sm:text-2xl font-bold tracking-tight text-foreground ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h4' : NativeText
         
    return (
        <HeadingComponent className={`text-xl sm:text-2xl font-semibold tracking-tight text-foreground`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h5' : NativeText
    return (
        <HeadingComponent className={`text-lg sm:text-xl font-semibold tracking-tight text-foreground ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className,  ...rest }) => {
    const HeadingComponent = Platform.OS === 'web' ? 'h6' : NativeText
    return (
        <HeadingComponent className={` text-base sm:text-lg font-semibold tracking-tight text-foreground ${className || ''}`} {...rest}>
            {children}
        </HeadingComponent>
    )
}
