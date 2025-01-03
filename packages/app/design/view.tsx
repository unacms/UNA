import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
} from 'react-native'
import { normalizeClasses } from 'app/lib/util'

export const ScrollView = ReactNativeScrollView
export const Pressable = ReactNativePressable
export const ViewRef = ReactNativeView

export const Row = ({ children, className, ...props }) => (
    <ReactNativeView className={'flex-row ' + normalizeClasses(className)} {...props}>
        {children}
    </ReactNativeView>
);

export const View = ({ children, className, ...props }) => (
    <ReactNativeView className={normalizeClasses(className)} {...props}>
        {children}
    </ReactNativeView>
);