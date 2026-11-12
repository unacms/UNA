/**
 * A conversation, post, discussion, video, photo, album, file, task, poll, Posts module post,
 * profile, group, space or event somewhere else than beside the list:
 *
 * - Cmd+click or Cmd+Enter (Ctrl elsewhere) on it: a new tab in the background (lib/tabs.ts),
 *   as a browser opens a link;
 * - Cmd+Option+click or Cmd+Option+Enter (Ctrl+Alt): a window of its own, as Open in New Window
 *   (File menu, a More menu, a toolbar button) and a double click on a sidebar context do.
 *
 * Rust opens the window (windows.rs), with the route in its address; only the main window may,
 * so in a window of its own these open in place as a plain Enter or click does.
 *
 * The many lists check the gesture with isWindowGesture or isWindowKey and then call the opener
 * of useOpenInWindow; the check notes which of the two the gesture was, and the opener, called
 * in the same event, takes it: a tab for Cmd alone, a window otherwise (a button, a menu item).
 */
import { useCallback } from 'react';

import { useWindowAnnounce } from './announce';
import { errorMessage } from './errors';
import { t, tCommand } from './i18n';
import type { MenuItemEntry } from './native-menu';
import { isSecondaryWindow, openWindow } from './native';
import { useOptionalNavigation, useTabs } from './navigation';
import { platform } from './platform';
import { type DetailRoute, routeToPath } from './router';
import { ariaKeyShortcuts, command } from './shortcuts';

type Modifiers = { metaKey: boolean; ctrlKey: boolean; altKey?: boolean; shiftKey?: boolean };

/** The details that open in a window of their own (windows.rs KINDS). */
export function opensInWindow(detail: DetailRoute): boolean {
    return detail.kind === 'conversation' || detail.kind === 'post' || detail.kind === 'discussion' || detail.kind === 'video' || detail.kind === 'photo' || detail.kind === 'album' || detail.kind === 'file' || detail.kind === 'task' || detail.kind === 'poll' || detail.kind === 'article' || detail.kind === 'profile' || detail.kind === 'group' || detail.kind === 'space' || detail.kind === 'event';
}

/** Where the gesture just checked opens: a background tab (Cmd alone) or a window (with Option). */
let gesture: 'tab' | 'window' | null = null;

function noteGesture(where: 'tab' | 'window'): void {
    gesture = where;
    // only the opener called in the same event takes it
    queueMicrotask(() => {
        gesture = null;
    });
}

/** Where a gesture opens, without noting it: null for a plain click or Enter. */
export function gestureTarget(e: Modifiers, mac = platform.mac): 'tab' | 'window' | null {
    const mod = mac ? e.metaKey : e.ctrlKey;
    const other = mac ? e.ctrlKey : e.metaKey;
    if (!mod || other || e.shiftKey) return null;
    return e.altKey ? 'window' : 'tab';
}

/**
 * Cmd (macOS) or Ctrl (elsewhere), with or without Option (Alt): the gesture that opens what it
 * is on elsewhere, a background tab or (with Option) a window of its own.
 */
export function isWindowGesture(e: Modifiers, mac = platform.mac): boolean {
    const where = gestureTarget(e, mac);
    if (where) noteGesture(where);
    return !!where;
}

/** Cmd+Enter or Cmd+Option+Enter (Ctrl elsewhere). */
export function isWindowKey(e: Modifiers & { key: string }, mac = platform.mac): boolean {
    return e.key === 'Enter' && isWindowGesture(e, mac);
}

/** The hint lists give for it: "⌘Enter or ⌘click opens it in a new tab, with ⌥ in a new window". */
export function openElsewhereHint(mac = platform.mac): string {
    const mod = mac ? '⌘' : 'Ctrl+';
    const alt = mac ? '⌥' : 'Alt';
    return t('{{mod}}Enter or {{mod}}click opens it in a new tab, with {{alt}} in a new window', { mod, alt });
}

/**
 * Open a detail in a window of its own, beside the list the main window shows now. Null where
 * it can't: in a window of its own, or without a router.
 */
export function useOpenInWindow(): ((detail: DetailRoute) => void) | null {
    const nav = useOptionalNavigation();
    const tabs = useTabs();
    const announce = useWindowAnnounce();
    const open = useCallback(
        (detail: DetailRoute) => {
            if (!nav || !opensInWindow(detail)) return;
            const where = gesture;
            gesture = null;
            const route = { list: nav.history.current.list, detail };
            // Cmd+click: a tab behind this one, as a browser opens a link
            if (where === 'tab' && tabs) {
                announce(tabs.open(route, { background: true }) ? t('Opened in a new tab') : t('Too many tabs open: close one first'));
                return;
            }
            // a refusal is said, not only logged: nothing else shows that no window came
            void openWindow(routeToPath(route)).catch((e: unknown) => announce(t('Could not open a window: {{reason}}', { reason: errorMessage(e) })));
        },
        [nav, tabs, announce],
    );
    return nav && !isSecondaryWindow ? open : null;
}

/** Open in New Window as a More menu's item, with the File menu's keys (commands.json open-in-window). */
export function openInWindowEntry(run: () => void): MenuItemEntry {
    const c = command('open-in-window');
    return { text: tCommand(c.label), accelerator: c.accelerator, keyshortcuts: ariaKeyShortcuts(c, platform.mac), run };
}
