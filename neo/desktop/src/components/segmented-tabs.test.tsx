import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fittingTabs, SegmentedTabs } from './segmented-tabs';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const TABS = ['posts', 'members', 'events', 'videos', 'photos', 'about'] as const;
type Tab = (typeof TABS)[number];
const widths = new Map<Tab, number>(TABS.map((t) => [t, 80]));

describe('fittingTabs', () => {
    it('keeps every tab when they all fit', () => {
        expect(fittingTabs(TABS, 'posts', widths, 60, 4 + 6 * 80)).toEqual([...TABS]);
    });

    it('fills from the start, leaving room for More', () => {
        // 4 + 60 for More: three tabs of 80 fit in 310
        expect(fittingTabs(TABS, 'posts', widths, 60, 310)).toEqual(['posts', 'members', 'events']);
    });

    it('always shows the selected tab, in its own place', () => {
        expect(fittingTabs(TABS, 'photos', widths, 60, 310)).toEqual(['posts', 'members', 'photos']);
    });

    it('shows only the selected tab when nothing else fits', () => {
        expect(fittingTabs(TABS, 'about', widths, 60, 150)).toEqual(['about']);
    });

    it('counts the pills’ bar inset and the gap between two pills', () => {
        // 16 + 6 * 80 + 5 * 4 = 516 does not fit; 16 + 60 (More) + 4 + 80 (Posts) leaves 150: one tab more (84)
        expect(fittingTabs(TABS, 'posts', widths, 60, 310, { pad: 16, gap: 4 })).toEqual(['posts', 'members']);
        expect(fittingTabs(TABS, 'posts', widths, 60, 516, { pad: 16, gap: 4 })).toEqual([...TABS]);
        expect(fittingTabs(TABS, 'posts', widths, 60, 515, { pad: 16, gap: 4 })).not.toHaveLength(TABS.length);
    });
});

describe('SegmentedTabs as pills', () => {
    it('is a bar of pills, not a segmented track, with the same tabs and keys', () => {
        const onChange = vi.fn();
        const { container } = render(
            <SegmentedTabs
                label="Design Circle, group"
                values={TABS}
                labels={{ posts: 'Posts', members: 'Members', events: 'Events', videos: 'Videos', photos: 'Photos', about: 'About' }}
                current="members"
                onChange={onChange}
                panelId="panel"
                tabId={(t) => `tab-${t}`}
                look="pills"
                fit
            />,
        );
        const bar = container.firstElementChild as HTMLElement;
        expect(bar.classList.contains('tab-pills')).toBe(true);
        expect(bar.classList.contains('segmented')).toBe(false);
        expect(screen.getByRole('tablist', { name: 'Design Circle, group' })).toBeTruthy();
        expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Members');
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Members' }), { key: 'ArrowLeft' });
        expect(onChange).toHaveBeenCalledWith('posts');
    });
});

describe('SegmentedTabs with fit', () => {
    function layout(room: number) {
        // the host's width and each cell's: jsdom lays nothing out
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('host') ? room : 0;
        });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const w = this.classList.contains('segment-more') ? 60 : this.classList.contains('segment') ? 80 : 0;
            return { width: w, height: 24, x: 0, y: 0, top: 0, left: 0, right: w, bottom: 24, toJSON: () => ({}) } as DOMRect;
        });
    }

    function draw(current: Tab, onChange = vi.fn()) {
        return render(
            <div className="host">
                <SegmentedTabs
                    label="Design Circle, group"
                    values={TABS}
                    labels={{ posts: 'Posts', members: 'Members', events: 'Events', videos: 'Videos', photos: 'Photos', about: 'About' }}
                    current={current}
                    onChange={onChange}
                    panelId="panel"
                    tabId={(t) => `tab-${t}`}
                    fit
                />
            </div>,
        );
    }

    it('puts the tabs that do not fit under More, named with what it holds', () => {
        layout(310);
        draw('posts');
        expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Members', 'Events']);
        const more = screen.getByRole('button', { name: 'More Design Circle, group: Videos, Photos, About' });
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('shows a selected tab that would not fit, in place of the last one', () => {
        layout(310);
        draw('about');
        expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Members', 'About']);
        expect(screen.getByRole('tab', { selected: true }).textContent).toBe('About');
    });

    it('has no More when every tab fits, and the arrows go through every tab', () => {
        layout(1000);
        const onChange = vi.fn();
        draw('posts', onChange);
        expect(screen.getAllByRole('tab')).toHaveLength(6);
        expect(screen.queryByRole('button', { name: /^More/ })).toBeNull();
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Posts' }), { key: 'End' });
        expect(onChange).toHaveBeenCalledWith('about');
    });

    it('keeps the arrows going into tabs under More', () => {
        layout(310);
        const onChange = vi.fn();
        draw('events', onChange);
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Events' }), { key: 'ArrowRight' });
        expect(onChange).toHaveBeenCalledWith('videos');
    });
});

describe('SegmentedTabs when a tab is taken away', () => {
    const LABELS = { posts: 'Posts', members: 'Members', events: 'Events', videos: 'Videos', photos: 'Photos', about: 'About' };
    const row = (values: readonly Tab[], onChange = vi.fn()) => (
        <>
            <input aria-label="Search" />
            <SegmentedTabs label="Results" values={values} labels={LABELS} current="videos" onChange={onChange} panelId="panel" tabId={(t) => `tab-${t}`} />
        </>
    );
    const left = TABS.filter((t) => t !== 'videos');

    it('moves focus from the removed tab to the first one, where the arrows work again', () => {
        const onChange = vi.fn();
        const { rerender } = render(row(TABS, onChange));
        screen.getByRole('tab', { name: 'Videos' }).focus();
        rerender(row(left, onChange));
        const first = screen.getByRole('tab', { name: 'Posts' });
        expect(first.tabIndex).toBe(0);
        expect(document.activeElement).toBe(first);
        fireEvent.keyDown(first, { key: 'ArrowLeft' });
        expect(onChange).toHaveBeenCalledWith('about');
    });

    it('leaves focus that was not on the removed tab where it is', () => {
        const { rerender } = render(row(TABS));
        // in a field outside the row
        const field = screen.getByRole('textbox', { name: 'Search' });
        screen.getByRole('tab', { name: 'Videos' }).focus();
        field.focus();
        rerender(row(left));
        expect(document.activeElement).toBe(field);

        // on nothing: it was never in the row
        cleanup();
        const again = render(row(TABS));
        again.rerender(row(left));
        expect(document.activeElement).toBe(document.body);
    });
});
