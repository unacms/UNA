/**
 * Which items of a counters menu (a feed card's reactions, comments ... counts) have something to show.
 * A counter at zero, and an item the app does not draw (an element without a `type`, such as UNA's views
 * counter sent as site markup), draw nothing but still take a slot in the row, and the row's gap before it.
 * No app imports, so `node --test packages/app/lib/counter-items.test.ts` runs it from the NEO root.
 */
type CounterData = { count?: number | string; items?: Array<{ count?: number | string }> };

export type CounterMenuItem = {
    display_type?: string;
    data?: { type?: string; counter?: CounterData | null } | null;
};

function toCount(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

/** The item's count: the sum of a compound counter's parts, or its own count; null when it sends none. */
export function counterItemCount(item: CounterMenuItem): number | null {
    const counter = item?.data?.counter;
    if (!counter || typeof counter !== 'object') return null;
    if (Array.isArray(counter.items)) return counter.items.reduce((sum, part) => sum + toCount(part?.count), 0);
    if ('count' in counter) return toCount(counter.count);
    return null;
}

/** Whether the item draws something: an element of a known type that is not a counter at zero. */
export function hasCounterToShow(item: CounterMenuItem): boolean {
    if (item?.display_type === 'element' && !item?.data?.type) return false;
    const count = counterItemCount(item);
    return count === null || count > 0;
}
