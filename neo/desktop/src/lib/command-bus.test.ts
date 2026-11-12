import { afterEach, describe, expect, it } from 'vitest';

import { FIELD_SHORTCUT_EVENT, menuCommand } from './command-bus';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('menu commands chosen by their keys', () => {
    it('run as any menu command where no field takes the keys', () => {
        expect(menuCommand('command-palette')).toBe('command-palette');
        expect(menuCommand('command-palette@key', document.body)).toBe('command-palette');
        expect(menuCommand('no-such-command')).toBeNull();
    });

    it('go to a focused field that takes them, which then cancels the command', () => {
        const field = document.createElement('div');
        field.setAttribute('data-field-shortcuts', 'command-palette');
        const inner = document.createElement('span');
        field.append(inner);
        document.body.append(field);
        const seen: string[] = [];
        field.addEventListener(FIELD_SHORTCUT_EVENT, (e) => {
            seen.push((e as CustomEvent<string>).detail);
            e.preventDefault();
        });
        expect(menuCommand('command-palette@key', inner)).toBeNull();
        expect(seen).toEqual(['command-palette']);
        // chosen with the mouse: the palette, whatever has focus
        expect(menuCommand('command-palette', inner)).toBe('command-palette');
    });

    it('run when the field lets them through', () => {
        const field = document.createElement('div');
        field.setAttribute('data-field-shortcuts', '');
        document.body.append(field);
        expect(menuCommand('command-palette@key', field)).toBe('command-palette');
    });
});
