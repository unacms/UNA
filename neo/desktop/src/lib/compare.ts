/**
 * Strings by UTF-16 code unit, the order of a bare `sort()`: the same in every locale, so a list
 * sorted with it can be compared as a canonical form (localeCompare cannot: it follows the locale).
 */
export function byCodeUnit(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}
