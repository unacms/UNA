/**
 * Dates and times as the person's language writes them: one place for what the lists, panes and
 * inboxes say about when. Every function takes the ISO string the API gives.
 *
 * A formatter is made once per set of options (`dateFormat`): making one is the slow part, and a
 * list asks for the same few on every row.
 */
import { locale, t } from './i18n';

const formats = new Map<string, Intl.DateTimeFormat>();

/** The formatter for these options in the person's locale (or `tag`), made once and kept. */
export function dateFormat(options: Intl.DateTimeFormatOptions, tag: string = locale()): Intl.DateTimeFormat {
    const key = `${tag}|${JSON.stringify(options)}`;
    let format = formats.get(key);
    if (!format) {
        format = new Intl.DateTimeFormat(tag, options);
        formats.set(key, format);
    }
    return format;
}

/** The viewer's own time zone. */
export function viewerZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const relative = new Map<string, Intl.RelativeTimeFormat>();
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

/** "3 hours ago", "yesterday", "now". */
export function ago(iso: string): string {
    const tag = locale();
    let rtf = relative.get(tag);
    if (!rtf) {
        rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
        relative.set(tag, rtf);
    }
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, size] of STEPS) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    return rtf.format(0, 'second');
}

/** The date and time to the second, for the tooltip of a short time ("3 hours ago"). */
export function exactTime(iso: string): string {
    return dateFormat({ year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(iso));
}

/** "6 November 2026 at 09:14": an open post says when exactly. */
export function longTime(iso: string): string {
    try {
        return dateFormat({ dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
    } catch {
        return exactTime(iso);
    }
}

/** "6 November 2026", or nothing for what is no date. */
export function longDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : dateFormat({ year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

/** "March 2026", or nothing for what is no date. */
export function monthYear(iso: string): string | null {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : dateFormat({ month: 'long', year: 'numeric' }).format(d);
}

/** "6 Nov 2026, 09:14" (`timed`) or "6 Nov 2026". */
export function mediumDate(d: Date, timed = false): string {
    return dateFormat(timed ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(d);
}

/** How many calendar days before `now` the moment is, in the viewer's zone (0 today, 1 yesterday). */
export function daysBefore(d: Date, now: Date = new Date()): number {
    const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    return Math.round((start(now) - start(d)) / 86_400_000);
}

/** Today, Yesterday, a weekday within the week, else the date (with the year when not this one). */
export function dayLabel(iso: string, now: Date = new Date()): string {
    const d = new Date(iso);
    const days = daysBefore(d, now);
    if (days === 0) return t('Today');
    if (days === 1) return t('Yesterday');
    if (days > 1 && days < 7) return dateFormat({ weekday: 'long' }).format(d);
    return dateFormat(d.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** The time of day, for under a message's bubble. */
export function timeLabel(iso: string): string {
    return dateFormat({ hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "09:14" today, "Yesterday", the weekday within the week ("Mon"), else "3 Nov" (with the year when not this one). */
export function inboxTime(iso: string, now: Date = new Date()): string {
    const d = new Date(iso);
    const days = daysBefore(d, now);
    if (days <= 0) return dateFormat({ hour: '2-digit', minute: '2-digit' }).format(d);
    if (days === 1) return t('Yesterday');
    if (days < 7) return dateFormat({ weekday: 'short' }).format(d);
    return dateFormat(d.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}
