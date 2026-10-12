// Number, percent and duration formatting as the classic UI does it
// (BxAnalyticsTemplate::formatValue and js/dashboard.js formatMetric).
// Hand-written instead of Intl, so web, iOS and Android print the same.
import type { AnalyticsStrings } from './analytics.types';

type DurationStrings = Pick<AnalyticsStrings, 'duration_h' | 'duration_m' | 'duration_s'>;

const COMPACT: ReadonlyArray<readonly [number, string]> = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
];

function groupThousands(value: number): string {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function trimZeros(value: string): string {
    return value.includes('.') ? value.replace(/\.?0+$/, '') : value;
}

/** 950, 9.5K, 95K, 1.2M */
export function formatNumber(value: unknown): string {
    const n = Math.trunc(Number(value) || 0);
    for (const [size, suffix] of COMPACT) {
        if (n >= size) {
            const f = n / size;
            return (f < 10 ? trimZeros(f.toFixed(1)) : groupThousands(Math.floor(f))) + suffix;
        }
    }
    return String(n);
}

export function formatPercent(value: unknown): string {
    const n = Number(value) || 0;
    return (Math.abs(n) < 10 && Math.round(n) !== n ? n.toFixed(1) : String(Math.round(n))) + '%';
}

export function formatDuration(value: unknown, strings: DurationStrings): string {
    const s = Math.round(Number(value) || 0);
    if (s < 60) return s + strings.duration_s;
    if (s < 3600) return Math.floor(s / 60) + strings.duration_m + ' ' + (s % 60) + strings.duration_s;
    return Math.floor(s / 3600) + strings.duration_h + ' ' + Math.floor((s % 3600) / 60) + strings.duration_m;
}

/** A metric value for a key figure or a list. */
export function formatMetric(metric: string, value: unknown, strings: DurationStrings): string {
    if (value === null || value === undefined || value === '') return '';
    switch (metric) {
        case 'bounce_rate':
            return formatPercent(value);
        case 'pages_per_session':
            return (Number(value) || 0).toFixed(1);
        case 'duration':
            return formatDuration(value, strings);
        default:
            return formatNumber(value);
    }
}

/** A chart axis tick (the classic chart rounds rates to whole percent). */
export function formatAxis(metric: string, value: number, strings: DurationStrings): string {
    if (metric === 'bounce_rate') return Math.round(value) + '%';
    return formatMetric(metric, value, strings);
}

/** +12%, -3.4%, '' when there is nothing to compare with. */
export function formatChange(change: number | null | undefined): string {
    if (change === null || change === undefined) return '';
    const small = Math.abs(change) < 10;
    const text = small ? change.toFixed(1) : groupThousands(Math.abs(Math.round(change)));
    const sign = change > 0 ? '+' : (!small && change < 0 ? '-' : '');
    return sign + text + '%';
}

export type Trend = 'good' | 'bad' | 'flat';

/** Down is good for the bounce rate and errors (BxAnalyticsTemplate::_trend). */
export function getTrend(metric: string, change: number | null | undefined): Trend {
    if (change === null || change === undefined || change === 0) return 'flat';
    const up = change > 0;
    if (metric === 'bounce_rate' || metric === 'errors') return up ? 'bad' : 'good';
    return up ? 'good' : 'bad';
}

/** Fill UNA's `{0}` placeholder (a replacer function, so `$&` in a page title stays as is). */
export function fillPlaceholder(text: string, value: string | number): string {
    return text.replace('{0}', () => String(value));
}

/** The device's IANA timezone, '' when the runtime can't tell (UNA then uses UTC). */
export function getDeviceTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
        return '';
    }
}
