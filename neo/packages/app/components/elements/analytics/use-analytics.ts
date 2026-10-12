import { useCallback } from 'react';
import { atom, useAtom, type PrimitiveAtom } from 'jotai';
import { useTabChromeKey } from 'app/context/tab-chrome';
import { useFetch } from 'app/lib/hooks/use-fetch';
import type { AnalyticsBlockData, AnalyticsFilterState, AnalyticsStrings } from './analytics.types';
import { getDeviceTimezone } from './format';

const DEFAULT_FILTERS: AnalyticsFilterState = { range: '7d', platform: '', f: {} };

// One filter state per screen: every analytics block on a screen follows the same
// filter bar, the way the classic page's blocks follow its URL parameters. Native
// keeps one per tab screen (several stay mounted); web has one screen ('web').
// Kept out of the URL on purpose: a query string on the page URL makes the
// Conductor lose the Analytics subtab and refetches the page on the server.
const filtersAtoms = new Map<string, PrimitiveAtom<AnalyticsFilterState>>();

function getFiltersAtom(key: string): PrimitiveAtom<AnalyticsFilterState> {
    let filtersAtom = filtersAtoms.get(key);
    if (!filtersAtom) {
        filtersAtom = atom<AnalyticsFilterState>(DEFAULT_FILTERS);
        filtersAtoms.set(key, filtersAtom);
    }
    return filtersAtom;
}

export function useAnalyticsFilters() {
    const [filters, setFilters] = useAtom(getFiltersAtom(useTabChromeKey()));

    const setRange = useCallback((range: string) => {
        setFilters((prev) => (prev.range === range ? prev : { ...prev, range }));
    }, [setFilters]);

    const setPlatform = useCallback((platform: string) => {
        setFilters((prev) => (prev.platform === platform ? prev : { ...prev, platform }));
    }, [setFilters]);

    /** Show only rows where `dimension` is `value`; the platform has its own filter. */
    const addFilter = useCallback((dimension: string, value: string) => {
        if (dimension === 'platform') {
            setPlatform(value);
            return;
        }
        setFilters((prev) => (prev.f[dimension] === value ? prev : { ...prev, f: { ...prev.f, [dimension]: value } }));
    }, [setFilters, setPlatform]);

    const removeFilter = useCallback((dimension: string) => {
        setFilters((prev) => {
            if (!(dimension in prev.f)) return prev;
            const f = { ...prev.f };
            delete f[dimension];
            return { ...prev, f };
        });
    }, [setFilters]);

    return { filters, setRange, setPlatform, addFilter, removeFilter };
}

const DEFAULT_STRINGS: AnalyticsStrings = {
    // Fallbacks for a server that sends no strings; UNA sends them translated.
    range: 'Period',
    platform: 'Platform',
    all_platforms: 'All platforms',
    online: 'online in the last {0} minutes',
    remove_filter: 'Remove filter: {0}',
    filter_by: 'Show only {0}',
    previous_period: 'Previous period: {0}',
    key_figures: 'Key figures',
    visitors: 'Unique visitors',
    no_data: 'No data for this period',
    error: "Couldn't load this report.",
    duration_h: 'h',
    duration_m: 'm',
    duration_s: 's',
};

export function getStrings(data: AnalyticsBlockData | undefined): AnalyticsStrings {
    return { ...DEFAULT_STRINGS, ...(data?.strings || {}) };
}

type ReportResponse<T> = {
    status?: number;
    code?: number;
    error?: unknown;
    data?: T;
};

/**
 * A block's report from `get_report`, with the screen's filters and the block's own
 * params (`local` adds per-block state such as the selected tab).
 *
 * `fetcher` doesn't throw on UNA errors: `{error, code}` arrives as a body with
 * status 500, so the result is checked here. Access denied (403) is `denied`: the
 * block renders nothing, like the classic block for a viewer without access.
 */
export function useAnalyticsReport<T>(data: AnalyticsBlockData | undefined, local?: Record<string, string>) {
    const { filters } = useAnalyticsFilters();

    const params: Record<string, unknown> = {
        ...(data?.params && typeof data.params === 'object' ? data.params : {}),
        ...local,
        range: filters.range,
        tz: getDeviceTimezone(),
    };
    if (filters.platform) params.platform = filters.platform;
    if (Object.keys(filters.f).length) params.f = filters.f;

    const url = data?.report && data.request_url
        ? `/api.php?r=${data.request_url}&params[]=${encodeURIComponent(data.report)}&params[]=${encodeURIComponent(JSON.stringify(params))}`
        : null;

    const query = useFetch<ReportResponse<T>>(url, { keepPreviousData: true });
    const response = query.data;

    const denied = response?.code === 403 || response?.status === 403;
    const report = response && response.status === 200 && !response.error && response.data && typeof response.data === 'object'
        ? response.data
        : undefined;

    return {
        report,
        /** Render nothing: no access, or a block without an endpoint. */
        hidden: denied || !url,
        isError: !denied && (!!query.error || (!!response && !report)),
        /** Nothing to show yet: the first request is on its way. */
        isLoading: !!url && !response && !query.error,
        /** Showing the previous filters' data while the new ones load. */
        isUpdating: query.isFetching && !!response,
        refetch: query.refetch,
    };
}
