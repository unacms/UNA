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

/* The window's filters ("+ Filter" and the chips): which filters are set, what "+ Filter" lists, and what a choice
   in it does to the query. */

/** A filter chip of UNA's scope descriptor (search_window: `scope.chips`). */
export type FilterChip = {
    name: string;
    type: 'scope' | 'toggle' | 'profile' | 'date_range' | 'options' | string;
    caption: string;
    value?: unknown;
    options?: Array<{ value: string; title: string }>;
    fields?: Array<{ value: string; title: string }>;
};

export type FilterStrings = Record<string, string | undefined>;

export type FilterMenuItem = { id: string; title: string; icon?: string; type?: 'separator' };

export type DatePreset = { id: string; title: string; days: number; ahead: boolean; field: string };

/** `{0}`, `{1}` in UNA's strings. */
export function fillString(text: string | undefined, ...values: Array<string | number>): string {
    return String(text ?? '').replace(/\{(\d)\}/g, (_m, i) => String(values[Number(i)] ?? ''));
}

/** The values of a module field in the query. */
export function optionValues(chip: FilterChip, query: SearchQuery): string[] {
    return ([] as string[]).concat((searchFilters(query)[chip.name] as string | string[] | undefined) ?? []);
}

/** Whether a chip shows: the scope always (where the window was opened chose it), a filter once it is set. */
export function isChipSet(chip: FilterChip, query: SearchQuery): boolean {
    if (chip.type === 'scope') return true;
    if (chip.type === 'options') return optionValues(chip, query).length > 0;
    if (chip.type === 'date_range') return !!(chip.value as { from?: string } | null)?.from;
    return !!chip.value;
}

/** Date presets: the past week, month and year, and for a module with start dates the coming week and month. */
export function datePresets(chip: FilterChip, strings: FilterStrings): DatePreset[] {
    const starts = (chip.fields ?? []).some((f) => f.value === 'starts');
    return [
        { id: 'w', title: strings.past_week ?? '', days: 7, ahead: false, field: '' },
        { id: 'm', title: strings.past_month ?? '', days: 30, ahead: false, field: '' },
        { id: 'y', title: strings.past_year ?? '', days: 365, ahead: false, field: '' },
        ...(starts ? [
            { id: 'sw', title: strings.starts_week ?? '', days: 7, ahead: true, field: 'starts' },
            { id: 'sm', title: strings.starts_month ?? '', days: 30, ahead: true, field: 'starts' },
        ] : []),
    ];
}

function ymd(date: Date): string {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

/** [from, to] of a preset: days before today, or days from today on. */
export function presetRange(days: number, ahead: boolean, today: Date): [string, string] {
    const other = new Date(today.getTime() + (ahead ? 1 : -1) * days * 86400000);
    return ahead ? [ymd(today), ymd(other)] : [ymd(other), ymd(today)];
}

/**
 * "+ Filter": the filters not set, in UNA's order, each group after a separator and each row naming its filter
 * ("Created by: Me", "Past 7 days", "Category: Garden"), then in global search the modules to look in.
 */
export function filterMenuItems(
    chips: FilterChip[],
    query: SearchQuery,
    strings: FilterStrings,
    options: { global: boolean; groups: Array<{ name: string; title: string; icon?: string }>; signedIn: boolean },
): FilterMenuItem[] {
    const menu: FilterMenuItem[] = [];
    const separate = () => { if (menu.length) menu.push({ id: 'sep' + menu.length, title: '', type: 'separator' }); };
    for (const c of chips) {
        if (isChipSet(c, query)) continue;
        switch (c.type) {
            case 'toggle':
                menu.push({ id: 't:' + c.name, title: c.caption, icon: 'Type' });
                break;
            case 'profile':
                separate();
                if (options.signedIn) menu.push({ id: 'p:me', title: fillString(strings.created_by_value, strings.me ?? ''), icon: 'UserRound' });
                menu.push({ id: 'p:find', title: fillString(strings.created_by_value, strings.find_person ?? ''), icon: 'UserRoundSearch' });
                break;
            case 'date_range':
                separate();
                for (const preset of datePresets(c, strings)) menu.push({ id: 'd:' + preset.id, title: preset.title, icon: 'Calendar' });
                break;
            case 'options':
                separate();
                for (const o of c.options ?? []) menu.push({ id: 'o:' + c.name + ':' + o.value, title: c.caption + ': ' + o.title, icon: 'ListFilter' });
                break;
        }
    }
    if (options.global && options.groups.length > 1) {
        separate();
        for (const g of options.groups) menu.push({ id: 's:' + g.name, title: fillString(strings.in, g.title), icon: g.icon });
    }
    return menu;
}

/**
 * The query after a choice in "+ Filter", or `find: true` for "Created by: Find someone…" (the person picker
 * opens; the query stays). The tab resets with any new filter, as on the site.
 */
export function applyFilterChoice(
    query: SearchQuery,
    id: string,
    chips: FilterChip[],
    context: { viewerId?: string | number | null; today?: Date; timezone?: string; strings?: FilterStrings },
): { query: SearchQuery; find?: boolean } {
    const [kind, name = '', ...rest] = id.split(':');
    const value = rest.join(':');
    const reset = (q: SearchQuery) => withSearchValue(q, 'tab', null);
    if (kind === 't') return { query: reset(withSearchValue(query, name as keyof SearchQuery, '1')) };
    if (kind === 'p' && name === 'me') return context.viewerId ? { query: reset(withSearchValue(query, 'author', String(context.viewerId))) } : { query };
    if (kind === 'p') return { query, find: true };
    if (kind === 'd') {
        const chip = chips.find((c) => c.type === 'date_range');
        const preset = chip ? datePresets(chip, context.strings ?? {}).find((p) => p.id === name) : undefined;
        if (!preset) return { query };
        const [from, to] = presetRange(preset.days, preset.ahead, context.today ?? new Date());
        let next = withSearchValue(query, 'date_from', from);
        next = withSearchValue(next, 'date_to', to);
        next = withSearchValue(next, 'date_field', preset.field || null);
        return { query: reset(withSearchValue(next, 'timezone', context.timezone || null)) };
    }
    if (kind === 'o') return { query: reset(withSearchFilter(query, name, [value])) };
    if (kind === 's') return { query: reset(withSearchValue(query, 'section', name)) };
    return { query };
}

/** The query without a chip's filter (its remove button). */
export function withoutChip(query: SearchQuery, chip: FilterChip): SearchQuery {
    let next = query;
    switch (chip.type) {
        case 'scope':
            next = withSearchValue(query, chip.name === 'context' ? 'context' : 'section', null);
            break;
        case 'profile':
            next = withSearchValue(query, 'author', null);
            break;
        case 'date_range':
            next = withSearchValue(withSearchValue(withSearchValue(query, 'date_from', null), 'date_to', null), 'date_field', null);
            break;
        case 'options':
            next = withSearchFilter(query, chip.name, null);
            break;
        default:
            next = withSearchValue(query, chip.name as keyof SearchQuery, null);
    }
    return withSearchValue(next, 'tab', null);
}
