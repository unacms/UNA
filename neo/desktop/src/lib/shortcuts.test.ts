import { describe, expect, it } from 'vitest';

import table from './commands.json';
import {
    ariaKeyShortcuts,
    command,
    COMMAND_IDS,
    commandForKey,
    commandForMouseButton,
    COMMANDS,
    isEditable,
    keyCaps,
    type KeyInput,
    parseAccelerator,
    type Platform,
    shortcutText,
    tabNumber,
} from './shortcuts';

const mac: Platform = { mac: true, nativeMenu: false };
const macApp: Platform = { mac: true, nativeMenu: true };
const windows: Platform = { mac: false, nativeMenu: false };

function key(k: Partial<KeyInput> & Pick<KeyInput, 'key'>): KeyInput {
    return { code: '', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...k };
}

describe('the command table', () => {
    it('lists exactly the commands the app knows', () => {
        expect(table.commands.map((c) => c.id).sort()).toEqual([...COMMAND_IDS].sort());
        expect(COMMANDS).toHaveLength(COMMAND_IDS.length);
    });

    it('parses every accelerator', () => {
        for (const c of COMMANDS) if (c.accelerator) expect(parseAccelerator(c.accelerator), c.id).not.toBeNull();
    });

    it('has no two commands on the same keys', () => {
        const seen = new Set<string>();
        for (const c of COMMANDS) {
            const keys = c.accelerator ?? c.keys;
            if (!keys) continue;
            expect(seen.has(keys), keys).toBe(false);
            seen.add(keys);
        }
    });
});

describe('parseAccelerator', () => {
    it('reads modifiers and the physical key', () => {
        const none = { mod: false, meta: false, ctrl: false, shift: false, alt: false };
        expect(parseAccelerator('CmdOrCtrl+1')).toEqual({ ...none, mod: true, code: 'Digit1' });
        expect(parseAccelerator('CmdOrCtrl+Shift+N')).toEqual({ ...none, mod: true, shift: true, code: 'KeyN' });
        expect(parseAccelerator('CmdOrCtrl+[')).toEqual({ ...none, mod: true, code: 'BracketLeft' });
        expect(parseAccelerator('Shift+F6')).toEqual({ ...none, shift: true, code: 'F6' });
        expect(parseAccelerator('Cmd+Ctrl+2')).toEqual({ ...none, meta: true, ctrl: true, code: 'Digit2' });
        expect(parseAccelerator('CmdOrCtrl+,')).toEqual({ ...none, mod: true, code: 'Comma' });
        expect(parseAccelerator('CmdOrCtrl+\\')).toEqual({ ...none, mod: true, code: 'Backslash' });
    });

    it('switches networks with Cmd+Ctrl+1…9 on macOS and Ctrl+Shift elsewhere', () => {
        expect(commandForKey(key({ key: '2', code: 'Digit2', metaKey: true, ctrlKey: true }), mac)).toBe('switch-network-2');
        expect(commandForKey(key({ key: '2', code: 'Digit2', metaKey: true }), mac)).toBe('select-tab-2');
        expect(commandForKey(key({ key: '@', code: 'Digit2', ctrlKey: true, shiftKey: true }), windows)).toBe('switch-network-2');
        expect(commandForKey(key({ key: '2', code: 'Digit2', ctrlKey: true }), windows)).toBe('select-tab-2');
        expect(keyCaps(command('switch-network-3'), true)).toEqual(['⌃', '⌘', '3']);
        expect(keyCaps(command('switch-network-3'), false)).toEqual(['Ctrl', 'Shift', '3']);
        expect(ariaKeyShortcuts(command('switch-network-3'), true)).toBe('Control+Meta+3');
        expect(ariaKeyShortcuts(command('switch-network-3'), false)).toBe('Control+Shift+3');
    });

    it('leaves AltGr to typing on Windows and Linux', () => {
        const altGr = (k: Partial<KeyInput> & Pick<KeyInput, 'key'>) => key({ ctrlKey: true, altKey: true, getModifierState: (m) => m === 'AltGraph', ...k });
        // [ and { on a German keyboard are AltGr+8 and AltGr+7, reported with Ctrl and Alt held
        expect(commandForKey(altGr({ key: '[', code: 'Digit8' }), windows)).toBeNull();
        expect(commandForKey(altGr({ key: '{', code: 'Digit7' }), windows)).toBeNull();
        expect(commandForKey(key({ key: '[', code: 'Digit8', ctrlKey: true, altKey: true }), windows)).toBeNull();
        // AltGr+Shift+digit is no network switch either
        expect(commandForKey(altGr({ key: '2', code: 'Digit2', shiftKey: true }), windows)).toBeNull();
    });

    it('opens Settings with Cmd+, and toggles the sidebar with Cmd+\\', () => {
        expect(commandForKey(key({ key: ',', code: 'Comma', metaKey: true }), mac)).toBe('open-settings');
        expect(commandForKey(key({ key: '\\', code: 'Backslash', ctrlKey: true }), windows)).toBe('toggle-sidebar');
    });

    it('turns single-key shortcuts off when Settings says so, but not Esc or the modified ones', () => {
        const all = undefined;
        expect(commandForKey(key({ key: 'j', code: 'KeyJ' }), windows, all, false)).toBeNull();
        expect(commandForKey(key({ key: '?', code: 'Slash', shiftKey: true }), windows, all, false)).toBeNull();
        expect(commandForKey(key({ key: 'E', code: 'KeyE', shiftKey: true }), windows, all, false)).toBeNull();
        expect(commandForKey(key({ key: 'Escape', code: 'Escape' }), windows, all, false)).toBe('close-detail');
        expect(commandForKey(key({ key: '1', code: 'Digit1', ctrlKey: true }), windows, all, false)).toBe('select-tab-1');
        expect(commandForKey(key({ key: 'j', code: 'KeyJ' }), windows, all, true)).toBe('next-item');
    });

    it('refuses what it does not know', () => {
        expect(parseAccelerator('Hyper+1')).toBeNull();
        expect(parseAccelerator('CmdOrCtrl+Ü')).toBeNull();
        expect(parseAccelerator('')).toBeNull();
    });
});

