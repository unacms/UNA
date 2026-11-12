import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Switch } from './switch';

afterEach(cleanup);

function Labelled({ inactive = false, onChange }: { inactive?: boolean; onChange?: (on: boolean) => void }) {
    const [on, setOn] = useState(false);
    return (
        <>
            <label htmlFor="s">Play a sound</label>
            <p id="s-why">Turn on Show notifications first</p>
            <Switch
                id="s"
                checked={on}
                inactive={inactive}
                describedBy="s-why"
                onChange={(next) => {
                    setOn(next);
                    onChange?.(next);
                }}
            />
        </>
    );
}

describe('Switch', () => {
    it('is a switch named by its label, and a press (Space and Enter on a button) toggles it', () => {
        render(<Labelled />);
        const sw = screen.getByRole('switch', { name: 'Play a sound' });
        expect(sw.getAttribute('aria-checked')).toBe('false');
        // a native button, so Enter and Space press it
        expect(sw.tagName).toBe('BUTTON');
        expect(sw.getAttribute('type')).toBe('button');
        fireEvent.click(sw);
        expect(sw.getAttribute('aria-checked')).toBe('true');
        fireEvent.click(sw);
        expect(sw.getAttribute('aria-checked')).toBe('false');
    });

    it('ignores presses while aria-disabled, keeps focus and says why', () => {
        const onChange = vi.fn();
        render(<Labelled inactive onChange={onChange} />);
        const sw = screen.getByRole('switch', { name: 'Play a sound' });
        sw.focus();
        fireEvent.click(sw);
        expect(onChange).not.toHaveBeenCalled();
        expect(sw.getAttribute('aria-checked')).toBe('false');
        expect(sw.getAttribute('aria-disabled')).toBe('true');
        expect(sw.hasAttribute('disabled')).toBe(false);
        expect(document.activeElement).toBe(sw);
        expect(document.getElementById(sw.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Turn on Show notifications first');
    });

    it('has a thumb whose place shows the state, not colour alone', () => {
        render(<Switch id="x" checked onChange={() => undefined} />);
        const sw = screen.getByRole('switch');
        expect(sw.querySelector('.switch-thumb')?.getAttribute('aria-hidden')).toBe('true');
        expect(sw.getAttribute('aria-checked')).toBe('true');
    });
});
