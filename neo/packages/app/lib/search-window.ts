/**
 * The search window's query: one format for the window, the results page (`/search-keyword`), Explore and UNA's
 * `system/search_window` service (BxDolSearchUnified on UNA). Its keys are the results page's URL params, so a
 * search can be shared as a link and opened again as it was.
 */

export type SearchQuery = {
    keyword?: string;
    /** Module names, comma separated; one module is the module scope. */
    section?: string;
    /** A context profile id (a group, an event): what is posted in it. */
    context?: string;
    /** A profile id: what it created ("Created by"). */
    author?: string;
    title_only?: string;
    date_from?: string;
    date_to?: string;
    /** created (default), starts, ends */
    date_field?: string;
    timezone?: string;
    /** JSON object of the module's search field values (the search form's filter format). */
    filters?: string;
    /** One module of the scope shown alone (the results' tabs). */
    tab?: string;
    /** best (default) or new */
    sort?: string;
    /** A module's next page. */
    cursor?: string;
};

/** What a page or a button opens the window with: its scope. */
export type SearchScope = {
    section?: string;
    context?: string | number;
    author?: string | number;
    title?: string;
};

export const SEARCH_QUERY_KEYS: Array<keyof SearchQuery> = [
    'keyword', 'section', 'context', 'author', 'title_only', 'date_from', 'date_to', 'date_field', 'timezone', 'filters', 'tab', 'sort', 'cursor',
];

/**
 * The query's known, non-empty keys from URL params, a page's params or a scope, each as a string.
 */
export function normalizeSearchQuery(input: Record<string, unknown> | null | undefined): SearchQuery {
    const out: SearchQuery = {};
    if (!input || typeof input !== 'object') return out;
    for (const key of SEARCH_QUERY_KEYS) {
        const value = input[key];
        if (value === undefined || value === null || value === false) continue;
        const text = typeof value === 'string' ? value.trim() : typeof value === 'number' || value === true ? String(value === true ? 1 : value) : '';
        if (text === '' || text === '0' && key !== 'keyword') continue;
        out[key] = text;
    }
    return out;
}

/** The window's query for a scope (a section's or a context's Search button, the page's `search`). */
export function searchQueryFromScope(scope: SearchScope | null | undefined, keyword = ''): SearchQuery {
    return normalizeSearchQuery({
        keyword,
        section: scope?.section,
        context: scope?.context,
        author: scope?.author,
    });
}

/** Whether the query asks for anything: words, or a narrowing (a context, an author, dates, fields). */
export function hasSearchQuery(query: SearchQuery): boolean {
    return !!(query.keyword || query.context || query.author || query.date_from || query.filters);
}

/** The results page's link for the query (its cursor left out). */
export function searchResultsHref(query: SearchQuery, base = '/search-keyword'): string {
    const params = SEARCH_QUERY_KEYS
        .filter((key) => key !== 'cursor' && query[key])
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(query[key] as string));
    return params.length ? base + '?' + params.join('&') : base;
}

/** The query with one key set, or removed for an empty value; a new scope starts the results over. */
export function withSearchValue(query: SearchQuery, key: keyof SearchQuery, value: string | null | undefined): SearchQuery {
    const out: SearchQuery = { ...query };
    if (value === null || value === undefined || value === '') delete out[key];
    else out[key] = value;
    delete out.cursor;
    if (key === 'section' || key === 'context') {
        delete out.tab;
        if (key === 'section') delete out.filters;
    }
    return out;
}

/** The module's field filters of the query as an object. */
export function searchFilters(query: SearchQuery): Record<string, string | string[]> {
    if (!query.filters) return {};
    try {
        const value = JSON.parse(query.filters);
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}

/** The query with a field filter set (a value, a list of values) or removed (empty). */
export function withSearchFilter(query: SearchQuery, name: string, value: string | string[] | null): SearchQuery {
    const filters = { ...searchFilters(query) };
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) delete filters[name];
    else filters[name] = value;
    return withSearchValue(query, 'filters', Object.keys(filters).length ? JSON.stringify(filters) : null);
}
