/**
 * UNA grid filters: numbered `filter0, filter1, …` go into one `filter` query
 * param; other dropdown keys are merged into `query_append`.
 */

const FILTER_PARAM_DIVIDER = '%23-%23';
const RESERVED_FILTER_KEYS = new Set(['search']);

/** Keys like `filter0` / `filter1` that UNA concatenates into `filter=`. */
const isNumberedFilterKey = (key) => /^filter\d+$/.test(key);

/** Dropdown filter keys in display order (numbered first, then named). */
export const getDropdownFilterKeys = (filters) => {
    if (!filters) return [];
    return Object.keys(filters)
        .filter((key) => !RESERVED_FILTER_KEYS.has(key) && Array.isArray(filters[key]) && filters[key].length > 0)
        .sort((a, b) => {
            const aNum = isNumberedFilterKey(a) ? parseInt(a.replace('filter', ''), 10) : Infinity;
            const bNum = isNumberedFilterKey(b) ? parseInt(b.replace('filter', ''), 10) : Infinity;
            if (aNum !== bNum) return aNum - bNum;
            return a.localeCompare(b);
        });
};

export const getNumberedFilterKeys = (keys) => keys.filter(isNumberedFilterKey);

export const getQueryParamFilterKeys = (keys) => keys.filter((key) => !isNumberedFilterKey(key));

/** True when the grid exposes a search box (`filters.search` is present). */
export const hasSearchFilter = (filters) => filters != null && 'search' in filters;

/** Map UNA `{value, title}` options to DropdownMenu item shape. */
export const mapFilterDropdownItems = (items) => items.map((aItem) => ({
    id: aItem.value,
    name: aItem.title.toLowerCase(),
    title: aItem.title
}));

/**
 * Build UNA `filter` query value: numbered dropdown ids + search,
 * joined with `#-#` (URL-encoded as `%23-%23`).
 */
export const buildFilterParam = (numberedFilterKeys, selectedFilters, searchValue) => {
    const parts = numberedFilterKeys.map((key) => selectedFilters[key]?.id ?? '');
    parts.push(searchValue ?? '');
    return parts.join(FILTER_PARAM_DIVIDER);
};

/** Merge named dropdown selections into `settings.query_append`. */
export const buildQueryAppend = (settings, queryParamFilterKeys, selectedFilters) => {
    const append = { ...(settings?.query_append || {}) };
    queryParamFilterKeys.forEach((key) => {
        const value = selectedFilters[key]?.id;
        if (value !== undefined && value !== '') {
            append[key] = value;
        }
    });
    return append;
};
