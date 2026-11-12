/**
 * Events (GET /events, /me/events, /events/{id}): an event is a context profile like a group,
 * so its page is the context page (group-view.tsx) with an event's facts, and going to it is
 * being in it (PUT and DELETE /events/{id}/rsvp). Here: the query keys, the Event as a context
 * page shows it, the lists of the Events section, and the words for its times, in the viewer's
 * zone (and the event's, where that is another).
 */
import type { QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { ensureOk, unwrap } from '../../lib/api';
import { locale, t, tn } from '../../lib/i18n';
import type { Context } from '../groups/groups';

export type Event = Schema<'Event'>;
export type EventList = 'upcoming' | 'going' | 'past';

export const EVENTS_PAGE = 30;

/** Pages of one list of the Events section. */
export const eventListKey = (list: EventList) => ['events', list] as const;
/** Whose events an Events tab lists: a group's or space's (`context`), or a profile's own (`author`). */
export type EventsOf = { context: string } | { author: string };
/** Upcoming or past: an Events tab's two lists. */
export type EventsWhen = 'upcoming' | 'past';
/** The events of a group, space or profile (its Events tab), upcoming or past. */
export const eventsOfKey = (of: EventsOf, when: EventsWhen) => ('context' in of ? (['events', 'context', of.context, when] as const) : (['events', 'author', of.author, when] as const));

/** A page of a group's, space's or profile's events: upcoming soonest first, past the latest first. */
export async function fetchEventsOf(api: UnaApi, of: EventsOf, when: EventsWhen, cursor: string | undefined, limit = EVENTS_PAGE): Promise<Schema<'Page_Event'>> {
    return unwrap(await api.GET('/events', { params: { query: { ...of, when, cursor, limit } } }));
}

/** A page of one of the Events section's lists: upcoming (soonest first), one's own (going), past (the latest first). */
export async function fetchEventList(api: UnaApi, list: EventList, cursor: string | undefined, limit = EVENTS_PAGE): Promise<Schema<'Page_Event'>> {
    if (list === 'going') return unwrap(await api.GET('/me/events', { params: { query: { cursor, limit } } }));
    return unwrap(await api.GET('/events', { params: { query: { when: list, cursor, limit } } }));
}

/**
 * An Event as a context page shows it: the Group fields its page and buttons read (its name, a
 * plain-text about, its cover's large copy, the going count as members), with the Event itself
 * as `event` for its own facts.
 */
export function eventContext(e: Event): Context {
    return {
        id: e.id,
        kind: 'group',
        module: e.module,
        handle: e.handle,
        display_name: e.title,
        about: e.summary,
        status: 'active',
        avatar: e.avatar,
        cover: e.cover?.variants?.large?.url ?? e.cover?.url ?? null,
        url: e.url,
        created_at: e.created_at,
        ...(e.badges ? { badges: e.badges } : {}),
        visibility: e.visibility,
        join_policy: e.join_policy,
        member_count: e.going_count,
        content_visible: e.content_visible,
        content_kinds: e.content_kinds,
        viewer: e.viewer,
        event: e,
    };
}

/** GET /events/{id}, as its page shows it. */
export async function fetchEventContext(api: UnaApi, id: string): Promise<Context> {
    return eventContext(unwrap(await api.GET('/events/{id}', { params: { path: { id } } })));
}

/** Going (PUT /events/{id}/rsvp `going`): the event as it is now, the viewer `active` in it, or `pending` where its organisers approve. */
export async function rsvpEvent(api: UnaApi, id: string): Promise<Event> {
    return unwrap(await api.PUT('/events/{id}/rsvp', { params: { path: { id } }, body: { status: 'going' } }));
}

/** What going made of the viewer: `active`, or `pending` where its organisers approve. */
export function rsvpStatus(e: Event): Schema<'MemberStatus'> {
    return e.viewer?.status === 'pending' ? 'pending' : 'active';
}

/** Not going, withdrawing a request or declining: DELETE /events/{id}/rsvp. */
export async function withdrawRsvp(api: UnaApi, id: string): Promise<void> {
    ensureOk(await api.DELETE('/events/{id}/rsvp', { params: { path: { id } } }));
}

/** A page of who is going, as the context page's Members (Attendees) tab lists them. */
export async function fetchAttendees(api: UnaApi, id: string, cursor: string | undefined, limit: number): Promise<Schema<'Page_Member'>> {
    const page = unwrap(await api.GET('/events/{id}/attendees', { params: { path: { id }, query: { cursor, limit } } }));
    return {
        items: page.items.map((a) => ({ profile: a.profile, role: a.role ?? 'member', status: 'active', since: a.created_at })),
        next_cursor: page.next_cursor,
    };
}

/** After going or not going: the Events section's lists and the context Events tabs load again. */
export async function afterRsvpChange(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['events'] });
}

/** "3 going". */
export function goingText(n: number): string {
    return tn(n, '{{count}} going', '{{count}} going');
}

/** The viewer's own zone. */
export function viewerZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The offset of a zone at a moment, in minutes. */
function offsetAt(iso: string, zone: string): number {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(d);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
    return Math.round((asUtc - Math.floor(d.getTime() / 60_000) * 60_000) / 60_000);
}

function dayParts(iso: string, zone: string): { y: number; m: number; d: number } {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(iso));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { y: get('year'), m: get('month'), d: get('day') };
}

function sameDay(a: string, b: string, zone: string): boolean {
    const x = dayParts(a, zone);
    const y = dayParts(b, zone);
    return x.y === y.y && x.m === y.m && x.d === y.d;
}

