import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useTheme } from 'app/design/theme';
import { formatDate, getMonthName, isWeb, useDateLocaleTag } from 'app/lib/util';
import type { AnalyticsBucket, AnalyticsPoint, AnalyticsStrings } from './analytics.types';
import { formatAxis, formatMetric, getDeviceTimezone } from './format';

const HEIGHT = 200;
const PAD_TOP = 8;
const AXIS_HEIGHT = 22;
const GUTTER = 48;
const PAD_RIGHT = 8;
const X_LABEL_WIDTH = 72;
const Y_TICKS = 4;
/** Decimals an axis tick prints (formatAxis); every other metric prints whole numbers. */
const AXIS_DECIMALS: Record<string, number> = { pages_per_session: 1 };

export type Point = { x: number; y: number };

export type AreaChartProps = {
    series: AnalyticsPoint[];
    metric: string;
    metricTitle: string;
    bucket: AnalyticsBucket;
    /** The report's timezone (OverviewReport.tz). */
    tz: string;
    strings: AnalyticsStrings;
};

/**
 * Bucket start as a label. Buckets are local starts in the report's timezone: the device's
 * (see useAnalyticsReport), or UTC when UNA doesn't know the zone the device sent (`utc`).
 * Then the date is shifted so local Date getters read the UTC wall time.
 */
export function formatBucket(t: number, bucket: AnalyticsBucket, utc: boolean, translate: TFunction, locale: string): string {
    const date = new Date(t * 1000);
    if (utc) date.setTime((t + date.getTimezoneOffset() * 60) * 1000);
    if (bucket === 'hour') return formatDate(date, translate, { showDate: false, showTime: true, locale });
    if (bucket === 'month') return `${getMonthName(translate, date.getMonth())} ${date.getFullYear()}`;
    return formatDate(date, translate, { month: 'short', yearPolicy: 'never', locale });
}

/** A 1/2/2.5/5 step that the axis prints exactly with `decimals` digits. */
export function niceStep(max: number, decimals: number): number {
    if (max <= 0) return 1;
    const min = Math.pow(10, -decimals);
    const raw = max / Y_TICKS;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / power;
    // 2.5 needs one more digit than its power of ten
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 && power > min ? 2.5 : n <= 5 ? 5 : 10) * power;
    return Math.max(min, step);
}

/** Monotone cubic tangents (Fritsch-Carlson): a smooth line that never overshoots a value. */
export function tangents(points: Point[]): number[] {
    const n = points.length;
    const slopes: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        const a = points[i] as Point;
        const b = points[i + 1] as Point;
        slopes.push(b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x));
    }
    const m: number[] = points.map((_, i) => {
        if (i === 0) return slopes[0] ?? 0;
        if (i === n - 1) return slopes[n - 2] ?? 0;
        const prev = slopes[i - 1] ?? 0;
        const next = slopes[i] ?? 0;
        return prev * next <= 0 ? 0 : (prev + next) / 2;
    });
    for (let i = 0; i < n - 1; i++) {
        const d = slopes[i] ?? 0;
        if (d === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
        }
        const a = (m[i] ?? 0) / d;
        const b = (m[i + 1] ?? 0) / d;
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            m[i] = k * a * d;
            m[i + 1] = k * b * d;
        }
    }
    return m;
}

export function curve(a: Point, b: Point, ma: number, mb: number): string {
    const dx = (b.x - a.x) / 3;
    return `C ${a.x + dx} ${a.y + ma * dx} ${b.x - dx} ${b.y - mb * dx} ${b.x} ${b.y}`;
}

function useChartColors() {
    const { colors } = useTheme();
    const [primary, border, muted] = useCSSVariable(['--color-primary', '--color-border', '--color-muted-foreground']);
    if (isWeb) return { line: 'var(--color-primary)', grid: 'var(--color-border)', guide: 'var(--color-muted-foreground)' };
    const pick = (value: string | number | undefined, fallback: ColorValue): ColorValue => (typeof value === 'string' && value ? value : fallback);
    return {
        line: pick(primary, colors.primary),
        grid: pick(border, colors.border),
        guide: pick(muted, colors.text),
    };
}

/**
 * One metric over the period as an area chart, like the classic overview chart: the
 * bucket still filling up ("now") is drawn dashed, future buckets are left empty.
 * Touch or hover shows a bucket's value; screen readers get every value as text.
 */
