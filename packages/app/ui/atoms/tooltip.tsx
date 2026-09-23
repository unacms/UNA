import type { ReactNode } from 'react';

type TooltipProps = {
    children?: ReactNode;
    content?: ReactNode;
    enabled?: boolean;
    side?: 'top' | 'bottom';
};

export default function Tooltip({ children }: TooltipProps) {
    return children;
}
