import { KeyboardAvoidingView } from 'react-native'
import { Platform } from 'react-native'
export default function KbAvoidingView(props) {
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}
