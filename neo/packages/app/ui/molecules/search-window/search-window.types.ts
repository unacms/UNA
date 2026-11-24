import type { SearchQuery } from 'app/lib/search-window';

/** A chip of UNA's scope descriptor (BxDolSearchUnified::getScope). */
export type SearchChip = {
    name: string;
    /** scope (removable "In: …"), toggle (Title only), profile (Created by), date_range, options (a module's search field) */
    type: 'scope' | 'toggle' | 'profile' | 'date_range' | 'options' | string;
    caption: string;
    value?: unknown;
    value_title?: string;
    removable?: boolean;
    icon?: string;
    multiple?: number | boolean;
    options?: Array<{ value: string; title: string }>;
    fields?: Array<{ value: string; title: string }>;
};

export type SearchScopeData = {
    scope: 'global' | 'module' | 'context' | string;
    context?: { id: number; title: string; module: string; url: string } | null;
    chips: SearchChip[];
    groups: Array<{ name: string; title: string; icon: string }>;
    ai?: number;
    results_url?: string;
};

/** A row: the module's unit data (getContentInfoAPI) with `search_kind`. */
export type SearchHitData = {
    id?: number | string;
    title?: string;
    text?: string;
    url?: string;
    image?: { src?: string } | string | false;
    module?: string;
    module_title?: string;
    author_data?: { id?: number; display_name?: string; url_avatar?: string; color?: string } | null;
    search_kind?: 'content' | 'comment' | 'profile' | 'page' | string;
    [key: string]: unknown;
};

export type SearchGroupData = {
    name: string;
    title: string;
    icon: string;
    count: number;
    count_more: boolean;
    cursor: string;
    items: SearchHitData[];
};

export type SearchResultsData =
    | { groups: SearchGroupData[]; total: number; total_more: boolean; group?: undefined }
    | { group: SearchGroupData; groups?: undefined; total?: undefined; total_more?: undefined };

export type SearchWindowData = {
    query: SearchQuery;
    scope: SearchScopeData;
    has_query?: number;
    results?: SearchResultsData;
};

export type SearchWindowMode = 'modal' | 'page' | 'explore';

export type SearchWindowProps = {
    /** The query it opens with (a scope, the results page's URL params). */
    initialQuery?: SearchQuery;
    mode?: SearchWindowMode;
    autoFocus?: boolean;
    /** The dialog's close (modal mode). */
    onClose?: () => void;
    /** The query as it changes (the results page keeps its address in step). */
    onQueryChange?: (query: SearchQuery) => void;
};
