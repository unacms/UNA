import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import type { TFunction } from 'i18next';

const isWeb = Platform.OS === 'web';
// Must match the SSR fallback in apps/next/stubs/react-native-localize.js.
const SSR_DATE_LOCALE = 'en-US';


function getDateOrderByLocale(tag: string): string {
    const lang = tag.toLowerCase();
    if (lang.startsWith('en-us')) return 'M D, Y';
    if (lang.startsWith('zh') || lang.startsWith('ja') || lang.startsWith('ko')) return 'Y M D';
    return 'D M Y';
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

    return formatDateUniversal(date, {
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

// Universal date formatting function (same result everywhere)
function formatDateUniversal(date: Date, {
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
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLongNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayStr = String(date.getDate()); // can use padStart(2,'0') for 2-digit
        const monthIndex = date.getMonth();

        // getMonth() is 0-11, so the name lookups always hit.
        let monthStr: string;
        if (month === 'short') monthStr = monthNames[monthIndex]!;
        else if (month === 'long') monthStr = monthLongNames[monthIndex]!;
        else if (month === 'numeric') monthStr = String(monthIndex + 1);
        else if (month === '2-digit') monthStr = String(monthIndex + 1).padStart(2, '0');
        else monthStr = monthNames[monthIndex]!;

        const needYear = (yearPolicy === 'always') || (yearPolicy === 'auto' && date.getFullYear() !== nowYear);
        const yearStr = String(date.getFullYear());

        const tokens = { D: dayStr, M: monthStr, Y: needYear ? yearStr : '' };

        // order + punctuation
        const pattern = getDateOrderByLocale(localeTag); // "M D, Y" etc
        const dateText = pattern
            .replace(/\bD\b/g, tokens.D)
            .replace(/\bM\b/g, tokens.M)
            .replace(/\bY\b/g, tokens.Y)
            // trim extra punctuation/spaces when year is hidden
            .replace(/\s+,/g, ',')
            .replace(/,\s*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (dateText) parts.push(dateText);
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
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric', locale });
        else
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric', locale }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: false, month: 'numeric', locale });
    else
        return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric', locale }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: true, month: 'numeric', locale });

};
