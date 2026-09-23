import type { ReactNode } from 'react';

type SafeMenuTriggerProps = {
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
};

/** Native: no tap filtering needed, render children as-is. */
export const SafeMenuTrigger = ({ children }: SafeMenuTriggerProps) => children;
