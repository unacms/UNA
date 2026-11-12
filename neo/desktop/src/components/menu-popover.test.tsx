import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fallbackMenus, type MenuEntry, showMenu } from '../lib/native-menu';
import { MenuHost, typeAhead } from './menu-popover';

afterEach(() => {
    act(() => fallbackMenus.show(null));
    cleanup();
});

function setup(entries: MenuEntry[]) {
    render(
        <>
            <button type="button">Opener</button>
            <button type="button">After</button>
            <MenuHost />
        </>,
    );
    const opener = screen.getByRole('button', { name: 'Opener' });
    opener.focus();
    act(() => void showMenu(entries, { anchor: opener }, { label: 'Things' }));
    return { opener, menu: screen.getByRole('menu', { name: 'Things' }) };
}

describe('the page’s own menu (outside the app)', () => {
    it('moves with the arrows, Home and End, and focuses the checked item first', () => {
        const run = vi.fn();
        const { menu } = setup([
            { text: 'Apples', run },
            { text: 'Bananas', checked: true, run },
            'separator',
            { text: 'Cherries', run },
        ]);
        const items = Array.from(menu.querySelectorAll<HTMLElement>('[role^="menuitem"]'));
        expect(items.map((i) => i.textContent?.trim())).toEqual(['Apples', 'Bananas', 'Cherries']);
        expect(within(menu).getByRole('menuitemradio', { name: 'Bananas' }).getAttribute('aria-checked')).toBe('true');
        expect(document.activeElement).toBe(items[1]);
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(items[2]);
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(items[0]);
        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        expect(document.activeElement).toBe(items[2]);
        fireEvent.keyDown(menu, { key: 'Home' });
        expect(document.activeElement).toBe(items[0]);
        fireEvent.keyDown(menu, { key: 'End' });
        expect(document.activeElement).toBe(items[2]);
        expect(menu.querySelector('[role="separator"]')).toBeTruthy();
    });

    it('goes to the next item starting with a typed letter', () => {
        const run = vi.fn();
        const { menu } = setup([
            { text: 'Sign Out', run },
            { text: 'Settings…', run },
            { text: 'View Profile', run },
        ]);
        const items = within(menu).getAllByRole('menuitem');
        expect(document.activeElement).toBe(items[0]);
        // letters typed far apart are searches of their own; close together they add up
        let clock = 10_000;
        vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000));
        fireEvent.keyDown(menu, { key: 'v' });
        expect(document.activeElement).toBe(items[2]);
        fireEvent.keyDown(menu, { key: 's' });
        expect(document.activeElement).toBe(items[0]);
        fireEvent.keyDown(menu, { key: 's' });
        expect(document.activeElement, 'a repeated letter cycles').toBe(items[1]);
        clock = 50_000;
        vi.spyOn(Date, 'now').mockImplementation(() => (clock += 100));
        fireEvent.keyDown(menu, { key: 's' });
        fireEvent.keyDown(menu, { key: 'i' });
        expect(document.activeElement, '"si": Sign Out').toBe(items[0]);
        vi.restoreAllMocks();
    });

    it('runs the chosen item with Enter, after focus is back on the button that opened it', () => {
        let focusedWhenRun: Element | null = null;
        const run = vi.fn(() => {
            focusedWhenRun = document.activeElement;
        });
        const { opener, menu } = setup([{ text: 'Later', enabled: false, run }, { text: 'Now', run }]);
        const later = within(menu).getByRole('menuitem', { name: 'Later' });
        expect(later.getAttribute('aria-disabled')).toBe('true');
        later.focus();
        fireEvent.keyDown(later, { key: 'Enter' });
        expect(run).not.toHaveBeenCalled();
        expect(screen.getByRole('menu')).toBeTruthy();
        const now = within(menu).getByRole('menuitem', { name: 'Now' });
        now.focus();
        fireEvent.keyDown(now, { key: 'Enter' });
        expect(run).toHaveBeenCalledTimes(1);
        expect(focusedWhenRun).toBe(opener);
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('closes with Esc and gives focus back, and with Tab', () => {
        const run = vi.fn();
        const { opener, menu } = setup([{ text: 'One', run }]);
        fireEvent.keyDown(menu, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(document.activeElement).toBe(opener);
        act(() => void showMenu([{ text: 'One', run }], { anchor: opener }));
        fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(document.activeElement, 'Tab goes on from the opener').toBe(opener);
        expect(run).not.toHaveBeenCalled();
    });

    it('closes on a click outside it', () => {
        const run = vi.fn();
        setup([{ text: 'One', run }]);
        fireEvent.pointerDown(screen.getByRole('button', { name: 'After' }));
        expect(screen.queryByRole('menu')).toBeNull();
        expect(run).not.toHaveBeenCalled();
    });
});

describe('typeAhead', () => {
    it('finds the next match after the current item, wrapping', () => {
        const texts = ['Home', 'Help', 'Explore'];
        expect(typeAhead(texts, 'h', 0)).toBe(1);
        expect(typeAhead(texts, 'h', 1)).toBe(0);
        expect(typeAhead(texts, 'ex', -1)).toBe(2);
        expect(typeAhead(texts, 'z', 0)).toBe(-1);
    });
});
