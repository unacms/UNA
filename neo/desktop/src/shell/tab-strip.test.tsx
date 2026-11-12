import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnnounceContext } from '../lib/announce';
import { TabsProvider } from '../lib/navigation';
import { sectionRoute } from '../lib/router';
import { TabsModel } from '../lib/tabs';
import { tabMenu, TabStrip } from './tab-strip';

afterEach(cleanup);

/** Long enough for a question's answer and for the frame focus moves in. */
const settled = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

describe('the tab strip while the tab shown has unsaved changes', () => {
    it('says a tab was duplicated, and moves focus to the tab an arrow key reached, only once the changes may go', async () => {
        const tabs = new TabsModel(sectionRoute('home'), null, null);
        const first = tabs.active;
        const second = tabs.open(sectionRoute('messages'), { background: true, title: 'Messages' })!;
        tabs.name(first.id, 'Home', 'house');
        let discard = false;
        const confirm = vi.fn(() => Promise.resolve(discard));
        first.history.guard({ dirty: () => true, confirm });
        const announce = vi.fn();
        render(
            <AnnounceContext.Provider value={announce}>
                <TabsProvider tabs={tabs}>
                    <TabStrip />
                </TabsProvider>
            </AnnounceContext.Provider>,
        );
        const tab = (name: string) => screen.getByRole('tab', { name });
        const duplicate = () => {
            const item = tabMenu(tabs, first, announce)[0];
            if (item && item !== 'separator') act(() => void item.run());
        };

        // the changes are kept: no copy, nothing said, focus where it was
        tab('Home').focus();
        duplicate();
        await settled();
        fireEvent.keyDown(tab('Home'), { key: 'ArrowRight' });
        await settled();
        expect(confirm).toHaveBeenCalledTimes(2);
        expect(announce).not.toHaveBeenCalled();
        expect(tabs.tabs).toHaveLength(2);
        expect(tabs.active.id).toBe(first.id);
        expect(document.activeElement).toBe(tab('Home'));
        expect(tab('Home').getAttribute('aria-selected')).toBe('true');

        // they may go: the tab reached is shown and focused
        discard = true;
        fireEvent.keyDown(tab('Home'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tab('Home'));
        await waitFor(() => expect(document.activeElement).toBe(tab('Messages')));
        expect(tabs.active.id).toBe(second.id);
        // and a copy is said once it is there (the tab now shown has nothing unsaved)
        duplicate();
        expect(announce).toHaveBeenCalledWith('Duplicated Home');
        expect(tabs.tabs).toHaveLength(3);
    });
});
