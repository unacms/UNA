import type { ReactNode } from 'react';

export type SheetProps = {
    /** Present the sheet. Keep the Sheet mounted and toggle this, so it can slide out. */
    visible: boolean;
    /** Shown in the sheet's navigation bar. */
    title?: string;
    /** The close button, a swipe down (iOS), Escape or a backdrop click (web). */
    onClose: () => void;
    /** A back button before the title, for a step back inside the sheet. */
    onBack?: () => void;
    /** Size the sheet to its content (default). `false` opens a medium sheet that can grow to the full screen. */
    fitContent?: boolean;
    children?: ReactNode;
};