describe('commandForKey', () => {
    it('maps Cmd+Option+1…5 to the sections on macOS and Ctrl+Alt+1…5 elsewhere, and Cmd+1…9 (Ctrl) to the tabs', () => {
        const sections = ['go-home', 'go-explore', 'go-notifications', 'go-messages', 'go-profile'];
        sections.forEach((id, i) => {
            expect(commandForKey(key({ key: String(i + 1), code: `Digit${i + 1}`, metaKey: true, altKey: true }), mac)).toBe(id);
            expect(commandForKey(key({ key: String(i + 1), code: `Digit${i + 1}`, ctrlKey: true, altKey: true }), windows)).toBe(id);
        });
        for (let n = 1; n <= 9; n++) {
            expect(commandForKey(key({ key: String(n), code: `Digit${n}`, metaKey: true }), mac)).toBe(`select-tab-${n}`);
            expect(commandForKey(key({ key: String(n), code: `Digit${n}`, ctrlKey: true }), windows)).toBe(`select-tab-${n}`);
            // no menu item holds them: the page takes them in the macOS app too
            expect(commandForKey(key({ key: String(n), code: `Digit${n}`, metaKey: true }), macApp)).toBe(`select-tab-${n}`);
        }
        expect(tabNumber('select-tab-9')).toBe(9);
        expect(tabNumber('go-home')).toBeNull();
        expect(commandForKey(key({ key: 't', code: 'KeyT', metaKey: true }), mac)).toBe('new-tab');
        expect(commandForKey(key({ key: 'w', code: 'KeyW', ctrlKey: true }), windows)).toBe('close-tab');
        expect(commandForKey(key({ key: 'T', code: 'KeyT', ctrlKey: true, shiftKey: true }), windows)).toBe('reopen-tab');
    });

    it('needs exactly the accelerator’s modifiers', () => {
        expect(commandForKey(key({ key: '1', code: 'Digit1', ctrlKey: true }), mac)).toBeNull();
        expect(commandForKey(key({ key: '1', code: 'Digit1', metaKey: true }), windows)).toBeNull();
        expect(commandForKey(key({ key: '1', code: 'Digit1', metaKey: true, shiftKey: true }), mac)).toBeNull();
        expect(commandForKey(key({ key: '1', code: 'Digit1' }), mac)).toBeNull();
    });

    it('matches the physical key, whatever the layout types', () => {
        // Cmd+[ on a layout where that key types something else
        expect(commandForKey(key({ key: 'ü', code: 'BracketLeft', metaKey: true }), mac)).toBe('back');
        expect(commandForKey(key({ key: ']', code: 'BracketRight', ctrlKey: true }), windows)).toBe('forward');
        expect(commandForKey(key({ key: 'n', code: 'KeyN', metaKey: true }), mac)).toBe('new-post');
        expect(commandForKey(key({ key: 'F6', code: 'F6' }), windows)).toBe('next-pane');
        expect(commandForKey(key({ key: 'F6', code: 'F6', shiftKey: true }), windows)).toBe('previous-pane');
    });

    it('leaves menu accelerators to the native menu in the macOS app', () => {
        expect(commandForKey(key({ key: '1', code: 'Digit1', metaKey: true, altKey: true }), macApp)).toBeNull();
        expect(commandForKey(key({ key: 'r', code: 'KeyR', metaKey: true }), macApp)).toBeNull();
        // keys the menu does not hold still work
        expect(commandForKey(key({ key: 'Escape', code: 'Escape' }), macApp)).toBe('close-detail');
        expect(commandForKey(key({ key: '?', code: 'Slash', shiftKey: true }), macApp)).toBe('show-shortcuts');
    });

    it('handles ? and Esc, but not while typing', () => {
        const textarea = document.createElement('textarea');
        const input = document.createElement('input');
        const checkbox = Object.assign(document.createElement('input'), { type: 'checkbox' });
        const button = document.createElement('button');
        expect(commandForKey(key({ key: '?', shiftKey: true }), windows)).toBe('show-shortcuts');
        expect(commandForKey(key({ key: '?', shiftKey: true, target: textarea }), windows)).toBeNull();
        expect(commandForKey(key({ key: 'Escape', target: input }), windows)).toBeNull();
        expect(commandForKey(key({ key: 'Escape', target: checkbox }), windows)).toBe('close-detail');
        expect(commandForKey(key({ key: 'Escape', target: button }), windows)).toBe('close-detail');
        expect(commandForKey(key({ key: 'Escape', metaKey: true }), windows)).toBeNull();
    });

    it('takes a capital letter only with Shift, so Caps Lock never turns e into Shift+E', () => {
        expect(commandForKey(key({ key: 'e', code: 'KeyE' }), windows)).toBe('mark-read');
        expect(commandForKey(key({ key: 'E', code: 'KeyE', shiftKey: true }), windows)).toBe('mark-all-read');
        // Caps Lock on: e is still e, and Shift+e still Shift+E
        expect(commandForKey(key({ key: 'E', code: 'KeyE' }), windows)).toBe('mark-read');
        expect(commandForKey(key({ key: 'e', code: 'KeyE', shiftKey: true }), windows)).toBe('mark-all-read');
        expect(commandForKey(key({ key: 'J', code: 'KeyJ', shiftKey: true }), windows)).toBeNull();
    });

    it('still takes Cmd shortcuts in text fields', () => {
        const textarea = document.createElement('textarea');
        expect(commandForKey(key({ key: '2', code: 'Digit2', metaKey: true, altKey: true, target: textarea }), mac)).toBe('go-explore');
    });

    it('ignores composing input and handled events', () => {
        expect(commandForKey(key({ key: 'Escape', isComposing: true }), windows)).toBeNull();
        expect(commandForKey(key({ key: 'Escape', defaultPrevented: true }), windows)).toBeNull();
    });
});

