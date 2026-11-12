/**
 * Search (the list pane): one field and tabs of results: People, Posts, Groups, Spaces, Events
 * and Discussions, then the content modules the site has (the Posts module's posts, photos,
 * albums, videos, files, polls, tasks: module-results.tsx). The
 * words and the tab are in the route (/search?q=lily&tab=posts), so Back and Forward return to a
 * search; typing replaces the route instead of adding to history. People and groups are the
 * site's best matches (up to 50); posts are a feed, newest first, that loads page by page, and
 * discussions the module's keyword search, newest first (one page of 50). On a site with the
 * Posts module the feed's tab is Feed and the module's is Posts, as on a profile. The tabs that
 * don't fit the pane are in a More menu (SegmentedTabs `fit`).
 */
import { useQuery } from '@tanstack/react-query';
import { createContext, type FormEvent, type KeyboardEvent, useContext, useEffect, useMemo, useState } from 'react';

import type { Schema } from 'una-api';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { Kbd } from '../../components/kbd';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { num, t, tn } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { SEARCH_MAX, SEARCH_MODULE_TABS, type SearchModuleTab, SEARCH_TABS, type SearchTab } from '../../lib/router';
import { platform } from '../../lib/platform';
import { command } from '../../lib/shortcuts';
import { Pane, paneHeadingId } from '../../shell/pane';
import { FeedList, useAnnouncer } from '../feed/feed-list';
import { type FeedSource, PAGE_SIZE, useFeed } from '../feed/use-feed';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { EventRow } from '../events/event-list';
import type { Event } from '../events/events';
import { DiscussionRow } from '../discussions/discussion-list';
import { type Discussion, useHasDiscussions } from '../discussions/discussions';
import { useSiteHasTag } from '../../lib/site-modules';
import { isModuleTab, moduleCount, moduleFoundText, ModuleResults, moduleTabName, useModuleSearches } from './module-results';

type Profile = Schema<'Profile'>;

/** The search field's id: Cmd+F (go-search) focuses it. */
export const SEARCH_FIELD = 'search-field';
/** How long typing pauses before the results follow. */
export const SEARCH_TYPING_MS = 300;
/** People and groups shown at most (the API's limit). */
export const PEOPLE_LIMIT = 50;

const TAB_NAMES: Record<Exclude<SearchTab, SearchModuleTab>, string> = { people: t('People'), posts: t('Posts'), groups: t('Groups'), spaces: t('Spaces'), events: t('Events'), discussions: t('Discussions') };
const PANEL_ID = 'search-results';
export const searchTabId = (tab: SearchTab) => `search-tab-${tab}`;

/**
 * A tab's label with how many results it has, once known: "People 3", "Posts 20+". `name`: what
 * the tab is called here when not by its own name (the feed's posts next to the Posts module's).
 */
export function tabLabel(tab: SearchTab, count: number | undefined, more = false, name: string = isModuleTab(tab) ? moduleTabName(tab) : TAB_NAMES[tab]): string {
    return count === undefined ? name : `${name} ${num(count)}${more ? '+' : ''}`;
}

/** What the live region says once a tab's results are in. */
export function foundText(tab: SearchTab, count: number, more = false): string {
    switch (tab) {
        case 'people':
            if (count === 0) return t('No people found');
            return more ? tn(count, '{{count}} or more person found', '{{count}} or more people found') : tn(count, '{{count}} person found', '{{count}} people found');
        case 'posts':
            if (count === 0) return t('No posts found');
            return more ? tn(count, '{{count}} or more post found', '{{count}} or more posts found') : tn(count, '{{count}} post found', '{{count}} posts found');
        case 'groups':
            if (count === 0) return t('No groups found');
            return more ? tn(count, '{{count}} or more group found', '{{count}} or more groups found') : tn(count, '{{count}} group found', '{{count}} groups found');
        case 'spaces':
            if (count === 0) return t('No spaces found');
            return more ? tn(count, '{{count}} or more space found', '{{count}} or more spaces found') : tn(count, '{{count}} space found', '{{count}} spaces found');
        case 'events':
            if (count === 0) return t('No events found');
            return more ? tn(count, '{{count}} or more event found', '{{count}} or more events found') : tn(count, '{{count}} event found', '{{count}} events found');
        case 'discussions':
            if (count === 0) return t('No discussions found');
            return more ? tn(count, '{{count}} or more discussion found', '{{count}} or more discussions found') : tn(count, '{{count}} discussion found', '{{count}} discussions found');
        default:
            return moduleFoundText(tab, count, more);
    }
}

