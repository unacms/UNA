import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { command } from '../lib/shortcuts';
import { place, Tooltip, TOOLTIP_DELAY } from './tooltip';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

function setup() {
    render(
        <Tooltip text="Back" command={command('back')}>
            <button type="button" aria-label="Back">
                ‹
            </button>
        </Tooltip>,
    );
    return screen.getByRole('button', { name: 'Back' });
}

const tip = () => document.querySelector('[data-tooltip]');

describe('Tooltip', () => {
    it('shows at once on keyboard focus, hidden from screen readers, with the keys', () => {
        const button = setup();
        expect(tip()).toBeNull();
        act(() => button.focus());
        expect(tip()?.getAttribute('aria-hidden')).toBe('true');
        expect(tip()?.textContent).toContain('Back');
        expect(tip()?.querySelectorAll('kbd.kbd-key').length).toBeGreaterThan(0);
        // the name is the button's own, the tooltip adds nothing to it
        expect(button.getAttribute('title')).toBeNull();
        act(() => button.blur());
        expect(tip()).toBeNull();
    });

    it('goes with Esc, which still reaches the page', () => {
        const button = setup();
        const onKey = vi.fn();
        window.addEventListener('keydown', onKey);
        act(() => button.focus());
        fireEvent.keyDown(button, { key: 'Escape' });
        expect(tip()).toBeNull();
        expect(onKey).toHaveBeenCalled();
        window.removeEventListener('keydown', onKey);
    });

    it('shown by the pointer, Esc only dismisses it: focus is elsewhere, the Esc was for the tooltip', () => {
        vi.useFakeTimers();
        const button = setup();
        const onKey = vi.fn();
        window.addEventListener('keydown', onKey);
        fireEvent.pointerEnter(button.parentElement!);
        act(() => vi.advanceTimersByTime(TOOLTIP_DELAY + 10));
        expect(tip()).toBeTruthy();
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(tip()).toBeNull();
        expect(onKey).not.toHaveBeenCalled();
        // with the tooltip gone, Esc does what it does again
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onKey).toHaveBeenCalledTimes(1);
        window.removeEventListener('keydown', onKey);
    });

    it('shows after a pause under the pointer and stays while the pointer is on it', () => {
        vi.useFakeTimers();
        const button = setup();
        fireEvent.pointerEnter(button.parentElement!);
        act(() => vi.advanceTimersByTime(TOOLTIP_DELAY - 50));
        expect(tip()).toBeNull();
        act(() => vi.advanceTimersByTime(60));
        expect(tip()).toBeTruthy();
        fireEvent.pointerLeave(button.parentElement!);
        fireEvent.pointerEnter(tip()!);
        act(() => vi.advanceTimersByTime(500));
        expect(tip()).toBeTruthy();
        fireEvent.pointerLeave(tip()!);
        act(() => vi.advanceTimersByTime(200));
        expect(tip()).toBeNull();
    });

    it('goes under its control, above it near the bottom, and stays inside the window', () => {
        const anchor = { top: 10, bottom: 38, left: 100, width: 28, height: 28, right: 128, x: 100, y: 10, toJSON: () => ({}) } as DOMRect;
        expect(place(anchor, { width: 60, height: 24 }, { width: 1000, height: 800 })).toEqual({ left: 84, top: 44 });
        const low = { ...anchor, top: 770, bottom: 798 } as DOMRect;
        expect(place(low, { width: 60, height: 24 }, { width: 1000, height: 800 }).top).toBe(740);
        const edge = { ...anchor, left: 0 } as DOMRect;
        expect(place(edge, { width: 60, height: 24 }, { width: 1000, height: 800 }).left).toBe(8);
    });
});
