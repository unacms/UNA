import { afterEach, describe, expect, it, vi } from 'vitest';

const calls: { cmd: string; args: unknown }[] = [];
let refuse: string | null = null;
let handler: ((event: { payload: { token: number; index: number } }) => void) | null = null;
const unlisten = vi.fn();

vi.mock('./native', () => ({ inApp: true }));
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(async (cmd: string, args: unknown) => {
        calls.push({ cmd, args });
        if (refuse) throw new Error(refuse);
    }),
}));
vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn(async (_event: string, fn: typeof handler) => {
        handler = fn;
        return unlisten;
    }),
}));

const { fallbackMenus, isContextMenuKey, menuPoint, nativeEntries, POPUP_EVENT, showMenu } = await import('./native-menu');

afterEach(() => {
    refuse = null;
    fallbackMenus.show(null);
    calls.length = 0;
    handler = null;
    unlisten.mockClear();
});

describe('native pop-up menus', () => {
    it('sends Rust the items in order, with their state and keys', () => {
        const run = () => {};
        expect(
            nativeEntries([
                { text: 'Gardeners – Lily', checked: true, accelerator: 'Cmd+Ctrl+1', run },
                { text: 'Cyclists', checked: false, run },
                'separator',
                { text: 'Add Network…', run },
                { text: 'Later', enabled: false, run },
            ]),
        ).toEqual([
            { kind: 'item', text: 'Gardeners – Lily', enabled: true, checked: true, accelerator: 'Cmd+Ctrl+1' },
            { kind: 'item', text: 'Cyclists', enabled: true, checked: false },
            { kind: 'separator' },
            { kind: 'item', text: 'Add Network…', enabled: true },
            { kind: 'item', text: 'Later', enabled: false },
        ]);
    });

    it('opens under its button and runs the item Rust says was chosen, with focus back on the button', async () => {
        const button = document.createElement('button');
        document.body.append(button);
        button.getBoundingClientRect = () => ({ left: 10.4, bottom: 40, top: 20, right: 90, width: 80, height: 20, x: 10.4, y: 20, toJSON: () => ({}) });
        const first = vi.fn();
        let focused: Element | null = null;
        const second = vi.fn(() => {
            focused = document.activeElement;
        });
        await showMenu([{ text: 'First', run: first }, 'separator', { text: 'Second', run: second }], { anchor: button });

        expect(calls).toHaveLength(1);
        const { cmd, args } = calls[0]!;
        expect(cmd).toBe('popup_menu');
        const { token, x, y, entries } = args as { token: number; x: number; y: number; entries: unknown[] };
        expect({ x, y }).toEqual({ x: 10, y: 44 });
        expect(entries).toHaveLength(3);
        // another menu's choice is not this one's
        handler?.({ payload: { token: token + 1, index: 2 } });
        expect(second).not.toHaveBeenCalled();
        handler?.({ payload: { token, index: 2 } });
        expect(second).toHaveBeenCalledTimes(1);
        expect(first).not.toHaveBeenCalled();
        expect(focused).toBe(button);
        expect(unlisten).toHaveBeenCalled();
        // and only once
        handler?.({ payload: { token, index: 2 } });
        expect(second).toHaveBeenCalledTimes(1);
        button.remove();
    });

    it('stops waiting for a menu once the next one opens', async () => {
        const a = vi.fn();
        await showMenu([{ text: 'A', run: a }], { x: 5, y: 6 });
        const firstToken = (calls[0]!.args as { token: number }).token;
        await showMenu([{ text: 'B', run: () => {} }], { x: 5, y: 6 });
        expect(unlisten).toHaveBeenCalledTimes(1);
        expect(POPUP_EVENT).toBe('menu-popup');
        expect(firstToken).toBeLessThan((calls[1]!.args as { token: number }).token);
    });

    it('opens at the pointer for a right-click, and knows the keyboard’s context-menu keys', () => {
        expect(menuPoint({ x: 12.6, y: 30.2 })).toEqual({ x: 13, y: 30 });
        expect(isContextMenuKey({ key: 'ContextMenu', shiftKey: false })).toBe(true);
        expect(isContextMenuKey({ key: 'F10', shiftKey: true })).toBe(true);
        expect(isContextMenuKey({ key: 'F10', shiftKey: false })).toBe(false);
    });

    it('opens the page’s own menu when the window may not open a native one', async () => {
        refuse = 'popup_menu not allowed. Permissions associated with this command: allow-popup-menu';
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const edit = vi.fn();
        await expect(showMenu([{ text: 'Edit Post', run: edit }], { x: 20, y: 30 }, { label: 'Actions for Lily’s post', owner: 'post-menu-1' })).resolves.toBeUndefined();
        expect(calls[0]!.cmd).toBe('popup_menu');
        expect(fallbackMenus.current?.label).toBe('Actions for Lily’s post');
        expect(fallbackMenus.current?.point).toEqual({ x: 20, y: 30 });
        fallbackMenus.close(0);
        expect(edit).toHaveBeenCalledTimes(1);
        // and it no longer waits for Rust's answer
        expect(unlisten).toHaveBeenCalled();
        warn.mockRestore();
    });
});
