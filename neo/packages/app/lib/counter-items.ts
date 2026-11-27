/**
 * Items of a counters menu (a feed card's reactions, comments ... counts) and what they show.
 * An item the app does not draw (an element without a `type`, such as UNA's views counter sent as site
 * markup) only takes a slot in the row: `isDrawnCounter` leaves it out. A counter at zero stays mounted, as
 * its widget follows the object's state (the first reaction makes it appear); the row puts no gap between
 * items, each counter keeps its own space after it, so an empty one takes none.
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

/** Whether the item is ever drawn: not an element without a `type`. A counter at zero is (it can change). */
export function isDrawnCounter(item: CounterMenuItem): boolean {
    return !(item?.display_type === 'element' && !item?.data?.type);
}

/** Whether the item shows something now: drawn, and not a counter at zero. */
export function hasCounterToShow(item: CounterMenuItem): boolean {
    if (!isDrawnCounter(item)) return false;
    const count = counterItemCount(item);
    return count === null || count > 0;
}
