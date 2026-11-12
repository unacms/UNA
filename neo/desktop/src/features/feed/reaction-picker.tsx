import { type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { t } from '../../lib/i18n';
import { ReactionGlyph, type ReactionLook } from './reaction-glyph';

type Kind = Schema<'ReactionKinds'>['kinds'][number];

type Props = {
    id: string;
    kinds: readonly Kind[];
    /** Icons or emoji (reactionLook). */
    look: ReactionLook;
    /** The viewer's reaction, checked in the menu. */
    current: string | null;
    onPick: (name: string) => void;
    /** Close; `restoreFocus` sends focus back to the button that opened it. */
    onClose: (restoreFocus: boolean) => void;
    /** The reaction control it opens from: placed from it, and a press on it is not a press outside. */
    anchor: RefObject<HTMLElement | null>;
    /** Opened from the keyboard: focus goes to the viewer's reaction or the first. A pointer leaves it where it is. */
    focusOnOpen: boolean;
    /** The pointer came into or left the capsule (hover keeps it open, ReactionButton). */
    onPointerEnter?: (e: ReactPointerEvent) => void;
    onPointerLeave?: (e: ReactPointerEvent) => void;
    /** Focus came into the capsule (it then closes only by Esc, Tab, a pick or a press outside). */
    onFocusIn?: () => void;
};

const popovers = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
const GAP = 6;
const MARGIN = 8;

/**
 * Where the picker goes: above the reaction control, or below it when there is no room above
 * (a post near the top of the pane), kept 8px inside the window.
 */
export function placePicker(anchor: DOMRect, picker: { width: number; height: number }, view: { width: number; height: number }, top = 0): { left: number; top: number } {
    let y = anchor.top - GAP - picker.height;
    if (y < Math.max(MARGIN, top)) y = anchor.bottom + GAP;
    const x = Math.min(Math.max(anchor.left, MARGIN), Math.max(MARGIN, view.width - MARGIN - picker.width));
    return { left: Math.round(x), top: Math.round(Math.min(y, view.height - MARGIN - picker.height)) };
}

/**
 * The reactions as a menu (the ARIA menu pattern, one row) in the top layer, so no scroller
 * clips it. Opened from the keyboard, focus moves into it, to the viewer's reaction or the
 * first; arrow keys, Home and End move; Enter or Space picks; Esc and Tab close it and focus
 * goes back to the button. Opened by hover or a long press, focus stays where it was, and Esc
 * still closes it (WCAG 1.4.13). A press outside closes it.
 */
export function ReactionPicker({ id, kinds, look, current, onPick, onClose, anchor, focusOnOpen, onPointerEnter, onPointerLeave, onFocusIn }: Props) {
    const menu = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(() => Math.max(0, kinds.findIndex((k) => k.name === current)));
    // focus follows `focused` only once the keyboard is in the menu
    const keyboard = useRef(focusOnOpen);

    useLayoutEffect(() => {
        const el = menu.current;
        const a = anchor.current;
        if (!el) return;
        if (popovers) {
            try {
                el.showPopover();
            } catch {
                // shown already, or no longer in the document
            }
        }
        if (!a) return;
        // the toolbar's bottom: the picker never goes under the pane's toolbar
        const pane = a.closest('.pane')?.querySelector('.pane-body')?.getBoundingClientRect().top ?? 0;
        const { left, top } = placePicker(a.getBoundingClientRect(), { width: el.offsetWidth, height: el.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, pane);
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }, [anchor]);

    useLayoutEffect(() => {
        if (!keyboard.current) return;
        menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[focused]?.focus();
    }, [focused]);

    // open under the pointer with focus elsewhere: Esc still closes it, and only it
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape' || menu.current?.contains(document.activeElement)) return;
            e.preventDefault();
            e.stopPropagation();
            onClose(false);
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [onClose]);

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (target && (menu.current?.contains(target) || anchor.current?.contains(target))) return;
            onClose(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [onClose, anchor]);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const n = kinds.length;
        let next: number;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                next = (focused + 1) % n;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                next = (focused - 1 + n) % n;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = n - 1;
                break;
            case 'Escape':
            case 'Tab':
                // the menu's own: Esc does not also close the detail pane under it
                e.preventDefault();
                e.stopPropagation();
                onClose(true);
                return;
            default:
                return;
        }
        e.preventDefault();
        keyboard.current = true;
        setFocused(next);
    };

    return (
        <div
            ref={menu}
            id={id}
            className="reaction-picker"
            role="menu"
            aria-label={t('Reactions')}
            aria-orientation="horizontal"
            popover={popovers ? 'manual' : undefined}
            onKeyDown={onKeyDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onFocus={onFocusIn}
        >
            {kinds.map((r, i) => (
                <button
                    key={r.name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={r.name === current}
                    aria-label={r.title}
                    title={r.title}
                    tabIndex={i === focused ? 0 : -1}
                    onFocus={() => {
                        keyboard.current = true;
                        setFocused(i);
                    }}
                    onClick={() => onPick(r.name)}
                >
                    <ReactionGlyph kind={r} look={look} size={20} />
                </button>
            ))}
        </div>
    );
}
