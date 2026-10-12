// Shapes of the bx_analytics (UNA Analytics module) blocks and reports.
// Blocks: BxAnalyticsModule::_getApiBlockData. Reports: BxAnalyticsReports.

export type AnalyticsOption = { value: string; title: string };

/** Server-translated strings; `{0}` is a placeholder NEO fills in. */
export type AnalyticsStrings = {
    range: string;
    platform: string;
    all_platforms: string;
    /** "online in the last {0} minutes" */
    online: string;
    /** "Remove filter: {0}" */
    remove_filter: string;
    /** "Show only {0}" */
    filter_by: string;
    /** "Previous period: {0}" */
    previous_period: string;
    key_figures: string;
    visitors: string;
    no_data: string;
    error: string;
    duration_h: string;
    duration_m: string;
    duration_s: string;
};

/** `data` of an analytics_* element. */
export type AnalyticsBlockData = {
    report: string;
    /** The block's own report params, e.g. `{ group: 'pages' }` for a top list. */
    params?: Record<string, unknown>;
    /** `bx_analytics/get_report` */
    request_url?: string;
    ranges?: AnalyticsOption[];
    platforms?: AnalyticsOption[];
    /** metric => title */
    metrics?: Record<string, string>;
    strings?: Partial<AnalyticsStrings>;
};

export type AnalyticsElementProps = {
    data?: AnalyticsBlockData;
    /** Spread into BlockWrapper (a JS component whose props TypeScript infers as all required). */
    blockWrapperProps?: any;
};

/** Filters shared by every analytics block of a screen (BxAnalyticsFilter params). */
export type AnalyticsFilterState = {
    range: string;
    /** Platform code, '' for all. */
    platform: string;
    /** dimension => value */
    f: Record<string, string>;
};

export type AnalyticsChip = { name: string; value: string; title: string; label: string };

export type FiltersReport = {
    chips: AnalyticsChip[];
    online: number;
    /** Online window, minutes. */
    window: number;
};

export type AnalyticsKpi = { value: number; previous: number; change: number | null };

export type AnalyticsBucket = 'hour' | 'day' | 'week' | 'month';

/** One chart bucket: `t` is the bucket's local start (unix seconds), plus every metric. */
export type AnalyticsPoint = {
    t: number;
    future: boolean;
    partial: boolean;
    [metric: string]: number | boolean;
};

export type OverviewReport = {
    kpis: Record<string, AnalyticsKpi>;
    series: AnalyticsPoint[];
    bucket: AnalyticsBucket;
    from: number;
    to: number;
    tz: string;
};

export type TopTab = { name: string; title: string; active: boolean };

export type TopItem = {
    value: string;
    label: string;
    visitors: number;
    pageviews: number;
    /** Percent of all visitors in the list. */
    share: number;
    /** Percent of the largest row, for the bar. */
    bar: number;
};

export type TopReport = {
    group: string;
    tab: string;
    tabs: TopTab[];
    dimension: string;
    column: string;
    items: TopItem[];
};
