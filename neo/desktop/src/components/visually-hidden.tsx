import type { ReactNode } from 'react';

/** Text for screen readers only: in the accessibility tree, not on screen. */
export function VisuallyHidden({ children, id }: { children: ReactNode; id?: string }) {
    return (
        <span className="sr-only" id={id}>
            {children}
        </span>
    );
}
