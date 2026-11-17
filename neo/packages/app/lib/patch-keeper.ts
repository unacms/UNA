import type { Query, QueryClient } from '@tanstack/react-query';

/**
 * Writes a profile's connection change into every cached list (`patchListPages`, lib/connection-patch.ts) and keeps
 * it there.
 *
 * A list request that was on its way when the change was written (the list revalidating after it opened, a pull to
 * refresh) left UNA before the change, and its answer would put the old counts and button back. So a change is kept
 * for a short while and written again over a list answer that was asked for before it. An answer asked for after
 * the change has it, or something newer (someone else followed too), and is left alone; one whose request was not
 * seen starting counts as older. An answer that already has the change comes back from the patch as it is, so
 * nothing is written twice.
 */
const KEEP_MS = 10000;

/** Applies a patch to a list's cached pages; gives the same object back when the patch changes nothing. */
type PatchPages<P> = (cached: unknown, patch: P) => unknown;
/** What a patch must say for it to be kept: whose it is, and its parts (a newer one adds to an earlier one's). */
type KeptPatch = { profileId: number | string; counts?: unknown; elements?: Record<string, unknown> | null };

const isListQuery = (query: Query) => Array.isArray((query.state.data as { pages?: unknown } | undefined)?.pages);

export function createPatchKeeper<P extends KeptPatch>(
    queryClient: QueryClient,
    patchPages: PatchPages<P>,
    { keepMs = KEEP_MS, now = Date.now } = {},
) {
    const kept = new Map<string, { patch: P; at: number }>();
    /** When each list's latest request started, by query hash. */
    const requestStarted = new Map<string, number>();
    let watching = false;

    const watch = () => {
        if (watching) return;
        watching = true;
        queryClient.getQueryCache().subscribe((event) => {
            if (event.type !== 'updated') return;
            const hash = event.query.queryHash;
            if (event.action.type === 'fetch') {
                requestStarted.set(hash, now());
                return;
            }
            if (event.action.type !== 'success' || !isListQuery(event.query)) return;

            const started = requestStarted.get(hash) ?? 0;
            const time = now();
            let data = event.query.state.data;
            for (const [key, { patch, at }] of kept) {
                if (time - at > keepMs) kept.delete(key);
                else if (at >= started) data = patchPages(data, patch);
            }
            // Writing fires this listener again with the patched data, which the patches then leave as it is.
            if (data !== event.query.state.data) queryClient.setQueryData(event.query.queryKey, data);
        });
    };

    return {
        apply(patch: P) {
            const key = String(patch.profileId);
            const earlier = kept.get(key);
            // A second action on the same profile (friend, then follow) keeps the first one's button.
            kept.set(key, {
                at: now(),
                patch: earlier
                    ? {
                        ...patch,
                        counts: patch.counts ?? earlier.patch.counts,
                        elements: { ...earlier.patch.elements, ...patch.elements },
                    }
                    : patch,
            });
            watch();
            queryClient.setQueriesData({ predicate: isListQuery }, (cached: unknown) => patchPages(cached, patch));
        },
    };
}
