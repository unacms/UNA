import { useEffect } from 'react';

import { t } from './i18n';

/** How many pages in a row may come back empty before the list waits for the person. */
const MAX_EMPTY_PAGES = 5;

type PagedQuery = {
    isSuccess: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage: boolean;
    data?: { pages: { items: unknown[] }[] };
    fetchNextPage: () => Promise<unknown>;
};

/**
 * The API reads a bounded number of rows per page and leaves out what the viewer may not see,
 * so a page can be empty and still have a next one. While nothing has shown yet, fetch on (a
 * few pages at most) instead of showing an empty list next to a "Load more" button.
 *
 * `active` is false for a list that is not on screen (a tab that is not the shown one): asking
 * for a next page is not held back by the query's `enabled`, so the list waits here until shown.
 */
export function useFillEmptyPages(query: PagedQuery, active = true): void {
    const pages = query.data?.pages ?? [];
    const shown = pages.some((p) => p.items.length > 0);
    const more = active && query.isSuccess && !shown && !!query.hasNextPage && !query.isFetchingNextPage && pages.length < MAX_EMPTY_PAGES;
    const { fetchNextPage } = query;

    useEffect(() => {
        if (more) void fetchNextPage();
    }, [more, pages.length, fetchNextPage]);
}

/**
 * What an empty list says: nothing at all, or nothing so far when older pages may still hold
 * something. Empty while the list has items or is still loading.
 */
export function emptyListText(query: Pick<PagedQuery, 'isSuccess' | 'hasNextPage' | 'isFetchingNextPage'>, count: number, empty: string): string {
    if (!query.isSuccess || count > 0 || query.isFetchingNextPage) return '';
    return query.hasNextPage ? t('Nothing to show so far. Older items may still be there.') : empty;
}
