import { useEffect, useRef, useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { SEARCH_DEBOUNCE_MS } from 'app/lib/search-debounce';
import type { SearchQuery } from 'app/lib/search-window';
import type { SearchGroupData, SearchWindowData } from './search-window.types';

const SEARCH_WINDOW_URL = '/api.php?r=system/search_window/TemplServicesSearch&params=';

/** One request of UNA's search_window service: the scope and its chips, and the results of the query. */
export async function fetchSearchWindow(query: SearchQuery, options: { ai?: boolean; signal?: AbortSignal } = {}): Promise<SearchWindowData | null> {
    const params = { params: { ...query, ...(options.ai ? { ai: 1 } : {}) } };
    const response = await fetcher(SEARCH_WINDOW_URL + encodeURIComponent(JSON.stringify(params)), false, { signal: options.signal });
    const block = response?.data?.[0];
    const data = block?.data;
    return data && typeof data === 'object' && data.scope ? (data as SearchWindowData) : null;
}

/**
 * The window's data for its query: asked again when the query changes (after a pause in typing), the previous
 * answer kept on screen meanwhile and a newer request winning. `aiToken` changes when the keyword is to be read by
 * the AI parser (Enter); that request has `ai`.
 */
export function useSearchWindowData(
    query: SearchQuery,
    aiToken: number,
    onAiQuery?: (query: SearchQuery) => void,
): { data: SearchWindowData | null; loading: boolean; error: boolean; allGroups: SearchGroupData[] } {
    const [data, setData] = useState<SearchWindowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // the "All" view's modules and counts, kept for the tabs while one module is shown
    const [allGroups, setAllGroups] = useState<SearchGroupData[]>([]);
    const lastAiToken = useRef(aiToken);
    const onAiQueryRef = useRef(onAiQuery);
    const allGroupsRef = useRef<SearchGroupData[]>([]);
    const key = JSON.stringify(query);

    useEffect(() => {
        onAiQueryRef.current = onAiQuery;
        allGroupsRef.current = allGroups;
    });

    useEffect(() => {
        const controller = new AbortController();
        const ai = aiToken !== lastAiToken.current;
        lastAiToken.current = aiToken;

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const result = await fetchSearchWindow(JSON.parse(key), { ai, signal: controller.signal });
                if (controller.signal.aborted) return;
                setData(result);
                setError(!result);
                const results = result?.results;
                if (results && !('group' in results && results.group) && results.groups)
                    setAllGroups(results.groups);
                // opened on one module's tab (a shared link): its neighbours' tabs come from the "All" view
                else if (results && 'group' in results && results.group && result?.query?.tab && result.scope?.scope !== 'module' && !allGroupsRef.current.length) {
                    const { tab: _tab, cursor: _cursor, ...rest } = JSON.parse(key) as SearchQuery;
                    const all = await fetchSearchWindow(rest, { signal: controller.signal });
                    const allResults = all?.results;
                    if (!controller.signal.aborted && allResults && !('group' in allResults && allResults.group) && allResults.groups)
                        setAllGroups(allResults.groups);
                }
                // the AI may have read the words into chips: the window takes UNA's query back
                if (ai && result?.query && JSON.stringify(result.query) !== key)
                    onAiQueryRef.current?.(result.query);
            } catch {
                if (controller.signal.aborted) return;
                setError(true);
            }
            setLoading(false);
        }, ai ? 0 : SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [key, aiToken]);

    return { data, loading, error, allGroups };
}
