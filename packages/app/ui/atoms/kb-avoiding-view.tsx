import { use, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { HeaderHeightContext } from "expo-router/react-navigation";
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView, KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView, useKeyboardState, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStableSafeAreaInsets } from "app/lib/hooks/router";
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { View } from "app/design/view";
import type {
    KbAvoidingViewProps,
    KbAvoidingViewScrollProps,
    KbGutterViewProps,
    KbStickyViewProps,
    ModalKbAwareScrollProps,
    StickyComposerListInset,
} from './kb-avoiding-view.types';

// Reanimated 4 types its ScrollView as a plain function with a `ref` prop, while
// keyboard-controller's types expect a forwardRef component. Works at runtime.
const AnimatedScrollView = Animated.ScrollView as unknown as NonNullable<
    ComponentProps<typeof KeyboardAwareScrollView>['ScrollViewComponent']
>;

/**
 * Padding for a list under a KbStickyView composer.
 * KeyboardProvider uses edge-to-edge: Android does NOT resize the window
 * (behaves like adjustNothing), so the list must pad by form + keyboard lift
 * on both platforms. Sticky offset.opened is typically insets.bottom.
 */
export function useStickyComposerListInset(formHeight = 0): StickyComposerListInset {
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

export default function KbAvoidingView({children, className, modalOffset}: KbAvoidingViewProps) {
    return (
        <KeyboardAvoidingView
            className={className}
            behavior={"padding"}
            keyboardVerticalOffset={modalOffset || (Platform.OS === "ios" ? 60 : 30)}
        >
            {children}
        </KeyboardAvoidingView>
    )
}

/**
 * Footer/form that translates with the keyboard (does not resize the layout).
 * Prefer over KbAvoidingView for absolute bottom composers.
 */
export function KbStickyView({ children, style, offset, enabled = true, ...rest }: KbStickyViewProps) {
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

/**
 * Side padding that eases from `gutter.rest` to `gutter.open` as the keyboard
 * comes up, in step with KbStickyView: a composer lined up with the tab bar can
 * widen once the keyboard covers the bar. Vertical padding stays in `className`.
 */
export function KbGutterView({ children, className, gutter }: KbGutterViewProps) {
    const { progress } = useReanimatedKeyboardAnimation();
    const rest = gutter?.rest ?? 0;
    const open = gutter?.open ?? 0;
    const gutterStyle = useAnimatedStyle(() => ({
        paddingHorizontal: interpolate(progress.value, [0, 1], [rest, open], Extrapolation.CLAMP),
    }));
    if (!gutter) return <View className={className}>{children}</View>;
    return (
        <View className={className}>
            <Animated.View style={gutterStyle}>{children}</Animated.View>
        </View>
    );
}

export function ModalKeyboardProvider({ children }: { children?: ReactNode }) {
    return <KeyboardProvider>{children}</KeyboardProvider>;
}

export function ModalKbAwareScroll({
    children,
    style,
    className,
    bottomOffset = 24,
    keyboardShouldPersistTaps = "handled",
    onScroll,
    ...rest
}: ModalKbAwareScrollProps) {
    // ScrollView className padding does not reliably pad the end of scroll content.
    // Outer modal already applies insets.bottom; keep a fixed breathing room under Save etc.
    const contentPaddingBottom = 24;

    return (
        <KeyboardAwareScrollView
            ScrollViewComponent={AnimatedScrollView}
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
}

export function KbAvoidingViewScroll({
    children,
    onScroll,
    paddingTop = 0,
    paddingBottom = 0,
    className,
    style,
    keyboardShouldPersistTaps = "always",
    ...rest
}: KbAvoidingViewScrollProps) {
    const { top } = useStableSafeAreaInsets();
    // NativeTabs has no stack header; useHeaderHeight() throws without this fallback.
    const headerHeight = use(HeaderHeightContext) ?? 0;
    const keyboardOffset = top + headerHeight + (Platform.OS === "ios" ? 58 : 44);
    return (
        <KeyboardAwareScrollView
            ScrollViewComponent={AnimatedScrollView}
            className={className ?? "flex-1"}
            style={style}
            onScroll={onScroll}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", paddingTop: paddingTop, paddingBottom: paddingBottom }}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            bottomOffset={keyboardOffset}
            extraKeyboardSpace={0}
            enabled={true}
            {...rest}
        >
            {children}
        </KeyboardAwareScrollView>
    );
}
