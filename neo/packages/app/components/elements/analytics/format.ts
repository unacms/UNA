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

function groupThousands(value: number | string): string {
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

/** Metrics where a rise is bad news (BxAnalyticsTemplate::_trend). */
const DOWN_IS_GOOD = new Set(['bounce_rate', 'errors', 'refunds', 'cancelled', 'churn']);

/** Down is good for the bounce rate, errors, refunds, cancellations and churn. */
export function getTrend(metric: string, change: number | null | undefined): Trend {
    if (change === null || change === undefined || change === 0) return 'flat';
    const up = change > 0;
    if (DOWN_IS_GOOD.has(metric)) return up ? 'bad' : 'good';
    return up ? 'good' : 'bad';
}

const moneyFormatters = new Map<string, Intl.NumberFormat | null>();

/** How an amount is printed: with cents, whole, or compact ($12K). */
type MoneyStyle = 'cents' | 'whole' | 'compact';

function getMoneyFormatter(currency: string, locale: string, style: MoneyStyle): Intl.NumberFormat | null {
    const key = `${locale}|${currency}|${style}`;
    if (moneyFormatters.has(key)) return moneyFormatters.get(key) ?? null;
    let formatter: Intl.NumberFormat | null = null;
    const base: Intl.NumberFormatOptions = style === 'whole'
        ? { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }
        : style === 'compact'
            ? { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1, minimumFractionDigits: 0 }
            : { style: 'currency', currency };
    // $ rather than US$ in every locale, as UNA prints it: a report has one currency
    const attempts: Array<[string | undefined, Intl.NumberFormatOptions]> = [
        [locale || undefined, { ...base, currencyDisplay: 'narrowSymbol' }],
        [locale || undefined, base],
        [undefined, base],
    ];
    for (const [tag, options] of attempts) {
        try {
            formatter = new Intl.NumberFormat(tag, options);
            break;
        } catch {
            // an unknown locale tag or display option; then an unknown currency code or no Intl
        }
    }
    moneyFormatters.set(key, formatter);
    return formatter;
}

/** Signs of common currencies, as UNA prints them. */
const CURRENCY_SIGNS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', RUB: '₽', INR: '₹', KRW: '₩', UAH: '₴', TRY: '₺', ILS: '₪', NGN: '₦', PHP: '₱', VND: '₫', PLN: 'zł', BRL: 'R$',
};

/**
 * Hermes on iOS accepts currencyDisplay narrowSymbol but still prints the code (USD 183.15):
 * put the sign in its place when we know it, so NEO matches UNA's own amounts.
 */
function withSign(text: string, code: string): string {
    const sign = CURRENCY_SIGNS[code];
    if (!sign || !text.includes(code)) return text;
    return text
        .replace(new RegExp(`${code}[\\s\\u00a0]?-`), `-${sign}`)
        .replace(new RegExp(`${code}[\\s\\u00a0]?(?=\\d)`), sign)
        .replace(new RegExp(`(\\d)[\\s\\u00a0]?${code}`), `$1 ${sign}`);
}

/**
 * An amount in the report's currency: $1,234.50. `whole` drops the cents (axis ticks).
 * Falls back to `1,234.50 USD` when the runtime can't format the currency.
 */
export function formatMoney(value: unknown, currency: string | undefined, locale: string, whole = false): string {
    const n = Number(value) || 0;
    const code = (currency || '').toUpperCase();
    const formatter = /^[A-Z]{3}$/.test(code) ? getMoneyFormatter(code, locale, whole ? 'whole' : 'cents') : null;
    if (formatter) return withSign(formatter.format(n), code);
    const fixed = whole ? String(Math.round(Math.abs(n))) : Math.abs(n).toFixed(2);
    const [int = '0', frac] = fixed.split('.');
    const text = (n < 0 ? '-' : '') + groupThousands(int) + (frac ? '.' + frac : '');
    return code ? `${text} ${code}` : text;
}

/** Credits: up to two decimals, no trailing zeros, thousands grouped. */
export function formatCredits(value: unknown): string {
    const [int = '0', frac] = (Number(value) || 0).toFixed(2).split('.');
    return trimZeros(groupThousands(int) + '.' + (frac ?? '00'));
}

/** A typed report value (BxAnalyticsTemplate::formatValue), '' for no value. */
export function formatReportValue(type: string | undefined, value: unknown, currency: string | undefined, locale: string): string {
    if (value === null || value === undefined || value === '') return '';
    switch (type) {
        case 'money':
            return formatMoney(value, currency, locale);
        case 'credits':
            return formatCredits(value);
        case 'percent':
        case 'rate':
            return formatPercent(value);
        case 'decimal':
            return (Number(value) || 0).toFixed(1);
        case 'text':
        case 'label':
            return String(value);
        default:
            return formatNumber(value);
    }
}

/**
 * A chart axis tick: compact numbers, money in the viewer's locale ($12K from 10,000).
 * `decimals` is the tick step's: money ticks keep their cents when the step has them.
 */
export function formatReportAxis(type: string | undefined, value: number, currency: string | undefined, locale: string, decimals = 0): string {
    if (type === 'money') {
        // $12K rather than $12,000 once the gutter would get too wide
        if (Math.abs(value) >= 10000) {
            const code = (currency || '').toUpperCase();
            const formatter = /^[A-Z]{3}$/.test(code) ? getMoneyFormatter(code, locale, 'compact') : null;
            if (formatter) return withSign(formatter.format(value), code);
            const compact = (value < 0 ? '-' : '') + formatNumber(Math.abs(value));
            return code ? `${compact} ${code}` : compact;
        }
        return formatMoney(value, currency, locale, decimals <= 0);
    }
    if (type === 'credits') return (value < 0 ? '-' : '') + formatNumber(Math.abs(value));
    if (type === 'number' || !type) return (value < 0 ? '-' : '') + formatNumber(Math.abs(value));
    return formatReportValue(type, value, currency, locale);
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
