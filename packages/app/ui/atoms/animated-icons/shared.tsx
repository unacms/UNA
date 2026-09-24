'use client'

import { forwardRef, type ComponentType, type ForwardedRef } from 'react'
import { Animated, type ViewProps } from 'react-native'
import { Circle, G, Path, Rect } from 'react-native-svg'

/**
 * RN Animated injects `collapsable={false}` into animated components; that must not reach web SVG
 * (React 19 warns). Strip it in the leaf so it runs after Animated merges props.
 */
type SvgHostProps = {
    collapsable?: boolean
    onLayout?: (...args: unknown[]) => void
    [key: string]: unknown
}

function stripDomInvalid(Component: ComponentType<any>, displayName: string) {
    const Stripped = forwardRef(function Stripped(props: SvgHostProps, ref: ForwardedRef<unknown>) {
        const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props
        return <Component ref={ref} {...rest} />
    })
    Stripped.displayName = displayName
    return Stripped
}

export const AnimatedPath = Animated.createAnimatedComponent(stripDomInvalid(Path, 'PathStripDomInvalid'))
export const AnimatedRect = Animated.createAnimatedComponent(stripDomInvalid(Rect, 'RectStripDomInvalid'))
export const AnimatedCircle = Animated.createAnimatedComponent(stripDomInvalid(Circle, 'CircleStripDomInvalid'))
export const AnimatedG = Animated.createAnimatedComponent(stripDomInvalid(G, 'GStripDomInvalid'))

/** Props that must not reach DOM nodes (RN / Animated may inject these; web rejects some on `<path>`). */
export function omitUnsafeViewProps(rest: object | null | undefined): ViewProps {
    if (!rest || typeof rest !== 'object') return {}
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest as ViewProps & {
        collapsable?: boolean
    }
    return safe
}

export type AnimatedIconScenes = {
    fill?: boolean
    draw?: boolean
    morph?: boolean
    smoke?: boolean
    custom1?: boolean
    custom2?: boolean
    custom3?: boolean
    custom4?: boolean
    custom5?: boolean
    custom6?: boolean
}

export type AnimatedIconProps = {
    size?: number | string
    width?: number | string
    height?: number | string
    color?: string
    strokeWidth?: number
    className?: string
    active?: boolean
    pressed?: boolean
    hovered?: boolean
    scenes?: AnimatedIconScenes
    selected?: boolean
    onMouseEnter?: (event: unknown) => void
    onMouseLeave?: (event: unknown) => void
} & Omit<ViewProps, 'style' | 'children' | 'onLayout'>
