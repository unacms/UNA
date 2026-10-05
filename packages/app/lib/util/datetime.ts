import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import type { TFunction } from 'i18next';

const isWeb = Platform.OS === 'web';
// Must match the SSR fallback in apps/next/stubs/react-native-localize.js.
const SSR_DATE_LOCALE = 'en-US';


/**
 * Per-locale date layout. Plain table instead of `Intl` so web, iOS and
 * Android format identically.
 */
export type DateFormatSpec = {
    order: 'DMY' | 'MDY' | 'YMD';
    /** Separator for the numeric form ("05.10.2026", "10/05/2026"). */
    sep: string;
    /** Appended to the day in the named form ("5. Okt. 2026"). */
    dayMark: string;
    /** First day of week, 0 = Sunday. */
    weekStart: 0 | 1;
};

const DEFAULT_DATE_FORMAT: DateFormatSpec = { order: 'DMY', sep: '.', dayMark: '', weekStart: 1 };

/** Full tag beats language. Keys are lowercase. */
const DATE_FORMAT_BY_TAG: Record<string, Partial<DateFormatSpec>> = {
    'en-us': { order: 'MDY', sep: '/', weekStart: 0 },
    'en-ca': { order: 'YMD', sep: '-', weekStart: 0 },
    'en-ph': { order: 'MDY', sep: '/', weekStart: 0 },
    'fr-ca': { order: 'YMD', sep: '-', weekStart: 0 },
    'pt-br': { sep: '/', weekStart: 0 },
};

const DATE_FORMAT_BY_LANG: Record<string, Partial<DateFormatSpec>> = {
    en: { sep: '/' },
    ru: { sep: '.' },
    uk: { sep: '.' },
    be: { sep: '.' },
    pl: { sep: '.' },
    cs: { sep: '.' },
    tr: { sep: '.' },
    de: { sep: '.', dayMark: '.' },
    fr: { sep: '/' },
    es: { sep: '/' },
    it: { sep: '/' },
    pt: { sep: '/' },
    el: { sep: '/' },
    ar: { sep: '/', weekStart: 0 },
    he: { sep: '.', weekStart: 0 },
    nl: { sep: '-' },
    sv: { order: 'YMD', sep: '-' },
    lt: { order: 'YMD', sep: '-' },
    hu: { order: 'YMD', sep: '.' },
    zh: { order: 'YMD', sep: '/', weekStart: 0 },
    ja: { order: 'YMD', sep: '/', weekStart: 0 },
    ko: { order: 'YMD', sep: '.', weekStart: 0 },
};

