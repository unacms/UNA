/**
 * Tabs of the main window, as a browser has them: each tab is its own route with its own Back
 * and Forward history and scroll positions, and the tabs, the one shown, the tabs closed lately
 * (Reopen Closed Tab) and the places visited lately (the top bar's History) are kept per network
 * on this computer, so the next launch opens them again. One tab always stays.
 */
import { parseRoute, type Route, RouteHistory, routeToPath, ScrollMemory } from './router';

/** How many tabs a window holds: one more is refused (and said so). */
export const TABS_MAX = 30;
/** How many closed tabs Reopen Closed Tab can bring back. */
export const CLOSED_MAX = 20;
/** How many places History lists. */
export const VISITED_MAX = 15;
/** Each tab's Back and Forward, as kept between launches. */
const KEPT_HISTORY = 30;

export type Tab = {
    readonly id: string;
    readonly history: RouteHistory;
    readonly scroll: ScrollMemory;
    /** What it shows, as the shell last named it (the page or the detail, else the section). */
    title: string;
    /** The icon of its section (an IconName). */
    icon: string;
};

/** A place visited lately: its path and what it was called. */
export type Visit = { path: string; title: string; icon: string };

/** A tab as kept: its history's paths, where in them it is, its name. */
type KeptTab = { id: string; paths: string[]; index: number; title: string; icon: string };
type Kept = { v: 1; tabs: KeptTab[]; active: string; closed: KeptTab[]; visited: Visit[] };

/** What is kept per network, under this key (one network's tabs are never another's). */
export function tabsStorageKey(sessionKey: string): string {
    return `una-desktop-tabs:${sessionKey}`;
}

let counter = 0;
function newId(): string {
    counter += 1;
    return `t${Date.now().toString(36)}${counter.toString(36)}`;
}

/** A history from kept paths: those the router still reads, at the place it was. */
function historyFrom(paths: readonly string[], index: number, fallback: Route): RouteHistory {
    const routes: Route[] = [];
    let at = 0;
    paths.forEach((p, i) => {
        const r = typeof p === 'string' ? parseRoute(p) : null;
        if (!r) return;
        if (i <= index) at = routes.length;
        routes.push(r);
    });
    const history = new RouteHistory(routes[0] ?? fallback);
    routes.slice(1).forEach((r) => history.push(r));
    while (history.snapshot().index > at && history.back());
    return history;
}

function keep(tab: Tab): KeptTab {
    const { paths, index } = tab.history.snapshot();
    // the last KEPT_HISTORY entries around where it is
    const start = Math.max(0, Math.min(index, paths.length - KEPT_HISTORY));
    return { id: tab.id, paths: paths.slice(start, start + KEPT_HISTORY), index: index - start, title: tab.title, icon: tab.icon };
}

function isKeptTab(v: unknown): v is KeptTab {
    const t = v as KeptTab;
    return !!t && typeof t.id === 'string' && Array.isArray(t.paths) && typeof t.index === 'number';
}

/** Storage that may be missing or throw (a private window, tests): every access is guarded. */
type Store = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStore(): Store | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

export class TabsModel {
    private list: Tab[] = [];
    private activeId = '';
    private closed: KeptTab[] = [];
    private visits: Visit[] = [];
    private listeners = new Set<() => void>();
    private unsubscribers = new Map<string, () => void>();
    private version = 0;

    constructor(
        private readonly initial: Route,
        private readonly key: string | null = null,
        private readonly store: Store | null = defaultStore(),
        /** Where it opens this time (a una:// link): the shown tab goes there, the others stay. */
        openAt: Route | null = null,
    ) {
        const kept = this.read();
        if (kept?.tabs.length) {
            for (const t of kept.tabs.slice(0, TABS_MAX)) this.adopt(this.make(historyFrom(t.paths, t.index, initial), t.id, t.title, t.icon));
            this.activeId = this.list.some((t) => t.id === kept.active) ? kept.active : (this.list[0]?.id ?? '');
            this.closed = kept.closed.filter(isKeptTab).slice(0, CLOSED_MAX);
            this.visits = kept.visited.filter((v) => typeof v?.path === 'string' && typeof v.title === 'string').slice(0, VISITED_MAX);
        }
        if (!this.list.length) {
            const tab = this.make(new RouteHistory(openAt ?? initial));
            this.adopt(tab);
            this.activeId = tab.id;
        } else if (openAt) this.active.history.push(openAt);
    }

    /** A number that changes with every change, for useSyncExternalStore. */
    get snapshot(): number {
        return this.version;
    }

    get tabs(): readonly Tab[] {
        return this.list;
    }

    get active(): Tab {
        return this.list.find((t) => t.id === this.activeId) ?? this.list[0]!;
    }

    get canReopen(): boolean {
        return this.closed.length > 0;
    }

