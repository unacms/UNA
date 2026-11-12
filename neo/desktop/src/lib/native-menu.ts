/**
 * Pop-up menus (the network and profile menus, a resize handle's menu). In the app they are
 * the OS's own menus (NSMenu, a Win32 or GTK menu), which Rust builds from the items sent here
 * (src-tauri/src/popup.rs): the page holds no menu permission. Outside the app (tests, a
 * browser tab) they are an ARIA menu drawn by components/menu-popover.tsx through MenuHost.
 *
 * Native menus have no danger styling: a destructive item says what it does ("Sign Out of …")
 * and its `run` still asks first where the action can't be undone.
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useSyncExternalStore } from 'react';

import { inApp } from './native';

export type MenuItemEntry = {
    text: string;
    enabled?: boolean;
    /** A choice: checked or not (the network or profile in use). */
    checked?: boolean;
    /** Tauri accelerator syntax, shown next to the text: only shortcuts with a modifier. */
    accelerator?: string;
    /** The same keys in aria-keyshortcuts syntax, for the page's own menu (outside the app). */
    keyshortcuts?: string;
    run: () => void;
};
export type MenuEntry = MenuItemEntry | 'separator';

/** Where the menu opens: under a button (bottom-start), or at the pointer (right-click). */
export type MenuAt = { anchor: HTMLElement } | { x: number; y: number; returnFocus?: HTMLElement | null };

/** The event Rust sends to this window when an item is chosen (popup.rs POPUP_EVENT). */
export const POPUP_EVENT = 'menu-popup';

/** The items as Rust takes them (popup.rs Entry). */
export function nativeEntries(entries: MenuEntry[]): unknown[] {
    return entries.map((e) =>
        e === 'separator'
            ? { kind: 'separator' }
            : {
                  kind: 'item',
                  text: e.text,
                  enabled: e.enabled !== false,
                  ...(e.checked === undefined ? {} : { checked: e.checked }),
                  ...(e.accelerator ? { accelerator: e.accelerator } : {}),
              },
    );
}

/** Where a menu opens, in CSS pixels from the window's top-left corner. */
export function menuPoint(at: MenuAt): { x: number; y: number } {
    if ('anchor' in at) {
        const r = at.anchor.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.bottom + 4) };
    }
    return { x: Math.round(at.x), y: Math.round(at.y) };
}

function returnTarget(at: MenuAt): HTMLElement | null {
    return 'anchor' in at ? at.anchor : (at.returnFocus ?? null);
}

/** Run a chosen item with focus back where the menu came from first, so the item may move it on. */
function choose(entry: MenuItemEntry | undefined, at: MenuAt) {
    const back = returnTarget(at);
    if (back?.isConnected) back.focus();
    if (entry && entry.enabled !== false) entry.run();
}

/**
 * Which menu button's menu is open (its `owner`), for the button's aria-expanded: the page's
 * own menu while it is drawn, the OS's while its call is out (macOS and Windows return when it
 * closes; GTK at once, so there it is never said to be open, which is the safe answer).
 */
let expandedOwner: string | null = null;
const expandedListeners = new Set<() => void>();

function setExpanded(owner: string | null) {
    if (expandedOwner === owner) return;
    expandedOwner = owner;
    for (const l of expandedListeners) l();
}

/** Whether the menu of the button that opens it as `owner` is open now. */
export function useMenuExpanded(owner: string): boolean {
    return useSyncExternalStore(
        (l) => {
            expandedListeners.add(l);
            return () => expandedListeners.delete(l);
        },
        () => expandedOwner === owner,
        () => false,
    );
}

let lastToken = 0;
let stopWaiting: (() => void) | null = null;

async function showNative(entries: MenuEntry[], at: MenuAt, owner: string | null, label?: string): Promise<void> {
    // one menu at a time: the one before it is closed by now
    stopWaiting?.();
    const token = ++lastToken;
    const { x, y } = menuPoint(at);
    let unlisten: (() => void) | null = null;
    let stopped = false;
    const stop = () => {
        stopped = true;
        unlisten?.();
        if (stopWaiting === stop) stopWaiting = null;
    };
    stopWaiting = stop;
    // listening before the menu opens: the choice can come back before invoke resolves
    const fn = await listen<{ token: number; index: number }>(POPUP_EVENT, (event) => {
        if (event.payload.token !== token || stopped) return;
        stop();
        const entry = entries[event.payload.index];
        choose(entry === 'separator' ? undefined : entry, at);
    });
    if (stopped) {
        fn();
        return;
    }
    unlisten = fn;
    setExpanded(owner);
    try {
        await invoke<void>('popup_menu', { token, entries: nativeEntries(entries), x, y });
    } catch (e) {
        stop();
        if (lastToken === token) setExpanded(null);
        // refused (a window without the permission) or failed: the page's own menu still opens
        console.warn('native menu', e);
        showPageMenu(entries, at, label, owner ?? undefined);
        return;
    }
    if (lastToken === token) setExpanded(null);
}

type Shown = { id: number; entries: MenuEntry[]; at: MenuAt; point: { x: number; y: number }; label?: string; owner?: string };
type Listener = (shown: Shown | null) => void;

/** The page's fallback menu: MenuHost draws what is shown here. */
export const fallbackMenus = {
    current: null as Shown | null,
    listeners: new Set<Listener>(),
    show(shown: Shown | null) {
        this.current = shown;
        setExpanded(shown?.owner ?? null);
        for (const l of this.listeners) l(shown);
    },
    subscribe(l: Listener): () => void {
        this.listeners.add(l);
        return () => this.listeners.delete(l);
    },
    /** The menu closed: an item was chosen (its index) or nothing. Focus goes back where it came from. */
    close(index: number | null) {
        const shown = this.current;
        this.show(null);
        if (!shown) return;
        const entry = index === null ? undefined : shown.entries[index];
        choose(entry === 'separator' ? undefined : entry, shown.at);
    },
};

/**
 * Open a menu. It resolves once it is open (the page's menu) or closed (the OS's); a chosen
 * item's `run` is called later. `owner` names the menu button it belongs to (useMenuExpanded).
 */
export function showMenu(entries: MenuEntry[], at: MenuAt, options: { label?: string; owner?: string } = {}): Promise<void> {
    if (!entries.some((e) => e !== 'separator')) return Promise.resolve();
    if (inApp) return showNative(entries, at, options.owner ?? null, options.label);
    showPageMenu(entries, at, options.label, options.owner);
    return Promise.resolve();
}

function showPageMenu(entries: MenuEntry[], at: MenuAt, label?: string, owner?: string) {
    fallbackMenus.show({ id: ++lastToken, entries, at, point: menuPoint(at), label, owner });
}

/** A context menu from the keyboard: Shift+F10 or the Menu key. */
export function isContextMenuKey(e: Pick<KeyboardEvent, 'key' | 'shiftKey'>): boolean {
    return e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey);
}
