import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import { cn, useDateLocaleTag } from 'app/lib/util';
import type { AnalyticsElementProps, AnalyticsStrings, ReportChart, ReportTable as ReportTableData, ReportTile, RevenueReport } from './analytics.types';
import { useAnalyticsReport, getStrings } from './use-analytics';
import { formatChange, formatReportValue, getTrend } from './format';
import { AnalyticsError, AnalyticsSkeleton } from './states';
import { StatTile, getTileWidth, useTileRowWidth } from './tiles';
import { SeriesChart } from './series-chart';
import { ReportHeading, ReportTable } from './report-table';

/** Report fields that are not parts to show (`import` is a Studio action). */
const SKIP = new Set(['money', 'filter', 'import', 'available', 'title']);
/** Two tables side by side from this block width, as the classic columns. */
const COLUMNS_MIN = 720;

function isChart(value: unknown): value is ReportChart {
    const chart = value as ReportChart | null;
    return !!chart && typeof chart === 'object' && typeof chart.kind === 'string' && Array.isArray(chart.datasets) && Array.isArray(chart.labels);
}

function isTable(value: unknown): value is ReportTableData {
    const table = value as ReportTableData | null;
    return !!table && typeof table === 'object' && Array.isArray(table.columns) && Array.isArray(table.rows);
}

function isTiles(value: unknown): value is ReportTile[] {
    return Array.isArray(value) && value.length > 0
        && value.every((tile) => !!tile && typeof tile === 'object' && typeof (tile as ReportTile).title === 'string' && 'value' in tile);
}

function isNotes(value: unknown): value is string[] {
    return Array.isArray(value) && value.length > 0 && value.every((note) => typeof note === 'string');
}

type Part =
    | { kind: 'tiles'; name: string; tiles: ReportTile[] }
    | { kind: 'chart'; name: string; chart: ReportChart }
    | { kind: 'tables'; tables: Array<{ name: string; table: ReportTableData }> }
    | { kind: 'notes'; name: string; notes: string[] };

/** Parts the classic template shows in another order than the report sends them. */
const PART_ORDER: Record<string, string[]> = {
    // credits.html: "What credits paid for" left, top spenders right
    credits: ['spent', 'spenders'],
};

/** The report's entries, with the parts of PART_ORDER swapped into their classic places. */
function getEntries(report: RevenueReport, reportName: string): Array<[string, unknown]> {
    const entries: Array<[string, unknown]> = Object.entries(report);
    const order = PART_ORDER[reportName];
    if (!order) return entries;
    const slots = entries.flatMap(([name], i) => (order.includes(name) ? [i] : []));
    const ordered = order.flatMap((name) => entries.filter(([key]) => key === name));
    slots.forEach((slot, k) => {
        const entry = ordered[k];
        if (entry) entries[slot] = entry;
    });
    return entries;
}

/** The report's parts in their order; tables in a row are kept together for the columns. */
function getParts(report: RevenueReport, reportName: string): Part[] {
    const parts: Part[] = [];
    for (const [name, value] of getEntries(report, reportName)) {
        if (SKIP.has(name)) continue;
        if (name === 'notes') {
            if (isNotes(value)) parts.push({ kind: 'notes', name, notes: value });
        } else if (isTiles(value)) {
            parts.push({ kind: 'tiles', name, tiles: value });
        } else if (isChart(value)) {
            if (value.labels.length && value.datasets.length) parts.push({ kind: 'chart', name, chart: value });
        } else if (isTable(value)) {
            const last = parts[parts.length - 1];
            if (last?.kind === 'tables') last.tables.push({ name, table: value });
            else parts.push({ kind: 'tables', tables: [{ name, table: value }] });
        }
    }
    return parts;
}

function Tiles({ tiles, currency, strings }: { tiles: ReportTile[]; currency?: string; strings: AnalyticsStrings }) {
    const { t } = useTranslation();
    const locale = useDateLocaleTag();
    const { width, onLayout } = useTileRowWidth();
    const widthClass = getTileWidth(width, tiles.length);
    const notAvailable = strings.not_available || t('n/a');

    return (
        <View className="-m-1 flex-row flex-wrap" role="group" accessibilityLabel={strings.key_figures} onLayout={onLayout}>
            {tiles.map((tile, i) => {
                const value = tile.value === null || tile.value === undefined
                    ? notAvailable
                    : formatReportValue(tile.type || 'number', tile.value, currency, locale);
                return (
                    <StatTile
                        key={tile.key ?? `${tile.title}-${i}`}
                        title={tile.title}
                        value={value}
                        change={formatChange(tile.change)}
                        trend={getTrend(tile.metric ?? tile.key ?? '', tile.change)}
                        sub={tile.sub}
                        widthClass={widthClass}
                    />
                );
            })}
        </View>
    );
}

