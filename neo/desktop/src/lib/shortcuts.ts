/**
 * App commands and their keys. One table (commands.json) feeds the native macOS menu and the
 * key handling here, so a shortcut is defined once: on macOS the menu's accelerator takes the
 * key before the web view sees it, so the web view handles only the keys that are not in the
 * menu; on Windows and Linux (no menu bar) it handles all of them.
 */
import table from './commands.json';
import { t } from './i18n';

export const COMMAND_IDS = [
    'check-updates',
    'open-settings',
    'new-tab',
    'close-tab',
    'reopen-tab',
    'close-window',
    'new-post',
    'new-message',
    'open-in-window',
    'add-network',
    'sign-out',
    'command-palette',
    'go-home',
    'go-explore',
    'go-notifications',
    'go-messages',
    'go-profile',
    'go-search',
    'toggle-sidebar',
    'hide-sidebar',
    'back',
    'forward',
    'next-pane',
    'previous-pane',
    'refresh',
    'theme-system',
    'theme-light',
    'theme-dark',
    'previous-tab',
    'next-tab',
    'select-tab-1',
    'select-tab-2',
    'select-tab-3',
    'select-tab-4',
    'select-tab-5',
    'select-tab-6',
    'select-tab-7',
    'select-tab-8',
    'select-tab-9',
    'switch-network-1',
    'switch-network-2',
    'switch-network-3',
    'switch-network-4',
    'switch-network-5',
    'switch-network-6',
    'switch-network-7',
    'switch-network-8',
    'switch-network-9',
    'close-detail',
    'next-item',
    'previous-item',
    'open-item',
    'show-new',
    'react',
    'comment',
    'reply',
    'open-author',
    'mark-read',
    'mark-all-read',
    'show-shortcuts',
    'open-site',
    'report-issue',
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

/** The n-th network of the list (1 to 9), from its command; null for other commands. */
export function networkNumber(id: CommandId): number | null {
    const m = /^switch-network-([1-9])$/.exec(id);
    return m ? Number(m[1]) : null;
}

/** The n-th tab (1 to 9: 9 is the last one), from its command; null for other commands. */
export function tabNumber(id: CommandId): number | null {
    const m = /^select-tab-([1-9])$/.exec(id);
    return m ? Number(m[1]) : null;
}

export type Command = {
    id: CommandId;
    label: string;
    help: string;
    menu?: 'app' | 'file' | 'view' | 'window' | 'help';
    section?: number;
    /** Tauri accelerator syntax, e.g. CmdOrCtrl+1. In the menu on macOS. */
    accelerator?: string;
    /** A key (KeyboardEvent.key) the web view handles everywhere, e.g. Escape or ?. */
    keys?: string;
    /** The Lucide icon the command palette shows; native menus show none. */
    icon?: string;
};

const ids = new Set<string>(COMMAND_IDS);

export function isCommandId(value: unknown): value is CommandId {
    return typeof value === 'string' && ids.has(value);
}

export const COMMANDS: readonly Command[] = table.commands.filter((c) => isCommandId(c.id)) as Command[];

export type Platform = {
    /** Cmd is the command modifier (macOS); Ctrl elsewhere. */
    mac: boolean;
    /** The native menu handles accelerators (the app on macOS). */
    nativeMenu: boolean;
};

/**
 * An accelerator's modifiers: `mod` is CmdOrCtrl (Cmd on macOS, Ctrl elsewhere); `meta` and
 * `ctrl` are Cmd and Ctrl named on their own (Cmd+Ctrl+1, a network). Where there is no Cmd
 * key to spare (Windows, Linux), Cmd+Ctrl is Ctrl+Shift: not Ctrl+Alt, which is AltGr there,
 * the key that types [ ] { } and other characters on many layouts (German, Polish, Czech).
 */
type Accelerator = { mod: boolean; meta: boolean; ctrl: boolean; shift: boolean; alt: boolean; code: string };

const KEY_CODES: Record<string, string> = {
    '[': 'BracketLeft',
    ']': 'BracketRight',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    '\\': 'Backslash',
    ';': 'Semicolon',
    '=': 'Equal',
    '-': 'Minus',
};

/** The physical key of an accelerator's last part, as KeyboardEvent.code names it (as Tauri's menus do). */
function keyCode(key: string): string | null {
    if (/^[0-9]$/.test(key)) return `Digit${key}`;
    if (/^[A-Za-z]$/.test(key)) return `Key${key.toUpperCase()}`;
    if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) return key;
    if (key === 'Enter' || key === 'Escape' || key === 'Tab' || key === 'Space') return key;
    return KEY_CODES[key] ?? null;
}

