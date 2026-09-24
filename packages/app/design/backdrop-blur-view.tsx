import { forwardRef, type ComponentType, type ForwardedRef, type ReactNode } from 'react'
import { StyleSheet, type StyleProp, type View, type ViewProps, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import {
    getBackdropBlurIntensity,
    stripBackdropBlurClasses,
} from 'app/design/backdrop-blur-utils'

export type BackdropBlurViewProps = Omit<ViewProps, 'role'> & {
    children?: ReactNode
    className?: string
    role?: ViewProps['role']
}

type CreateBackdropBlurViewOptions = {
    mapStyle?: (style: StyleProp<ViewStyle>) => StyleProp<ViewStyle>
}

/**
 * Uniwind OSS maps `backdrop-filter` to `{}` in its RN CSS processor — bare
 * `backdrop-blur-*` classes have no native effect unless we bridge them here.
 * Variant-prefixed classes stay in className for Uniwind breakpoint/state handling.
 * Does not force overflow-hidden — add it at call sites that need blur clipped to radius.
 */
export function createBackdropBlurView(
    RNViewComponent: ComponentType<any>,
    { mapStyle }: CreateBackdropBlurViewOptions = {},
) {
    const Base = forwardRef(function BackdropBlurView(
        { className, style, children, ...props }: BackdropBlurViewProps,
        ref: ForwardedRef<View>,
    ) {
        const intensity = getBackdropBlurIntensity(className || '')
        const resolvedStyle = mapStyle ? mapStyle(style) : style

        if (!intensity) {
            return (
                <RNViewComponent
                    ref={ref}
                    className={className}
                    style={resolvedStyle}
                    {...props}
                >
                    {children}
                </RNViewComponent>
            )
        }

        return (
            <RNViewComponent
                ref={ref}
                className={stripBackdropBlurClasses(className || '')}
                style={resolvedStyle}
                {...props}
            >
                <BlurView
                    intensity={intensity}
                    tint="systemMaterial"
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                {children}
            </RNViewComponent>
        )
    })

    Base.displayName = 'View'
    return Base
}
