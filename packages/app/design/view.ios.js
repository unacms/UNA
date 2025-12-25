import {
  View as RNView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
} from 'react-native'
import { forwardRef } from 'react'
import { cssInterop } from 'nativewind'

const iosContinuousCurveStyle = { borderCurve: 'continuous' }

// аккуратно склеиваем style (поддерживает object/array/undefined)
const withIOSCurve = (style) => [iosContinuousCurveStyle, style].filter(Boolean)

// View
const ViewBase = forwardRef(({ style, ...props }, ref) => (
  <RNView ref={ref} style={withIOSCurve(style)} {...props} />
))
ViewBase.displayName = 'View'
export const View = cssInterop(ViewBase, { className: 'style' })

// Pressable
const PressableBase = forwardRef(({ style, ...props }, ref) => (
  <RNPressable ref={ref} style={withIOSCurve(style)} {...props} />
))
PressableBase.displayName = 'Pressable'
export const Pressable = cssInterop(PressableBase, { className: 'style' })

// ScrollView
const ScrollViewBase = forwardRef(({ style, ...props }, ref) => (
  <RNScrollView ref={ref} style={withIOSCurve(style)} {...props} />
))
ScrollViewBase.displayName = 'ScrollView'
export const ScrollView = cssInterop(ScrollViewBase, { className: 'style' })

// Row (flex-row + iOS curve)
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
export const Row = cssInterop(RowBase, { className: 'style' })
