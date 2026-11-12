import { describe, expect, it, vi } from 'vitest';

import { parseRoute, routeToPath, sectionRoute } from './router';
import { CLOSED_MAX, TabsModel, TABS_MAX, tabsStorageKey } from './tabs';

/** A storage of our own: tests never share localStorage's. */
function memory(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const route = (path: string) => parseRoute(path)!;
const paths = (tabs: TabsModel) => tabs.tabs.map((t) => routeToPath(t.history.current));
const home = sectionRoute('home');

describe('tabs', () => {
    it('opens one tab at Home, then new ones after the one shown, in the background or not', () => {
        const tabs = new TabsModel(home, null, null);
        expect(paths(tabs)).toEqual(['/home']);
        const a = tabs.open(route('/messages'))!;
        expect(tabs.active.id).toBe(a.id);
        tabs.select(tabs.tabs[0]!.id);
        const b = tabs.open(route('/notifications'), { background: true })!;
        expect(paths(tabs)).toEqual(['/home', '/notifications', '/messages']);
        expect(tabs.active.id).not.toBe(b.id);
        expect(tabs.indexOf(b.id)).toBe(1);
    });

    it('keeps each tab’s history and scroll its own', () => {
        const tabs = new TabsModel(home, null, null);
        const first = tabs.active;
        first.history.push(route('/explore'));
        first.scroll.set('/explore', 300);
        const second = tabs.open(route('/messages'))!;
        second.history.push(route('/notifications'));
        expect(second.history.canGoBack).toBe(true);
        second.history.back();
        expect(routeToPath(second.history.current)).toBe('/messages');
        expect(routeToPath(first.history.current)).toBe('/explore');
        expect(second.scroll.get('/explore')).toBeUndefined();
        expect(first.scroll.get('/explore')).toBe(300);
    });

    it('closes a tab (never the last), shows the next one, and reopens it with its history', () => {
        const tabs = new TabsModel(home, null, null);
        const only = tabs.active;
        expect(tabs.close(only.id)).toBe(false);
        const b = tabs.open(route('/messages'))!;
        b.history.push(route('/messages/conversation/7'));
        const c = tabs.open(route('/notifications'))!;
        tabs.select(b.id);
        expect(tabs.close(b.id)).toBe(true);
        // the one after it is shown
        expect(tabs.active.id).toBe(c.id);
        expect(paths(tabs)).toEqual(['/home', '/notifications']);
        const back = tabs.reopen()!;
        expect(routeToPath(back.history.current)).toBe('/messages/conversation/7');
        expect(back.history.canGoBack).toBe(true);
        expect(tabs.active.id).toBe(back.id);
        expect(tabs.canReopen).toBe(false);
        expect(tabs.reopen()).toBeNull();
        // the last one: the one before it
        tabs.select(tabs.tabs[tabs.tabs.length - 1]!.id);
        const last = tabs.active.id;
        tabs.close(last);
        expect(tabs.active.id).toBe(tabs.tabs[tabs.tabs.length - 1]!.id);
    });

    it('selects by number (9 is the last), steps round the ends, moves, duplicates and closes the others', () => {
        const tabs = new TabsModel(home, null, null);
        const ids = [tabs.active.id, tabs.open(route('/explore'))!.id, tabs.open(route('/messages'))!.id, tabs.open(route('/notifications'))!.id];
        expect(tabs.selectNumber(2)).toBe(true);
        expect(tabs.active.id).toBe(ids[1]);
        expect(tabs.selectNumber(9)).toBe(true);
        expect(tabs.active.id).toBe(ids[3]);
        expect(tabs.selectNumber(7)).toBe(false);
        tabs.selectNext(1);
        expect(tabs.active.id).toBe(ids[0]);
        tabs.selectNext(-1);
        expect(tabs.active.id).toBe(ids[3]);
        tabs.move(ids[3]!, 0);
        expect(paths(tabs)).toEqual(['/notifications', '/home', '/explore', '/messages']);
        const copy = tabs.duplicate(ids[3]!)!;
        expect(tabs.indexOf(copy.id)).toBe(1);
        expect(routeToPath(copy.history.current)).toBe('/notifications');
        tabs.closeOthers(copy.id);
        expect(tabs.tabs.map((t) => t.id)).toEqual([copy.id]);
        expect(tabs.active.id).toBe(copy.id);
    });

    it('asks before unsaved changes in the tab shown go: another tab shown, a new one, the tab closed', async () => {
        const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
        const tabs = new TabsModel(home, null, null);
        const first = tabs.active;
        const second = tabs.open(route('/messages'), { background: true })!;
        let discard = false;
        const confirm = vi.fn(() => Promise.resolve(discard));
        first.history.guard({ dirty: () => true, confirm });
        const closed = vi.fn();

        tabs.select(second.id);
        await settled();
        expect(tabs.selectNumber(2)).toBe(true);
        await settled();
        const refused = tabs.open(route('/explore'))!;
        await settled();
        expect(tabs.close(first.id, closed)).toBe(true);
        await settled();
        tabs.closeOthers(second.id);
        await settled();
        expect(confirm).toHaveBeenCalledTimes(5);
        expect(tabs.active.id).toBe(first.id);
        expect(tabs.tabs.map((t) => t.id)).toEqual([first.id, second.id]);
        expect(tabs.indexOf(refused.id)).toBe(-1);
        expect(closed).not.toHaveBeenCalled();
        // what leaves the shown tab where it is asks nothing
        const behind = tabs.open(route('/explore'), { background: true })!;
        expect(tabs.close(behind.id, closed)).toBe(true);
        expect(closed).toHaveBeenCalledTimes(1);
        tabs.move(second.id, 0);
        tabs.move(second.id, 1);
        expect(confirm).toHaveBeenCalledTimes(5);

        discard = true;
        const opened = tabs.open(route('/notifications'))!;
        expect(tabs.active.id).toBe(first.id);
        await settled();
        expect(tabs.active.id).toBe(opened.id);
        // the tab now shown has nothing unsaved
        tabs.select(first.id);
        expect(tabs.active.id).toBe(first.id);
        expect(confirm).toHaveBeenCalledTimes(6);
        expect(tabs.close(first.id, closed)).toBe(true);
        expect(closed).toHaveBeenCalledTimes(1);
        await settled();
        expect(closed).toHaveBeenCalledTimes(2);
        expect(tabs.indexOf(first.id)).toBe(-1);
        // reopened, it is a tab of its own history: the form went with the old one
        expect(tabs.reopen()).not.toBeNull();
        expect(confirm).toHaveBeenCalledTimes(7);
    });

    it('holds at most TABS_MAX tabs and CLOSED_MAX closed ones', () => {
        const tabs = new TabsModel(home, null, null);
        for (let i = 1; i < TABS_MAX; i++) expect(tabs.open(route('/explore'), { background: true })).not.toBeNull();
        expect(tabs.open(route('/explore'))).toBeNull();
        for (let i = 1; i < TABS_MAX; i++) tabs.close(tabs.tabs[1]!.id);
        let n = 0;
        while (tabs.reopen()) {
            n++;
            if (n > 50) break;
        }
        expect(n).toBe(CLOSED_MAX);
    });

    it('keeps the tabs, the one shown, the closed ones and History per network across a restart', () => {
        const store = memory();
        const makers = tabsStorageKey('http://desktop.localhost:8090|1');
        const riverside = tabsStorageKey('http://network2.localhost:8092|1');
        const tabs = new TabsModel(home, makers, store);
        tabs.name(tabs.active.id, 'Home', 'house');
        tabs.active.history.push(route('/explore'));
        tabs.name(tabs.active.id, 'Explore', 'compass');
        const second = tabs.open(route('/messages/conversation/7'))!;
        tabs.name(second.id, 'Lily Carter', 'message-circle');
        tabs.open(route('/notifications'));
        tabs.close(tabs.active.id);
        tabs.select(second.id);

        const again = new TabsModel(home, makers, store);
        expect(paths(again)).toEqual(['/explore', '/messages/conversation/7']);
        expect(again.active.id).toBe(second.id);
        expect(again.active.title).toBe('Lily Carter');
        expect(again.active.icon).toBe('message-circle');
        expect(again.tabs[0]!.history.canGoBack).toBe(true);
        again.tabs[0]!.history.back();
        expect(routeToPath(again.tabs[0]!.history.current)).toBe('/home');
        expect(again.canReopen).toBe(true);
        expect(again.visited.map((v) => v.title)).toEqual(['Explore', 'Home']);

        // another network has its own (none yet: Home)
        const other = new TabsModel(home, riverside, store);
        expect(paths(other)).toEqual(['/home']);
        other.open(route('/explore'));
        // Back in the first tab was kept too
        expect(paths(new TabsModel(home, makers, store))).toEqual(['/home', '/messages/conversation/7']);
        expect(paths(new TabsModel(home, riverside, store))).toEqual(['/home', '/explore']);
    });

    it('opens a una:// link in the tab shown, and starts over with one tab for another profile', () => {
        const store = memory();
        const key = tabsStorageKey('s|1');
        const tabs = new TabsModel(home, key, store);
        tabs.open(route('/explore'));
        const linked = new TabsModel(home, key, store, route('/home/post/12'));
        expect(paths(linked)).toEqual(['/home', '/home/post/12']);
        linked.resetAll(sectionRoute('profile'));
        expect(paths(linked)).toEqual(['/profile']);
        expect(linked.canReopen).toBe(false);
        expect(linked.visited).toEqual([]);
    });

    it('reads no kept tabs that are not its own shape, and survives a storage that throws', () => {
        const store = memory();
        store.data.set(tabsStorageKey('s|1'), '{"v":2,"tabs":[]}');
        expect(paths(new TabsModel(home, tabsStorageKey('s|1'), store))).toEqual(['/home']);
        store.data.set(tabsStorageKey('s|1'), JSON.stringify({ v: 1, active: 'x', closed: [], visited: [], tabs: [{ id: 'x', paths: ['/nowhere/at/all', '/explore'], index: 1, title: 'Explore', icon: 'compass' }] }));
        expect(paths(new TabsModel(home, tabsStorageKey('s|1'), store))).toEqual(['/explore']);
        const broken = {
            getItem: () => {
                throw new Error('denied');
            },
            setItem: () => {
                throw new Error('denied');
            },
        };
        const tabs = new TabsModel(home, 'k', broken);
        expect(tabs.open(route('/explore'))).not.toBeNull();
    });
});
