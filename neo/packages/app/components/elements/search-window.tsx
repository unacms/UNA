import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { BlockWrapper } from 'app/components/block-wrapper';
import SearchWindow from 'app/ui/molecules/search-window/search-window';
import { useSetExploreSearchActive } from 'app/context/jotai/search-window';
import { hasSearchQuery, normalizeSearchQuery, type SearchQuery } from 'app/lib/search-window';
import { parseUrl, parseQueryString } from 'app/lib/util';
import type { ElementProps } from 'app/components/block';

/**
 * UNA's search block (system:get_block_search_window): the search window in the page. On Explore, the apps' search
 * page, X's way: its field and chips on top, the page's featured blocks until a search is typed, its results in their
 * place then, and the blocks again once the field is cleared. `?search=1` (the phone header's Search) focuses the field.
 */
export default function ElementSearchWindow({ blockWrapperProps, data, url }: ElementProps) {
    const setActive = useSetExploreSearchActive();
    // the page's address: its params (a search to open with, `search=1` to focus the field)
    const params = useMemo(() => {
        const href = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.search : parseUrl(String(url ?? '')).queryString;
        return parseQueryString(String(href ?? '').replace(/^\?/, ''));
    }, [url]);
    const initialQuery = useMemo(() => normalizeSearchQuery({ ...(data?.query ?? {}), ...params }), [data?.query, params]);
    const [query, setQuery] = useState<SearchQuery>(initialQuery);
    const active = hasSearchQuery(query);

    useEffect(() => {
        setActive(active);
    }, [active, setActive]);
    useEffect(() => () => setActive(false), [setActive]);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <SearchWindow initialQuery={initialQuery} mode="explore" autoFocus={params.search === '1'} onQueryChange={setQuery} />
        </BlockWrapper>
    );
}
