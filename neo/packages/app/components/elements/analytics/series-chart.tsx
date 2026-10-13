import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useTheme, useThemeValue } from 'app/design/theme';
import { cn, isWeb, useDateLocaleTag } from 'app/lib/util';
import type { ReportChart, ReportDataset } from './analytics.types';
import { formatCredits, formatReportAxis, formatReportValue, getDeviceTimezone } from './format';
import { curve, formatBucket, niceStep, tangents, type Point } from './area-chart';

const HEIGHT = 200;
const PAD_TOP = 8;
const AXIS_HEIGHT = 22;
const PAD_RIGHT = 8;
const X_LABEL_WIDTH = 72;
const BAR_MAX = 28;

/** Series colours, in order: the chart tokens (palette.css). */
const PALETTE_SIZE = 6;
const SWATCH: Record<string, string> = {
    'chart-1': 'bg-chart-1',
    'chart-2': 'bg-chart-2',
    'chart-3': 'bg-chart-3',
    'chart-4': 'bg-chart-4',
    'chart-5': 'bg-chart-5',
    'chart-6': 'bg-chart-6',
    good: 'bg-emerald-600 dark:bg-emerald-400',
    bad: 'bg-destructive',
};
/** Native, when Uniwind can't read a token: the palette.css values. */
const FALLBACK_LIGHT = ['#2563eb', '#0891b2', '#d97706', '#db2777', '#16a34a', '#7c3aed'];
const FALLBACK_DARK = ['#60a5fa', '#67e8f9', '#fcd34d', '#f9a8d4', '#86efac', '#c4b5fd'];
const TOKENS = ['--color-chart-1', '--color-chart-2', '--color-chart-3', '--color-chart-4', '--color-chart-5', '--color-chart-6', '--color-border', '--color-muted-foreground', '--color-destructive'];

/** The colour name of a series: its tone, or the next one of the palette. */
function seriesColor(dataset: ReportDataset, index: number): string {
    if (dataset.tone === 'good' || dataset.tone === 'bad') return dataset.tone;
    return `chart-${(index % PALETTE_SIZE) + 1}`;
}

function useSeriesColors() {
    const { colors } = useTheme();
    const values = useCSSVariable(TOKENS);
    const fallback = useThemeValue(FALLBACK_LIGHT, FALLBACK_DARK);
    const good = useThemeValue('#059669', '#34d399');
    const bad = '#e11d48';
    if (isWeb) {
        return {
            series: (name: string): ColorValue => (name === 'good' ? good : name === 'bad' ? 'rgb(var(--destructive))' : `rgb(var(--${name}))`),
            grid: 'rgb(var(--border))',
            guide: 'rgb(var(--muted-foreground))',
        };
    }
    const pick = (value: string | number | undefined, other: ColorValue): ColorValue => (typeof value === 'string' && value ? value : other);
    return {
        series: (name: string): ColorValue => {
            if (name === 'good') return good;
            if (name === 'bad') return pick(values[8], bad);
            const i = Number(name.replace('chart-', '')) - 1;
            return pick(values[i], fallback[i] ?? colors.primary);
        },
        grid: pick(values[6], colors.border),
        guide: pick(values[7], colors.text),
    };
}

export type SeriesChartProps = {
    chart: ReportChart;
    title: string;
    /** The report's currency, when the chart doesn't name one. */
    currency?: string;
};

/**
 * Several series over time, like the classic revenue charts: lines (kind `lines`) or stacked
 * bars (kind `stacked`), with a legend. Touch or hover shows a bucket's values in the legend;
 * screen readers get every value as text.
 */
