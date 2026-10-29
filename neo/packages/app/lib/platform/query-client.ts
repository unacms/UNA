import { QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
    return new QueryClient({
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
}

/**
 * Shared TanStack Query client for web + native.
 * Must be cleared on sign-out so list/membership caches cannot leak across accounts.
 * Web SSR must not render with it: use `getQueryClient()` there.
 */
export const queryClient = makeQueryClient()

/**
 * The client for a React tree: in the browser and on native the shared one above,
 * on the server a new one per render, so no request sees another's cache.
 */
export function getQueryClient() {
    return typeof window === 'undefined' ? makeQueryClient() : queryClient
}