/** A list of results' name, by what it lists. */
function matchingLabel(kind: 'people' | 'groups' | 'spaces', words: string): string {
    if (kind === 'people') return t('People matching “{{words}}”', { words });
    return kind === 'spaces' ? t('Spaces matching “{{words}}”', { words }) : t('Groups matching “{{words}}”', { words });
}

/** What an empty list of results says, by what it would list. */
function nothingMatches(kind: 'people' | 'groups' | 'spaces', words: string): string {
    if (kind === 'people') return t('Nobody matches “{{words}}”.', { words });
    return kind === 'spaces' ? t('No spaces match “{{words}}”.', { words }) : t('No groups match “{{words}}”.', { words });
}

/** A site without that kind of profile says so. */
function hasNone(kind: 'people' | 'groups' | 'spaces'): string {
    if (kind === 'people') return t('This network has no people.');
    return kind === 'spaces' ? t('This network has no spaces.') : t('This network has no groups.');
}

/** The sidebar has the search field (Shell): the Search view then draws none of its own. */
export const SidebarSearchContext = createContext(false);

/**
 * The search field: typing shows the Search view once it pauses (the route is replaced, not
 * added to), Enter at once. Esc with words clears them; Esc on an empty field goes back to where
 * Search was opened from, with focus on that list's heading. It is in the sidebar, or in the
 * Search view when the sidebar is an icon rail.
 */
export function SearchField({ variant }: { variant: 'sidebar' | 'pane' }) {
    const route = useRoute();
    const { history, showSearch } = useNavigation();
    const inSearch = route.list.section === 'search';
    const q = inSearch ? (route.list.q ?? '') : '';
    const tab = (inSearch ? route.list.tab : undefined) ?? 'people';
    const [text, setText] = useState(q);

    // the words changed elsewhere (the palette, Back, another section): the field shows them,
    // unless it already does (typing "lily " must keep its space while the route has "lily")
    const [shown, setShown] = useState({ q, inSearch });
    if (shown.q !== q || shown.inSearch !== inSearch) {
        setShown({ q, inSearch });
        if (text.trim() !== q) setText(q);
    }

    useEffect(() => {
        if (text.trim() === q) return;
        const timer = setTimeout(() => showSearch(text, tab, true), SEARCH_TYPING_MS);
        return () => clearTimeout(timer);
    }, [text, q, tab, showSearch]);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (text.trim() !== q || !inSearch) showSearch(text, tab, true);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Escape') return;
        // the field's own Esc: never the detail pane's close
        e.preventDefault();
        e.stopPropagation();
        if (text) {
            setText('');
            return;
        }
        if (inSearch && history.canGoBack) history.back();
        // the list's heading, once the list it goes back to is drawn
        requestAnimationFrame(() => document.getElementById(paneHeadingId('list'))?.focus());
    };

    const palette = command('command-palette');
    return (
        <form role="search" className={variant === 'sidebar' ? 'sidebar-search' : 'search-form'} onSubmit={onSubmit}>
            <label htmlFor={SEARCH_FIELD} className="sr-only">
                {t('Search people, posts and groups')}
            </label>
            {variant === 'sidebar' ? <Icon name="search" size={14} /> : null}
            <input
                id={SEARCH_FIELD}
                className="search-input"
                type="search"
                dir="auto"
                placeholder={variant === 'sidebar' ? t('Search') : t('Search people, posts and groups')}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
            />
            {/* the palette exists: its keys, while the field is empty */}
            {variant === 'sidebar' && !text ? (
                <span className="search-hint">
                    <Kbd command={palette} decorative />
                </span>
            ) : null}
        </form>
    );
}

