import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
    ViewProps as ReactNativeViewProps,
} from 'react-native'

export const Pressable = ReactNativePressable
export const ScrollView = ReactNativeScrollView
export const ViewRef = ReactNativeView
export const View = ReactNativeView

export const Row = ({ children, className = '', ...props }) => (
    <ReactNativeView className={'flex-row ' + className} {...props}>
        {children}
    </ReactNativeView>
);