function Notes({ notes }: { notes: string[] }) {
    return (
        <View className="w-full gap-1">
            {notes.map((note, i) => (
                <Text key={i} className="text-xs text-muted-foreground">{note}</Text>
            ))}
        </View>
    );
}

/** Chart titles of the classic templates, by report and part. */
function useChartTitle(report: string, part: string, chart: ReportChart, strings: AnalyticsStrings): string {
    const { t } = useTranslation();
    if (part === 'movement') return strings.sbs_movement || t('New, renewed and cancelled');
    if (report === 'revenue') return strings.chart_revenue || t('Revenue over time');
    if (report === 'subscriptions') return strings.chart_mrr || t('Monthly recurring revenue over time');
    if (report === 'credits') return strings.chart_credits || t('Credits over time');
    return chart.datasets.map((dataset) => dataset.label).join(', ');
}

function ChartPart({ report, name, chart, currency, strings }: { report: string; name: string; chart: ReportChart; currency?: string; strings: AnalyticsStrings }) {
    const title = useChartTitle(report, name, chart, strings);
    return <SeriesChart chart={chart} title={title} currency={currency} />;
}

/**
 * A revenue report (revenue, subscriptions, sales, credits) as the classic block shows it:
 * key figures, charts, tables and notes, in the report's order. Parts are found by their
 * shape, so a report that gains a part shows it without a change here.
 */
export default function AnalyticsReport({ data, blockWrapperProps }: AnalyticsElementProps) {
    const { t } = useTranslation();
    const strings = getStrings(data);
    // the viewer's tab of each table: get_report reads `tab_<table name>`
    const [tabs, setTabs] = useState<Record<string, string>>({});
    const local: Record<string, string> = {};
    for (const [name, tab] of Object.entries(tabs)) if (tab) local[`tab_${name}`] = tab;
    const { report, hidden, isLoading, isError, isUpdating, refetch } = useAnalyticsReport<RevenueReport>(data, local);
    const [width, setWidth] = useState(0);

    // Credits without a module that keeps them: nothing to show.
    if (hidden || report?.available === false) return null;

    const reportName = data?.report ?? '';
    const currency = report?.money?.code;

    let content: ReactNode;
    if (isLoading) {
        content = (
            <View className="w-full gap-4">
                <AnalyticsSkeleton rows={2} />
                <View className="h-48 w-full rounded-xl bg-muted" />
            </View>
        );
    } else if (!report) {
        content = isError ? <AnalyticsError text={strings.error} onRetry={refetch} /> : null;
    } else {
        const columns = width >= COLUMNS_MIN;
        content = (
            <View
                className={cn('w-full gap-6', isUpdating && 'opacity-60')}
                aria-busy={isUpdating}
                onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
            >
                {getParts(report, reportName).map((part, i) => {
                    switch (part.kind) {
                        case 'tiles':
                            return (
                                <View key={part.name} className="w-full gap-2">
                                    {part.name === 'invoices' ? <ReportHeading>{strings.sales_invoices || t('Commission invoices issued in this period')}</ReportHeading> : null}
                                    <Tiles tiles={part.tiles} currency={currency} strings={strings} />
                                </View>
                            );
                        case 'chart':
                            return <ChartPart key={part.name} report={reportName} name={part.name} chart={part.chart} currency={currency} strings={strings} />;
                        case 'notes':
                            return <Notes key={part.name} notes={part.notes} />;
                        case 'tables':
                            return (
                                <View key={`tables-${i}`} className={cn('w-full gap-6', columns && 'flex-row items-start')}>
                                    {part.tables.map(({ name, table }) => (
                                        <View key={name} className={columns && part.tables.length > 1 ? 'min-w-0 flex-1' : 'w-full'}>
                                            <ReportTable
                                                table={table}
                                                currency={currency}
                                                noData={strings.no_data}
                                                tab={tabs[table.name || name] ?? ''}
                                                onTabChange={(tab) => setTabs((prev) => ({ ...prev, [table.name || name]: tab }))}
                                            />
                                        </View>
                                    ))}
                                </View>
                            );
                        default:
                            return null;
                    }
                })}
                {isError ? <AnalyticsError text={strings.error} onRetry={refetch} /> : null}
            </View>
        );
    }

    return <BlockWrapper {...blockWrapperProps}>{content}</BlockWrapper>;
}
