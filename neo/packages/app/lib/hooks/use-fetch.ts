import { useQuery } from '@tanstack/react-query';
import type { QueryFunctionContext, UseQueryOptions } from '@tanstack/react-query';
import i18n from 'i18next';
import { fetcher } from 'app/lib/fetcher';
import type { FetchOptions } from 'app/lib/fetcher';

/** GET path for the UNA API, e.g. `/api.php?r=module/method/Template&params[]=…`. */
export type FetchUrl = string;

/** `fetcher` options that make sense for a read (the signal comes from React Query). */
export type FetcherReadOptions = Pick<FetchOptions, 'timeoutMs' | 'maxAttempts' | 'silent'>;

type FetchQueryKey = readonly ['una', FetchUrl, string];

/**
 * Query options for a UNA GET — for `useQueries` or a custom `useQuery`.
 *
 * - The key is the request itself (+ language, which `fetcher` appends),
 *   so identical requests share one cache entry and one in-flight fetch.
 * - `fetcher` already retries timeouts / network errors, so React Query doesn't.
 * - A changed key or unmount aborts the request.
 * - The cache is cleared on sign-out (`clearClientSessionState`).
 */
export function fetchQueryOptions<T = any>(url: FetchUrl | null | undefined, fetchOptions: FetcherReadOptions = {}) {
    return {
        queryKey: ['una', url ?? '', i18n.language] as FetchQueryKey,
        queryFn: ({ signal }: QueryFunctionContext<FetchQueryKey>) =>
            fetcher(url as FetchUrl, false, { ...fetchOptions, signal }) as Promise<T>,
        enabled: !!url,
        retry: false,
    };
}

type FetchQueryOptions<T> = Omit<UseQueryOptions<T, unknown, T, FetchQueryKey>, 'queryKey' | 'queryFn'> & {
    /** Passed to `fetcher`, e.g. `{ silent: true, maxAttempts: 1 }` for an optional request. */
    fetchOptions?: FetcherReadOptions;
};

/**
 * Load UNA data for rendering: `const { data, isLoading, error } = useFetch(url)`.
 * Pass a falsy `url` to wait (e.g. until the user is known). Resolves to the raw
 * response JSON (`{}` when the body isn't JSON) — read `data?.data` defensively.
 * For actions (like, save, delete) call `fetcher` directly — they aren't queries.
 */
export function useFetch<T = any>(url: FetchUrl | null | undefined, options: FetchQueryOptions<T> = {}) {
    const { fetchOptions, ...queryOptions } = options;
    const base = fetchQueryOptions<T>(url, fetchOptions);
    return useQuery<T, unknown, T, FetchQueryKey>({
        ...base,
        ...queryOptions,
        enabled: base.enabled && (queryOptions.enabled ?? true),
    });
}
