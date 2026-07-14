import { forwardRef } from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import {
    getBackdropBlurIntensity,
    stripBackdropBlurClasses,
} from 'app/design/backdrop-blur-utils'

/**
 * @typedef {Omit<import('react-native').ViewProps, 'role'> & {
 *   children?: import('react').ReactNode,
 *   className?: string,
 *   role?: import('react-native').ViewProps['role']
 * }} BackdropBlurViewProps
 */

/**
 * Uniwind OSS maps `backdrop-filter` to `{}` in its RN CSS processor — bare
 * `backdrop-blur-*` classes have no native effect unless we bridge them here.
 * Variant-prefixed classes stay in className for Uniwind breakpoint/state handling.
 * Does not force overflow-hidden — add it at call sites that need blur clipped to radius.
 */
export function createBackdropBlurView(RNViewComponent, { mapStyle } = {}) {
    /**
     * @param {BackdropBlurViewProps} props
     * @param {import('react').ForwardedRef<import('react-native').View>} ref
     */
    const Base = forwardRef(function BackdropBlurView(
        { className, style, children, ...props },
        ref,
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
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />
                {children}
            </RNViewComponent>
        )
    })

    Base.displayName = 'View'
    return Base
}