export function getDateFormatSpec(tag: string): DateFormatSpec {
    const lower = tag.toLowerCase().replace('_', '-');
    const lang = lower.split('-')[0] ?? '';
    return {
        ...DEFAULT_DATE_FORMAT,
        ...DATE_FORMAT_BY_LANG[lang],
        ...DATE_FORMAT_BY_TAG[lower],
    };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Month name inside a date ("5 октября"); `monthIndex` is 0-11. */
export function getMonthName(t: TFunction, monthIndex: number, length: 'short' | 'long' = 'short'): string {
    const fallback = (length === 'long' ? MONTH_LONG : MONTH_SHORT)[monthIndex] ?? '';
    return t(`date_month_${length}_${monthIndex + 1}`, { defaultValue: fallback });
}

/** Standalone month name for pickers and headers ("Октябрь"); `monthIndex` is 0-11. */
export function getMonthTitle(t: TFunction, monthIndex: number): string {
    return t(`date_month_name_${monthIndex + 1}`, { defaultValue: MONTH_LONG[monthIndex] ?? '' });
}

/** Two-letter weekday for calendar headers; `day` is 0 = Sunday … 6 = Saturday. */
export function getWeekdayShort(t: TFunction, day: number): string {
    return t(`date_weekday_short_${day}`, { defaultValue: WEEKDAY_SHORT[day] ?? '' });
}

function readDeviceLocaleTag(): string {
    if (isWeb) {
        if (typeof navigator === 'undefined') return SSR_DATE_LOCALE;
        return navigator.language || (navigator as { userLanguage?: string }).userLanguage || SSR_DATE_LOCALE;
    }
    return RNLocalize.getLocales()?.[0]?.languageTag || SSR_DATE_LOCALE;
}

let currentDateLocaleTag = isWeb ? SSR_DATE_LOCALE : readDeviceLocaleTag();
const dateLocaleListeners = new Set<() => void>();

function subscribeDateLocale(cb: () => void) {
    dateLocaleListeners.add(cb);
    return () => { dateLocaleListeners.delete(cb); };
}

function getDateLocaleSnapshot() {
    return currentDateLocaleTag;
}

function getDateLocaleServerSnapshot() {
    return SSR_DATE_LOCALE;
}

export function hydrateDateLocale() {
    const next = readDeviceLocaleTag();
    if (next === currentDateLocaleTag) return;
    currentDateLocaleTag = next;
    dateLocaleListeners.forEach((listener) => listener());
}

/**
 * SSR-stable device locale. First client render matches the server (`en-US`
 * on web); after mount it updates to `navigator.language` and re-renders
 * subscribers so date order (M D, Y vs D M Y) does not hydrate-mismatch.
 */
export function useDateLocaleTag(): string {
    const tag = useSyncExternalStore(
        subscribeDateLocale,
        getDateLocaleSnapshot,
        getDateLocaleServerSnapshot,
    );
    useEffect(() => {
        hydrateDateLocale();
    }, []);
    return tag;
}

function resolveLocaleTag(explicit?: string): string {
    if (explicit) return explicit;
    return currentDateLocaleTag;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function isSameClockTime(a: Date, b: Date): boolean {
    return a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}

export type FormatDateOptions = {
    /** Prefix "Today" / "Tomorrow" for near future dates. */
    inFuture?: boolean;
    /** Relative "Now" / "5m" / "3h" / "2d" / "4w" for recent dates. */
    inPast?: boolean;
    /** BCP 47 tag for date order; defaults to the device locale. */
    locale?: string;
    month?: 'numeric' | '2-digit' | 'short' | 'long';
    showTime?: boolean;
    showDate?: boolean;
    /** 12-hour clock with AM/PM. */
    hour12?: boolean;
    /** Accepted for API compatibility; not used. */
    timeZone?: string;
    yearPolicy?: 'auto' | 'always' | 'never';
};

export const formatDate = (
    input: Date | string | number,
    t: TFunction,
    {
        inFuture = false,
        inPast = false,
        locale,                     // 'en-US' (not used for universality)
        month = 'short',            // 'numeric' | '2-digit' | 'short' | 'long' | ...
        showTime = false,
        showDate = true,
        hour12,                     // true/false | undefined (keeps locale default behavior)
        timeZone,                   // e.g. 'UTC' (not used for universality)
        yearPolicy = 'auto',        // 'auto' | 'always' | 'never'
    } = {} as FormatDateOptions
): string => {
    const date = input instanceof Date ? input : new Date(input);
    const localeTag = resolveLocaleTag(locale);
    if (Number.isNaN(date.getTime())) return '';
    const nowYear = new Date().getFullYear();

    let rel = '';
    if (inFuture && showDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        rel = dDay.getTime() === today.getTime() ? t('Today ') : dDay.getTime() === tomorrow.getTime() ? t('Tomorrow ') : '';
    }

    if (inPast) {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const sec = Math.round(diffMs / 1000);
        const absSec = Math.abs(sec);
        if (absSec < 60)
            return t('Now');

        // Universal relative time formatting (same everywhere)
        const min = Math.round(sec / 60);
        if (Math.abs(min) < 60) {
            return `${Math.abs(min)}m`;
        }
        const hrs = Math.round(sec / 3600);
        if (Math.abs(hrs) < 24) {
            return `${Math.abs(hrs)}h`;
        }
        const days = Math.round(sec / (3600 * 24));
        if (Math.abs(days) < 31) {
            return `${Math.abs(days)}d`;
        }
        const weeks = Math.round(sec / (3600 * 24 * 7));
        if (Math.abs(weeks) < 24) {
            return `${Math.abs(weeks)}w`;
        }
    }

    return formatDateUniversal(date, t, {
        showDate,
        showTime,
        month,
        yearPolicy,
        nowYear,
        hour12,
        rel,
        localeTag
    });
};

/**
 * Numeric: "05.10.2026" / "10/05/2026" / "2026/10/05", year dropped → "05.10".
 * Named: "5 окт. 2026" / "Oct 5, 2026" / "2026 Oct 5", year dropped → "5 окт.".
 */
function formatDatePart(date: Date, t: TFunction, spec: DateFormatSpec, month: FormatDateOptions['month'], withYear: boolean): string {
    const monthIndex = date.getMonth();
    const year = String(date.getFullYear());

    if (month === 'numeric' || month === '2-digit') {
        const pad = month === '2-digit';
        const d = pad ? String(date.getDate()).padStart(2, '0') : String(date.getDate());
        const m = pad ? String(monthIndex + 1).padStart(2, '0') : String(monthIndex + 1);
        const ordered = spec.order === 'MDY' ? [m, d, year]
            : spec.order === 'YMD' ? [year, m, d]
            : [d, m, year];
        return ordered.filter(part => withYear || part !== year).join(spec.sep);
    }

    const name = getMonthName(t, monthIndex, month === 'long' ? 'long' : 'short');
    const day = String(date.getDate()) + spec.dayMark;
    if (spec.order === 'MDY')
        return withYear ? `${name} ${day}, ${year}` : `${name} ${day}`;
    if (spec.order === 'YMD')
        return withYear ? `${year} ${name} ${day}` : `${name} ${day}`;
    return withYear ? `${day} ${name} ${year}` : `${day} ${name}`;
}

// Universal date formatting function (same result everywhere)
function formatDateUniversal(date: Date, t: TFunction, {
    showDate,
    showTime,
    month,
    yearPolicy,
    nowYear,
    hour12,
    rel,
    localeTag,
}: {
    showDate: boolean;
    showTime: boolean;
    month: FormatDateOptions['month'];
    yearPolicy: FormatDateOptions['yearPolicy'];
    nowYear: number;
    hour12?: boolean;
    rel: string;
    localeTag: string;
}) {
    const parts: string[] = [];

    // --- DATE ---
    if (showDate && !rel) {
        const needYear = (yearPolicy === 'always') || (yearPolicy === 'auto' && date.getFullYear() !== nowYear);
        parts.push(formatDatePart(date, t, getDateFormatSpec(localeTag), month, needYear));
    }

    // --- TIME ---
    if (showTime) {
        let hours = date.getHours();
        const minutes = date.getMinutes();

        if (hour12) {
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`);
        } else {
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }
    }

    return (rel || '') + parts.join(' ');
}

/** "start - end" for two Unix timestamps (seconds), collapsing a shared day or time. */
export const formatDateInterval = (dateStart: number, dateEnd: number, t: TFunction): string => {
    const start = new Date(dateStart * 1000);
    const end = new Date(dateEnd * 1000);
    const locale = currentDateLocaleTag;

    const isSingleDate = isSameCalendarDay(start, end);
    const isSingleTime = isSameClockTime(start, end);

    if (isSingleDate)
        if (isSingleTime)
            return formatDate(start, t, { inFuture: true, showTime: true, month: '2-digit', locale });
        else
            return formatDate(start, t, { inFuture: true, showTime: true, month: '2-digit', locale }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: false, month: '2-digit', locale });
    else
        return formatDate(start, t, { inFuture: true, showTime: true, month: '2-digit', locale }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: true, month: '2-digit', locale });

};
