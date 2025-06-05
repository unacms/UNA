import { KeyboardAvoidingView } from 'react-native'
import { useHeaderHeight } from "@react-navigation/elements";
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KbAvoidingView(props) {
    let { children, offset, ...rest } = props;
    const { top } = useSafeAreaInsets();
    let keyboardVerticalOffsetValue;

    if (typeof offset === 'number') {
        // If an explicit offset is provided, use it directly with the top safe area inset.
        keyboardVerticalOffsetValue = offset + top;
    } else {
        // Only call useHeaderHeight if no explicit offset is provided.
        // This is typically for screens within a navigator that has a header.
        const headerHeight = useHeaderHeight();
        keyboardVerticalOffsetValue = (Platform.OS === 'ios' ? 58 : 44) + headerHeight;
        // Note: The original logic for the non-offset case did not add 'top' safe area inset explicitly here,
        // relying on headerHeight presumably including it or being relative to the area below it.
        // We maintain that behavior for the headerHeight case.
    }

    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={keyboardVerticalOffsetValue} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}