    /** Places visited lately, the newest first, without the one shown. */
    get visited(): readonly Visit[] {
        const here = routeToPath(this.active.history.current);
        return this.visits.filter((v) => v.path !== here);
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    select(id: string): void {
        if (id === this.activeId || !this.list.some((t) => t.id === id)) return;
        this.activeId = id;
        this.changed();
    }

    /** The n-th tab (1 to 8), or the last one for 9, as browsers do. */
    selectNumber(n: number): boolean {
        const tab = n === 9 ? this.list[this.list.length - 1] : this.list[n - 1];
        if (!tab) return false;
        this.select(tab.id);
        return true;
    }

    /** The tab after (1) or before (-1) the one shown, round the end. */
    selectNext(step: 1 | -1): void {
        const i = this.indexOf(this.activeId);
        const next = this.list[(i + step + this.list.length) % this.list.length];
        if (next) this.select(next.id);
    }

    /**
     * A new tab after the one shown at a route (Home, or wherever), shown at once unless in the
     * background (Cmd+click). Null when the window holds TABS_MAX already.
     */
    open(route: Route, { background = false, title = '', icon = '' }: { background?: boolean; title?: string; icon?: string } = {}): Tab | null {
        if (this.list.length >= TABS_MAX) return null;
        const tab = this.make(new RouteHistory(route), undefined, title, icon);
        this.list.splice(this.indexOf(this.activeId) + 1, 0, tab);
        this.watch(tab);
        if (!background) this.activeId = tab.id;
        this.changed();
        return tab;
    }

    /** A copy of a tab beside it, with its history, shown. */
    duplicate(id: string): Tab | null {
        const from = this.list.find((t) => t.id === id);
        if (!from || this.list.length >= TABS_MAX) return null;
        const kept = keep(from);
        const tab = this.make(historyFrom(kept.paths, kept.index, this.initial), undefined, from.title, from.icon);
        this.list.splice(this.indexOf(id) + 1, 0, tab);
        this.watch(tab);
        this.activeId = tab.id;
        this.changed();
        return tab;
    }

    /**
     * Close a tab; the last one stays (false). The tab shown next is the one after it, else the
     * one before, as browsers do.
     */
    close(id: string): boolean {
        const i = this.indexOf(id);
        if (i < 0 || this.list.length <= 1) return false;
        const [tab] = this.list.splice(i, 1);
        if (!tab) return false;
        this.unsubscribers.get(id)?.();
        this.unsubscribers.delete(id);
        this.closed = [keep(tab), ...this.closed].slice(0, CLOSED_MAX);
        if (this.activeId === id) this.activeId = (this.list[i] ?? this.list[i - 1])!.id;
        this.changed();
        return true;
    }

    /** Close every tab but this one. */
    closeOthers(id: string): void {
        if (!this.list.some((t) => t.id === id)) return;
        for (const t of [...this.list].reverse()) if (t.id !== id) this.close(t.id);
        this.select(id);
    }

    /** The tab closed last, back where it was with its history, shown. */
    reopen(): Tab | null {
        const [kept, ...rest] = this.closed;
        if (!kept || this.list.length >= TABS_MAX) return null;
        this.closed = rest;
        const tab = this.make(historyFrom(kept.paths, kept.index, this.initial), undefined, kept.title, kept.icon);
        this.list.splice(this.indexOf(this.activeId) + 1, 0, tab);
        this.watch(tab);
        this.activeId = tab.id;
        this.changed();
        return tab;
    }

    /** Put a tab at another place (drag, or Option+Shift+arrow). */
    move(id: string, to: number): void {
        const from = this.indexOf(id);
        const target = Math.max(0, Math.min(this.list.length - 1, to));
        if (from < 0 || from === target) return;
        const [tab] = this.list.splice(from, 1);
        this.list.splice(target, 0, tab!);
        this.changed();
    }

    indexOf(id: string): number {
        return this.list.findIndex((t) => t.id === id);
    }

    /** What a tab shows now, as the shell names it, and the place it is, for History. */
    name(id: string, title: string, icon: string): void {
        const tab = this.list.find((t) => t.id === id);
        if (!tab || !title) return;
        const path = routeToPath(tab.history.current);
        const same = tab.title === title && tab.icon === icon;
        tab.title = title;
        tab.icon = icon;
        const visit = { path, title, icon };
        const first = this.visits[0];
        const visited = !first || first.path !== path || first.title !== title;
        if (visited) this.visits = [visit, ...this.visits.filter((v) => v.path !== path)].slice(0, VISITED_MAX);
        if (!same || visited) this.changed();
    }

    /** Start over with one tab at a route (another profile acts now: what was open was the other's). */
    resetAll(route: Route): void {
        for (const off of this.unsubscribers.values()) off();
        this.unsubscribers.clear();
        const tab = this.make(new RouteHistory(route));
        this.list = [];
        this.adopt(tab);
        this.activeId = tab.id;
        this.closed = [];
        this.visits = [];
        this.changed();
    }

    /** Stop following the tabs' histories (the network is left). */
    dispose(): void {
        for (const off of this.unsubscribers.values()) off();
        this.unsubscribers.clear();
        this.listeners.clear();
    }

    private make(history: RouteHistory, id = newId(), title = '', icon = ''): Tab {
        return { id, history, scroll: new ScrollMemory(), title, icon };
    }

    private adopt(tab: Tab): void {
        this.list.push(tab);
        this.watch(tab);
    }

    /** A tab's navigation is kept too (and History follows it). */
    private watch(tab: Tab): void {
        this.unsubscribers.set(
            tab.id,
            tab.history.subscribe(() => {
                this.save();
            }),
        );
    }

    private changed(): void {
        this.version += 1;
        this.save();
        for (const l of this.listeners) l();
    }

    private read(): Kept | null {
        if (!this.key || !this.store) return null;
        try {
            const kept = JSON.parse(this.store.getItem(this.key) ?? 'null') as Kept | null;
            if (!kept || kept.v !== 1 || !Array.isArray(kept.tabs)) return null;
            return { ...kept, tabs: kept.tabs.filter(isKeptTab), closed: Array.isArray(kept.closed) ? kept.closed : [], visited: Array.isArray(kept.visited) ? kept.visited : [] };
        } catch {
            return null;
        }
    }

    private save(): void {
        if (!this.key || !this.store) return;
        const kept: Kept = { v: 1, tabs: this.list.map(keep), active: this.activeId, closed: this.closed, visited: this.visits };
        try {
            this.store.setItem(this.key, JSON.stringify(kept));
        } catch {
            // it lasts until the app quits
        }
    }
}
