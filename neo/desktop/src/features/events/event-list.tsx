import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { type MouseEvent, useState } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { contextDetailRoute, feedRoute, type FeedName } from '../../lib/router';
import { Pane } from '../../shell/pane';
import { FEED_LABELS } from '../feed/feed-tabs';
import { groupKey } from '../groups/groups';
import {
    dateTile,
    type Event,
    eventContext,
    type EventList,
    eventListKey,
    type EventsOf,
    eventsOfKey,
    type EventsWhen,
    eventWhen,
    eventZoneNote,
    fetchEventList,
    fetchEventsOf,
    goingText,
    isOngoing,
    withEventHeadings,
} from './events';

const LISTS: readonly EventList[] = ['upcoming', 'going', 'past'];
const PANEL_ID = 'events-panel';
const listTabId = (list: EventList) => `events-list-${list}`;
const LIST_LABELS = { upcoming: FEED_LABELS.upcoming, going: FEED_LABELS.going, past: FEED_LABELS.past } as const satisfies Record<EventList, string>;

/** The list a route's feed names: Upcoming by default. */
export function eventList(feed: FeedName | undefined): EventList {
    return feed === 'going' || feed === 'past' ? feed : 'upcoming';
}

/** An event's start in a calendar tile: the month over the day, in the viewer's zone. */
export function DateTile({ event }: { event: Pick<Event, 'starts_at'> }) {
    const tile = dateTile(event);
    return (
        <span className="date-tile" aria-hidden="true">
            {tile ? (
                <>
                    <span className="date-tile-month">{tile.month}</span>
                    <span className="date-tile-day">{tile.day}</span>
                </>
            ) : (
                <Icon name="calendar" size={20} />
            )}
        </span>
    );
}

/**
 * One event in a list: its date tile and name open its page (Cmd+click, Cmd+Enter or a
 * double-click: in a window of its own), its badges after the name, when it is in the viewer's
 * zone (and the event's own where that is another), where, and how many are going.
 */
