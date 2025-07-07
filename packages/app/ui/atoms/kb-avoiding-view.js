import { useHeaderHeight } from "@react-navigation/elements";
import { Platform } from 'react-native'
import { KeyboardAwareScrollView, KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";

/*export default function KbAvoidingView(props) {
    const { children, offset, ...rest } = props;
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
}*/

export default function KbAvoidingView({children, className}) {
    return (
        <KeyboardAvoidingView 
            className={className}
            behavior={"padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 30}
        >
            {children}
        </KeyboardAvoidingView>
    )
}

export function KbAvoidingViewScroll({ children, onScroll, paddingTop = 0 }) {
    const { top } = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const keyboardOffset = top + headerHeight + (Platform.OS === "ios" ? 58 : 44);
    return (
        <KeyboardAwareScrollView
            ScrollViewComponent={Animated.ScrollView}
            className="flex-1"
            onScroll={onScroll}    
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", paddingTop:paddingTop }}
            bottomOffset={keyboardOffset}
            extraKeyboardSpace={0}
            enabled={true}
        >
            {children}
        </KeyboardAwareScrollView>
    );
}
