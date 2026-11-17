/**
 * Rows a list holds on screen while newer ones wait behind "Show New" (`frozen` in `useUniListQuery`) keep their
 * place and their set, but each shows its newest cached copy. A row changed in place (a card's counts and buttons
 * after a follow, `lib/connection-cache.ts`) is not a new row to hold back; without this it would stay as it was
 * until the reader took the new rows. The held rows come back as they are when no copy is newer.
 */
export function refreshHeldRows<T extends { id?: string | number | null }>(held: T[], cached: readonly T[]): T[] {
    if (!held.length || !cached.length) return held;

    const newest = new Map<string, T>();
    for (const item of cached) {
        if (item?.id != null) newest.set(String(item.id), item);
    }

    let changed = false;
    const rows = held.map((item) => {
        const copy = item?.id != null ? newest.get(String(item.id)) : undefined;
        if (copy === undefined || copy === item) return item;
        changed = true;
        return copy;
    });
    return changed ? rows : held;
}