export function EventRow({ event: e }: { event: Event }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = contextDetailRoute('event', e.id);
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the page shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(groupKey(e.id))) queryClient.setQueryData(groupKey(e.id), eventContext(e), { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    const when = eventWhen(e);
    const zone = eventZoneNote(e);
    const going = e.viewer?.rsvp === 'going';
    const state = going ? t('Going') : e.viewer?.status === 'pending' ? t('Request sent') : e.viewer?.status === 'invited' ? t('Invited') : '';
    return (
        <li className="list-row event-row" onDoubleClick={onDoubleClick}>
            <span className="avatar-link" onClick={(m) => open(m)}>
                <DateTile event={e} />
            </span>
            <div className="list-main">
                <span className={e.badges?.length ? 'with-badges' : undefined}>
                    <button
                        type="button"
                        className="profile-link strong"
                        data-open=""
                        onClick={(m) => open(m)}
                        onKeyDown={(k) => {
                            if (!openInWindow || !isWindowKey(k)) return;
                            k.preventDefault();
                            openInWindow(detail);
                        }}
                    >
                        <bdi>{e.title}</bdi>
                        {/* the tile, the headings and Now are hidden: the date, and that it is on now, are said with the name */}
                        <span className="sr-only">{isOngoing(e) ? t(', happening now, {{when}}', { when }) : `, ${when}`}</span>
                    </button>
                    <ProfileBadges badges={e.badges} />
                </span>
                <span className="row-sub" aria-hidden="true">
                    {isOngoing(e) ? <strong className="event-now">{`${t('Now')} · `}</strong> : null}
                    <time dateTime={e.starts_at ?? undefined} title={zone || undefined}>
                        {when}
                    </time>
                </span>
                {zone ? <span className="row-sub">{zone}</span> : null}
                <span className="row-sub">
                    {e.location ? (
                        <>
                            <Icon name="map-pin" size={12} strong />
                            <span className="truncate">{e.location}</span>
                            <span aria-hidden="true">·</span>
                        </>
                    ) : null}
                    <span>{goingText(e.going_count)}</span>
                </span>
            </div>
            {state ? (
                <span className="row-state">
                    {going ? <Icon name="check" size={12} strong /> : null}
                    {state}
                </span>
            ) : null}
        </li>
    );
}

const EMPTY: Record<EventList, { title: string; hint: string }> = {
    upcoming: { title: t('Nothing coming up'), hint: t('New events in this network show up here.') },
    going: { title: t('You aren’t going to anything yet'), hint: t('Say you’re going to an event and it shows up here.') },
    past: { title: t('No past events'), hint: t('Events that have ended are listed here.') },
};

/**
 * The Events section: Upcoming (soonest first, those on now first), Going (one's own) and Past
 * (the latest first), under day headings; an event opens its page in the content pane.
 */
export function EventsBrowse() {
    const { api } = useApp();
    const route = useRoute();
    const { history } = useNavigation();
    const list = eventList(route.list.feed);
    const query = useInfiniteQuery({
        queryKey: eventListKey(list),
        queryFn: async ({ pageParam }) => fetchEventList(api, list, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = emptyListText(query, items.length, EMPTY[list].title);
    const label = list === 'past' ? t('Past events, the latest first') : list === 'going' ? t('Events you’re going to, soonest first') : t('Upcoming events, soonest first');

    return (
        <Pane
            pane="list"
            title={t('Events')}
            ready={!query.isLoading}
            busy={query.isLoading}
            scope={<SegmentedTabs label={t('Events')} values={LISTS} labels={LIST_LABELS} current={list} onChange={(l) => history.push({ list: feedRoute('events', l), detail: null })} panelId={PANEL_ID} tabId={listTabId} />}
        >
            <div className="column" id={PANEL_ID} role="tabpanel" aria-labelledby={listTabId(list)}>
                <SkeletonRows loading={query.isLoading} />
                {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
                <EmptyState shown={!!empty} icon="calendar" title={empty || EMPTY[list].title} hint={empty === EMPTY[list].title ? EMPTY[list].hint : undefined} />
                {items.length ? <EventsList events={items} past={list === 'past'} label={label} /> : null}
                {query.hasNextPage ? (
                    <button
                        type="button"
                        className="btn btn-wide"
                        onClick={() => {
                            if (!query.isFetchingNextPage) void query.fetchNextPage();
                        }}
                        aria-disabled={query.isFetchingNextPage || undefined}
                        aria-busy={query.isFetchingNextPage}
                    >
                        {t('More events')}
                    </button>
                ) : null}
            </div>
        </Pane>
    );
}

/**
 * Events as one list under day headings: the headings are items of the list hidden from screen
 * readers (each row says its date), so the list keeps one set of rows.
 */
export function EventsList({ events, past, label }: { events: readonly Event[]; past: boolean; label: string }) {
    const rows = withEventHeadings(events, past);
    return (
        <ul className="list rows event-list" aria-label={label}>
            {rows.map((r) =>
                r.kind === 'day' ? (
                    <li key={r.key} className="event-day" aria-hidden="true">
                        {r.label}
                    </li>
                ) : (
                    <EventRow key={r.event.id} event={r.event} />
                ),
            )}
        </ul>
    );
}

const WHENS: readonly EventsWhen[] = ['upcoming', 'past'];
const WHEN_LABELS = { upcoming: FEED_LABELS.upcoming, past: FEED_LABELS.past } as const satisfies Record<EventsWhen, string>;

/** What an Events tab says of whose events it lists. */
function eventsOfText(of: EventsOf, when: EventsWhen, name: string): { label: string; empty: string } {
    if ('context' in of)
        return when === 'past'
            ? { label: t('Past events in {{name}}, the latest first', { name }), empty: t('No past events in {{name}}', { name }) }
            : { label: t('Upcoming events in {{name}}, soonest first', { name }), empty: t('Nothing coming up in {{name}}', { name }) };
    return when === 'past'
        ? { label: t('Past events by {{name}}, the latest first', { name }), empty: t('{{name}} has no past events', { name }) }
        : { label: t('Upcoming events by {{name}}, soonest first', { name }), empty: t('{{name}} has nothing coming up', { name }) };
}

/**
 * An Events tab: a group's or space's events (GET /events?context=), or the events a profile
 * made (`author`), Upcoming (soonest first) or Past (the latest first).
 */
export function EventsOfTab({ of, name }: { of: EventsOf; name: string }) {
    const { api } = useApp();
    const [when, setWhen] = useState<EventsWhen>('upcoming');
    const query = useInfiniteQuery({
        queryKey: eventsOfKey(of, when),
        queryFn: async ({ pageParam }) => fetchEventsOf(api, of, when, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const text = eventsOfText(of, when, name);
    const empty = emptyListText(query, items.length, text.empty);
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-events`;
    const panelId = `${base}-events-panel`;
    const tabId = (w: EventsWhen) => `${base}-events-${w}`;
    return (
        <section className="connections" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Events')}
            </h3>
            <SegmentedTabs label={'context' in of ? t('Events in {{name}}', { name }) : t('Events by {{name}}', { name })} values={WHENS} labels={WHEN_LABELS} current={when} onChange={setWhen} panelId={panelId} tabId={tabId} />
            <div id={panelId} role="tabpanel" aria-labelledby={tabId(when)}>
                {query.isLoading ? <p className="muted">{t('Loading…')}</p> : null}
                {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
                <p className={empty ? 'muted empty' : 'sr-only'} role="status">
                    {empty}
                </p>
                {items.length ? <EventsList events={items} past={when === 'past'} label={text.label} /> : null}
                {query.hasNextPage ? (
                    <button
                        type="button"
                        className="btn btn-wide"
                        onClick={() => {
                            if (!query.isFetchingNextPage) void query.fetchNextPage();
                        }}
                        aria-disabled={query.isFetchingNextPage || undefined}
                        aria-busy={query.isFetchingNextPage}
                    >
                        {t('More events')}
                    </button>
                ) : null}
            </div>
        </section>
    );
}

/** A group's or space's Events tab. */
export function ContextEvents({ contextId, name }: { contextId: string; name: string }) {
    return <EventsOfTab of={{ context: contextId }} name={name} />;
}
