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
    /** Revenue reports, optional: NEO translates its own fallbacks. A tile without a value. */
    not_available?: string;
    chart_revenue?: string;
    chart_mrr?: string;
    chart_credits?: string;
    sbs_movement?: string;
    sales_invoices?: string;
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

/*
 * Revenue reports (revenue, subscriptions, sales, credits): BxAnalyticsReports getRevenue,
 * getSubscriptions, getSales and getCredits. AnalyticsReport renders a report's parts by
 * their shape: tiles, charts (kind + datasets), tables (columns + rows) and notes.
 */

/** How a value prints (BxAnalyticsTemplate::formatValue). */
export type ReportValueType = 'label' | 'money' | 'number' | 'percent' | 'credits' | 'decimal' | 'text' | (string & {});

export type ReportMoney = {
    active?: boolean;
    payment?: string;
    /** ISO 4217 code of every amount of the report, e.g. `USD`. */
    code?: string;
    credits_only?: boolean;
};

export type ReportTile = {
    key?: string;
    title: string;
    /** `null`: nothing to measure (a rate without a base). */
    value: number | string | null;
    previous?: number | null;
    change?: number | null;
    type?: ReportValueType;
    /** Decides whether up is good (getTrend). */
    metric?: string;
    /** A note under the value, formatted by UNA. */
    sub?: string;
};

export type ReportDataset = {
    key?: string;
    label: string;
    values: Array<number | null>;
    /** A meaning colour instead of the next one of the palette. */
    tone?: 'good' | 'bad';
    /** A reference line. */
    dashed?: boolean;
    /** Per value: the bucket is still in progress. */
    partial?: boolean[];
};

export type ReportChart = {
    /** `lines` or `stacked` (bars). */
    kind: string;
    /** How the values print: `money`, `number`, ... */
    metric?: string;
    currency?: string;
    /** Bucket starts, unix seconds in `tz`. */
    labels: number[];
    bucket?: AnalyticsBucket;
    tz?: string;
    datasets: ReportDataset[];
};

export type ReportColumn = { key: string; type: ReportValueType; title: string };

export type ReportRow = {
    label: string;
    /** Under the label, e.g. the module of an item. */
    sub?: string;
    /** Absolute UNA URL. */
    link?: string;
    /** Percent of the largest row, for the bar behind the row. */
    bar?: number;
    values: Record<string, number | string | null>;
};

export type ReportTable = {
    name: string;
    caption?: string;
    /** Selected tab; switching asks for the report again with `tab_<name>`. */
    tab?: string;
    tabs?: TopTab[];
    columns: ReportColumn[];
    rows: ReportRow[];
    /** Text when there are no rows. */
    empty?: string;
};

/** A revenue report: `money`, `notes` and any number of named parts. */
export type RevenueReport = {
    money?: ReportMoney;
    /** Credits: false when no installed module keeps credits. */
    available?: boolean;
    title?: string;
    tiles?: ReportTile[];
    notes?: string[];
    [part: string]: unknown;
};
