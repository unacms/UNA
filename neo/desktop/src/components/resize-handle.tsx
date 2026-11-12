import { type KeyboardEvent, type PointerEvent, useRef } from 'react';

import { t } from '../lib/i18n';
import { isContextMenuKey, showMenu } from '../lib/native-menu';

/** A step of the arrow keys, and of Shift+arrows and the menu's Narrower and Wider. */
export const STEP = 8;
export const BIG_STEP = 32;

export function clampWidth(value: number, min: number, max: number): number {
    return Math.round(Math.min(Math.max(value, min), Math.max(min, max)));
}

/** The width a key gives, or null for a key the handle does not take. */
export function widthForKey(key: string, shift: boolean, value: number, min: number, max: number): number | null {
    const step = shift ? BIG_STEP : STEP;
    switch (key) {
        case 'ArrowLeft':
            return clampWidth(value - step, min, max);
        case 'ArrowRight':
            return clampWidth(value + step, min, max);
        case 'Home':
            return min;
        case 'End':
            return clampWidth(max, min, max);
        default:
            return null;
    }
}

/** Where the handle's menu opens from the keyboard: just after the line, halfway down it. */
export function handleMenuPoint(r: Pick<DOMRect, 'right' | 'top' | 'height'>): { x: number; y: number } {
    return { x: r.right, y: r.top + r.height / 2 };
}

type Props = {
    /** "Resize sidebar", "Resize list". */
    label: string;
    value: number;
    min: number;
    max: number;
    defaultValue: number;
    onChange: (value: number) => void;
    /**
     * Which side of the line the resized pane is on: `start` (the default) the one before it,
     * which a drag to the right widens; `end` the one after it (a page's side column), which a
     * drag to the left and the left arrow widen.
     */
    edge?: 'start' | 'end';
};

/**
 * The line between two panes, which resizes the one before it: drag it, use the arrow keys
 * (Shift for bigger steps), Home and End, double-click it for the default width, or right-click
 * it (Shift+F10, the Menu key) for Narrower, Wider and Default Width: a pointer can resize it
 * without dragging (WCAG 2.5.7). The hit area is 8px over the 1px line.
 */
export function ResizeHandle({ label, value, min, max, defaultValue, onChange, edge = 'start' }: Props) {
    const sign = edge === 'end' ? -1 : 1;
    const drag = useRef<{ x: number; start: number } | null>(null);
    const set = (v: number) => {
        const next = clampWidth(v, min, max);
        if (next !== value) onChange(next);
    };

    const openMenu = (at: { x: number; y: number } | null, el: HTMLElement) => {
        // from the keyboard, beside the handle's middle: it runs the window's height, so under
        // it (a menu button's place) is the window's bottom edge, far from the focus
        const point = at ?? handleMenuPoint(el.getBoundingClientRect());
        void showMenu(
            [
                { text: t('Narrower'), enabled: value > min, run: () => set(value - BIG_STEP) },
                { text: t('Wider'), enabled: value < max, run: () => set(value + BIG_STEP) },
                'separator',
                { text: t('Default Width'), enabled: value !== clampWidth(defaultValue, min, max), run: () => set(defaultValue) },
            ],
            { ...point, returnFocus: el },
        ).catch((e: unknown) => console.error('menu', e));
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (isContextMenuKey(e)) {
            e.preventDefault();
            openMenu(null, e.currentTarget);
            return;
        }
        // the pane after the line grows towards the start: the arrows swap
        const key = edge === 'end' && e.key === 'ArrowLeft' ? 'ArrowRight' : edge === 'end' && e.key === 'ArrowRight' ? 'ArrowLeft' : e.key;
        const next = widthForKey(key, e.shiftKey, value, min, max);
        if (next === null) return;
        e.preventDefault();
        set(next);
    };

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, start: value };
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d) set(d.start + sign * (e.clientX - d.x));
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        drag.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    return (
        <div
            className="resize-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={Math.max(min, max)}
            aria-valuenow={value}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={() => set(defaultValue)}
            onContextMenu={(e) => {
                e.preventDefault();
                openMenu({ x: e.clientX, y: e.clientY }, e.currentTarget);
            }}
        />
    );
}
