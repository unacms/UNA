import type { AnimatedIconScenes, AnimatedIconSpec } from './types';

export type AnimatedLucideIconProps = {
    spec: AnimatedIconSpec;
    size?: number | string;
    width?: number | string;
    height?: number | string;
    /** A fixed tint (the native tab bar); otherwise the icon takes `currentColor` from its `text-*` class. */
    color?: string;
    strokeWidth?: number;
    className?: string;
    active?: boolean;
    /** Native press feedback; web reads `:active` on the row. */
    pressed?: boolean;
    scenes?: AnimatedIconScenes;
    style?: unknown;
    [key: string]: unknown;
};

/** Stroke width as the static icon draws it (/lucide/<stroke>/ masks): integer 1–64, anything else is 2. */
export function iconStrokeWidth(strokeWidth: unknown): number {
    const num = Number(strokeWidth);
    return Number.isInteger(num) && num > 0 && num <= 64 ? num : 2;
}

/** Start delay of each part's motion: its own `delay`, else `stagger` times its place among the moving parts. */
export function motionDelays(spec: AnimatedIconSpec): number[] {
    let moving = 0;
    return spec.parts.map((part) => {
        if (!part.motion) return 0;
        const delay = part.delay ?? (spec.stagger ?? 0) * moving;
        moving += 1;
        return delay;
    });
}

export const fillsNode = (fill: boolean | readonly number[] | undefined, index: number) =>
    fill === true || (Array.isArray(fill) && fill.includes(index));
