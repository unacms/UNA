import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { fallbackMenus } from '../lib/native-menu';
import { listMax, panesMode, sidebarMax } from '../shell/layout';
import { MenuHost } from './menu-popover';
import { BIG_STEP, handleMenuPoint, ResizeHandle, STEP, widthForKey } from './resize-handle';

afterEach(() => {
    act(() => fallbackMenus.show(null));
    cleanup();
});

function Harness() {
    const [width, setWidth] = useState(220);
    return (
        <>
            <ResizeHandle label="Resize sidebar" value={width} min={180} max={320} defaultValue={220} onChange={setWidth} />
            <MenuHost />
        </>
    );
}

const handle = () => screen.getByRole('separator', { name: 'Resize sidebar' });
const now = () => Number(handle().getAttribute('aria-valuenow'));

describe('ResizeHandle', () => {
    it('is a focusable separator with its range', () => {
        render(<Harness />);
        const h = handle();
        expect(h.getAttribute('aria-orientation')).toBe('vertical');
        expect(h.tabIndex).toBe(0);
        expect([h.getAttribute('aria-valuemin'), h.getAttribute('aria-valuemax'), h.getAttribute('aria-valuenow')]).toEqual(['180', '320', '220']);
    });

    it('moves with the arrows, Shift+arrows, Home and End, and resets on a double-click', () => {
        render(<Harness />);
        fireEvent.keyDown(handle(), { key: 'ArrowRight' });
        expect(now()).toBe(220 + STEP);
        fireEvent.keyDown(handle(), { key: 'ArrowLeft', shiftKey: true });
        expect(now()).toBe(220 + STEP - BIG_STEP);
        fireEvent.keyDown(handle(), { key: 'End' });
        expect(now()).toBe(320);
        fireEvent.keyDown(handle(), { key: 'ArrowRight' });
        expect(now(), 'never past its widest').toBe(320);
        fireEvent.keyDown(handle(), { key: 'Home' });
        expect(now()).toBe(180);
        fireEvent.doubleClick(handle());
        expect(now()).toBe(220);
    });

    it('drags with the pointer', () => {
        render(<Harness />);
        fireEvent.pointerDown(handle(), { button: 0, clientX: 220, pointerId: 1 });
        fireEvent.pointerMove(handle(), { clientX: 260, pointerId: 1 });
        expect(now()).toBe(260);
        fireEvent.pointerUp(handle(), { clientX: 260, pointerId: 1 });
        fireEvent.pointerMove(handle(), { clientX: 300, pointerId: 1 });
        expect(now(), 'not after the pointer is up').toBe(260);
    });

    it('resizes without dragging from its menu: right-click, Shift+F10 or the Menu key (WCAG 2.5.7)', () => {
        render(<Harness />);
        fireEvent.contextMenu(handle(), { clientX: 220, clientY: 300 });
        const menu = screen.getByRole('menu');
        expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Narrower', 'Wider', 'Default Width']);
        expect(within(menu).getByRole('menuitem', { name: 'Default Width' }).getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(within(menu).getByRole('menuitem', { name: 'Wider' }));
        expect(now()).toBe(220 + BIG_STEP);
        expect(document.activeElement).toBe(handle());
        // from the keyboard it opens beside the handle's middle, not under its bottom (the window's)
        handle().getBoundingClientRect = () => ({ left: 216, right: 224, top: 0, bottom: 800, width: 8, height: 800, x: 216, y: 0, toJSON: () => ({}) });
        fireEvent.keyDown(handle(), { key: 'F10', shiftKey: true });
        expect(fallbackMenus.current?.point).toEqual({ x: 224, y: 400 });
        expect(handleMenuPoint({ right: 224, top: 0, height: 800 })).toEqual({ x: 224, y: 400 });
        fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Default Width' }));
        expect(now()).toBe(220);
        fireEvent.keyDown(handle(), { key: 'ContextMenu' });
        fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Narrower' }));
        expect(now()).toBe(220 - BIG_STEP);
    });

    it('takes only its keys', () => {
        expect(widthForKey('ArrowUp', false, 220, 180, 320)).toBeNull();
        expect(widthForKey('ArrowLeft', false, 184, 180, 320)).toBe(180);
    });
});

describe('the layout’s limits', () => {
    it('shows three panes only where the list and the detail both fit', () => {
        expect(panesMode(null)).toBe('three');
        expect(panesMode(760)).toBe('three');
        expect(panesMode(759)).toBe('cover');
    });

    it('never lets a width it allows switch the window to the cover', () => {
        // the list: never so wide the detail goes under 420
        expect(listMax(1000)).toBe(580);
        expect(listMax(2000)).toBe(600);
        expect(listMax(700)).toBe(340);
        // the sidebar: a window keeps 760 for the panes beside it, whatever the sidebar is now
        expect(sidebarMax(1000)).toBe(240);
        expect(sidebarMax(1200)).toBe(320);
        for (const w of [960, 1000, 1040, 1079]) expect(panesMode(w - sidebarMax(w))).toBe('three');
        // no room for three panes even beside the narrowest sidebar: the cover at any width
        expect(sidebarMax(900)).toBe(320);
        expect(panesMode(900 - 180)).toBe('cover');
    });
});
