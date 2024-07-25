import { KeyboardAvoidingView } from 'react-native'
import { useHeaderHeight } from "@react-navigation/elements";
import { Platform } from 'react-native'
export default function KbAvoidingView(props) {
    const headerHeight = useHeaderHeight();
    let { children, ...rest } = props
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={58 + headerHeight} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}
