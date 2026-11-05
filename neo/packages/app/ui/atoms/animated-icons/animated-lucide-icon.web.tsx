import { createElement, type CSSProperties, type ReactNode } from 'react';
import type { AnimatedIconPart, IconActiveShape, IconMotion, IconPoint } from './types';
import { fillsNode, iconStrokeWidth, motionDelays, type AnimatedLucideIconProps } from './animated-lucide-icon.types';

/** Duration of each motion in ms unless the spec sets `ms`. */
const MOTION_MS: Record<IconMotion['kind'], number> = {
    rotate: 300,
    shift: 300,
    swing: 450,
    wiggle: 500,
    lift: 400,
    pulse: 350,
    draw: 400,
    appear: 200,
};

const origin = (point: IconPoint | undefined) => (point ? `${point[0]}px ${point[1]}px` : undefined);

function motionStyle(motion: IconMotion, delay: number): CSSProperties {
    const vars: Record<string, string | undefined> = {
        '--nai-t': `${motion.ms ?? MOTION_MS[motion.kind]}ms`,
        '--nai-d': delay ? `${delay}ms` : undefined,
    };
    if ('deg' in motion) vars['--nai-deg'] = `${motion.deg}deg`;
    if ('scale' in motion) vars['--nai-s'] = String(motion.scale);
    if ('origin' in motion) vars['--nai-o'] = origin(motion.origin);
    if (motion.kind === 'shift' || motion.kind === 'lift') {
        vars['--nai-x'] = `${motion.x ?? 0}px`;
        vars['--nai-y'] = `${motion.y ?? (motion.kind === 'lift' ? -1.5 : 0)}px`;
    }
    return vars as CSSProperties;
}

function activeStyle(shape: IconActiveShape): CSSProperties {
    return {
        '--nai-ax': `${shape.x ?? 0}px`,
        '--nai-ay': `${shape.y ?? 0}px`,
        '--nai-ad': `${shape.deg ?? 0}deg`,
        '--nai-ao': origin(shape.origin),
    } as CSSProperties;
}

function renderPart(part: AnimatedIconPart, key: number, delay: number, fillOn: boolean, motionOn: boolean): ReactNode {
    const motion = motionOn ? part.motion : undefined;
    const draws = motion?.kind === 'draw';
    let content: ReactNode = part.nodes.map(([tag, attrs], index) =>
        createElement(tag, {
            key: index,
            ...attrs,
            // A unit path length lets one keyframe draw any shape.
            ...(draws ? { pathLength: 100 } : null),
            ...(fillOn && fillsNode(part.fill, index) ? { fill: 'currentColor', fillOpacity: 0, 'data-fill': '' } : null),
        })
    );
    if (motion)
        content = <g className="nai-m" data-m={motion.kind} style={motionStyle(motion, delay)}>{content}</g>;
    if (part.active)
        content = <g className="nai-x" data-hide={part.active.hide ? '' : undefined} style={activeStyle(part.active)}>{content}</g>;
    return <g key={key}>{content}</g>;
}

/**
 * Web engine: plain SVG with the same geometry as the static /lucide/* mask, animated by CSS only
 * (`.nai` rules in design/styles/global.web.css). Hover and keyboard focus come from the row's `group`
 * (or the focused link/button around the icon), the active state from `data-active`, and
 * `prefers-reduced-motion: reduce` turns the motion off. Nothing here re-renders on hover.
 */
export default function AnimatedLucideIcon({
    spec,
    size,
    width,
    height,
    color,
    strokeWidth,
    className,
    active,
    pressed: _pressed,
    scenes,
    style,
    swapped,
    ...rest
}: Readonly<AnimatedLucideIconProps & { swapped?: boolean }>) {
    const w = width || size || 24;
    const h = height || size || 24;
    const delays = motionDelays(spec);
    const fillOn = scenes?.fill !== false;
    const motionOn = scenes?.draw !== false;
    const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={w}
            height={h}
            fill="none"
            stroke="currentColor"
            strokeWidth={iconStrokeWidth(strokeWidth)}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={className ? `nai ${className}` : 'nai'}
            data-active={active ? '' : undefined}
            data-still={spec.stillWhenActive ? '' : undefined}
            data-swapped={swapped ? '' : undefined}
            style={{
                ...(style as CSSProperties | undefined),
                // The static icon's box (iconset.web.tsx), so the swap moves nothing.
                display: 'inline-block',
                width: px(w),
                height: px(h),
                minWidth: px(w),
                minHeight: px(h),
                flexShrink: 0,
                ...(color ? { color } : null),
            }}
            {...rest}
        >
            {spec.parts.map((part, index) => renderPart(part, index, delays[index] ?? 0, fillOn, motionOn))}
        </svg>
    );
}
