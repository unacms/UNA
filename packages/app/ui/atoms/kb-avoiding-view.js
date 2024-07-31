import { KeyboardAvoidingView } from 'react-native'
import { useHeaderHeight } from "@react-navigation/elements";
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function KbAvoidingView(props) {
    const headerHeight = useHeaderHeight();
    const { bottom,top } = useSafeAreaInsets();
    let { children, offset, ...rest } = props
   
    let offsetHeight = (Platform.OS === 'ios' ? 58 :44) + headerHeight
    if (offset)
        offsetHeight = offset+bottom+top;
    console.log('offsetHeight', offsetHeight, offset)
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={offsetHeight} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}
