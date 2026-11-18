/**
 * Where the keyboard is in the signed-in window. Focus follows navigation: a new section focuses
 * the list's heading, an opened detail its heading, a closed detail what opened it. F6 moves
 * between the panes, each keeping the element it last had.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { forgetPreopenedEntry, isPreopened, preopenedId, resumePreopened, setPreopened } from '../features/messages/preopen';
import { focusWhenPresent } from '../lib/focused-entry';
import { useNavigation, useRoute } from '../lib/navigation';
import { type DetailRoute, detailPath, isPage, type ListRoute, type Route, sameRoute } from '../lib/router';
import { paneHeadingId, type PaneName } from './pane';

const PANES = ['sidebar', 'list', 'detail'] as const;
type AnyPane = (typeof PANES)[number];

export function paneElement(name: AnyPane): HTMLElement | null {
    const el = document.querySelector<HTMLElement>(`[data-pane="${name}"]`);
    // a pane behind the detail cover is inert, a closed detail pane is hidden
    return el && !el.closest('[inert], [hidden]') ? el : null;
}

/** Which page a list route shows: a new one (another group or profile) takes focus to its heading; a tab of the same one does not. */
function pageKey(list: ListRoute): string {
    return isPage(list) ? `${list.section}/${list.group ?? list.profile ?? ''}` : list.section;
}

export function focusHeading(pane: PaneName): boolean {
    const heading = document.getElementById(paneHeadingId(pane));
    if (!heading || heading.closest('[inert], [hidden]')) return false;
    heading.focus();
    return true;
}

/** A navigation as focus sees it: where the window was and is, and what the shell kept about it. */
type Move = {
    before: Route;
    route: Route;
    /** The id of an element a command asked to have focused after this navigation. */
    want: string | null;
    /** The detail that closed is the conversation the inbox had opened by itself. */
    closingPreopened: boolean;
    /** What had focus when the detail that closed was opened. */
    opener: HTMLElement | undefined;
};

/** A detail that just opened: its heading, unless something in it took focus itself (a new message's text box). */
function focusOpenedDetail(detail: DetailRoute, sectionChanged: boolean): void {
    if (isPreopened(detail)) {
        // shown beside the inbox, not gone to: focus stays in the sidebar or the list
        // (Messages entered with it, by Back or Forward: the list's heading, as a section)
        if (sectionChanged) focusHeading('list');
        return;
    }
    if (!document.activeElement?.closest('[data-pane="detail"]')) focusHeading('detail');
}

/**
 * The conversation the inbox opened by itself has closed. Nothing opened it: focus stays where
 * it is, unless it was in the pane that closed (then the conversation's row in the list).
 */
function focusAfterPreopened(before: Route): void {
    // closed where it was opened: Back to that entry opens it as any other
    forgetPreopenedEntry(before);
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && active.isConnected && !active.closest('[inert], [hidden]')) return;
    const id = before.detail?.kind === 'conversation' ? before.detail.id : '';
    const row = document.querySelector<HTMLElement>(`[data-pane="list"] [data-conversation="${CSS.escape(id)}"]`);
    if (row && !row.closest('[inert], [hidden]')) row.focus();
    else focusHeading('list');
}

/** A detail has closed: back to what opened it, else the row of the post it showed, else the list's heading. */
function focusOpener(closed: DetailRoute, opener: HTMLElement | undefined): void {
    // a virtualized feed may have drawn the post's row anew: the post it opened is the row with its id
    const postId = closed.kind === 'post' ? closed.id : null;
    const row = postId ? (Array.from(document.querySelectorAll<HTMLElement>('[data-pane="list"] article[data-id]')).find((el) => el.dataset.id === postId) ?? null) : null;
    const target = opener?.isConnected ? opener : row;
    if (target && !target.closest('[inert], [hidden]')) target.focus();
    else focusHeading('list');
}

/**
 * Focus follows navigation: a new section focuses the list's heading, an opened detail its
 * heading, a closed detail what opened it. Screen readers read the heading that got focus.
 */
function moveFocus({ before, route, want, closingPreopened, opener }: Move): void {
    if (want) {
        // the detail it is in may still be loading; if it never comes, the detail's heading
        focusWhenPresent(want, 3000, route.detail ? paneHeadingId('detail') : undefined);
        return;
    }
    const sectionChanged = before.list.section !== route.list.section || pageKey(before.list) !== pageKey(route.list);
    if (route.detail && (!before.detail || detailPath(before.detail) !== detailPath(route.detail))) {
        focusOpenedDetail(route.detail, sectionChanged);
        return;
    }
    if (sectionChanged) {
        focusHeading('list');
        return;
    }
    if (route.detail || !before.detail) return;
    if (closingPreopened) focusAfterPreopened(before);
    else focusOpener(before.detail, opener);
}