export function SearchView() {
    const { api } = useApp();
    const route = useRoute();
    const { showSearch } = useNavigation();
    const sidebarField = useContext(SidebarSearchContext);
    const q = route.list.section === 'search' ? (route.list.q ?? '') : '';
    const tab = (route.list.section === 'search' ? route.list.tab : undefined) ?? 'people';
    const [announcement, announce] = useAnnouncer();

    const people = useQuery({
        queryKey: ['search', 'people', q],
        queryFn: async () => unwrap(await api.GET('/search/profiles', { params: { query: { q, limit: PEOPLE_LIMIT } } })),
        enabled: !!q,
        staleTime: 30_000,
    });
    const groups = useQuery({
        queryKey: ['search', 'groups', q],
        // null: a site without the Groups module has no group search (404), which is no error,
        // so Refresh (refetchQueries with throwOnError) does not fail on it
        queryFn: async (): Promise<Profile[] | null> => {
            try {
                return unwrap(await api.GET('/search/groups', { params: { query: { q, limit: PEOPLE_LIMIT } } }));
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        enabled: !!q,
        staleTime: 30_000,
    });
    const noGroups = groups.data === null;
    // spaces only where GET /api/v2 lists the module
    const hasSpaces = useSiteHasTag('spaces') === true;
    const spaces = useQuery({
        queryKey: ['search', 'spaces', q],
        queryFn: async (): Promise<Profile[]> => unwrap(await api.GET('/search/spaces', { params: { query: { q, limit: PEOPLE_LIMIT } } })),
        enabled: !!q && hasSpaces,
        staleTime: 30_000,
    });
    // events only where GET /api/v2 lists the module
    const hasEvents = useSiteHasTag('events') === true;
    const events = useQuery({
        queryKey: ['search', 'events', q],
        queryFn: async (): Promise<Event[]> => unwrap(await api.GET('/search/events', { params: { query: { q, limit: PEOPLE_LIMIT } } })),
        enabled: !!q && hasEvents,
        staleTime: 30_000,
    });
    const discussions = useQuery({
        queryKey: ['search', 'discussions', q],
        // null: a site without Discussions has no discussion search (404), which is no error
        queryFn: async (): Promise<{ items: Discussion[]; more: boolean } | null> => {
            try {
                const page = unwrap(await api.GET('/search/discussions', { params: { query: { q, limit: PEOPLE_LIMIT } } }));
                return { items: page.items, more: !!page.next_cursor };
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        enabled: !!q,
        staleTime: 30_000,
    });
    // a site without Discussions has no such tab (the sidebar has no row for it either)
    const hasDiscussions = useHasDiscussions();
    const noDiscussions = discussions.data === null || hasDiscussions === false;
    // the content modules' own searches: a tab for each the site has, asked when it is shown
    const modules = useModuleSearches(q, tab);
    const moduleTabs = SEARCH_MODULE_TABS.filter((kind) => modules[kind].available === true).join(' ');
    const tabs = useMemo(
        () => SEARCH_TABS.filter((kind) => (isModuleTab(kind) ? moduleTabs.split(' ').includes(kind) : (kind !== 'discussions' || !noDiscussions) && (kind !== 'spaces' || hasSpaces) && (kind !== 'events' || hasEvents))),
        [noDiscussions, hasSpaces, hasEvents, moduleTabs],
    );
    // next to the Posts module's posts the feed's are Feed, as in a profile's tabs
    const feedName = modules.articles.available === true ? t('Feed') : undefined;

    const source = useMemo<FeedSource>(
        () => ({
            key: ['feed', 'search', q],
            enabled: !!q,
            poll: false,
            load: async (cursor) => {
                const page = unwrap(await api.GET('/search/content', { params: { query: { q, cursor, limit: PAGE_SIZE } } }));
                return { items: page.items.map((h) => h.activity), next_cursor: page.next_cursor };
            },
        }),
        [api, q],
    );
    const posts = useFeed(source);

    const counts: Record<SearchTab, { count: number | undefined; more: boolean }> = {
        people: { count: people.data?.length, more: false },
        posts: { count: posts.query.isSuccess ? posts.items.length : undefined, more: !!posts.query.hasNextPage },
        groups: { count: noGroups ? 0 : groups.data?.length, more: false },
        spaces: { count: hasSpaces ? spaces.data?.length : 0, more: false },
        events: { count: hasEvents ? events.data?.length : 0, more: false },
        discussions: { count: noDiscussions ? 0 : discussions.data?.items.length, more: !!discussions.data?.more },
        articles: moduleCount(modules.articles),
        photos: moduleCount(modules.photos),
        albums: moduleCount(modules.albums),
        videos: moduleCount(modules.videos),
        files: moduleCount(modules.files),
        polls: moduleCount(modules.polls),
        tasks: moduleCount(modules.tasks),
    };

    // The tab's results, said once they are in (a new search or another tab), not each time more
    // posts load. An empty first page of posts with more to come (hits the viewer may not see
    // were left out) is not "No posts found": the list loads on, and what it finds is said then.
    const shown = counts[tab];
    const paged = isModuleTab(tab) ? modules[tab].query : tab === 'posts' ? posts.query : null;
    const loadingOn = !!paged && (!!paged.hasNextPage || paged.isFetchingNextPage);
    const phase = shown.count === undefined ? 'unknown' : shown.count > 0 ? 'some' : loadingOn ? 'pending' : 'none';
    useEffect(() => {
        if (!q || shown.count === undefined || phase === 'pending') return;
        announce(foundText(tab, shown.count, shown.more));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, tab, phase]);

    const labels = Object.fromEntries(SEARCH_TABS.map((kind) => [kind, tabLabel(kind, q ? counts[kind].count : undefined, counts[kind].more, kind === 'posts' ? feedName : undefined)])) as Record<SearchTab, string>;
    const selected = route.detail?.kind === 'post' ? route.detail.id : null;
    const openProfile = route.detail?.kind === 'profile' ? route.detail.id : null;
    const openContext = route.detail?.kind === 'group' || route.detail?.kind === 'space' ? route.detail.id : null;
    const openDiscussion = route.detail?.kind === 'discussion' ? route.detail.id : null;

    return (
        <Pane pane="list" title={t('Search')} subtitle={q ? t('for “{{words}}”', { words: q }) : undefined} ready={!q || tab !== 'posts' || !posts.query.isLoading} busy={!!q && (people.isLoading || (tab === 'posts' && posts.query.isLoading) || (isModuleTab(tab) && modules[tab].available === true && modules[tab].query.isLoading))}>
            <div className="column">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {sidebarField ? null : <SearchField variant="pane" />}
                {q ? (
                    <>
                        {/* as wide as the pane: the tabs that don't fit it are in More */}
                        <div className="search-tabs">
                            <SegmentedTabs label={t('Results')} values={tabs} labels={labels} current={tab} onChange={(kind) => showSearch(q, kind)} panelId={PANEL_ID} tabId={searchTabId} fit />
                        </div>
                        <div id={PANEL_ID} role="tabpanel" aria-labelledby={searchTabId(tab)} className="search-panel">
                            {tab === 'posts' ? (
                                <FeedList
                                    key={q}
                                    feed={posts}
                                    cacheKey={`search/${q}`}
                                    label={t('Posts matching “{{words}}”', { words: q })}
                                    empty={{ icon: 'search-x', title: t('Nothing matches “{{words}}”', { words: q }), hint: t('Check the spelling or try fewer words.') }}
                                    selectedId={selected}
                                    tabId={searchTabId('posts')}
                                />
                            ) : isModuleTab(tab) ? (
                                <ModuleResults kind={tab} q={q} searches={modules} announce={announce} />
                            ) : tab === 'events' ? (
                                <EventResults q={q} query={events} unavailable={!hasEvents} />
                            ) : tab === 'discussions' ? (
                                <DiscussionResults q={q} query={discussions} openId={openDiscussion} />
                            ) : (
                                <ProfileResults
                                    kind={tab}
                                    q={q}
                                    query={tab === 'people' ? people : tab === 'spaces' ? spaces : groups}
                                    unavailable={(tab === 'groups' && noGroups) || (tab === 'spaces' && !hasSpaces)}
                                    openId={openProfile ?? openContext}
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon="search"
                        title={t('Search people, posts and groups')}
                        hint={t('Type a name, a handle or words from a post in the search field, or press {{keys}} anywhere.', { keys: platform.mac ? '⌘K' : 'Ctrl+K' })}
                    />
                )}
            </div>
        </Pane>
    );
}

type EventsQuery = { data?: Event[]; isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => unknown };

/** Events whose name matches, best match first, with their dates (GET /search/events). */
function EventResults({ q, query, unavailable }: { q: string; query: EventsQuery; unavailable: boolean }) {
    if (unavailable) return <EmptyState icon="calendar" title={t('This network has no events.')} />;
    if (query.isLoading) return <SkeletonRows loading />;
    if (query.error) return <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} />;
    const items = query.data ?? [];
    if (!items.length) return <EmptyState icon="search-x" title={t('No events match “{{words}}”.', { words: q })} hint={t('Check the spelling or try fewer words.')} />;
    return (
        <ul className="list rows event-list" aria-label={t('Events matching “{{words}}”', { words: q })}>
            {items.map((e) => (
                <EventRow key={e.id} event={e} />
            ))}
        </ul>
    );
}

type DiscussionsQuery = { data?: { items: Discussion[]; more: boolean } | null; isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => unknown };

function DiscussionResults({ q, query, openId }: { q: string; query: DiscussionsQuery; openId: string | null }) {
    const { me } = useApp();
    if (query.data === null) return <EmptyState icon="messages-square" title={t('This network has no discussions.')} />;
    if (query.isLoading) return <SkeletonRows loading />;
    if (query.error) return <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} />;
    const items = query.data?.items ?? [];
    if (!items.length) return <EmptyState icon="search-x" title={t('No discussions match “{{words}}”.', { words: q })} hint={t('Check the spelling or try fewer words.')} />;
    const myIds = new Set(me.profiles.map((p) => p.id));
    return (
        <ul className="list conv-list" aria-label={t('Discussions matching “{{words}}”', { words: q })}>
            {items.map((d) => (
                <DiscussionRow key={d.id} discussion={d} selected={d.id === openId} myIds={myIds} />
            ))}
        </ul>
    );
}

type ResultsQuery = { data?: Profile[] | null; isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => unknown };

function ProfileResults({ kind, q, query, unavailable, openId }: { kind: 'people' | 'groups' | 'spaces'; q: string; query: ResultsQuery; unavailable: boolean; openId: string | null }) {
    if (unavailable) return <EmptyState icon="layout-grid" title={hasNone(kind)} />;
    if (query.isLoading) return <SkeletonRows loading />;
    if (query.error) return <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} />;
    const items = query.data ?? [];
    if (!items.length) return <EmptyState icon="search-x" title={nothingMatches(kind, q)} hint={t('Check the spelling or try fewer words.')} />;
    const contexts = kind !== 'people';
    return (
        <ul className="list rows" aria-label={matchingLabel(kind, q)}>
            {items.map((p) => (
                <li key={p.id} className={`list-row${contexts ? ' group-row' : ''}`} data-selected={p.id === openId || undefined} aria-current={p.id === openId || undefined}>
                    <ProfileAvatar profile={p} size={contexts ? 40 : 36} />
                    <div className="list-main">
                        <ProfileName profile={p} className="strong" />
                        {/* the kind of profile under its name */}
                        <span className="row-sub">{p.kind === 'group' ? (kind === 'spaces' ? t('Space') : t('Group')) : p.kind === 'organization' ? t('Organization') : t('Person')}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}
