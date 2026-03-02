import { useHeaderHeight } from "@react-navigation/elements";
import { Platform } from 'react-native'
import { KeyboardAwareScrollView, KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";

export default function KbAvoidingView({
    children,
    className,
    modalOffset,
}) {
    const keyboardVerticalOffset =
        typeof modalOffset === 'number'
            ? modalOffset + (Platform.OS === 'ios' ? 20 : 0)
            : Platform.OS === 'ios'
                ? 60
                : 30

    return (
        <KeyboardAvoidingView 
            className={className}
            behavior="padding"
            keyboardVerticalOffset={keyboardVerticalOffset}
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", paddingTop:paddingTop }}
            bottomOffset={keyboardOffset}
            extraKeyboardSpace={0}
            enabled={true}
        >
            {children}
        </KeyboardAwareScrollView>
    );
}
