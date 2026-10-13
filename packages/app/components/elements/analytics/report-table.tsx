import { useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import Tabs from 'app/ui/molecules/tabs/tabs';
import { cn, isWeb, useDateLocaleTag } from 'app/lib/util';
import { UNA_URL } from 'app/config';
import type { ReportColumn, ReportRow, ReportTable as ReportTableData } from './analytics.types';
import { formatReportValue } from './format';
import { AnalyticsEmpty } from './states';

/** Room of a value column, and the least the label keeps beside them. */
const VALUE_WIDTH = 96;
const LABEL_MIN = 160;
const GAP = 12;

/** A section heading inside a block (h3 on web, a header on native). */
export function ReportHeading({ children }: { children: string }) {
    return (
        <Text
            className="text-sm font-semibold text-foreground"
            {...(isWeb ? { role: 'heading', 'aria-level': 3 } : { accessibilityRole: 'header' as const })}
        >
            {children}
        </Text>
    );
}

/**
 * UNA's own pages as app routes: an absolute UNA_URL link becomes root-relative, the way
 * clearLinks does it for HTML. Links to other hosts stay as they are (and open outside).
 */
export function toAppHref(link: string): string {
    const strip = (url: string) => url.replace(/^https?:/i, '');
    const base = strip(UNA_URL).toLowerCase();
    const rest = strip(link);
    if (!base.startsWith('//') || rest.slice(0, base.length).toLowerCase() !== base) return link;
    const path = rest.slice(base.length);
    if (path === '') return '/';
    // a longer host that only starts the same (una.example.com.other) isn't UNA
    if (!/^[/?#]/.test(path)) return link;
    return path.startsWith('/') ? path : `/${path}`;
}

type Cell = { column: ReportColumn; text: string };

function TableRow({ row, cells, inline, label }: { row: ReportRow; cells: Cell[]; inline: Cell[]; label: string }) {
    // Web reads the row's label instead of the cells (the column header is hidden).
    const hideOnWeb = isWeb ? { 'aria-hidden': true } : {};
    const inner = (
        <>
            <View
                className="absolute bottom-0 left-0 top-0 rounded-md bg-primary/10"
                style={{ width: `${Math.max(0, Math.min(100, Number(row.bar) || 0))}%` }}
            />
            <View className="min-w-0 flex-1 py-1.5" {...hideOnWeb}>
                <Text className={cn('text-sm text-foreground', row.link && 'web:group-hover:underline')} numberOfLines={2}>{row.label}</Text>
                {row.sub ? <Text className="text-xs text-muted-foreground" numberOfLines={1}>{row.sub}</Text> : null}
                {inline.length ? (
                    <Text className="text-xs text-muted-foreground">
                        {inline.map((cell) => `${cell.column.title} ${cell.text}`).join(' · ')}
                    </Text>
                ) : null}
            </View>
            {cells.map((cell, i) => (
                <Text
                    key={cell.column.key}
                    className={cn('shrink-0 text-right text-sm', i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}
                    style={{ width: VALUE_WIDTH }}
                    numberOfLines={1}
                    {...hideOnWeb}
                >
                    {cell.text}
                </Text>
            ))}
        </>
    );
    const rowClass = 'relative min-h-11 w-full flex-row items-center gap-3 px-2';

    if (row.link) {
        return (
            <Link href={toAppHref(row.link)} alt={label} className="group block w-full rounded-md web:hover:bg-muted-foreground/10">
                <View className={rowClass}>{inner}</View>
            </Link>
        );
    }

    // A div without a role can't be named on web: the label goes in as hidden text.
    return (
        <View className={rowClass} {...(isWeb ? {} : { accessible: true, accessibilityLabel: label })}>
            {isWeb ? <Text className="sr-only">{label}</Text> : null}
            {inner}
        </View>
    );
}

export type ReportTableProps = {
    table: ReportTableData;
    /** The report's currency for money columns. */
    currency?: string;
    /** Text when the table has no rows and says nothing itself. */
    noData: string;
    /** The tab the viewer picked, '' for the report's own. */
    tab: string;
    onTabChange: (tab: string) => void;
    /** Show the caption as a heading (off when the block title already says it). */
    showCaption?: boolean;
};

/**
 * A table of a revenue report: caption, optional switcher tabs, rows with a share bar.
 * A narrow block shows the label and the first value; the other values go under the label.
 */
export function ReportTable({ table, currency, noData, tab, onTabChange, showCaption = true }: ReportTableProps) {
    const locale = useDateLocaleTag();
    const [width, setWidth] = useState(0);

    const columns = Array.isArray(table.columns) ? table.columns : [];
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const tabs = Array.isArray(table.tabs) ? table.tabs : [];
    const values = columns.filter((column) => column.type !== 'label');
    const labelColumn = columns.find((column) => column.type === 'label');

    // every column in a row when they fit; before the first measurement, the narrow layout
    const wide = width > 0 && width - LABEL_MIN >= values.length * (VALUE_WIDTH + GAP);
    const shown = wide ? values : values.slice(0, 1);
    const moved = wide ? [] : values.slice(1);

    const rowCells = (row: ReportRow): Cell[] => values.map((column) => ({
        column,
        text: formatReportValue(column.type, row.values?.[column.key], currency, locale),
    }));

    return (
        <View className="w-full gap-2">
            {showCaption && table.caption ? <ReportHeading>{table.caption}</ReportHeading> : null}
            {tabs.length > 1 ? (
                <Tabs
                    tabs={tabs.map((item) => ({ key: item.name, title: item.title }))}
                    activeTab={tab || table.tab || tabs.find((item) => item.active)?.name}
                    onTabChange={onTabChange}
                    overflow="collapse"
                    hug
                    equalWidth={false}
                    triggerClassName="native:min-h-11"
                />
            ) : null}
            <View className="w-full" onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
                {!rows.length ? (
                    <AnalyticsEmpty text={table.empty || noData} />
                ) : (
                    <>
                        <Row className="w-full items-end gap-3 px-2 pb-1" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                            <Text className="min-w-0 flex-1 text-xs font-medium uppercase text-muted-foreground" numberOfLines={1}>{labelColumn?.title ?? ''}</Text>
                            {shown.map((column) => (
                                <Text key={column.key} className="shrink-0 text-right text-xs font-medium uppercase text-muted-foreground" style={{ width: VALUE_WIDTH }} numberOfLines={2}>
                                    {column.title}
                                </Text>
                            ))}
                        </Row>
                        <View className="w-full gap-0.5" role="list" accessibilityLabel={table.caption}>
                            {rows.map((row, i) => {
                                const cells = rowCells(row);
                                const name = row.sub ? `${row.label} (${row.sub})` : row.label;
                                const label = `${name}: ` + cells.filter((cell) => cell.text !== '').map((cell) => `${cell.column.title} ${cell.text}`).join(', ');
                                return (
                                    <View key={`${row.label}-${i}`} role="listitem">
                                        <TableRow
                                            row={row}
                                            cells={cells.slice(0, shown.length)}
                                            inline={cells.slice(shown.length).filter((cell) => cell.text !== '' && moved.length > 0)}
                                            label={label}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}
