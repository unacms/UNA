import {
    ScrollView as ReactNativeScrollView,
    View as ReactNativeView,
    Pressable as ReactNativePressable,
    Platform
} from 'react-native'
import { forwardRef } from 'react'
import { cssInterop } from 'nativewind'

// iOS continuous border curve style for smooth rounded corners
const iosContinuousCurveStyle = Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

// Wrap Pressable to include iOS continuous curve
export const Pressable = forwardRef((props, ref) => {
    const { style, ...restProps } = props;
    const mergedStyle = Platform.OS === 'ios' 
        ? [iosContinuousCurveStyle, style]
        : style;
    
    return <ReactNativePressable ref={ref} style={mergedStyle} {...restProps} />;
});
Pressable.displayName = 'Pressable';

// Wrap ScrollView to include iOS continuous curve
export const ScrollView = forwardRef((props, ref) => {
    const { style, contentContainerStyle, ...restProps } = props;
    const mergedStyle = Platform.OS === 'ios' 
        ? [iosContinuousCurveStyle, style]
        : style;
    
    return <ReactNativeScrollView ref={ref} style={mergedStyle} contentContainerStyle={contentContainerStyle} {...restProps} />;
});
ScrollView.displayName = 'ScrollView';

export const ViewRef = ReactNativeView;

// Создаем forwardRef компонент с displayName и автоматическим применением iOS continuous curve
const ViewWithRef = forwardRef((props, ref) => {
    const { style, ...restProps } = props;
    // Merge iOS continuous curve with user styles
    const mergedStyle = Platform.OS === 'ios' 
        ? [iosContinuousCurveStyle, style]
        : style;
    
    return <ReactNativeView ref={ref} style={mergedStyle} {...restProps} />;
})
ViewWithRef.displayName = 'View'

// Применяем cssInterop для поддержки className и анимаций
export const View = cssInterop(ViewWithRef, {
    className: 'style'
})

export const Row = forwardRef(({ children, className = '', style, ...props }, ref) => {
    // Merge iOS continuous curve with user styles for Row component too
    const mergedStyle = Platform.OS === 'ios' 
        ? [iosContinuousCurveStyle, style]
        : style;
    
    return (
        <ReactNativeView ref={ref} className={'flex-row ' + className} style={mergedStyle} {...props}>
            {children}
        </ReactNativeView>
    );
});
Row.displayName = 'Row'