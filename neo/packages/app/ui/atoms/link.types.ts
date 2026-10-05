// Props shared by link.tsx (native) and link.web.tsx.
import type { ReactNode } from 'react';

export type LinkProps = {
    href?: string;
    target?: string;
    /** Treat as external even when the URL looks internal. */
    asExternal?: boolean;
    /** Native: tab segment (e.g. `/tab0`) to navigate in, instead of inferring it. */
    tabPath?: string;
    /** Theme `link_styles` key. */
    variant?: string;
    /** Theme `link_sizes` key. */
    size?: string;
    /** `plain` drops the theme text styling. */
    mode?: string;
    className?: string;
    /** Extra touch/click area around the link. */
    hitarea?: boolean;
    hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
    /** Accessible label (becomes `aria-label` on web). */
    alt?: string;
    /** Native: haptic feedback preset on press. */
    haptics?: string;
    /** Web: disable Next prefetch. */
    noprefetch?: boolean;
    /** Legacy, ignored. */
    emulate?: unknown;
    children?: ReactNode;
    onPress?: (event?: any) => void;
    onPressIn?: (event?: any) => void;
    onClick?: () => void;
    onPointerDown?: (event?: any) => void;
    [key: string]: unknown;
};
