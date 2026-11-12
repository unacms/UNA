import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Command } from '../lib/shortcuts';
import { Kbd } from './kbd';

/** How long the pointer rests on the control before its tooltip shows. */
export const TOOLTIP_DELAY = 600;
/** How long it stays after the pointer leaves, so the pointer can move onto it (WCAG 1.4.13). */
const HIDE_DELAY = 100;
const MARGIN = 8;

const popovers = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function focusVisible(el: Element): boolean {
    try {
        return el.matches(':focus-visible');
    } catch {
        return true;
    }
}

/** Where the tooltip goes: under the control, above it near the window's bottom, kept 8px inside the window. */
export function place(anchor: DOMRect, tip: { width: number; height: number }, view: { width: number; height: number }): { left: number; top: number } {
    let top = anchor.bottom + 6;
    if (top + tip.height > view.height - MARGIN) top = anchor.top - 6 - tip.height;
    let left = anchor.left + anchor.width / 2 - tip.width / 2;
    left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, view.width - MARGIN - tip.width));
    return { left, top: Math.max(MARGIN, top) };
}

type Props = {
    /** What the control does; the control's own aria-label says the same. */
    text: string;
    /** Its shortcut, shown as keys (the control has it in aria-keyshortcuts). */
    command?: Command;
    /** Said after the text, e.g. "nothing to go back to". */
    note?: string;
    children: ReactNode;
};

/**
 * A tooltip for an icon-only control: after 600ms of hover, at once on keyboard focus; it stays
 * while hovered, Esc dismisses it, it goes on blur or when the pointer leaves (WCAG 1.4.13). It
 * is hidden from screen readers: the control's aria-label is its name and aria-keyshortcuts its
 * keys. It is a manual popover in the top layer, so modal dialogs and scrollers never clip it.
 */
export function Tooltip({ text, command, note, children }: Props) {
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLSpanElement>(null);
    const tip = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // shown by the pointer resting on the control, or by keyboard focus on it
    const openedBy = useRef<'hover' | 'focus'>('hover');

    const clear = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };
    const showSoon = useCallback(() => {
        clear();
        timer.current = setTimeout(() => {
            openedBy.current = 'hover';
            setOpen(true);
        }, TOOLTIP_DELAY);
    }, []);
    const hideSoon = useCallback(() => {
        clear();
        timer.current = setTimeout(() => setOpen(false), HIDE_DELAY);
    }, []);
    const hide = useCallback(() => {
        clear();
        setOpen(false);
    }, []);
    useEffect(() => clear, []);

    useLayoutEffect(() => {
        const el = tip.current;
        const a = anchor.current?.firstElementChild ?? anchor.current;
        if (!open || !el || !a) return;
        if (popovers) {
            try {
                el.showPopover();
            } catch {
                // shown already, or no longer in the document
            }
        }
        const { left, top } = place(a.getBoundingClientRect(), { width: el.offsetWidth, height: el.offsetHeight }, { width: window.innerWidth, height: window.innerHeight });
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        // Esc dismisses it (WCAG 1.4.13). Shown by hover, that is all that Esc does: focus is
        // elsewhere and the Esc was for the tooltip. Shown by focus on the control, Esc goes on
        // to what it does there (on the detail's Close, it closes the detail).
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            hide();
            if (openedBy.current === 'hover') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open, hide]);

    return (
        <span
            ref={anchor}
            className="tooltip-anchor"
            onPointerEnter={showSoon}
            onPointerLeave={hideSoon}
            onPointerDown={hide}
            onFocus={(e) => {
                if (focusVisible(e.target)) {
                    clear();
                    openedBy.current = 'focus';
                    setOpen(true);
                }
            }}
            onBlur={hide}
        >
            {children}
            {open ? (
                <div ref={tip} className="tooltip" popover={popovers ? 'manual' : undefined} aria-hidden="true" data-tooltip="" onPointerEnter={clear} onPointerLeave={hideSoon}>
                    <span>{note ? `${text}: ${note}` : text}</span>
                    {command ? <Kbd command={command} decorative /> : null}
                </div>
            ) : null}
        </span>
    );
}
