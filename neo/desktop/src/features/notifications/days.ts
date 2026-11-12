/**
 * Day headings in the notifications inbox (spec 4.2): Today, Yesterday, This week, Earlier.
 * They are rows of the virtual list but not stops for its keys, and not counted in
 * aria-setsize; each notification says its own day instead ("Yesterday, 3 hours ago").
 */
import type { Schema } from 'una-api';

import { t } from '../../lib/i18n';
import { dayLabel } from '../messages/days';

type Notification = Schema<'Notification'>;

/**
 * A day row's `id` is unique in the list (its first notification's): items that are not
 * strictly newest first (new events over a cached page) can bring a group back twice.
 */
export type InboxRow = { kind: 'day'; id: string; key: string; label: string } | { kind: 'notification'; n: Notification; index: number; day: string };

function startOf(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Which group a notification is under: today, yesterday, the 7 days before, or earlier. */
export function dayGroup(iso: string, now: Date = new Date()): { key: string; label: string } {
    const days = Math.round((startOf(now) - startOf(new Date(iso))) / 86_400_000);
    if (days <= 0) return { key: 'today', label: t('Today') };
    if (days === 1) return { key: 'yesterday', label: t('Yesterday') };
    if (days < 7) return { key: 'week', label: t('This week') };
    return { key: 'earlier', label: t('Earlier') };
}

/** Notifications (newest first) with a heading before each new group. */
export function withDayHeadings(items: readonly Notification[], now: Date = new Date()): InboxRow[] {
    const rows: InboxRow[] = [];
    let group: string | null = null;
    items.forEach((n, index) => {
        const g = dayGroup(n.created_at, now);
        if (g.key !== group) {
            rows.push({ kind: 'day', id: `day-${n.id}`, key: g.key, label: g.label });
            group = g.key;
        }
        // the day a notification says it is from: Today, Yesterday, the weekday or the date
        rows.push({ kind: 'notification', n, index, day: dayLabel(n.created_at, now) });
    });
    return rows;
}

/** The start of today, in ms: what day headings are counted from. */
export function startOfToday(now: Date = new Date()): number {
    return startOf(now);
}
