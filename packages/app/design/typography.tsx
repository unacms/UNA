import { Text as NativeText, Platform, type TextProps as RNTextProps } from 'react-native'
import type { ReactNode } from 'react'
import { decodeText } from 'app/lib/util'
import { appSetting } from 'app/lib/util'
const isWeb = Platform.OS === 'web'
// Use DOM element on web so Tailwind classes apply without NativeWind babel
const Text_: any = isWeb ? 'span' : NativeText

const noScale = isWeb  || appSetting('native', 'allow_font_scaling')? {} : { allowFontScaling: false }

/** Web-only DOM props callers pass through Text/headings (ignored on native). */
type WebTextExtras = {
    onClick?: (event: any) => void
    title?: string
    htmlFor?: string
    tabIndex?: number
}

export type TextProps = RNTextProps & WebTextExtras & {
    className?: string
    /** Font utility class; defaults to `font-main` (`font-title` for headings). */
    fontFamily?: string
}

export type HeadingProps = TextProps & {
    /** Drop the top/bottom spacing when the heading is the first/last block (`'true'` from UNA). */
    isfirst?: boolean | 'true' | 'false'
    islast?: boolean | 'true' | 'false'
    children?: ReactNode
}

function sanitizeWebTextProps(props: Record<string, any>) {
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
        nativeID,
        ...domProps
    } = props;
    if (accessibilityRole && !domProps.role) domProps.role = accessibilityRole;
    if (accessibilityLabel && !domProps['aria-label']) domProps['aria-label'] = accessibilityLabel;
    if (nativeID && !domProps.id) domProps.id = nativeID;
    if (onPress && !domProps.onClick) domProps.onClick = onPress;
    return domProps;
}

const getSpacing = (top: string, bottom: string, isfirst: HeadingProps['isfirst'], islast: HeadingProps['islast']) => {
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
    numberOfLines = undefined,
    ...rest
}: TextProps) => {
    const baseClassName = className || '  '
    let finalClassName = `${baseClassName} ${fontFamily || 'font-main'}`.trim()
    const spreadProps = isWeb ? sanitizeWebTextProps(rest) : rest
    const content = typeof children === "string" ? decodeText(children) : children;

    if (numberOfLines && isWeb)
        finalClassName += ' line-clamp-' + numberOfLines;

    return (
        <Text_ {...noScale} {...spreadProps} {...(!isWeb ? { numberOfLines } : {})} className={finalClassName} >
            {content}
        </Text_>
    )
}

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h1' : NativeText
    const spacing = getSpacing('mt-2', 'mb-6', isfirst, islast)

    return (
        <HeadingComponent {...noScale} className={`pt-2 text-4xl xl:text-5xl  tracking-tight leading-tight font-bold text-foreground text-balance ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H1C = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h1' : NativeText
    const spacing = getSpacing('pt-0', 'pb-4', isfirst, islast)

    return (
        <HeadingComponent {...noScale} className={`text-2xl sm:text-3xl font-bold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H2 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h2' : NativeText
    const spacing = getSpacing('pt-6', 'pb-4', isfirst, islast)

    return (
        <HeadingComponent {...noScale} className={`text-2xl font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
           {children}
        </HeadingComponent>
    )
}

export const H3 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h3' : NativeText
    const spacing = getSpacing('pt-4', 'pb-2', isfirst, islast)

    return (
        <HeadingComponent {...noScale} className={`text-lg lg:text-xl font-bold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H4 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h4' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent {...noScale} className={`text-base lg:text-lg font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H5 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h5' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent {...noScale} className={`text-lg sm:text-xl font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}

export const H6 = ({ children, className, fontFamily = '', isfirst, islast, ...rest }: HeadingProps) => {
    const HeadingComponent: any = isWeb ? 'h6' : NativeText
    const spacing = isfirst !== undefined ? getSpacing('pt-2', 'pb-1', isfirst, islast) : ''

    return (
        <HeadingComponent {...noScale} className={` text-base sm:text-lg font-semibold tracking-tight text-foreground ${spacing} ${className || ''} ${fontFamily || 'font-title'}`} {...(isWeb ? sanitizeWebTextProps(rest) : rest)}>
            {children}
        </HeadingComponent>
    )
}
