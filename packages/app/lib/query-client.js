import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client for web + native.
 * Must be cleared on sign-out so list/membership caches cannot leak across accounts.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 3 * 60 * 1000,
            refetchOnWindowFocus: false,
        },
    },
})
