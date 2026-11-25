import { useEffect, useState } from 'react';
import SearchWindow from './search-window';
import { useSetExploreSearchActive } from 'app/context/explore-search';
import { hasSearchQuery, normalizeSearchQuery, type SearchQuery } from 'app/lib/search-window';

type ExploreSearchProps = {
    /** UNA's `static` item (system:get_block_search_window): the page's query, and `focus` from the header's Search. */
    data?: { query?: Record<string, unknown>; focus?: number | boolean };
};

/**
 * Explore's search, the apps' search page, X's way: its field and chips on top, the page's featured blocks until a
 * search is typed, its results in their place then, and the blocks again once the field is cleared.
 */
export default function ExploreSearch({ data }: ExploreSearchProps) {
    const setActive = useSetExploreSearchActive();
    const [initialQuery] = useState<SearchQuery>(() => normalizeSearchQuery(data?.query ?? {}));
    const [active, setLocalActive] = useState(() => hasSearchQuery(initialQuery));

    useEffect(() => {
        setActive(active);
    }, [active, setActive]);
    useEffect(() => () => setActive(false), [setActive]);

    return (
        <SearchWindow
            initialQuery={initialQuery}
            mode="explore"
            autoFocus={!!data?.focus}
            onQueryChange={(query) => setLocalActive(hasSearchQuery(query))}
        />
    );
}
