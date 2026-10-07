import {
  View as RNView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
} from 'react-native'
import { forwardRef, type ComponentType } from 'react'
import { withUniwind } from 'uniwind'
import { Motion } from '@legendapp/motion'
import { iosContinuousCurveStyle } from 'app/design/corner-smoothing'
import type {
  DesignMotionViewProps,
  DesignPressableProps,
  DesignScrollViewProps,
  DesignViewProps,
} from './view.types'

// Merge style carefully (supports object/array/undefined)
const withIOSCurve = (style: any) => [iosContinuousCurveStyle, style].filter(Boolean)

// View
const ViewBase: any = forwardRef(({ style, ...props }: any, ref: any) => (
  <RNView ref={ref} style={withIOSCurve(style)} {...props} />
))
ViewBase.displayName = 'View'
export const View: ComponentType<DesignViewProps> = ViewBase

// Pressable
const PressableBase: any = forwardRef(({ style, ...props }: any, ref: any) => (
  <RNPressable ref={ref} style={withIOSCurve(style)} {...props} />
))
PressableBase.displayName = 'Pressable'
export const Pressable: ComponentType<DesignPressableProps> = PressableBase

// ScrollView
const ScrollViewBase: any = forwardRef(({ style, ...props }: any, ref: any) => (
  <RNScrollView ref={ref} style={withIOSCurve(style)} {...props} />
))
ScrollViewBase.displayName = 'ScrollView'
export const ScrollView: ComponentType<DesignScrollViewProps> = ScrollViewBase

// MotionView
const MotionViewBase: any = forwardRef(({ style, ...props }: any, ref: any) => (
  <Motion.View ref={ref} style={withIOSCurve(style)} {...props} />
))
MotionViewBase.displayName = 'MotionView'
export const MotionView: ComponentType<DesignMotionViewProps> = withUniwind(MotionViewBase) as any

// Row (flex-row + iOS curve)
const RowBase: any = forwardRef(({ children, className, style, ...props }: any, ref: any) => (
  <RNView
    ref={ref}
    className={['flex-row', className].filter(Boolean).join(' ')}
    style={withIOSCurve(style)}
    {...props}
  >
    {children}
  </RNView>
))
RowBase.displayName = 'Row'
export const Row: ComponentType<DesignViewProps> = RowBase
