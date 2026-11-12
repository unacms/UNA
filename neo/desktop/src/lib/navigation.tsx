/** React bindings of the router (router.ts): the current route, navigation, scroll memory. */
import { createContext, type ReactNode, type RefObject, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

import { type DetailRoute, type FeedName, feedRoute, isPage, type ListFilter, type Route, RouteHistory, sameRoute, ScrollMemory, type SearchTab, searchRoute, type Section, sectionRoute } from './router';
import type { Tab, TabsModel } from './tabs';

type RouterValue = { history: RouteHistory; scroll: ScrollMemory; resetAll?: (route: Route) => void };

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ history, scroll, resetAll, children }: { history: RouteHistory; scroll?: ScrollMemory; resetAll?: (route: Route) => void; children: ReactNode }) {
    const value = useMemo(() => ({ history, scroll: scroll ?? new ScrollMemory(), resetAll }), [history, scroll, resetAll]);
    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

const TabsContext = createContext<TabsModel | null>(null);

/** The window's tabs (lib/tabs.ts), null where there are none (a window of its own, a test of one screen). */
export function useTabs(): TabsModel | null {
    return useContext(TabsContext);
}

/** The tab shown, following the tabs' changes (null without tabs). */
export function useActiveTab(): { tabs: TabsModel; active: Tab; list: readonly Tab[] } | null {
    const tabs = useContext(TabsContext);
    useSyncExternalStore(
        (l) => tabs?.subscribe(l) ?? (() => {}),
        () => tabs?.snapshot ?? 0,
    );
    return tabs ? { tabs, active: tabs.active, list: tabs.tabs } : null;
}

/**
 * The router of the tab shown: its history and scroll memory, the ones every screen's
 * navigation uses, and its tabs for the strip. Starting over (another profile acts) leaves one tab.
 */
export function TabsProvider({ tabs, children }: { tabs: TabsModel; children: ReactNode }) {
    useSyncExternalStore(
        (l) => tabs.subscribe(l),
        () => tabs.snapshot,
    );
    const { history, scroll } = tabs.active;
    const resetAll = useMemo(() => (route: Route) => tabs.resetAll(route), [tabs]);
    return (
        <TabsContext.Provider value={tabs}>
            <RouterProvider history={history} scroll={scroll} resetAll={resetAll}>
                {children}
            </RouterProvider>
        </TabsContext.Provider>
    );
}

function useRouterValue(): RouterValue {
    const value = useContext(RouterContext);
    if (!value) throw new Error('navigation outside RouterProvider');
    return value;
}

export function useRoute(): Route {
    const { history } = useRouterValue();
    return useSyncExternalStore(
        (listener) => history.subscribe(listener),
        () => history.current,
    );
}

export type Navigation = {
    history: RouteHistory;
    /**
     * A section's list, with no detail open. Within the same section the chosen feed stays; from
     * a page (someone's profile, a group) the section starts over (Profile: one's own, Groups: browse).
     */
    go: (section: Section) => void;
    /** Another feed of the current section; an open detail stays open. */
    showFeed: (feed: FeedName) => void;
    /** The current list with a filter (null: all of it); an open detail stays open. */
    showFilter: (filter: ListFilter | null) => void;
    /**
     * The Search list with these words and tab; an open detail stays open. `replace` changes the
     * current entry instead of adding one (the words as they are typed, so Back does not step
     * through each one).
     */
    showSearch: (q: string, tab?: SearchTab, replace?: boolean) => void;
    /** Open a detail next to the current list (in the main window a profile or group opens its page instead: pageRoute). */
    openDetail: (detail: DetailRoute) => void;
    /**
     * Replace the open detail (a new conversation once it exists), or close it in place (null),
     * but only while `from` is still the current route: after an await the person may have gone
     * somewhere else.
     */
    replaceDetail: (detail: DetailRoute | null, from: Route) => boolean;
    closeDetail: () => void;
    /** A detail that no longer exists: closed if open, and gone from back and forward. */
    forget: (detail: DetailRoute) => void;
    /** Start over at a section with no history or remembered scroll (another profile acts now). */
    reset: (section: Section) => void;
};

function makeNavigation(history: RouteHistory, scroll: ScrollMemory, resetAll?: (route: Route) => void): Navigation {
    return {
        history,
        go: (section) => {
            const list = history.current.list;
            history.push(list.section === section && !isPage(list) ? { list, detail: null } : sectionRoute(section));
        },
        showFeed: (feed) => history.push({ list: feedRoute(history.current.list.section, feed), detail: history.current.detail }),
        showFilter: (filter) => {
            const { section } = history.current.list;
            history.push({ list: filter ? { section, filter } : { section }, detail: history.current.detail });
        },
        showSearch: (q, tab, replace) => {
            const route = { list: searchRoute(q, tab), detail: history.current.detail };
            if (replace && history.current.list.section === 'search') history.replace(route);
            else history.push(route);
        },
        openDetail: (detail) => history.push({ list: history.current.list, detail }),
        replaceDetail: (detail, from) => {
            if (!sameRoute(history.current, from)) return false;
            history.replace({ list: from.list, detail });
            return true;
        },
        closeDetail: () => {
            if (history.current.detail) history.push({ list: history.current.list, detail: null });
        },
        forget: (detail) => history.forget(detail),
        reset: (section) => {
            // with tabs, the others go too: what they showed was the other profile's
            if (resetAll) {
                resetAll(sectionRoute(section));
                return;
            }
            scroll.clear();
            history.reset(sectionRoute(section));
        },
    };
}

export function useNavigation(): Navigation {
    const { history, scroll, resetAll } = useRouterValue();
    return useMemo(() => makeNavigation(history, scroll, resetAll), [history, scroll, resetAll]);
}

/**
 * Navigation where there is a router, null where there is none (a component rendered on its own,
 * as in a test): a profile name then stays plain text.
 */
export function useOptionalNavigation(): Navigation | null {
    const value = useContext(RouterContext);
    return useMemo(() => (value ? makeNavigation(value.history, value.scroll, value.resetAll) : null), [value]);
}

/**
 * Keep an element's scroll position per key (a route path) while the app runs, and restore it
 * when the key comes back. `ready` holds the restore until the content is there.
 */
export function useScrollMemory(ref: RefObject<HTMLElement | null>, key: string | null, ready = true): void {
    const { scroll } = useRouterValue();
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || !key || !ready) return;
        // The position as the last scroll event left it. The cleanup must not read scrollTop:
        // by then React has already swapped in the next content (another feed in the same pane),
        // and the browser has clamped scrollTop to it.
        let top = scroll.get(key) ?? 0;
        el.scrollTop = top;
        const onScroll = () => {
            top = el.scrollTop;
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            scroll.set(key, top);
        };
    }, [ref, key, ready, scroll]);
}
