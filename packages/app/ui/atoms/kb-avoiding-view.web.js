import { KeyboardAvoidingView } from 'react-native'
import { Platform } from 'react-native'
import React from 'react';

export default function KbAvoidingView(props) {
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}

export const KbAvoidingViewScroll = React.forwardRef((props, ref) => {
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} ref={ref} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
});
