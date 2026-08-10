import { forwardRef, useEffect, useState } from 'react';
import { useHeaderHeight } from "@react-navigation/elements";
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView, KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView, useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";

/**
 * Padding for a list under a KbStickyView composer.
 * KeyboardProvider uses edge-to-edge: Android does NOT resize the window
 * (behaves like adjustNothing), so the list must pad by form + keyboard lift
 * on both platforms. Sticky offset.opened is typically insets.bottom.
 */
export function useStickyComposerListInset(formHeight = 0) {
    const insets = useSafeAreaInsets();
    const controllerHeight = useKeyboardState((s) => (s.isVisible ? s.height : 0));
    // Fallback: inside RN Modal some Android devices report 0 via the controller.
    const [rnKeyboardHeight, setRnKeyboardHeight] = useState(0);
    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setRnKeyboardHeight(e?.endCoordinates?.height ?? 0)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setRnKeyboardHeight(0)
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);
    const keyboardHeight = Math.max(controllerHeight, rnKeyboardHeight);
    const keyboardLift = keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;
    return {
        marginBottom: formHeight + keyboardLift,
        keyboardLift,
    };
}

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

export default function KbAvoidingView({children, className, modalOffset}) {
    const { top } = useSafeAreaInsets();
    return (
        <KeyboardAvoidingView 
            className={className}
            behavior={"padding"}
            keyboardVerticalOffset={(modalOffset +( (Platform.OS === "ios" ? 0 : 0))) || (Platform.OS === "ios" ? 60 : 30)}
        >
            {children}
        </KeyboardAvoidingView>
    )
}

/**
 * Footer/form that translates with the keyboard (does not resize the layout).
 * Prefer over KbAvoidingView for absolute bottom composers.
 */
export function KbStickyView({ children, style, offset, enabled = true, ...rest }) {
    return (
        <KeyboardStickyView
            style={style}
            offset={offset}
            enabled={enabled}
            {...rest}
        >
            {children}
        </KeyboardStickyView>
    )
}

export function ModalKeyboardProvider({ children }) {
    return <KeyboardProvider>{children}</KeyboardProvider>;
}

export const ModalKbAwareScroll = forwardRef(function ModalKbAwareScroll(
    {
        children,
        style,
        className,
        bottomOffset = 24,
        keyboardShouldPersistTaps = "handled",
        onScroll,
        ...rest
    },
    ref
) {
    // ScrollView className padding does not reliably pad the end of scroll content.
    // Outer modal already applies insets.bottom; keep a fixed breathing room under Save etc.
    const contentPaddingBottom = 24;

    return (
        <KeyboardAwareScrollView
            ref={ref}
            ScrollViewComponent={Animated.ScrollView}
            className={className}
            style={style}
            onScroll={onScroll}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: contentPaddingBottom,
            }}
            bottomOffset={bottomOffset}
            enabled={true}
            {...rest}
        >
            {children}
        </KeyboardAwareScrollView>
    );
});

export const KbAvoidingViewScroll = forwardRef(function KbAvoidingViewScroll(
    {
        children,
        onScroll,
        paddingTop = 0,
        className,
        style,
        keyboardShouldPersistTaps = "always",
        ...rest
    },
    ref
) {
    const { top } = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const keyboardOffset = top + headerHeight + (Platform.OS === "ios" ? 58 : 44);
    return (
        <KeyboardAwareScrollView
            ref={ref}
            ScrollViewComponent={Animated.ScrollView}
            className={className ?? "flex-1"}
            style={style}
            onScroll={onScroll}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", paddingTop: paddingTop }}
            bottomOffset={keyboardOffset}
            extraKeyboardSpace={0}
            enabled={true}
            {...rest}
        >
            {children}
        </KeyboardAwareScrollView>
    );
});