export type ShellFocus = {
    /** Names an element (its id) to focus after the next navigation: the search field, a post's comment box. */
    focusAfterNavigation: (id: string) => void;
    /** Focus a pane: what it last had, else its heading (the sidebar: its current row). False when it has nothing to focus. */
    focusPane: (name: AnyPane) => boolean;
    /** F6 and Shift+F6: the next or the previous pane that takes focus. */
    cyclePane: (step: 1 | -1) => void;
};

export function useShellFocus(): ShellFocus {
    const route = useRoute();
    const { history } = useNavigation();
    const previous = useRef<Route>(route);
    // the tab shown (its history): another one is a tab switch, not a navigation
    const shownHistory = useRef(history);
    // an element to focus after the next navigation (Cmd+N: the new post box)
    const pendingFocus = useRef<string | null>(null);
    // what had focus when a detail opened, to go back to when it closes
    const openers = useRef(new Map<string, HTMLElement>());
    // the last focused element in each pane, for F6
    const lastFocus = useRef(new Map<AnyPane, HTMLElement>());

    // What opened a detail is what had focus when the route changed, before React renders the
    // detail (whose autoFocus would take focus first). A detail replaced from inside the detail
    // pane (a new conversation once sent) keeps the opener of the one it replaces.
    useEffect(() => {
        let last = history.current;
        return history.subscribe(() => {
            const before = last;
            const now = history.current;
            last = now;
            // Back or Forward to an entry where the inbox opened it by itself: preopened again
            // (here, before the route renders, so the conversation mounts waiting to be read)
            resumePreopened(now);
            if (!now.detail) return;
            // the inbox opened it by itself: nothing opened it, and focus stays where it is
            if (isPreopened(now.detail)) return;
            const path = detailPath(now.detail);
            if (before.detail && detailPath(before.detail) === path) return;
            const active = document.activeElement;
            if (!(active instanceof HTMLElement) || active === document.body) return;
            if (!active.closest('[data-pane="detail"]')) {
                openers.current.set(path, active);
                return;
            }
            const carried = before.detail ? openers.current.get(detailPath(before.detail)) : undefined;
            if (carried) openers.current.set(path, carried);
        });
    }, [history]);

    // the conversation the inbox opened by itself (preopen.ts) while it is the one open
    const preopenedPath = useRef<string | null>(null);
    useLayoutEffect(() => {
        if (shownHistory.current !== history) {
            shownHistory.current = history;
            previous.current = route;
            pendingFocus.current = null;
            // chosen in the strip: focus stays on the tab; otherwise (Cmd+1, a new or a closed
            // tab) the content's heading, as a new section
            if (!document.activeElement?.closest('[role="tab"]')) focusHeading('list');
            return;
        }
        const before = previous.current;
        if (sameRoute(before, route)) return;
        previous.current = route;
        // a preopened conversation is preopened only while it is open
        if (preopenedId() !== null && !isPreopened(route.detail)) setPreopened(null);
        const closingPreopened = !route.detail && !!before.detail && preopenedPath.current === detailPath(before.detail);
        preopenedPath.current = route.detail && isPreopened(route.detail) ? detailPath(route.detail) : null;
        const want = pendingFocus.current;
        pendingFocus.current = null;
        moveFocus({ before, route, want, closingPreopened, opener: before.detail ? openers.current.get(detailPath(before.detail)) : undefined });
    }, [route, history]);

    useEffect(() => {
        const onFocusIn = (e: FocusEvent) => {
            const pane = (e.target as Element | null)?.closest?.<HTMLElement>('[data-pane]')?.dataset.pane;
            if (pane && (PANES as readonly string[]).includes(pane)) lastFocus.current.set(pane as AnyPane, e.target as HTMLElement);
        };
        document.addEventListener('focusin', onFocusIn);
        return () => document.removeEventListener('focusin', onFocusIn);
    }, []);

    const detailOpen = !!route.detail;
    const focusPane = useCallback(
        (name: AnyPane): boolean => {
            // an empty detail pane has nothing to act on, and its only heading is not drawn
            if (name === 'detail' && !detailOpen) return false;
            const pane = paneElement(name);
            if (!pane) return false;
            const last = lastFocus.current.get(name);
            if (last?.isConnected && pane.contains(last)) {
                last.focus();
                return true;
            }
            if (name !== 'sidebar') return focusHeading(name);
            const item = pane.querySelector<HTMLElement>('[aria-current="page"]') ?? pane.querySelector<HTMLElement>('button');
            item?.focus();
            return !!item;
        },
        [detailOpen],
    );

    const cyclePane = useCallback(
        (step: 1 | -1) => {
            const current = (document.activeElement?.closest<HTMLElement>('[data-pane]')?.dataset.pane ?? 'sidebar') as AnyPane;
            const start = Math.max(0, PANES.indexOf(current));
            for (let i = 1; i <= PANES.length; i++) {
                const next = PANES[(start + step * i + PANES.length * 2) % PANES.length];
                if (next && focusPane(next)) return;
            }
        },
        [focusPane],
    );

    const focusAfterNavigation = useCallback((id: string) => {
        pendingFocus.current = id;
    }, []);

    return { focusAfterNavigation, focusPane, cyclePane };
}