describe('isEditable', () => {
    it('knows text fields', () => {
        const editable = document.createElement('div');
        editable.contentEditable = 'true';
        // jsdom has no isContentEditable
        Object.defineProperty(editable, 'isContentEditable', { value: true });
        expect(isEditable(editable)).toBe(true);
        expect(isEditable(document.createElement('select'))).toBe(true);
        expect(isEditable(Object.assign(document.createElement('input'), { type: 'search' }))).toBe(true);
        expect(isEditable(Object.assign(document.createElement('input'), { type: 'submit' }))).toBe(false);
        expect(isEditable(document.createElement('div'))).toBe(false);
        expect(isEditable(null)).toBe(false);
        expect(isEditable(window)).toBe(false);
    });

    it('leaves single keys to an editor open in place, on its buttons too', () => {
        const form = document.createElement('form');
        form.setAttribute('data-own-keys', '');
        const save = document.createElement('button');
        form.append(save);
        expect(commandForKey(key({ key: 'Escape', code: 'Escape', target: save }), mac)).toBeNull();
        expect(commandForKey(key({ key: 'l', code: 'KeyL', target: save }), mac)).toBeNull();
        // outside it they work, and accelerators work inside it too
        expect(commandForKey(key({ key: 'l', code: 'KeyL', target: document.createElement('button') }), mac)).toBe('react');
        expect(commandForKey(key({ key: '1', code: 'Digit1', metaKey: true, target: save }), mac)).not.toBeNull();
    });
});

describe('mouse buttons', () => {
    it('maps back and forward', () => {
        expect(commandForMouseButton(3)).toBe('back');
        expect(commandForMouseButton(4)).toBe('forward');
        expect(commandForMouseButton(0)).toBeNull();
        expect(commandForMouseButton(1)).toBeNull();
    });
});

describe('labels', () => {
    it('writes keys the way each platform does', () => {
        expect(keyCaps(command('go-home'), true)).toEqual(['⌥', '⌘', '1']);
        expect(keyCaps(command('go-home'), false)).toEqual(['Ctrl', 'Alt', '1']);
        expect(keyCaps(command('select-tab-1'), true)).toEqual(['⌘', '1']);
        expect(keyCaps(command('previous-pane'), true)).toEqual(['⇧', 'F6']);
        expect(keyCaps(command('close-detail'), true)).toEqual(['Esc']);
        expect(keyCaps(command('open-site'), true)).toEqual([]);
        expect(shortcutText(command('back'), true)).toBe('⌘[');
        expect(shortcutText(command('back'), false)).toBe('Ctrl+[');
    });

    it('names keys for aria-keyshortcuts', () => {
        expect(ariaKeyShortcuts(command('go-home'), true)).toBe('Alt+Meta+1');
        expect(ariaKeyShortcuts(command('go-home'), false)).toBe('Control+Alt+1');
        expect(ariaKeyShortcuts(command('close-detail'), true)).toBe('Escape');
        expect(ariaKeyShortcuts(command('open-site'), true)).toBeUndefined();
    });
});
