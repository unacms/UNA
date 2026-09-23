import { KeyboardAvoidingView, ScrollView, View } from 'react-native'
import { Platform } from 'react-native'
import type { ReactNode } from 'react';
import type {
    KbAvoidingViewProps,
    KbAvoidingViewScrollProps,
    KbStickyViewProps,
    ModalKbAwareScrollProps,
    StickyComposerListInset,
} from './kb-avoiding-view';

// Props follow the native (keyboard-controller) contract; web forwards the rest
// to plain RN components as before, hence the `rest as object` spreads below.

/** Web: no OS keyboard overlay — list only needs the composer height. */
export function useStickyComposerListInset(formHeight = 0): StickyComposerListInset {
    return { marginBottom: formHeight, keyboardLift: 0 };
}

export function ModalKeyboardProvider({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}

export function ModalKbAwareScroll({ children, ...rest }: ModalKbAwareScrollProps) {
    return (
        <ScrollView {...(rest as object)}>
            {children}
        </ScrollView>
    );
}

export default function KbAvoidingView({ children, ...rest }: KbAvoidingViewProps) {
    return (
        <KeyboardAvoidingView {...rest} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}

/** Web: no keyboard sticky — render as a plain View. */
export function KbStickyView({ children, offset, enabled, ...rest }: KbStickyViewProps) {
    return <View {...(rest as object)}>{children}</View>;
}

export function KbAvoidingViewScroll({ children, ...rest }: KbAvoidingViewScrollProps) {
    return (
        <KeyboardAvoidingView {...(rest as object)} keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {children}
        </KeyboardAvoidingView>
    );
}
