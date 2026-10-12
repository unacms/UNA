import { useState } from 'react';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import { cn, isWeb } from 'app/lib/util';
import type { AnalyticsElementProps, AnalyticsKpi, AnalyticsStrings, OverviewReport } from './analytics.types';
import { useAnalyticsReport, getStrings } from './use-analytics';
import { fillPlaceholder, formatChange, formatMetric, getTrend, type Trend } from './format';
import { AreaChart } from './area-chart';
import { AnalyticsEmpty, AnalyticsError, AnalyticsSkeleton } from './states';

const TREND_TEXT: Record<Trend, string> = {
    good: 'text-emerald-700 dark:text-emerald-300',
    bad: 'text-rose-700 dark:text-rose-300',
    flat: 'text-muted-foreground',
};

function KpiTile({ metric, title, kpi, selected, strings, onPress }: {
    metric: string;
    title: string;
    kpi: AnalyticsKpi;
    selected: boolean;
    strings: AnalyticsStrings;
    onPress: () => void;
}) {
    const value = formatMetric(metric, kpi.value, strings);
    const change = formatChange(kpi.change);
    const previous = fillPlaceholder(strings.previous_period, formatMetric(metric, kpi.previous, strings));
    const label = [`${title}: ${value}`, change, previous].filter(Boolean).join(', ');

    return (
        <View className="w-1/2 p-1 sm:w-1/3 lg:w-1/6">
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                // Web drops accessibilityState: a toggle, as in the classic UI.
                {...(isWeb ? { 'aria-pressed': selected, title: previous } : {})}
                className={cn(
                    'min-h-11 w-full gap-1 rounded-xl border-2 px-3 py-2',
                    selected ? 'border-primary bg-primary/10' : 'border-transparent bg-muted-foreground/10 web:hover:bg-muted-foreground/20'
                )}
            >
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{title}</Text>
                <View className="flex-row flex-wrap items-baseline gap-x-2">
                    <Text className="text-xl font-semibold text-foreground">{value}</Text>
                    {change ? (
                        <Text className={cn('text-xs font-medium', TREND_TEXT[getTrend(metric, kpi.change)])}>{change}</Text>
                    ) : null}
                </View>
            </Pressable>
        </View>
    );
}

/** Key figures with the change against the previous period, and the selected one over time. */
export default function AnalyticsOverview({ data, blockWrapperProps }: AnalyticsElementProps) {
    const strings = getStrings(data);
    const { report, hidden, isLoading, isError, isUpdating, refetch } = useAnalyticsReport<OverviewReport>(data);
    const [metric, setMetric] = useState('visitors');

    if (hidden) return null;

    const titles = data?.metrics ?? {};
    const kpis = report?.kpis ?? {};
    const metrics = Object.keys(kpis);
    const selected = kpis[metric] ? metric : (metrics[0] ?? 'visitors');
    const series = Array.isArray(report?.series) ? report.series : [];
    const hasData = series.some((point) => !point.future && Number(point.visitors) > 0) || Number(kpis.visitors?.value) > 0;

    let content;
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
        content = (
            <View className={cn('w-full gap-4', isUpdating && 'opacity-60')} aria-busy={isUpdating}>
                <View className="-m-1 flex-row flex-wrap" role="group" accessibilityLabel={strings.key_figures}>
                    {metrics.map((name) => {
                        const kpi = kpis[name];
                        return kpi ? (
                            <KpiTile
                                key={name}
                                metric={name}
                                title={titles[name] ?? name}
                                kpi={kpi}
                                selected={name === selected}
                                strings={strings}
                                onPress={() => setMetric(name)}
                            />
                        ) : null;
                    })}
                </View>
                {hasData ? (
                    <AreaChart
                        series={series}
                        metric={selected}
                        metricTitle={titles[selected] ?? selected}
                        bucket={report.bucket}
                        tz={report.tz}
                        strings={strings}
                    />
                ) : (
                    <AnalyticsEmpty text={strings.no_data} />
                )}
                {isError ? <AnalyticsError text={strings.error} onRetry={refetch} /> : null}
            </View>
        );
    }

    return <BlockWrapper {...blockWrapperProps}>{content}</BlockWrapper>;
}
