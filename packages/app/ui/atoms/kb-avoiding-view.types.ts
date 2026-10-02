// Props shared by kb-avoiding-view.tsx (native) and kb-avoiding-view.web.tsx.
// Typed by the native (keyboard-controller) contract; web forwards what it can.
import type { ComponentProps, ReactNode, Ref } from 'react';
import type { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

export type StickyComposerListInset = {
    marginBottom: number;
    keyboardLift: number;
};

export type KbAvoidingViewProps = {
    children?: ReactNode;
    className?: string;
    /** Native: keyboard offset override. */
    modalOffset?: number;
    [key: string]: unknown;
};

export type KbStickyViewProps = Partial<ComponentProps<typeof KeyboardStickyView>> & {
    children?: ReactNode;
    className?: string;
};

export type KbGutterViewProps = {
    children?: ReactNode;
    className?: string;
    /** Native: side padding at rest and with the keyboard up; eases between them with the keyboard. */
    gutter?: { rest: number; open: number } | null;
};

type KbAwareScrollProps = Partial<Omit<ComponentProps<typeof KeyboardAwareScrollView>, 'ref'>> & {
    children?: ReactNode;
    className?: string;
    ref?: Ref<any>;
};

export type ModalKbAwareScrollProps = KbAwareScrollProps;

export type KbAvoidingViewScrollProps = KbAwareScrollProps & {
    paddingTop?: number;
    paddingBottom?: number;
};
