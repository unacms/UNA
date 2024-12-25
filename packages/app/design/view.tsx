import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
} from 'react-native'


export const View = ReactNativeView
export const ScrollView = ReactNativeScrollView
export const Pressable = ReactNativePressable


export const Row = ({ children, className, ...props }) => (
    <ReactNativeView className={`flex-row ${className || ""}`} {...props}>
        {children}
    </ReactNativeView>
);