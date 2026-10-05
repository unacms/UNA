import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { flattenPagesForUniList } from 'app/lib/browse-query';
import {
    getDropdownFilterKeys,
    getNumberedFilterKeys,
    getQueryParamFilterKeys,
    buildQueryAppend,
    buildFilterParam,
} from './filters';
import { fetchGridData } from './actions';
import { useGridApi } from './context';

/**
 * Everything the grid needs before it can render: rows, filter/search state and
 * the paginated query. Column layout is computed once in `GridProvider`.
 *
 * The query cache is the only copy of the rows; store handlers patch it through
 * the `queryClient` / `queryKey` injected below.
 */
export function useGridData(data) {
    const { t } = useTranslation();
    const gridStore = useGridApi();
    const queryClient = useQueryClient();

    const settings = data.settings;
    const [selectedFilters, setSelectedFilters] = useState({});
    const [searchValue, setSearchValue] = useState('');

    const dropdownFilterKeys = useMemo(
        () => getDropdownFilterKeys(settings.filters),
        [settings.filters]
    );

    const numberedFilterKeys = useMemo(
        () => getNumberedFilterKeys(dropdownFilterKeys),
        [dropdownFilterKeys]
    );

    const queryParamFilterKeys = useMemo(
        () => getQueryParamFilterKeys(dropdownFilterKeys),
        [dropdownFilterKeys]
    );

    const queryAppend = useMemo(
        () => buildQueryAppend(settings, queryParamFilterKeys, selectedFilters),
        [settings?.query_append, queryParamFilterKeys, selectedFilters]
    );

    const filterParam = useMemo(
        () => buildFilterParam(numberedFilterKeys, selectedFilters, searchValue),
        [numberedFilterKeys, selectedFilters, searchValue]
    );

    const queryKey = useMemo(
        () => ['grid', settings.object, filterParam, JSON.stringify(queryAppend)],
        [settings.object, filterParam, queryAppend]
    );

    const {
        status,
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: reloadGrid,
        isRefetching,
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => fetchGridData({
            pageParam,
            settings,
            selectedFilters,
            numberedFilterKeys,
            queryAppend,
            searchValue
        }),
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length > 0) {
                return {
                    start: lastPage.params.start + lastPage.params.per_page
                };
            }
            return undefined;
        },
        staleTime: 1000,
        initialPageParam: { start: 0 }
    });

    /** Store handlers read these through `get()` — nothing subscribes to them. */
    useEffect(() => {
        gridStore.setState({ settings, queryAppend, queryClient, queryKey, reloadGrid, t });
    }, [gridStore, settings, queryAppend, queryClient, queryKey, reloadGrid, t]);

    const rows = useMemo(() => flattenPagesForUniList(pagesData), [pagesData]);

    const handleEndReached = () => {
        if (!hasNextPage || isFetchingNextPage) return;
        fetchNextPage();
    };

    /** Search is part of the query key via `filterParam` — no extra reload. */
    const handleSearch = (value) => {
        setSearchValue(value);
    };

    /** Dropdown filter is part of the query key via `filterParam` / `queryAppend`. */
    const handleFilter = (filterKey, value) => {
        setSelectedFilters((prev) => ({ ...prev, [filterKey]: value }));
    };

    return {
        settings,
        rows,
        dropdownFilterKeys,
        selectedFilters,
        handleFilter,
        handleSearch,
        /** Everything the table needs to render loading / refresh / paging states. */
        query: {
            status,
            hasNextPage,
            isFetchingNextPage,
            isRefetching,
            handleEndReached,
            reloadGrid,
        },
    };
}
