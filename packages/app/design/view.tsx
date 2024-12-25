import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
} from 'react-native'


export const View = ({ children, className, ...props }) => (
    <ReactNativeView className={`${className || ""}`} {...props}>
        {children}
    </ReactNativeView>
);

export const ScrollView = ({ children, className, ...props }) => (
    <ReactNativeScrollView className={`${className || ""}`} {...props}>
        {children}
    </ReactNativeScrollView>
);

export const Pressable = ({ children, className, ...props }) => (
    <ReactNativePressable className={`${className || ""}`} {...props}>
        {children}
    </ReactNativePressable>
);

export const Row = ({ children, className, ...props }) => (
    <View className={`flex-row ${className || ""}`} {...props}>
        {children}
    </View>
);