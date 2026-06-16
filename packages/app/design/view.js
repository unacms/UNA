import {
    ScrollView as RNScrollView,
    View as RNView,
    Pressable as RNPressable
} from 'react-native'
import { forwardRef } from 'react'
import { withUniwind } from 'uniwind'
import { cn } from 'app/lib/util'
import { Motion } from '@legendapp/motion'
import { createBackdropBlurView } from 'app/design/backdrop-blur-view'

export const interopComponent = (Component, displayName) => {
    /** @type {any} */
    const Base = forwardRef((props, ref) => <Component ref={ref} {...props} />)
    Base.displayName = displayName
    return Base
}

export const interopRender = (displayName, render) => {
    /** @type {any} */
    const Base = forwardRef(render)
    Base.displayName = displayName
    return Base
}

export const View = createBackdropBlurView(RNView)
/** On iOS, shadow shell avoids continuous corners; elsewhere same as View. */
export const ShadowShell = View
export const Pressable = interopComponent(RNPressable, 'Pressable')
export const ScrollView = interopComponent(RNScrollView, 'ScrollView')
export const MotionView = withUniwind(Motion.View)

export const Row = interopRender(
    'Row',
    ({ children, className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn('flex-row', className)}
            {...props}
        >
            {children}
        </View>
    )
)
