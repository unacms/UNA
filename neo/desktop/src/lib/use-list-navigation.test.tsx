import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { activeIndex, itemKeyAction, moveIndex, useListNavigation } from './use-list-navigation';

describe('moveIndex', () => {
    it('stays within the list', () => {
        expect(moveIndex(0, 'next', 3)).toBe(1);
        expect(moveIndex(2, 'next', 3)).toBe(2);
        expect(moveIndex(0, 'previous', 3)).toBe(0);
        expect(moveIndex(1, 'first', 3)).toBe(0);
        expect(moveIndex(0, 'last', 3)).toBe(2);
        expect(moveIndex(1, 'page-down', 30)).toBe(6);
        expect(moveIndex(28, 'page-down', 30)).toBe(29);
        expect(moveIndex(3, 'page-up', 30)).toBe(0);
    });

    it('starts at the first item when none is active, and has nothing in an empty list', () => {
        expect(moveIndex(-1, 'next', 3)).toBe(0);
        expect(moveIndex(-1, 'previous', 3)).toBe(0);
        expect(moveIndex(-1, 'last', 3)).toBe(2);
        expect(moveIndex(-1, 'next', 0)).toBe(-1);
        expect(moveIndex(4, 'last', 0)).toBe(-1);
    });

    it('moves from the last item when the list got shorter', () => {
        expect(moveIndex(9, 'previous', 3)).toBe(1);
        expect(moveIndex(9, 'next', 3)).toBe(2);
    });
});

describe('itemKeyAction', () => {
    const key = (k: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) =>
        itemKeyAction({ key: k, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });

    it('maps the feed keys', () => {
        expect(key('ArrowDown')).toBe('next');
        expect(key('ArrowUp')).toBe('previous');
        expect(key('Home')).toBe('first');
        expect(key('End')).toBe('last');
        expect(key('PageDown')).toBe('page-down');
        expect(key('PageUp')).toBe('page-up');
        expect(key('Enter')).toBe('open');
    });

    it('leaves other keys and modified ones to the page', () => {
        expect(key('a')).toBeNull();
        expect(key(' ')).toBeNull();
        expect(key('ArrowDown', { metaKey: true })).toBeNull();
        expect(key('Home', { ctrlKey: true })).toBeNull();
        expect(key('Enter', { shiftKey: true })).toBeNull();
    });
});

function List({ count, onOpen }: { count: number; onOpen: (i: number) => void }) {
    const list = useRef<HTMLUListElement>(null);
    const nav = useListNavigation({
        count,
        onOpen,
        onActivate: (i) => list.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.focus(),
    });
    return (
        <>
            <button onClick={() => nav.move('next')}>j</button>
            <button onClick={() => nav.move('previous')}>k</button>
            <button onClick={() => nav.open()}>o</button>
            <ul ref={list}>
                {Array.from({ length: count }, (_, i) => (
                    <li key={i} data-index={i} {...nav.itemProps(i)}>
                        Item {i}
                        <button>Inside {i}</button>
                    </li>
                ))}
            </ul>
        </>
    );
}

const item = (i: number) => screen.getByText(`Item ${i}`);

afterEach(cleanup);

describe('useListNavigation', () => {
    it('moves with the arrow keys within bounds and opens with Enter', () => {
        const onOpen = vi.fn();
        render(<List count={3} onOpen={onOpen} />);
        item(0).focus();
        fireEvent.keyDown(item(0), { key: 'ArrowUp' });
        expect(document.activeElement).toBe(item(0));
        fireEvent.keyDown(item(0), { key: 'ArrowDown' });
        expect(document.activeElement).toBe(item(1));
        fireEvent.keyDown(item(1), { key: 'End' });
        expect(document.activeElement).toBe(item(2));
        fireEvent.keyDown(item(2), { key: 'ArrowDown' });
        expect(document.activeElement).toBe(item(2));
        fireEvent.keyDown(item(2), { key: 'Enter' });
        expect(onOpen).toHaveBeenCalledWith(2);
    });

    it('j and k move from the active item; o opens it', () => {
        const onOpen = vi.fn();
        render(<List count={3} onOpen={onOpen} />);
        fireEvent.click(screen.getByText('o'));
        expect(onOpen).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('j'));
        expect(document.activeElement).toBe(item(0));
        fireEvent.click(screen.getByText('j'));
        fireEvent.click(screen.getByText('j'));
        fireEvent.click(screen.getByText('j'));
        expect(document.activeElement).toBe(item(2));
        fireEvent.click(screen.getByText('k'));
        expect(document.activeElement).toBe(item(1));
        fireEvent.click(screen.getByText('o'));
        expect(onOpen).toHaveBeenCalledWith(1);
    });

    it('keeps one item in the tab order, the active one', () => {
        render(<List count={3} onOpen={() => {}} />);
        expect([0, 1, 2].map((i) => item(i).tabIndex)).toEqual([0, -1, -1]);
        fireEvent.focus(screen.getByText('Inside 2'));
        expect([0, 1, 2].map((i) => item(i).tabIndex)).toEqual([-1, -1, 0]);
    });

    it('leaves keys on a control inside an item alone', () => {
        const onOpen = vi.fn();
        render(<List count={3} onOpen={onOpen} />);
        const inside = screen.getByText('Inside 0');
        inside.focus();
        fireEvent.keyDown(inside, { key: 'Enter' });
        fireEvent.keyDown(inside, { key: 'ArrowDown' });
        expect(onOpen).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(inside);
    });

    it('does nothing in an empty list', () => {
        const onOpen = vi.fn();
        render(<List count={0} onOpen={onOpen} />);
        fireEvent.click(screen.getByText('j'));
        fireEvent.click(screen.getByText('o'));
        expect(onOpen).not.toHaveBeenCalled();
    });
});

describe('activeIndex', () => {
    it('follows the active item by id when others are added or removed before it', () => {
        const active = { index: 3, key: 'x' };
        expect(activeIndex(active, 6, ['n1', 'n2', 'a', 'b', 'c', 'x'])).toBe(5);
        expect(activeIndex(active, 2, ['b', 'x'])).toBe(1);
    });

    it('keeps the old place, within the list, once the item is gone or the list has no ids', () => {
        expect(activeIndex({ index: 3, key: 'x' }, 6, ['a', 'b', 'c', 'd', 'e', 'f'])).toBe(3);
        expect(activeIndex({ index: 3, key: 'x' }, 2, ['a', 'b'])).toBe(1);
        expect(activeIndex({ index: 3, key: undefined }, 6)).toBe(3);
        expect(activeIndex({ index: -1, key: undefined }, 6)).toBe(-1);
        expect(activeIndex({ index: 2, key: 'a' }, 0, [])).toBe(-1);
    });
});
