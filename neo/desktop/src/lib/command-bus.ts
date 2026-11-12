/**
 * Where commands come from: the native menu (a Tauri event from src-tauri/src/menu.rs), the
 * keyboard (shortcuts.ts) and the mouse's back and forward buttons. All of them end in one
 * handler.
 */
import { listen } from '@tauri-apps/api/event';

import { inApp } from './native';
import { appSettings } from './settings';
import { type CommandId, COMMANDS, commandForKey, commandForMouseButton, isCommandId, type Platform } from './shortcuts';

/** The Tauri event the menu sends (menu.rs, MENU_EVENT); its payload is a command id. */
export const MENU_EVENT = 'menu';

/**
 * A command chosen by its key equivalent comes as `<id>@key` (menu.rs FIELD_KEYS): macOS gives
 * the key to the menu first, so a focused field that takes those keys itself (the rich editor's
 * ⌘K, a link) gets them here, as a `field-shortcut` event with the command's id, and the command
 * runs only when no field took it.
 */
export const FIELD_SHORTCUT_EVENT = 'field-shortcut';

/** The command of a menu event's payload, or null when a focused field took its keys. */
export function menuCommand(payload: string, active: Element | null = document.activeElement): CommandId | null {
    const byKey = payload.endsWith('@key');
    const id = byKey ? payload.slice(0, -4) : payload;
    if (!isCommandId(id)) return null;
    if (byKey && active?.closest('[data-field-shortcuts]')) {
        const taken = new CustomEvent<string>(FIELD_SHORTCUT_EVENT, { detail: id, cancelable: true, bubbles: true });
        // the field cancels it when it took the keys
        if (!active.dispatchEvent(taken)) return null;
    }
    return id;
}

/**
 * While a dialog is open, keys and mouse buttons belong to it (Esc closes the dialog, not the
 * pane under it), wherever focus is: a click on the dialog's blank space leaves focus on body.
 */
function modalOpen(): boolean {
    return !!document.querySelector('dialog[open]');
}

export function listenForCommands(run: (id: CommandId) => void, platform: Platform): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
        if (modalOpen()) return;
        // single keys (j, k, ?) only while Settings > Keyboard leaves them on
        const id = commandForKey(e, platform, COMMANDS, appSettings.current.singleKeyShortcuts);
        if (!id) return;
        e.preventDefault();
        run(id);
    };
    const onMouseUp = (e: MouseEvent) => {
        const id = commandForMouseButton(e.button);
        if (!id || modalOpen()) return;
        e.preventDefault();
        run(id);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mouseup', onMouseUp);

    let stopped = false;
    let unlisten: (() => void) | null = null;
    if (inApp) {
        void listen<string>(MENU_EVENT, (event) => {
            const id = menuCommand(event.payload);
            if (id) run(id);
        }).then(
            (fn) => {
                if (stopped) fn();
                else unlisten = fn;
            },
            (e: unknown) => console.error('menu events', e),
        );
    }

    return () => {
        stopped = true;
        unlisten?.();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('mouseup', onMouseUp);
    };
}
