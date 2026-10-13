import { useState } from 'react';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import Tabs from 'app/ui/molecules/tabs/tabs';
import { BlockWrapper } from 'app/components/block-wrapper';
import { cn, isWeb } from 'app/lib/util';
import type { AnalyticsElementProps, AnalyticsStrings, TopItem, TopReport } from './analytics.types';
import { useAnalyticsFilters, useAnalyticsReport, getStrings } from './use-analytics';
import { fillPlaceholder, formatNumber } from './format';
import { AnalyticsEmpty, AnalyticsError, AnalyticsSkeleton } from './states';

function TopRow({ item, strings, onFilter }: { item: TopItem; strings: AnalyticsStrings; onFilter?: () => void }) {
    const visitors = formatNumber(item.visitors);
    const share = `${item.share}%`;
    // Web reads the row's label instead of the cells (the column header is hidden).
    const hideOnWeb = isWeb ? { 'aria-hidden': true } : {};
    const inner = (
        <>
            <View
                className="absolute bottom-0 left-0 top-0 rounded-md bg-primary/10"
                style={{ width: `${Math.max(0, Math.min(100, Number(item.bar) || 0))}%` }}
            />
            <Text className="min-w-0 flex-1 text-sm text-foreground" numberOfLines={1} {...hideOnWeb}>{item.label}</Text>
            <Text className="shrink-0 text-sm font-medium text-foreground" {...hideOnWeb}>{visitors}</Text>
            <Text className="w-12 shrink-0 text-right text-xs text-muted-foreground" {...hideOnWeb}>{share}</Text>
        </>
    );
    const rowClass = 'relative min-h-11 w-full flex-row items-center gap-3 px-2';

    // Rows without a value (direct visits, "(none)") filter nothing in the classic UI either.
    if (!onFilter) {
        const label = `${item.label}: ${visitors} ${strings.visitors}, ${share}`;
        // A div without a role can't be named on web: the label goes in as hidden text.
        return (
            <View className={rowClass} {...(isWeb ? {} : { accessible: true, accessibilityLabel: label })}>
                {isWeb ? <Text className="sr-only">{label}</Text> : null}
                {inner}
            </View>
        );
    }

    const filterBy = fillPlaceholder(strings.filter_by, item.label);
    return (
        <Pressable
            onPress={onFilter}
            accessibilityRole="button"
            accessibilityLabel={`${filterBy}: ${visitors} ${strings.visitors}, ${share}`}
            {...(isWeb ? { title: filterBy } : {})}
            className={cn(rowClass, 'rounded-md web:hover:bg-muted-foreground/10')}
        >
            {inner}
        </Pressable>
    );
}

/** A top list (pages, sources, locations, devices, platforms) with a tab per dimension. */
export default function AnalyticsTop({ data, blockWrapperProps }: AnalyticsElementProps) {
    const strings = getStrings(data);
    const { addFilter } = useAnalyticsFilters();
    const [tab, setTab] = useState('');
    const { report, hidden, isLoading, isError, isUpdating, refetch } = useAnalyticsReport<TopReport>(data, tab ? { tab } : undefined);

    if (hidden) return null;

    const tabs = Array.isArray(report?.tabs) ? report.tabs : [];
    const items = Array.isArray(report?.items) ? report.items : [];

    let body;
    if (isLoading) {
        body = <AnalyticsSkeleton rows={5} />;
    } else if (!report) {
        body = isError ? <AnalyticsError text={strings.error} onRetry={refetch} /> : null;
    } else if (!items.length) {
        body = <AnalyticsEmpty text={strings.no_data} />;
    } else {
        body = (
            <View className="w-full">
                <Row className="w-full items-center gap-3 px-2 pb-1" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Text className="flex-1 text-xs font-medium uppercase text-muted-foreground" numberOfLines={1}>{report.column}</Text>
                    <Text className="text-xs font-medium uppercase text-muted-foreground" numberOfLines={1}>{strings.visitors}</Text>
                </Row>
                <View className="w-full gap-0.5" role="list">
                    {items.map((item, i) => (
                        <View key={`${item.value}-${i}`} role="listitem">
                            <TopRow
                                item={item}
                                strings={strings}
                                onFilter={item.value !== '' ? () => addFilter(report.dimension, item.value) : undefined}
                            />
                        </View>
                    ))}
                </View>
                {isError ? <AnalyticsError text={strings.error} onRetry={refetch} /> : null}
            </View>
        );
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-3">
                {tabs.length > 1 ? (
                    <Tabs
                        tabs={tabs.map((item) => ({ key: item.name, title: item.title }))}
                        activeTab={tab || report?.tab}
                        onTabChange={setTab}
                        // in a narrow column (the right bar) the tabs that don't fit go into "More"
                        overflow="collapse"
                        hug
                        equalWidth={false}
                        triggerClassName="native:min-h-11"
                    />
                ) : null}
                <View className={cn('w-full', isUpdating && 'opacity-60')} aria-busy={isUpdating}>
                    {body}
                </View>
            </View>
        </BlockWrapper>
    );
}
