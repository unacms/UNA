import {
    ScrollView as RNScrollView,
    View as RNView,
    Pressable as RNPressable
} from 'react-native'
import { forwardRef } from 'react'
import { cssInterop } from 'nativewind'

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
export const Row = interopRender(
    'Row',
    ({ children, className, ...props }, ref) => (
        <RNView
            ref={ref}
            className={['flex-row', className].filter(Boolean).join(' ')}
            {...props}
        >
            {children}
        </RNView>
    )
)