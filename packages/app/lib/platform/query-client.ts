import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client for web + native.
 * Must be cleared on sign-out so list/membership caches cannot leak across accounts.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            // TanStack Query v4 name (`gcTime` is v5 and was silently ignored).
            cacheTime: 3 * 60 * 1000,
            refetchOnWindowFocus: false,
            // Default 3 retries, but not after a fetcher timeout: each retry would re-run the
            // same slow request (the fetcher has already waited `fetch_timeout_ms`).
            retry: (failureCount, error) =>
                (error as Error | undefined)?.message !== 'Timeout' && failureCount < 3,
        },
    },
})