export function AreaChart({ series, metric, metricTitle, bucket, tz, strings }: AreaChartProps) {
    const { t } = useTranslation();
    const locale = useDateLocaleTag();
    const colors = useChartColors();
    const [width, setWidth] = useState(0);
    const [active, setActive] = useState<number | null>(null);

    const values = series.map((point) => (point.future ? null : Number(point[metric]) || 0));
    let last = -1;
    values.forEach((value, i) => {
        if (value !== null) last = i;
    });
    const utc = tz !== getDeviceTimezone();
    const labels = series.map((point) => formatBucket(point.t, bucket, utc, t, locale));

    const summary = `${metricTitle}: ` + values
        .slice(0, last + 1)
        .map((value, i) => `${labels[i]} ${formatMetric(metric, value, strings)}`)
        .join(', ');

    const max = Math.max(0, ...values.map((value) => value ?? 0));
    const step = niceStep(max, AXIS_DECIMALS[metric] ?? 0);
    const yMax = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

    const plotWidth = Math.max(0, width - GUTTER - PAD_RIGHT);
    const plotHeight = HEIGHT - PAD_TOP - AXIS_HEIGHT;
    const baseline = PAD_TOP + plotHeight;
    const n = series.length;
    const xStep = n > 1 ? plotWidth / (n - 1) : 0;
    const xAt = (i: number) => GUTTER + (n > 1 ? i * xStep : plotWidth / 2);
    const yAt = (value: number) => PAD_TOP + plotHeight * (1 - value / yMax);

    const points: Point[] = values.slice(0, last + 1).map((value, i) => ({ x: xAt(i), y: yAt(value ?? 0) }));
    const m = tangents(points);

    let solid = '';
    let dashed = '';
    let solidEnd = -1;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1] as Point;
        const b = points[i] as Point;
        const segment = curve(a, b, m[i - 1] ?? 0, m[i] ?? 0);
        if (series[i]?.partial) {
            dashed += `M ${a.x} ${a.y} ${segment} `;
        } else {
            solid += (solidEnd === i - 1 ? '' : `M ${a.x} ${a.y} `) + segment + ' ';
            solidEnd = i;
        }
    }
    const first = points[0];
    const end = points[points.length - 1];
    let area = '';
    if (first && end && points.length > 1) {
        area = `M ${first.x} ${first.y} `;
        for (let i = 1; i < points.length; i++) area += curve(points[i - 1] as Point, points[i] as Point, m[i - 1] ?? 0, m[i] ?? 0) + ' ';
        area += `L ${end.x} ${baseline} L ${first.x} ${baseline} Z`;
    }

    const maxLabels = Math.max(2, Math.floor(plotWidth / X_LABEL_WIDTH));
    const labelEvery = Math.max(1, Math.ceil(n / maxLabels));

    const activeIndex = active !== null && active <= last ? active : null;
    const activePoint = activeIndex !== null ? points[activeIndex] : undefined;

    const pick = (x: number) => {
        if (last < 0 || !plotWidth) return;
        const i = n > 1 ? Math.round((x - GUTTER) / xStep) : 0;
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
        };

    return (
        <View className="w-full gap-1">
            <Row className="min-h-5 items-center justify-between gap-2" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{metricTitle}</Text>
                {activeIndex !== null ? (
                    <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                        {`${labels[activeIndex]}: ${formatMetric(metric, values[activeIndex], strings)}`}
                    </Text>
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
                            <Line key={tick} x1={GUTTER} x2={width - PAD_RIGHT} y1={yAt(tick)} y2={yAt(tick)} stroke={colors.grid} strokeWidth={1} />
                        ))}
                        {area ? <Path d={area} fill={colors.line} fillOpacity={0.15} /> : null}
                        {solid ? <Path d={solid} stroke={colors.line} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
                        {dashed ? <Path d={dashed} stroke={colors.line} strokeWidth={2} fill="none" strokeDasharray="4 4" strokeLinecap="round" /> : null}
                        {points.length === 1 && first ? <Circle cx={first.x} cy={first.y} r={3} fill={colors.line} /> : null}
                        {activePoint ? (
                            <>
                                <Line x1={activePoint.x} x2={activePoint.x} y1={PAD_TOP} y2={baseline} stroke={colors.guide} strokeWidth={1} strokeDasharray="2 3" />
                                <Circle cx={activePoint.x} cy={activePoint.y} r={4} fill={colors.line} />
                            </>
                        ) : null}
                    </Svg>
                ) : null}
                {width > 0 ? ticks.map((tick) => (
                    <Text
                        key={tick}
                        className="absolute text-right text-xs text-muted-foreground"
                        style={{ left: 0, width: GUTTER - 8, top: yAt(tick) - 8 }}
                        numberOfLines={1}
                    >
                        {formatAxis(metric, tick, strings)}
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
        </View>
    );
}
