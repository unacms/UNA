import {
    ScrollView as RNScrollView,
    View as RNView,
    Pressable as RNPressable
} from 'react-native'
import { forwardRef } from 'react'
import { cssInterop } from 'nativewind'
import { cn } from 'app/lib/util'
import { Motion } from '@legendapp/motion'

const defaultInterop = { className: 'style' }

export const interopComponent = (Component, displayName, interopConfig = defaultInterop) => {
    const Base = forwardRef((props, ref) => <Component ref={ref} {...props} />)
    Base.displayName = displayName
    return cssInterop(Base, interopConfig)
}

export const interopRender = (displayName, render, interopConfig = defaultInterop) => {
    const Base = forwardRef(render)
    Base.displayName = displayName
    return cssInterop(Base, interopConfig)
}

export const View = interopComponent(RNView, 'View')
export const Pressable = interopComponent(RNPressable, 'Pressable')
export const ScrollView = interopComponent(RNScrollView, 'ScrollView')
export const MotionView = interopComponent(Motion.View, 'MotionView');

export const Row = interopRender(
    'Row',
    ({ children, className, ...props }, ref) => (
        <RNView
            ref={ref}
            className={cn('flex-row', className)}
            {...props}
        >
            {children}
        </RNView>
    )
)