export function SeriesChart({ chart, title, currency: reportCurrency }: SeriesChartProps) {
    const { t } = useTranslation();
    const locale = useDateLocaleTag();
    const colors = useSeriesColors();
    const [width, setWidth] = useState(0);
    const [active, setActive] = useState<number | null>(null);

    const stacked = chart.kind === 'stacked';
    const type = chart.metric || 'number';
    const currency = chart.currency || reportCurrency;
    const bucket = chart.bucket || 'day';
    const datasets = chart.datasets.filter((dataset) => Array.isArray(dataset.values));
    const n = chart.labels.length;
    const utc = (chart.tz || 'UTC') !== getDeviceTimezone();
    const labels = chart.labels.map((time) => formatBucket(time, bucket, utc, t, locale));
    // a value, '' for none; counts keep their fractions (credits are amounts)
    const format = (value: number | null | undefined) => (value === null || value === undefined
        ? ''
        : type === 'number' ? formatCredits(value) : formatReportValue(type, value, currency, locale));

    // buckets after now have no values (null): the chart and its text stop at the last one
    let last = -1;
    for (let i = 0; i < n; i++) {
        if (datasets.some((dataset) => dataset.values[i] !== null && dataset.values[i] !== undefined)) last = i;
    }

    const summary = `${title}. ` + datasets
        .map((dataset) => `${dataset.label}: ` + labels.slice(0, last + 1)
            .map((label, i): [string, string] => [label, format(dataset.values[i])])
            .filter(([, text]) => text !== '')
            .map(([label, text]) => `${label} ${text}`)
            .join(', '))
        .join('. ');

    // the scale: the largest and smallest value (net revenue goes below zero), or the largest stack
    let max = 0;
    let min = 0;
    for (let i = 0; i < n; i++) {
        if (stacked) {
            max = Math.max(max, datasets.reduce((sum, dataset) => sum + Math.max(0, Number(dataset.values[i]) || 0), 0));
        } else {
            for (const dataset of datasets) {
                const value = Number(dataset.values[i]) || 0;
                max = Math.max(max, value);
                min = Math.min(min, value);
            }
        }
    }
    const decimals = type === 'money' && max - min < 4 ? 2 : 0;
    const step = niceStep(max - min, decimals);
    const yMin = Math.floor(min / step) * step;
    const yMax = Math.max(yMin + step, Math.ceil(max / step) * step);
    // rounded, so 0.1 steps don't drift into 0.30000000000000004
    const ticks = Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, i) => Number((yMin + i * step).toFixed(decimals)));
    // money ticks keep their cents when the step has them ($0.50, $1.00)
    const tickLabels = ticks.map((tick) => formatReportAxis(type, tick, currency, locale, step < 1 ? decimals : 0));
    const gutter = Math.min(80, Math.max(36, Math.max(...tickLabels.map((label) => label.length)) * 7.5 + 10));

    const plotWidth = Math.max(0, width - gutter - PAD_RIGHT);
    const plotHeight = HEIGHT - PAD_TOP - AXIS_HEIGHT;
    const baseline = PAD_TOP + plotHeight;
    // bars sit in bands, line points on the band edges' grid (first and last at the ends)
    const band = n > 0 ? plotWidth / n : 0;
    const xStep = n > 1 ? plotWidth / (n - 1) : 0;
    const xAt = (i: number) => (stacked ? gutter + band * (i + 0.5) : gutter + (n > 1 ? i * xStep : plotWidth / 2));
    const yAt = (value: number) => PAD_TOP + (plotHeight * (yMax - value)) / (yMax - yMin);

    const maxLabels = Math.max(2, Math.floor(plotWidth / X_LABEL_WIDTH));
    const labelEvery = Math.max(1, Math.ceil(n / maxLabels));

    const activeIndex = active !== null && active <= last ? active : null;

    const pick = (x: number) => {
        if (last < 0 || !plotWidth) return;
        const i = stacked ? Math.floor((x - gutter) / (band || 1)) : n > 1 ? Math.round((x - gutter) / xStep) : 0;
        setActive(Math.min(last, Math.max(0, i)));
    };

    const pointerProps = isWeb
        ? {
            // the overlay has no children, so the offset is already relative to it
            onMouseMove: (event: { nativeEvent: { offsetX: number } }) => pick(event.nativeEvent.offsetX),
            onMouseLeave: () => setActive(null),
        }
        : {
            onStartShouldSetResponder: () => true,
            onResponderGrant: (event: { nativeEvent: { locationX: number } }) => pick(event.nativeEvent.locationX),
            onResponderMove: (event: { nativeEvent: { locationX: number } }) => pick(event.nativeEvent.locationX),
            onResponderRelease: () => setActive(null),
            onResponderTerminate: () => setActive(null),
        };

    const lines = stacked ? [] : datasets.map((dataset, d) => {
        const color = colors.series(seriesColor(dataset, d));
        // runs of values without a gap; a null value breaks the line
        let solid = '';
        let dashed = '';
        const dots: Point[] = [];
        let run: Array<{ point: Point; i: number }> = [];
        const flush = () => {
            if (run.length === 1 && run[0]) dots.push(run[0].point);
            const points = run.map((item) => item.point);
            const m = tangents(points);
            for (let k = 1; k < run.length; k++) {
                const a = points[k - 1] as Point;
                const b = points[k] as Point;
                const segment = `M ${a.x} ${a.y} ` + curve(a, b, m[k - 1] ?? 0, m[k] ?? 0) + ' ';
                if (dataset.dashed || dataset.partial?.[run[k]?.i ?? -1]) dashed += segment;
                else solid += segment;
            }
            run = [];
        };
        dataset.values.forEach((value, i) => {
            if (i >= n) return;
            if (value === null || value === undefined) {
                flush();
                return;
            }
            run.push({ point: { x: xAt(i), y: yAt(Number(value) || 0) }, i });
        });
        flush();
        return { key: dataset.key ?? String(d), color, solid, dashed, dots };
    });

    const barWidth = Math.max(2, Math.min(BAR_MAX, band * 0.6));
    const bars = stacked ? chart.labels.map((_, i) => {
        let top = 0;
        return datasets.map((dataset, d) => {
            const value = Math.max(0, Number(dataset.values[i]) || 0);
            const y0 = yAt(top);
            top += value;
            const y1 = yAt(top);
            return { key: `${i}-${d}`, x: xAt(i) - barWidth / 2, y: y1, height: Math.max(0, y0 - y1), color: colors.series(seriesColor(dataset, d)), i };
        }).filter((bar) => bar.height > 0);
    }).flat() : [];

    return (
        <View className="w-full gap-2">
            <Row className="min-h-5 items-center justify-between gap-2" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text className="min-w-0 flex-1 text-sm font-medium text-foreground" numberOfLines={1}>{title}</Text>
                {activeIndex !== null ? (
                    <Text className="shrink-0 text-sm text-muted-foreground" numberOfLines={1}>{labels[activeIndex]}</Text>
                ) : null}
            </Row>
            <View
                className="relative w-full"
                style={{ height: HEIGHT }}
                onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
                accessible
                role="img"
                accessibilityLabel={summary}
            >
                {width > 0 ? (
                    <Svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
                        {ticks.map((tick) => (
                            <Line key={tick} x1={gutter} x2={width - PAD_RIGHT} y1={yAt(tick)} y2={yAt(tick)} stroke={colors.grid} strokeWidth={1} />
                        ))}
                        {bars.map((bar) => (
                            <Rect
                                key={bar.key}
                                x={bar.x}
                                y={bar.y}
                                width={barWidth}
                                height={bar.height}
                                fill={bar.color}
                                fillOpacity={activeIndex === null || activeIndex === bar.i ? 1 : 0.45}
                            />
                        ))}
                        {activeIndex !== null && !stacked ? (
                            <Line x1={xAt(activeIndex)} x2={xAt(activeIndex)} y1={PAD_TOP} y2={baseline} stroke={colors.guide} strokeWidth={1} strokeDasharray="2 3" />
                        ) : null}
                        {lines.map((line) => (line.solid ? (
                            <Path key={`${line.key}-s`} d={line.solid} stroke={line.color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        ) : null))}
                        {lines.map((line) => (line.dashed ? (
                            <Path key={`${line.key}-d`} d={line.dashed} stroke={line.color} strokeWidth={2} fill="none" strokeDasharray="4 4" strokeLinecap="round" />
                        ) : null))}
                        {lines.map((line) => line.dots.map((dot, k) => (
                            <Circle key={`${line.key}-o${k}`} cx={dot.x} cy={dot.y} r={3} fill={line.color} />
                        )))}
                        {activeIndex !== null && !stacked ? datasets.map((dataset, d) => {
                            const value = dataset.values[activeIndex];
                            if (value === null || value === undefined) return null;
                            return <Circle key={`a${d}`} cx={xAt(activeIndex)} cy={yAt(Number(value) || 0)} r={4} fill={colors.series(seriesColor(dataset, d))} />;
                        }) : null}
                    </Svg>
                ) : null}
                {width > 0 ? ticks.map((tick, i) => (
                    <Text
                        key={tick}
                        className="absolute text-right text-xs text-muted-foreground"
                        style={{ left: 0, width: gutter - 8, top: yAt(tick) - 8 }}
                        numberOfLines={1}
                    >
                        {tickLabels[i]}
                    </Text>
                )) : null}
                {width > 0 ? labels.map((label, i) => (i % labelEvery ? null : (
                    <Text
                        key={i}
                        className="absolute text-center text-xs text-muted-foreground"
                        style={{
                            left: Math.min(Math.max(0, xAt(i) - X_LABEL_WIDTH / 2), width - X_LABEL_WIDTH),
                            width: X_LABEL_WIDTH,
                            top: baseline + 4,
                        }}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                ))) : null}
                <View
                    className="absolute inset-0"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...pointerProps}
                />
            </View>
            <Row className="flex-wrap gap-x-4 gap-y-1" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {datasets.map((dataset, d) => (
                    <Row key={dataset.key ?? d} className="min-h-5 items-center gap-1.5">
                        <View className={cn('h-2.5 w-2.5 rounded-sm', SWATCH[seriesColor(dataset, d)])} />
                        <Text className="text-xs text-muted-foreground">{dataset.label}</Text>
                        {activeIndex !== null && format(dataset.values[activeIndex]) ? (
                            <Text className="text-xs font-medium text-foreground">{format(dataset.values[activeIndex])}</Text>
                        ) : null}
                    </Row>
                ))}
            </Row>
        </View>
    );
}
