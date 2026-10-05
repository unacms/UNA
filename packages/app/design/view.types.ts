// Public props of the design primitives, shared by view.tsx (Android / base),
// view.ios.tsx and view.web.tsx (DOM elements).
import type { ReactNode, Ref } from 'react'
import type {
    PressableProps as RNPressableProps,
    PressableStateCallbackType,
    ScrollViewProps as RNScrollViewProps,
    View as RNView,
    ViewProps as RNViewProps,
} from 'react-native'

/** DOM-only props the web primitives forward to the element (ignored on native). */
type WebExtras = {
    onMouseDown?: (event: any) => void
    onWheel?: (event: any) => void
    onMouseEnter?: (event: any) => void
    onMouseLeave?: (event: any) => void
    onKeyDown?: (event: any) => void
    tabIndex?: number
    title?: string
}

export type DesignViewProps = RNViewProps & WebExtras & {
    className?: string
    children?: ReactNode
    ref?: Ref<RNView>
}

export type DesignPressableProps = Omit<RNPressableProps, 'children'> & WebExtras & {
    className?: string
    children?: ReactNode | ((state: PressableStateCallbackType) => ReactNode)
    /** Web: render a real `<a href>` (status-bar preview, open in new tab); onPress still handles plain clicks. */
    href?: string
    target?: string
    rel?: string
    ref?: Ref<RNView>
}

export type DesignScrollViewProps = RNScrollViewProps & WebExtras & {
    className?: string
    /** Web: class of the inner content wrapper. */
    contentContainerClassName?: string
    ref?: Ref<any>
}

/** Legend Motion props; on web a small CSS-transition shim reads `animate` + `transition`. */
export type MotionProps = {
    animate?: Record<string, any>
    animateProps?: Record<string, any>
    initial?: Record<string, any>
    initialProps?: Record<string, any>
    exit?: Record<string, any>
    transition?: Record<string, any>
    transformOrigin?: Record<string, any>
    whileTap?: Record<string, any>
    whileHover?: Record<string, any>
    onAnimationComplete?: (...args: any[]) => void
}

export type DesignMotionViewProps = DesignViewProps & MotionProps
