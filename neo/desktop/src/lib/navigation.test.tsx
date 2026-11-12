import { cleanup, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { RouterProvider, useScrollMemory } from './navigation';
import { RouteHistory, ScrollMemory, sectionRoute } from './router';

function Scroller({ scrollKey, ready = true }: { scrollKey: string; ready?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useScrollMemory(ref, scrollKey, ready);
    return <div ref={ref} data-testid="scroller" />;
}

function setup(scroll: ScrollMemory) {
    const history = new RouteHistory(sectionRoute('home'));
    return (node: React.ReactNode) => render(<RouterProvider history={history} scroll={scroll}>{node}</RouterProvider>);
}

afterEach(cleanup);

/** Scroll as the person does: the position changes, then a scroll event follows. */
function scrollTo(el: HTMLElement, top: number) {
    el.scrollTop = top;
    fireEvent.scroll(el);
}

describe('useScrollMemory', () => {
    it('saves the position when the list goes away and restores it when it comes back', () => {
        const scroll = new ScrollMemory();
        const mount = setup(scroll);

        const first = mount(<Scroller scrollKey="/home" />);
        scrollTo(first.getByTestId('scroller'), 340);
        first.unmount();
        expect(scroll.get('/home')).toBe(340);

        const again = mount(<Scroller scrollKey="/home" />);
        expect(again.getByTestId('scroller').scrollTop).toBe(340);
    });

    it('keeps each key apart and starts unknown keys at the top', () => {
        const scroll = new ScrollMemory();
        scroll.set('/home', 200);
        const mount = setup(scroll);

        const view = mount(<Scroller scrollKey="/home" />);
        const el = view.getByTestId('scroller');
        expect(el.scrollTop).toBe(200);
        scrollTo(el, 250);

        view.rerender(
            <RouterProvider history={new RouteHistory(sectionRoute('home'))} scroll={scroll}>
                <Scroller scrollKey="/explore" />
            </RouterProvider>,
        );
        expect(scroll.get('/home')).toBe(250);
        expect(view.getByTestId('scroller').scrollTop).toBe(0);
    });

    it('waits for the content before restoring', () => {
        const scroll = new ScrollMemory();
        scroll.set('/home', 90);
        const mount = setup(scroll);
        const view = mount(<Scroller scrollKey="/home" ready={false} />);
        const el = view.getByTestId('scroller');
        el.scrollTop = 5;
        view.rerender(
            <RouterProvider history={new RouteHistory(sectionRoute('home'))} scroll={scroll}>
                <Scroller scrollKey="/home" ready />
            </RouterProvider>,
        );
        expect(el.scrollTop).toBe(90);
    });

    it('saves where the person scrolled, not where the next content clamped it', () => {
        const scroll = new ScrollMemory();
        const mount = setup(scroll);
        const view = mount(<Scroller scrollKey="/home" />);
        const el = view.getByTestId('scroller');
        scrollTo(el, 11000);
        // a shorter feed replaced the long one before the key changed: the browser clamped it
        el.scrollTop = 600;
        view.rerender(
            <RouterProvider history={new RouteHistory(sectionRoute('home'))} scroll={scroll}>
                <Scroller scrollKey="/home?feed=for-you" />
            </RouterProvider>,
        );
        expect(scroll.get('/home')).toBe(11000);
    });
});