/** Days from `now`'s day to the moment's, in a zone (0 today, 1 tomorrow, -1 yesterday). */
function daysFrom(iso: string, now: Date, zone: string): number {
    const a = dayParts(now.toISOString(), zone);
    const b = dayParts(iso, zone);
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/**
 * When an event is, in one line, in a zone (the viewer's by default): "Sat, 9 Nov, 10:00 – 16:00",
 * "Sat, 6 Dec, 09:00 – Sun, 7 Dec, 17:00", the year where it is not this one. "Date to be set"
 * for an event the site keeps no date for.
 */
export function eventWhen(e: Pick<Event, 'starts_at' | 'ends_at'>, zone: string = viewerZone(), now: Date = new Date(), tag: string = locale()): string {
    if (!e.starts_at) return t('Date to be set');
    const thisYear = dayParts(e.starts_at, zone).y === dayParts(now.toISOString(), zone).y && (!e.ends_at || dayParts(e.ends_at, zone).y === dayParts(now.toISOString(), zone).y);
    const date = new Intl.DateTimeFormat(tag, { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', ...(thisYear ? {} : { year: 'numeric' }) });
    const time = new Intl.DateTimeFormat(tag, { timeZone: zone, hour: '2-digit', minute: '2-digit' });
    const start = new Date(e.starts_at);
    if (!e.ends_at || e.ends_at === e.starts_at) return `${date.format(start)}, ${time.format(start)}`;
    const end = new Date(e.ends_at);
    if (sameDay(e.starts_at, e.ends_at, zone)) return `${date.format(start)}, ${time.format(start)} – ${time.format(end)}`;
    return `${date.format(start)}, ${time.format(start)} – ${date.format(end)}, ${time.format(end)}`;
}

/**
 * The event's own times where its zone is another than the viewer's (its offset differs then):
 * "10:00 – 16:00 London time" (the zone's city), else ''.
 */
export function eventZoneNote(e: Pick<Event, 'starts_at' | 'ends_at' | 'timezone'>, zone: string = viewerZone(), tag: string = locale()): string {
    if (!e.starts_at || !e.timezone || e.timezone === zone) return '';
    try {
        if (offsetAt(e.starts_at, e.timezone) === offsetAt(e.starts_at, zone)) return '';
        const city = (e.timezone.split('/').pop() ?? e.timezone).replace(/_/g, ' ');
        return t('{{when}} {{city}} time', { when: eventWhen(e, e.timezone, new Date(), tag), city });
    } catch {
        // a zone this computer does not know
        return '';
    }
}

/** The month and day of an event's start for its date tile ("NOV", "9"), in the viewer's zone. */
export function dateTile(e: Pick<Event, 'starts_at'>, zone: string = viewerZone(), tag: string = locale()): { month: string; day: string } | null {
    if (!e.starts_at) return null;
    const d = new Date(e.starts_at);
    return {
        month: new Intl.DateTimeFormat(tag, { timeZone: zone, month: 'short' }).format(d).replace('.', '').toUpperCase(),
        day: new Intl.DateTimeFormat(tag, { timeZone: zone, day: 'numeric' }).format(d),
    };
}

/** Whether it is on now. */
export function isOngoing(e: Pick<Event, 'starts_at' | 'ends_at'>, now: Date = new Date()): boolean {
    return !!e.starts_at && Date.parse(e.starts_at) <= now.getTime() && !!e.ends_at && Date.parse(e.ends_at) > now.getTime();
}

/** Whether it has ended. */
export function hasEnded(e: Pick<Event, 'starts_at' | 'ends_at'>, now: Date = new Date()): boolean {
    const end = e.ends_at ?? e.starts_at;
    return !!end && Date.parse(end) <= now.getTime();
}

export type EventRow = { kind: 'day'; key: string; label: string } | { kind: 'event'; event: Event };

/**
 * The heading an event is listed under, in the viewer's zone: Happening now, Today, Tomorrow,
 * This week, then its month ("December", with the year when not this one). Past lists: Today,
 * Yesterday, This week, then the month.
 */
export function eventGroup(e: Pick<Event, 'starts_at' | 'ends_at'>, past: boolean, zone: string = viewerZone(), now: Date = new Date(), tag: string = locale()): { key: string; label: string } {
    if (!e.starts_at) return { key: 'undated', label: t('No date yet') };
    if (!past && isOngoing(e, now)) return { key: 'now', label: t('Happening now') };
    const days = daysFrom(e.starts_at, now, zone);
    if (days === 0) return { key: 'today', label: t('Today') };
    if (!past && days === 1) return { key: 'tomorrow', label: t('Tomorrow') };
    if (past && days === -1) return { key: 'yesterday', label: t('Yesterday') };
    if (!past && days > 1 && days < 7) return { key: 'week', label: t('This week') };
    if (past && days < -1 && days > -7) return { key: 'week', label: t('This week') };
    const { y, m } = dayParts(e.starts_at, zone);
    const sameYear = y === dayParts(now.toISOString(), zone).y;
    const label = new Intl.DateTimeFormat(tag, { timeZone: 'UTC', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) }).format(new Date(Date.UTC(y, m - 1, 15)));
    return { key: `${y}-${m}`, label };
}

/** Events in their list's order, with a heading before each new group. */
export function withEventHeadings(events: readonly Event[], past: boolean, zone: string = viewerZone(), now: Date = new Date()): EventRow[] {
    const rows: EventRow[] = [];
    let group: string | null = null;
    for (const e of events) {
        const g = eventGroup(e, past, zone, now);
        if (g.key !== group) {
            rows.push({ kind: 'day', key: `${g.key}-${e.id}`, label: g.label });
            group = g.key;
        }
        rows.push({ kind: 'event', event: e });
    }
    return rows;
}
