import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Explore with a search typed: its results stand in place of the page's other blocks until the field is cleared
 * (X's Explore). One per page (components/layouts.js), so another page, a native tab that stays mounted among them,
 * keeps its blocks.
 */
type ExploreSearchState = { active: boolean; setActive: (active: boolean) => void };

const ExploreSearchContext = createContext<ExploreSearchState | null>(null);

export function ExploreSearchProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState(false);
    const value = useMemo(() => ({ active, setActive }), [active]);
    return <ExploreSearchContext.Provider value={value}>{children}</ExploreSearchContext.Provider>;
}

/** Whether this page's Explore search shows its results in place of the other blocks. */
export function useExploreSearchActive(): boolean {
    return useContext(ExploreSearchContext)?.active ?? false;
}

export function useSetExploreSearchActive(): (active: boolean) => void {
    return useContext(ExploreSearchContext)?.setActive ?? (() => {});
}
