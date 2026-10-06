import type { ReactNode } from 'react';

type TooltipProps = {
    children?: ReactNode;
    content?: ReactNode;
    enabled?: boolean;
    side?: 'top' | 'bottom';
    /** Web wrapper classes; native renders no wrapper. */
    className?: string;
};

export default function Tooltip({ children }: TooltipProps) {
    return children;
}