export function parseAccelerator(accelerator: string): Accelerator | null {
    // the last part may itself be '+'; none of ours is
    const parts = accelerator.split('+');
    const key = parts.pop();
    if (!key) return null;
    const code = keyCode(key);
    if (!code) return null;
    const result: Accelerator = { mod: false, meta: false, ctrl: false, shift: false, alt: false, code };
    for (const part of parts) {
        const p = part.toLowerCase();
        if (p === 'cmdorctrl' || p === 'commandorcontrol') result.mod = true;
        else if (p === 'cmd' || p === 'command' || p === 'super' || p === 'meta') result.meta = true;
        else if (p === 'ctrl' || p === 'control') result.ctrl = true;
        else if (p === 'shift') result.shift = true;
        else if (p === 'alt' || p === 'option') result.alt = true;
        else return null;
    }
    return result;
}

export type KeyInput = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'> & {
    getModifierState?: (key: string) => boolean;
    isComposing?: boolean;
    defaultPrevented?: boolean;
    target?: EventTarget | null;
};

/** Typing goes to text fields: single keys (?, Escape) stay theirs. */
export function isEditable(target: EventTarget | null | undefined): boolean {
    if (!target || typeof (target as Element).closest !== 'function') return false;
    const el = target as HTMLElement;
    // the rich editor's text (jsdom has no isContentEditable)
    if (el.isContentEditable || el.closest('[contenteditable="true"]')) return true;
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag !== 'INPUT') return false;
    const type = (el as HTMLInputElement).type;
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(type);
}

/**
 * Marks an element whose single keys are its own wherever focus is inside it, buttons too (an
 * editor open in place: l, c or r there must not act on the post, nor Esc close its pane).
 */
export const OWN_KEYS_ATTR = 'data-own-keys';

function inOwnKeys(target: EventTarget | null | undefined): boolean {
    if (!target || typeof (target as Element).closest !== 'function') return false;
    return !!(target as Element).closest(`[${OWN_KEYS_ATTR}]`);
}

/** The keys an accelerator needs held on this platform. */
function heldKeys(a: Accelerator, mac: boolean): { meta: boolean; ctrl: boolean; alt: boolean; shift: boolean } {
    if (mac) return { meta: a.mod || a.meta, ctrl: a.ctrl, alt: a.alt, shift: a.shift };
    return { meta: false, ctrl: a.mod || a.ctrl, alt: a.alt, shift: a.shift || a.meta };
}

/**
 * AltGr held (Windows and Linux report it as Ctrl+Alt too): the key types a character, such as
 * [ with AltGr+8 on a German keyboard, and is no shortcut.
 */
function isAltGraph(e: KeyInput): boolean {
    return !!e.getModifierState?.('AltGraph');
}

function matchesAccelerator(e: KeyInput, a: Accelerator, mac: boolean): boolean {
    const want = heldKeys(a, mac);
    if (!mac && isAltGraph(e)) return false;
    return e.code === a.code && e.metaKey === want.meta && e.ctrlKey === want.ctrl && e.shiftKey === want.shift && e.altKey === want.alt;
}

/** Keys that type a character: those WCAG 2.1.4 lets people turn off (not Escape, F6 or the like). */
function isCharacterKey(keys: string): boolean {
    return [...keys].length === 1;
}

/**
 * Whether a key press is a command's single key. A letter is that letter with Shift for a capital
 * (E) and without it for a small one (e), whatever Caps Lock does to `key`: with Caps Lock on, e
 * still marks one notification read, and only Shift+E marks all of them.
 */
function matchesKey(e: KeyInput, keys: string): boolean {
    if (/^[a-z]$/.test(keys)) return !e.shiftKey && e.key.toLowerCase() === keys;
    if (isCapital(keys)) return e.shiftKey && e.key.toUpperCase() === keys;
    return e.key === keys;
}

/**
 * The command a key press runs, or null. With `singleKeys` off (Settings > Keyboard, WCAG
 * 2.1.4) the shortcuts of one character key (j, k, ?, …) do nothing; Esc and those with a
 * modifier still work.
 */
