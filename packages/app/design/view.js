import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable
} from 'react-native'
import { forwardRef } from 'react'
import { cssInterop } from 'nativewind'

export const Pressable = ReactNativePressable
export const ScrollView = ReactNativeScrollView
export const ViewRef = ReactNativeView

// Создаем forwardRef компонент с displayName
const ViewWithRef = forwardRef((props, ref) => (
    <ReactNativeView ref={ref} {...props} />
))
ViewWithRef.displayName = 'View'

// Применяем cssInterop для поддержки className и анимаций
export const View = cssInterop(ViewWithRef, {
    className: 'style'
})

export const Row = forwardRef(({ children, className = '', ...props }, ref) => (
    <ReactNativeView ref={ref} className={'flex-row ' + className} {...props}>
        {children}
    </ReactNativeView>
));
Row.displayName = 'Row'