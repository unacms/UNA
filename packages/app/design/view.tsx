import {
    ScrollView as RNScrollView,
    View as RNView,
    Pressable as RNPressable
} from 'react-native'
import { forwardRef, type ComponentType, type ForwardRefRenderFunction } from 'react'
import { withUniwind } from 'uniwind'
import { cn } from 'app/lib/util'
import { Motion } from '@legendapp/motion'
import { createBackdropBlurView } from 'app/design/backdrop-blur-view'
import type {
    DesignMotionViewProps,
    DesignPressableProps,
    DesignScrollViewProps,
    DesignViewProps,
} from './view.types'

export const interopComponent = (Component: ComponentType<any>, displayName: string): any => {
    const Base: any = forwardRef((props, ref) => <Component ref={ref} {...props} />)
    Base.displayName = displayName
    return Base
}

export const interopRender = (displayName: string, render: ForwardRefRenderFunction<any, any>): any => {
    const Base: any = forwardRef(render)
    Base.displayName = displayName
    return Base
}

export const View: ComponentType<DesignViewProps> = createBackdropBlurView(RNView)
// Strip web-only anchor props (see view.web.tsx: href renders a real <a>).
export const Pressable: ComponentType<DesignPressableProps> = interopRender(
    'Pressable',
    ({ href: _href, target: _target, rel: _rel, ...props }: DesignPressableProps, ref: any) => (
        <RNPressable ref={ref} {...props} />
    )
)
export const ScrollView: ComponentType<DesignScrollViewProps> = interopComponent(RNScrollView, 'ScrollView')
export const MotionView: ComponentType<DesignMotionViewProps> = withUniwind(Motion.View) as any

export const Row: ComponentType<DesignViewProps> = interopRender(
    'Row',
    ({ children, className, ...props }: DesignViewProps, ref: any) => (
        <View
            ref={ref}
            className={cn('flex-row', className)}
            {...props}
        >
            {children}
        </View>
    )
)
