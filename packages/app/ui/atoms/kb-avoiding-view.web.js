import { KeyboardAvoidingView, ScrollView, View } from 'react-native'
import { Platform } from 'react-native'
import React from 'react';

export function ModalKeyboardProvider({ children }) {
    return <>{children}</>;
}

export const ModalKbAwareScroll = React.forwardRef(({ children, ...rest }, ref) => {
    return (
        <ScrollView ref={ref} {...rest}>
            {children}
        </ScrollView>
    );
});

export default function KbAvoidingView(props) {
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}

/** Web: no keyboard sticky — render as a plain View. */
export function KbStickyView({ children, offset, enabled, ...rest }) {
    return <View {...rest}>{children}</View>;
}

export const KbAvoidingViewScroll = React.forwardRef((props, ref) => {
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} ref={ref} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
});
