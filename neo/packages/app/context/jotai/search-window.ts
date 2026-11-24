import { useCallback } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import type { SearchQuery } from 'app/lib/search-window';

/**
 * The search window's dialog (SearchWindowHost): open or not, and the query it opens with (the scope of the button
 * that opened it). One per app; the header's Search, a section's or a context's Search and Cmd/Ctrl+K open it.
 */
export type SearchWindowState = {
    open: boolean;
    query: SearchQuery;
};

export const searchWindowAtom = atom<SearchWindowState>({ open: false, query: {} });

export function useSearchWindowState(): SearchWindowState {
    return useAtomValue(searchWindowAtom);
}

/** Open the search window with a query: `{}` for global search, `{ section: 'bx_posts' }`, `{ context: '12' }`. */
export function useOpenSearchWindow(): (query?: SearchQuery) => void {
    const set = useSetAtom(searchWindowAtom);
    return useCallback((query: SearchQuery = {}) => set({ open: true, query }), [set]);
}

export function useCloseSearchWindow(): () => void {
    const set = useSetAtom(searchWindowAtom);
    return useCallback(() => set((state) => ({ ...state, open: false })), [set]);
}

/**
 * Explore with a search typed: its results stand in place of the page's other blocks until the field is cleared
 * (X's Explore). The page's block list reads it.
 */
export const exploreSearchActiveAtom = atom<boolean>(false);

export function useExploreSearchActive(): boolean {
    return useAtomValue(exploreSearchActiveAtom);
}

export function useSetExploreSearchActive(): (active: boolean) => void {
    return useSetAtom(exploreSearchActiveAtom);
}
