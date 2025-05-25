import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
    ViewProps as ReactNativeViewProps,
} from 'react-native'
import { normalizeClasses } from 'app/lib/util'
import * as React from 'react'

export const ScrollView = ReactNativeScrollView
export const Pressable = ReactNativePressable
export const ViewRef = ReactNativeView

interface RowProps extends ReactNativeViewProps {
    children?: React.ReactNode;
    className?: string;
}

export const Row = ({ children, className, ...props }: RowProps) => (
    <ReactNativeView className={'flex-row ' + normalizeClasses(className || '')} {...props}>
        {children}
    </ReactNativeView>
);

interface ViewProps extends ReactNativeViewProps {
    children?: React.ReactNode;
    className?: string;
}

export const View = React.forwardRef<ReactNativeView, ViewProps>(({ children, className, ...props }, ref) => (
    <ReactNativeView className={normalizeClasses(className || '')} {...props} ref={ref}>
        {children}
    </ReactNativeView>
));