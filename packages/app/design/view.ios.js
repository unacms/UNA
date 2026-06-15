import {
  View as RNView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
} from 'react-native'
import { forwardRef } from 'react'
import { withUniwind } from 'uniwind'
import { Motion } from '@legendapp/motion'

const iosContinuousCurveStyle = { borderCurve: 'continuous' }

// Merge style carefully (supports object/array/undefined)
const withIOSCurve = (style) => [iosContinuousCurveStyle, style].filter(Boolean)

// View
/** @type {any} */
const ViewBase = forwardRef(({ style, ...props }, ref) => (
  <RNView ref={ref} style={withIOSCurve(style)} {...props} />
))
ViewBase.displayName = 'View'
export const View = ViewBase

// Pressable
/** @type {any} */
const PressableBase = forwardRef(({ style, ...props }, ref) => (
  <RNPressable ref={ref} style={withIOSCurve(style)} {...props} />
))
PressableBase.displayName = 'Pressable'
export const Pressable = PressableBase

// ScrollView
/** @type {any} */
const ScrollViewBase = forwardRef(({ style, ...props }, ref) => (
  <RNScrollView ref={ref} style={withIOSCurve(style)} {...props} />
))
ScrollViewBase.displayName = 'ScrollView'
export const ScrollView = ScrollViewBase

// MotionView
/** @type {any} */
const MotionViewBase = forwardRef(({ style, ...props }, ref) => (
  <Motion.View ref={ref} style={withIOSCurve(style)} {...props} />
))
MotionViewBase.displayName = 'MotionView'
export const MotionView = withUniwind(MotionViewBase)

// Row (flex-row + iOS curve)
/** @type {any} */
const RowBase = forwardRef(({ children, className, style, ...props }, ref) => (
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
export const Row = RowBase
