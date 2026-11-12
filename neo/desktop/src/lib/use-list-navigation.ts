/**
 * Keyboard movement through a list of items (the feed pattern): one item is active, j/k and the
 * arrow keys move it, Enter opens it. The list draws focus and scrolling (`onActivate`), so the
 * same logic works for a virtualized list whose items are not all in the DOM.
 */
import { type FocusEvent, type KeyboardEvent, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { isWindowKey } from './open-in-window';

export type ListMove = 'next' | 'previous' | 'first' | 'last' | 'page-down' | 'page-up';

/** How far Page Down and Page Up move. */
export const PAGE_STEP = 5;

/**
 * The index a move goes to, kept within the list. With nothing active (-1) every move but
 * 'last' starts at the first item. -1 when the list is empty.
 */
export function moveIndex(current: number, move: ListMove, count: number, page = PAGE_STEP): number {
    if (count <= 0) return -1;
    const last = count - 1;
    if (move === 'last') return last;
    if (move === 'first' || current < 0) return 0;
    const from = Math.min(current, last);
    switch (move) {
        case 'next':
            return Math.min(from + 1, last);
        case 'previous':
            return Math.max(from - 1, 0);
        case 'page-down':
            return Math.min(from + page, last);
        case 'page-up':
            return Math.max(from - page, 0);
    }
}

type KeyLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;

/**
 * What a key does on a list item that has focus itself (not a control inside it). j, k and o
 * come from the window's commands instead (commands.json), so they also work from the list's
 * heading; here they would run twice.
 */
export function itemKeyAction(e: KeyLike): ListMove | 'open' | null {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return null;
    switch (e.key) {
        case 'ArrowDown':
            return 'next';
        case 'ArrowUp':
            return 'previous';
        case 'Home':
            return 'first';
        case 'End':
            return 'last';
        case 'PageDown':
            return 'page-down';
        case 'PageUp':
            return 'page-up';
        case 'Enter':
            return 'open';
        default:
            return null;
    }
}

type Options = {
    count: number;
    /**
     * Each item's id, in order. The active item is then kept by id, so it stays the same item
     * when others are added or removed before it (a refresh, a page that overlaps).
     */
    keys?: readonly string[];
    /** Open the item (Enter, o). */
    onOpen: (index: number) => void;
    /** An item became active by key: bring it into view and focus it. */
    onActivate: (index: number) => void;
    /** Open the item in a window of its own (Cmd+Enter, Ctrl+Enter elsewhere); none: not offered. */
    onOpenInWindow?: (index: number) => void;
};

export type ListNavigation = {
    /** The active item, -1 for none; always within the list. */
    active: number;
    /** Move from the active item; false when the list is empty. */
    move: (m: ListMove) => boolean;
    /** Make an item the active one by key (scrolled to and focused); false when it is not in the list. */
    activate: (index: number) => boolean;
    /** Open the active item; false when there is none. */
    open: () => boolean;
    /** Props for each item element: a roving tabindex, focus tracking and the keys above. */
    itemProps: (index: number) => {
        tabIndex: number;
        onFocus: (e: FocusEvent<HTMLElement>) => void;
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
    };
};

type Active = { index: number; key: string | undefined };

/**
 * The active item's index now: where its id is, when the list has ids and still holds it;
 * otherwise its old place, kept within the list (the item there took the place of a removed one).
 */
export function activeIndex(active: Active, count: number, keys?: readonly string[]): number {
    if (count <= 0 || active.index < 0) return -1;
    if (keys && active.key !== undefined) {
        const at = keys.indexOf(active.key);
        if (at >= 0) return at;
    }
    return Math.min(active.index, count - 1);
}

export function useListNavigation({ count, keys, onOpen, onActivate, onOpenInWindow }: Options): ListNavigation {
    const [rawActive, setRawActive] = useState<Active>({ index: -1, key: undefined });
    const active = activeIndex(rawActive, count, keys);
    // what the callbacks read, so they stay stable for the list's command handler
    const state = useRef({ active, count, keys, onOpen, onActivate, onOpenInWindow });
    useLayoutEffect(() => {
        state.current = { active, count, keys, onOpen, onActivate, onOpenInWindow };
    });

    const setActive = useCallback((index: number) => setRawActive({ index, key: state.current.keys?.[index] }), []);

    const moveFrom = useCallback(
        (from: number, m: ListMove) => {
            const next = moveIndex(from, m, state.current.count);
            if (next < 0) return false;
            setActive(next);
            state.current.onActivate(next);
            return true;
        },
        [setActive],
    );

    const move = useCallback((m: ListMove) => moveFrom(state.current.active, m), [moveFrom]);

    const activate = useCallback(
        (index: number) => {
            if (index < 0 || index >= state.current.count) return false;
            setActive(index);
            state.current.onActivate(index);
            return true;
        },
        [setActive],
    );

    const open = useCallback(() => {
        const { active: index, onOpen: openItem } = state.current;
        if (index < 0) return false;
        openItem(index);
        return true;
    }, []);

    const itemProps = useCallback(
        (index: number) => ({
            // Tab enters the list at the active item (the first while none is)
            tabIndex: index === Math.max(active, 0) ? 0 : -1,
            // focus anywhere in an item (a click, Tab to one of its buttons) makes it the active one
            onFocus: () => setActive(index),
            onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
                if (e.target !== e.currentTarget) return;
                const inWindow = state.current.onOpenInWindow;
                if (inWindow && isWindowKey(e)) {
                    e.preventDefault();
                    inWindow(index);
                    return;
                }
                const action = itemKeyAction(e);
                if (!action) return;
                e.preventDefault();
                if (action === 'open') state.current.onOpen(index);
                else moveFrom(index, action);
            },
        }),
        [active, moveFrom, setActive],
    );

    return { active, move, activate, open, itemProps };
}