export function commandForKey(e: KeyInput, platform: Platform, commands: readonly Command[] = COMMANDS, singleKeys = true): CommandId | null {
    if (e.isComposing || e.defaultPrevented) return null;
    for (const c of commands) {
        if (c.accelerator && !(platform.nativeMenu && c.menu)) {
            const a = parseAccelerator(c.accelerator);
            if (a && matchesAccelerator(e, a, platform.mac)) return c.id;
        }
        if (!c.keys || (!singleKeys && isCharacterKey(c.keys))) continue;
        if (matchesKey(e, c.keys) && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target) && !inOwnKeys(e.target)) return c.id;
    }
    return null;
}

/** A command's keys are one character key, which Settings can turn off. */
export function isSingleKeyCommand(c: Command): boolean {
    return !!c.keys && isCharacterKey(c.keys);
}

/** Mouse back and forward buttons (MouseEvent.button 3 and 4). */
export function commandForMouseButton(button: number): CommandId | null {
    if (button === 3) return 'back';
    if (button === 4) return 'forward';
    return null;
}

const MAC_SYMBOLS: Record<string, string> = { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃' };

function isCapital(key: string): boolean {
    return key.length === 1 && key >= 'A' && key <= 'Z';
}

/** The keys of a command as key caps for the shortcut sheet, e.g. ['⌘', '1'] or ['Ctrl', '1']. */
export function keyCaps(c: Command, mac: boolean): string[] {
    if (c.keys) {
        // a capital letter is that letter with Shift
        if (isCapital(c.keys)) return [mac ? (MAC_SYMBOLS.shift ?? 'Shift') : 'Shift', c.keys];
        return [c.keys === 'Escape' ? 'Esc' : c.keys];
    }
    if (!c.accelerator) return [];
    const a = parseAccelerator(c.accelerator);
    if (!a) return [];
    const key = c.accelerator.split('+').pop() ?? '';
    const held = heldKeys(a, mac);
    // in the order each platform writes them: ⌃⌥⇧⌘ on macOS, Ctrl+Alt+Shift elsewhere
    const caps: string[] = mac
        ? [held.ctrl && '⌃', held.alt && '⌥', held.shift && '⇧', held.meta && (MAC_SYMBOLS.mod ?? '⌘')].filter((k): k is string => !!k)
        : [held.ctrl && 'Ctrl', held.alt && 'Alt', held.shift && 'Shift'].filter((k): k is string => !!k);
    caps.push(key);
    return caps;
}

/** Key caps as a short text: "⌘1" on macOS, "Ctrl+1" elsewhere. */
export function shortcutText(c: Command, mac: boolean): string {
    return keyCaps(c, mac).join(mac ? '' : '+');
}

/** How a key cap is said: screen readers mispronounce ⌘ ⇧ ⌥ ⌃ and most punctuation. */
const SPOKEN: Record<string, string> = {
    '⌘': t('Command', { context: 'key' }),
    '⇧': t('Shift'),
    '⌥': t('Option', { context: 'key' }),
    '⌃': t('Control', { context: 'key' }),
    Ctrl: t('Control', { context: 'key' }),
    Esc: t('Escape'),
    '↩': t('Return', { context: 'key' }),
    '[': t('Left Bracket'),
    ']': t('Right Bracket'),
    '\\': t('Backslash'),
    ',': t('Comma'),
    '.': t('Period', { context: 'key' }),
    '?': t('Question Mark'),
    '/': t('Slash'),
};

/** The keys in words, for the text beside a Kbd: "Command K", "Shift Command N", "Control Shift 1". */
export function spokenShortcut(c: Command, mac: boolean): string {
    return keyCaps(c, mac)
        .map((k) => SPOKEN[k] ?? k)
        .join(' ');
}

/** The command's keys in aria-keyshortcuts syntax, e.g. "Meta+1" or "Control+1". */
export function ariaKeyShortcuts(c: Command, mac: boolean): string | undefined {
    if (c.keys) return c.keys === '?' || isCapital(c.keys) ? `Shift+${c.keys}` : c.keys;
    if (!c.accelerator) return undefined;
    const a = parseAccelerator(c.accelerator);
    if (!a) return undefined;
    const held = heldKeys(a, mac);
    const key = c.accelerator.split('+').pop() ?? '';
    return [held.ctrl && 'Control', held.alt && 'Alt', held.shift && 'Shift', held.meta && 'Meta', key].filter((k): k is string => !!k).join('+');
}

export function command(id: CommandId): Command {
    const c = COMMANDS.find((x) => x.id === id);
    if (!c) throw new Error(`no command ${id}`);
    return c;
}
