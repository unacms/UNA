// Props shared by snackbar.tsx (native) and snackbar.web.tsx.

export type SnackbarProps = {
    /** Whether the snackbar is shown (animates in/out). */
    visible?: boolean;
    /** Main text. */
    title?: string;
    /** Secondary text (plain variant only). */
    description?: string;
    /** Icon name from the icon set. */
    icon?: string;
    position?: 'top' | 'bottom';
    /** Button variant. */
    variant?: string;
    /** Button size. */
    size?: string;
    /** Called when the snackbar/button is pressed. */
    onPress?: () => void;
    /** Called on dismiss: swipe on native, Escape on web. */
    onDismiss?: () => void;
    dismissible?: boolean;
    /** Button title; defaults to `title`. */
    buttonTitle?: string;
    /** Action button (default) vs plain pressable text. */
    showButton?: boolean;
    style?: any;
    className?: string;
};
