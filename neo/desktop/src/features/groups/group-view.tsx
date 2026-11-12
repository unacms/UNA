import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { Schema } from 'una-api';

import { FeedGroupContext } from '../../components/activity-card';
import { Avatar, Cover } from '../../components/avatar';
import { type ContextAction, HeroActions } from '../../components/context-actions';
import { EmptyState } from '../../components/empty-state';
import { Icon, type IconName } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { useWindowAnnounce } from '../../lib/announce';
import { ApiError, isGone, retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { useCopyLink } from '../../lib/copy-link';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { closeThisWindow, isSecondaryWindow, openExternal } from '../../lib/native';
import type { MenuEntry } from '../../lib/native-menu';
import { useNavigation, useRoute } from '../../lib/navigation';
import { openInWindowEntry, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { CONTEXT_SECTIONS, contextDetailRoute, contextHasTab, contextPage, type GroupTab, sameRoute } from '../../lib/router';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useCompose } from '../compose/compose-sheet';
import { DiscussionRow } from '../discussions/discussion-list';
import { DISCUSSIONS_PAGE, discussionListKey } from '../discussions/discussions';
import { ContextEvents, DateTile } from '../events/event-list';
import { FilesOfTab } from '../files/file-list';
import { AlbumsOfTab } from '../photos/album-list';
import { PhotosOfTab } from '../photos/photo-list';
import { PollsOfTab } from '../polls/poll-list';
import { PostsOfTab } from '../posts/post-list';
import { ContextTasks } from '../tasks/task-list';
import { VideosOfTab } from '../videos/video-list';
import { type Event, eventWhen, eventZoneNote, goingText, hasEnded, isOngoing } from '../events/events';
import { FeedList, useAnnouncer } from '../feed/feed-list';
import { PageColumns } from '../page-blocks/page-blocks';
import { sitePath } from '../page-blocks/page-layout';
import { type FeedSource, PAGE_SIZE, useFeed } from '../feed/use-feed';
import { profileSummaryKey } from '../profile/graph';
import { HeroSkeleton } from '../profile/profile-view';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { joinEntries, moreAction, ReportDialog, type ReportTarget, siteMoreEntries, useSiteActions } from '../profile/site-more';
import { ContextRow } from './group-list';
import { answeredKind, type Context, CONTEXTS, type ContextKind, fetchAnyContext, fetchContext, fetchMembers, type Group, groupFeedKey, groupKey, groupMembersKey, membersText, membershipText, subspacesKey, subspacesText } from './groups';
import { membershipItems, useMembership } from './join-button';

const MEMBERS_PAGE = 30;
const SUBSPACES_PAGE = 30;

const ROLE_TEXT: Record<Schema<'GroupRole'>, string> = { owner: t('Owner'), admin: t('Admin'), moderator: t('Moderator'), member: t('Member') };

const TAB_LABELS: Record<GroupTab, string> = { posts: t('Posts'), spaces: t('Subspaces'), events: t('Events'), articles: t('Posts'), videos: t('Videos'), tasks: t('Tasks'), photos: t('Photos'), albums: t('Albums'), files: t('Files'), polls: t('Polls'), discussions: t('Discussions'), members: t('Members'), attendees: t('Attendees'), about: t('About') };

/** What the page says of its kind, a whole sentence for each kind. */
const NEW_POST_IN: Record<ContextKind, string> = { group: t('New post in group'), space: t('New post in space'), event: t('New post in event') };
const BROWSE: Record<ContextKind, string> = { group: t('Browse groups'), space: t('Browse spaces'), event: t('Browse events') };
const SIGN_IN_TO_JOIN: Record<ContextKind, string> = { group: t('Sign in on the site to join groups.'), space: t('Sign in on the site to join spaces.'), event: t('Sign in on the site to join events.') };

/** The tabs' accessible name: the context's name and what it is. */
function tabsLabel(name: string, kind: ContextKind): string {
    if (kind === 'space') return t('{{name}}, space', { name });
    if (kind === 'event') return t('{{name}}, event', { name });
    return t('{{name}}, group', { name });
}

/**
 * The group (or space) as GET /groups/{id} (/spaces/{id}) has it; seeded with what a list
 * showed, so its name is there at once. A group's page asks /spaces/{id} after a 404 where the
 * site may have Spaces: it was opened as a group before the site's module list was known (the
 * first run, a switch), and GroupView then moves to the space's page.
 */
export function useGroup(id: string, kind: ContextKind = 'group') {
    const { api } = useApp();
    return useQuery({ queryKey: groupKey(id), queryFn: () => (kind === 'group' ? fetchAnyContext(api, id) : fetchContext(api, kind, id)), retry: retryOnce });
}

/** Why a context can't be shown: gone, or hidden from this viewer (404 for a secret one), or refused (403). */
function goneText(error: unknown, kind: ContextKind): string {
    const refused = error instanceof ApiError && error.status === 403;
    if (kind === 'space') return refused ? t('You can’t see this space') : t('This space isn’t available');
    if (kind === 'event') return refused ? t('You can’t see this event') : t('This event isn’t available');
    return refused ? t('You can’t see this group') : t('This group isn’t available');
}

/** Why joining needs the site, for a context that says so. */
function joinOnSiteText(group: Group): string {
    return t('{{name}} asks some questions or a payment before one joins. Join it on the site (More).', { name: group.display_name });
}

/** The tabs a viewer may open: Posts and Members only where the group shows its content to them. */
export function groupTabs(group: Pick<Group, 'content_visible'> | undefined): GroupTab[] {
    return contextTabs(group, 'group');
}

/**
 * The tabs of a context's page: Posts, a space's Subspaces, Events, Tasks, the Posts module's posts, Videos, Photos, Albums, Files, Polls and Discussions (where the
 * site lets them go into it, `content_kinds`) and Members (an event's Attendees) where it shows
 * its content to the viewer; About always. A closed one seen from outside has About only, as its
 * page on the site.
 */
export function contextTabs(context: Pick<Group, 'content_visible'> & Partial<Pick<Group, 'content_kinds'>> | undefined, kind: ContextKind): GroupTab[] {
    if (!context?.content_visible) return ['about'];
    const space = kind === 'space' ? (['spaces'] as const) : [];
    const events = kind !== 'event' && context.content_kinds?.includes('events') ? (['events'] as const) : [];
    const tasks = context.content_kinds?.includes('tasks') ? (['tasks'] as const) : [];
    const articles = context.content_kinds?.includes('posts') ? (['articles'] as const) : [];
    const videos = context.content_kinds?.includes('videos') ? (['videos'] as const) : [];
    const photos = context.content_kinds?.includes('photos') ? (['photos'] as const) : [];
    const albums = context.content_kinds?.includes('albums') ? (['albums'] as const) : [];
    const files = context.content_kinds?.includes('files') ? (['files'] as const) : [];
    const polls = context.content_kinds?.includes('polls') ? (['polls'] as const) : [];
    const discussions = context.content_kinds?.includes('discussions') ? (['discussions'] as const) : [];
    return ['posts', ...space, ...events, ...tasks, ...articles, ...videos, ...photos, ...albums, ...files, ...polls, ...discussions, kind === 'event' ? 'attendees' : 'members', 'about'];
}

/** A tab's name: the feed is Feed where the page has the Posts module's posts as Posts too. */
export function tabLabel(tab: GroupTab, tabs: readonly GroupTab[]): string {
    return tab === 'posts' && tabs.includes('articles') ? t('Feed') : TAB_LABELS[tab];
}

const tabId = (groupId: string, tab: GroupTab) => `group-${groupId}-tab-${tab}`;
const panelId = (groupId: string) => `group-${groupId}-panel`;

/**
 * A group's (or a space's) page, like a profile's: cover, picture, name, its privacy and size,
 * the viewer's membership with Join, Ask to join, Leave and the others, New post in it, and its
 * tabs: Posts (its feed), a space's Subspaces, Discussions where it has them, Members and
 * About. A space in another space names it above its name, as a link. A closed one seen from
 * outside shows its name and picture, how to ask to join and About. In the main window it
 * fills the content pane (a post or a discussion opens beside it); in a window of its own it
 * is that window's detail.
 */
export function GroupView({ id, tab = 'posts', place = 'page', kind = 'group' }: { id: string; tab?: GroupTab; place?: 'page' | 'window'; kind?: ContextKind }) {
    const { history, openDetail, replaceDetail } = useNavigation();
    const route = useRoute();
    const compose = useCompose();
    const page = place === 'page';
    const [announcement, announce] = useAnnouncer();
    const [linkError, setLinkError] = useState<string | null>(null);
    const openInWindow = useOpenInWindow();
    const announceInWindow = useWindowAnnounce();
    const copyLink = useCopyLink(announceInWindow, setLinkError);
    const queryClient = useQueryClient();
    // the name and picture it was opened with (a search, a post's author), until the group is here
    const summary = queryClient.getQueryData<Schema<'Profile'>>(profileSummaryKey(id));
    const info = CONTEXTS[kind];
    const query = useGroup(id, kind);
    const gone = query.isError && isGone(query.error);
    // a group that is gone for this viewer is not drawn from what was cached before (react-query
    // keeps it on error): no card, buttons or members next to the alert; its name stays the title
    const g: Context | undefined = gone ? undefined : query.data;
    const name = query.data?.display_name ?? summary?.display_name ?? info.title;
    const available = contextTabs(g, kind);
    const current: GroupTab = available.includes(tab) ? tab : (available[0] ?? 'about');

    // Opened as a group before the site said which modules it has, it is a space: the space's
    // page, in the same place in history (as ProfileView does for a context opened as a profile).
    const belongs = g ? answeredKind(g) : null;
    useEffect(() => {
        if (!belongs || belongs === kind) return;
        const to = contextHasTab(belongs, tab) ? tab : 'posts';
        if (!page) replaceDetail(contextDetailRoute(belongs, id, to), route);
        else if (sameRoute(history.current, route)) history.replace({ list: contextPage(belongs, id, to), detail: route.detail });
    }, [belongs, kind, id, tab, page, route, replaceDetail, history]);

    // a page's tab is the page's route (an open post stays open); in a window, the window's detail
    const showTab = (to: GroupTab) => (page ? history.push({ list: contextPage(kind, id, to), detail: route.detail }) : openDetail(contextDetailRoute(kind, id, to)));

    const openSite = (url: string) => {
        setLinkError(null);
        openExternal(url).catch((e: unknown) => setLinkError(errorMessage(e)));
    };

    // the site only for what the app can't do: an admin's editing, joining a group that asks questions
    const moreOwner = `group-more-${id}`;
    // the site's own More of the context (Report ...), once it is here
    const siteActions = useSiteActions(id, !!g);
    const [reporting, setReporting] = useState<ReportTarget | null>(null);
    const moreEntries = (): MenuEntry[] => {
        const out: MenuEntry[] = [];
        if (openInWindow) out.push(openInWindowEntry(() => openInWindow(contextDetailRoute(kind, id, current))));
        if (g?.url) {
            const url = g.url;
            if (out.length) out.push('separator');
            out.push({
                text: t('Copy Link'),
                run: () => copyLink(url),
            });
            if (g.viewer?.can_edit) out.push({ text: t('Edit on Site'), run: () => openSite(url) });
            else if (g.viewer?.join_on_site) out.push({ text: t('Join on Site'), run: () => openSite(url) });
        }
        // the site's items first, as the site's More lists them (a context's editing is the site's)
        const site = siteMoreEntries(siteActions, { report: (item) => setReporting({ id, name: g?.display_name ?? info.title, choices: item.choices ?? [] }), edit: () => undefined }, ['edit']);
        return joinEntries(site, out);
    };

    // the hero's buttons, and the toolbar's copy of them once they are scrolled under it
    const membership = useMembership(g, { announce, kind });
    // and after them More, next to them, the site's and the app's items for it
    const heroActions: ContextAction[] = [
        ...membershipItems(membership),
        ...(g?.viewer?.can_post && compose ? [{ key: 'new-post', label: NEW_POST_IN[kind], icon: 'square-pen' as const, iconWithLabel: true, run: () => compose.open(undefined, g.id) }] : []),
        ...(g && (g.url || openInWindow || siteActions.some((a) => a.action === 'report')) ? [moreAction(moreOwner, g.display_name, moreEntries)] : []),
    ];

    // the toolbar keeps Close in a window of its own; a page has none of its own
    const actions = page ? undefined : <CloseDetailButton />;

    return (
        <Pane
            pane={page ? 'list' : 'detail'}
            names
            title={name}
            hideTitle={g ? 'until-scrolled' : undefined}
            hero={g ? { picture: <Avatar profile={g} size={24} shape="square" /> } : undefined}
            actions={actions}
            heroActions={heroActions}
            ready={!!g || query.isError}
            busy={query.isLoading}
        >
            <ReportDialog target={reporting} onClose={() => setReporting(null)} onDone={announce} />
            <div className="profile-view group-view">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {gone ? (
                    <EmptyState
                        icon="users-round"
                        title={goneText(query.error, kind)}
                        hint={t('It may be private, or it was removed.')}
                        actions={
                            isSecondaryWindow ? (
                                <button type="button" className="btn btn-primary" onClick={closeThisWindow}>
                                    {t('Close window')}
                                </button>
                            ) : (
                                <button type="button" className="btn btn-primary" onClick={() => history.push({ list: { section: CONTEXT_SECTIONS[kind] }, detail: null })}>
                                    {BROWSE[kind]}
                                </button>
                            )
                        }
                    />
                ) : query.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(query.error)}</span>
                        </p>
                        <button type="button" className="btn" onClick={() => void query.refetch()} aria-busy={query.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {linkError ? (
                    <p className="error small hero-error" role="alert">
                        {linkError}
                    </p>
                ) : null}

                {g ? (
                    <>
                        <header className="hero">
                            <Cover profile={g} url={g.cover} />
                            <div className="hero-body">
                                <span className="hero-avatar">{g.event ? <DateTile event={g.event} /> : <Avatar profile={g} size={80} shape="square" />}</span>
                                <div className="hero-identity">
                                    {/* above the name, on a line of its own: the actions sit level with the name */}
                                    {kind === 'space' && g.parent_id ? <ParentSpace id={g.parent_id} place={place} /> : null}
                                    {g.event?.context_id ? <EventContext id={g.event.context_id} place={place} /> : null}
                                    <div className="hero-text">
                                    {/* the pane's heading says the name to screen readers; the badges are said after it */}
                                    <div className="hero-name-line">
                                        <div className="profile-name" aria-hidden="true" dir="auto">
                                            {g.display_name}
                                        </div>
                                        <ProfileBadges badges={g.badges} max={Infinity} lead={t('Badges: ')} />
                                    </div>
                                    {g.event ? <EventFacts event={g.event} /> : <GroupFacts group={g} kind={kind} />}
                                    {g.viewer?.join_on_site ? <p className="hero-facts">{joinOnSiteText(g)}</p> : null}
                                    {!g.viewer ? <p className="hero-facts">{SIGN_IN_TO_JOIN[kind]}</p> : null}
                                    </div>
                                    <HeroActions
                                        actions={heroActions}
                                        errors={
                                            membership.error ? (
                                                <p className="error small" role="alert">
                                                    {membership.error}
                                                </p>
                                            ) : undefined
                                        }
                                    />
                                </div>
                            </div>
                        </header>
                        {!g.content_visible ? (
                            <div className="grouped hero-note">
                                <Icon name="lock-keyhole" size={28} />
                                <p>
                                    {kind === 'event'
                                        ? g.viewer?.status === 'pending'
                                            ? t('Its organisers have your request. Its posts and who is going show here once they let you in.')
                                            : t('Only those going see this event’s posts and who else is going.')
                                        : g.viewer?.status === 'pending'
                                          ? t('Its admins have your request. Its posts and members show here once they let you in.')
                                          : kind === 'space'
                                            ? t('Only members see this space’s posts and members.')
                                            : t('Only members see this group’s posts and members.')}
                                </p>
                            </div>
                        ) : null}
                        {available.length > 1 ? (
                            <SegmentedTabs
                                label={tabsLabel(g.display_name, kind)}
                                values={available}
                                labels={Object.fromEntries(available.map((a) => [a, tabLabel(a, available)])) as Record<GroupTab, string>}
                                current={current}
                                onChange={showTab}
                                panelId={panelId(id)}
                                tabId={(a) => tabId(id, a)}
                                className="profile-tabs"
                                look="pills"
                                fit
                            />
                        ) : null}
                        <div id={panelId(id)} role={available.length > 1 ? 'tabpanel' : undefined} aria-labelledby={available.length > 1 ? tabId(id, current) : undefined} className="profile-panel">
                            {current === 'posts' ? (
                                <GroupTimeline group={g} page={page} selectedId={page && route.detail?.kind === 'post' ? route.detail.id : null} />
                            ) : current === 'spaces' ? (
                                <Subspaces space={g} />
                            ) : current === 'events' ? (
                                <ContextEvents contextId={g.id} name={g.display_name} />
                            ) : current === 'tasks' ? (
                                <ContextTasks context={g} selectedId={route.detail?.kind === 'task' ? route.detail.id : null} />
                            ) : current === 'articles' ? (
                                <PostsOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'videos' ? (
                                <VideosOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'photos' ? (
                                <PhotosOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'albums' ? (
                                <AlbumsOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'files' ? (
                                <FilesOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'polls' ? (
                                <PollsOfTab of={{ context: g.id }} name={g.display_name} canAdd={!!g.viewer?.can_post} />
                            ) : current === 'discussions' ? (
                                <ContextDiscussions context={g} kind={kind} selectedId={route.detail?.kind === 'discussion' ? route.detail.id : null} />
                            ) : current === 'members' || current === 'attendees' ? (
                                <Members group={g} kind={kind} />
                            ) : g.event ? (
                                <EventAbout event={g.event} />
                            ) : (
                                <GroupAbout group={g} />
                            )}
                        </div>
                    </>
                ) : query.isLoading ? (
                    <HeroSkeleton />
                ) : null}
            </div>
        </Pane>
    );
}

/**
 * The space a space is in, above its name: "In Makers Guild", a link to its page (in a window
 * of its own, that window's detail).
 */
function ParentSpace({ id, place }: { id: string; place: 'page' | 'window' }) {
    const { history, openDetail } = useNavigation();
    const parent = useGroup(id, 'space');
    if (!parent.data) return null;
    const p = parent.data;
    return (
        <p className="hero-crumb">
            <Icon name="orbit" size={12} strong />
            <span>
                {rich(t('In <a>{{name}}</a>', { name: p.display_name }), {
                    a: (text) => (
                        <button
                            type="button"
                            className="profile-link"
                            onClick={() => (place === 'page' ? history.push({ list: contextPage('space', p.id), detail: null }) : openDetail(contextDetailRoute('space', p.id)))}
                        >
                            <bdi>{text}</bdi>
                        </button>
                    ),
                })}
            </span>
        </p>
    );
}

/**
 * The group or space an event is in, above its name: "In Makers Guild", a link to its page (in
 * a window of its own, that window's detail).
 */
function EventContext({ id, place }: { id: string; place: 'page' | 'window' }) {
    const { history, openDetail } = useNavigation();
    const context = useGroup(id, 'group');
    if (!context.data) return null;
    const c = context.data;
    const kind = answeredKind(c) ?? 'group';
    return (
        <p className="hero-crumb">
            <Icon name={CONTEXTS[kind].icon} size={12} strong />
            <span>
                {rich(t('In <a>{{name}}</a>', { name: c.display_name }), {
                    a: (text) => (
                        <button type="button" className="profile-link" onClick={() => (place === 'page' ? history.push({ list: contextPage(kind, c.id), detail: null }) : openDetail(contextDetailRoute(kind, c.id)))}>
                            <bdi>{text}</bdi>
                        </button>
                    ),
                })}
            </span>
        </p>
    );
}

/**
 * An event's facts under its name: when, in the viewer's zone (now, ended), its own zone's times
 * where that is another, where, who organises it, how many are going and the viewer's answer.
 */
function EventFacts({ event: e }: { event: Event }) {
    const zone = eventZoneNote(e);
    const privacy = PRIVACY_LOOK[e.visibility];
    const status = e.viewer?.rsvp === 'going' ? t('You’re going') : e.viewer?.status === 'pending' ? t('Request sent') : e.viewer?.status === 'invited' ? t('Invited') : '';
    const organiser = e.author ? <ProfileName profile={e.author} /> : null;
    return (
        <>
            <p className="hero-facts event-when">
                <span className="hero-fact">
                    <Icon name="clock" size={12} strong />
                    <time dateTime={e.starts_at ?? undefined}>{eventWhen(e)}</time>
                </span>
                {isOngoing(e) ? <span className="hero-fact group-status">{t('Happening now')}</span> : hasEnded(e) ? <span className="hero-fact">{t('Ended')}</span> : null}
            </p>
            {zone ? <p className="hero-facts">{zone}</p> : null}
            {e.location ? (
                <p className="hero-facts">
                    <span className="hero-fact">
                        <Icon name="map-pin" size={12} strong />
                        <span>{e.location}</span>
                    </span>
                </p>
            ) : null}
            <div className="hero-facts">
                {e.author ? (
                    <span className="hero-fact">
                        <span>{rich(t('By <name></name>'), { name: () => organiser })}</span>
                    </span>
                ) : null}
                {privacy ? (
                    <span className="hero-fact">
                        <Icon name={privacy.icon} size={12} strong />
                        {privacy.words}
                    </span>
                ) : null}
                <span className="hero-fact">
                    <Icon name="users-round" size={12} strong />
                    {goingText(e.going_count)}
                </span>
                {status ? <span className="hero-fact group-status">{status}</span> : null}
            </div>
        </>
    );
}

/** An event's About tab: its description (the site's HTML, sanitized), and when and where it is. */
function EventAbout({ event: e }: { event: Event }) {
    const zone = eventZoneNote(e);
    return (
        <div className="profile-about-tab event-about">
            <dl className="event-details">
                <dt>{t('When')}</dt>
                <dd>
                    {eventWhen(e)}
                    {zone ? <span className="muted">{` (${zone})`}</span> : null}
                </dd>
                {e.location ? (
                    <>
                        <dt>{t('Where')}</dt>
                        <dd>{e.location}</dd>
                    </>
                ) : null}
                {e.author ? (
                    <>
                        <dt>{t('Organiser')}</dt>
                        <dd>
                            <ProfileName profile={e.author} />
                        </dd>
                    </>
                ) : null}
            </dl>
            {e.body_html ? (
                <RichText html={e.body_html} className="profile-about" />
            ) : e.summary ? (
                <p className="profile-about" dir="auto">
                    {e.summary}
                </p>
            ) : e.content_visible ? (
                <p className="muted">{t('{{name}} has no description yet.', { name: e.title })}</p>
            ) : null}
        </div>
    );
}

/** A space's subspaces (GET /spaces/{id}/spaces), newest first, page by page; each opens its page. */
function Subspaces({ space }: { space: Context }) {
    const { api } = useApp();
    const [announcement, announce] = useAnnouncer();
    const [acted, setActed] = useState<ReadonlySet<string>>(() => new Set());
    const query = useInfiniteQuery({
        queryKey: subspacesKey(space.id),
        queryFn: async ({ pageParam }) =>
            unwrap(await api.GET('/spaces/{id}/spaces', { params: { path: { id: space.id }, query: { cursor: pageParam as string | undefined, limit: SUBSPACES_PAGE } } })),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        retry: retryOnce,
    });
    useFillEmptyPages(query);
    const items: Context[] = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = emptyListText(query, items.length, t('{{name}} has no subspaces.', { name: space.display_name }));
    const headingId = `space-${space.id}-subspaces`;
    return (
        <section className="connections" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {space.child_count ? tn(space.child_count, 'Subspaces, {{count}} subspace', 'Subspaces, {{count}} subspaces') : t('Subspaces')}
            </h3>
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            {query.isLoading ? <p className="muted">{t('Loading…')}</p> : null}
            {query.isError ? (
                <div className="inline-error" role="alert">
                    <p className="error">{errorMessage(query.error)}</p>
                    <button type="button" className="btn" onClick={() => void query.refetch()} aria-busy={query.isFetching}>
                        {t('Try again')}
                    </button>
                </div>
            ) : null}
            <p className={empty ? 'muted empty' : 'sr-only'} role="status">
                {empty}
            </p>
            {items.length ? (
                <ul className="list rows group-list" aria-labelledby={headingId}>
                    {items.map((s) => (
                        <ContextRow key={s.id} context={s} kind="space" announce={announce} acted={acted.has(s.id)} onAction={() => setActed((a) => new Set(a).add(s.id))} />
                    ))}
                </ul>
            ) : null}
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
                    {t('Load more subspaces')}
                </button>
            ) : null}
        </section>
    );
}

/**
 * The discussions in a group or space (GET /discussions?context_id=), the latest reply first; one
 * opens beside the page. Members start one there (POST /discussions with the context: the site
 * says no to those who may not).
 */
function ContextDiscussions({ context, kind, selectedId }: { context: Context; kind: ContextKind; selectedId: string | null }) {
    const { api, me } = useApp();
    const { openDetail } = useNavigation();
    const query = useInfiniteQuery({
        queryKey: discussionListKey('latest', context.id),
        queryFn: async ({ pageParam }) =>
            unwrap(await api.GET('/discussions', { params: { query: { sort: 'latest', context_id: context.id, cursor: pageParam as string | undefined, limit: DISCUSSIONS_PAGE } } })),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        retry: retryOnce,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = emptyListText(query, items.length, t('No discussions in {{name}} yet', { name: context.display_name }));
    const myIds = new Set(me.profiles.map((p) => p.id));
    const canStart = context.viewer?.status === 'active';
    const start = () => openDetail({ kind: 'new-discussion', groupId: context.id });
    const headingId = `${kind}-${context.id}-discussions`;
    return (
        <section className="connections context-discussions" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Discussions')}
            </h3>
            {canStart ? (
                <div className="context-tab-actions">
                    <button type="button" className="btn" onClick={start}>
                        <Icon name="square-pen" />
                        {t('New discussion')}
                    </button>
                </div>
            ) : null}
            {query.isLoading ? <p className="muted">{t('Loading…')}</p> : null}
            {query.isError ? (
                <div className="inline-error" role="alert">
                    <p className="error">{errorMessage(query.error)}</p>
                    <button type="button" className="btn" onClick={() => void query.refetch()} aria-busy={query.isFetching}>
                        {t('Try again')}
                    </button>
                </div>
            ) : null}
            <p className={empty ? 'muted empty' : 'sr-only'} role="status">
                {empty}
            </p>
            {items.length ? (
                <ul className="list conv-list" aria-label={t('Discussions in {{name}}, latest reply first', { name: context.display_name })}>
                    {items.map((d) => (
                        <DiscussionRow key={d.id} discussion={d} selected={selectedId === d.id} myIds={myIds} />
                    ))}
                </ul>
            ) : null}
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
                    {t('Load more discussions')}
                </button>
            ) : null}
        </section>
    );
}

const PRIVACY_LOOK: Record<Schema<'GroupVisibility'>, { icon: IconName; words: string }> = {
    public: { icon: 'globe', words: t('Public') },
    members: { icon: 'users', words: t('Members only') },
    closed: { icon: 'lock-keyhole', words: t('Closed') },
    secret: { icon: 'eye-off', words: t('Secret') },
    context: { icon: 'users', words: t('Same as its space') },
    other: { icon: 'shield', words: t('Custom privacy') },
};

/** The group's privacy, size (a space's subspaces) and the viewer's place in it, on one line with small icons (spec 6.3). */
function GroupFacts({ group: g, kind }: { group: Context; kind: ContextKind }) {
    const privacy = PRIVACY_LOOK[g.visibility];
    const status = membershipText(g.viewer);
    return (
        <div className="hero-facts">
            {privacy ? (
                <span className="hero-fact">
                    <Icon name={privacy.icon} size={12} strong />
                    {privacy.words}
                </span>
            ) : null}
            <span className="hero-fact">
                <Icon name="users-round" size={12} strong />
                {membersText(g.member_count)}
            </span>
            {kind === 'space' && g.child_count ? (
                <span className="hero-fact">
                    <Icon name="orbit" size={12} strong />
                    {subspacesText(g.child_count)}
                </span>
            ) : null}
            {status ? <span className="hero-fact group-status">{status}</span> : null}
        </div>
    );
}

/** The About tab: what the group says about itself. */
function GroupAbout({ group: g }: { group: Group }) {
    return (
        <div className="profile-about-tab">
            {g.about ? (
                <p className="profile-about" dir="auto">
                    {g.about}
                </p>
            ) : (
                <p className="muted">{t('{{name}} has no description yet.', { name: g.display_name })}</p>
            )}
        </div>
    );
}

/** The group's posts (its profile timeline); New post into it is in the hero. On its page, the site's blocks about it go beside them. */
function GroupTimeline({ group, page, selectedId }: { group: Group; page: boolean; selectedId: string | null }) {
    const { api, siteUrl } = useApp();
    const compose = useCompose();
    const source = useMemo<FeedSource>(
        () => ({
            key: groupFeedKey(group.id),
            load: async (cursor) => unwrap(await api.GET('/profiles/{id}/timeline', { params: { path: { id: group.id }, query: { cursor, limit: PAGE_SIZE } } })),
        }),
        [api, group.id],
    );
    const feed = useFeed(source);
    const write = group.viewer?.can_post && compose ? () => compose.open(undefined, group.id) : null;
    const list = (
        // the posts are in this group: their "in <group>" line would only repeat it
        <FeedGroupContext.Provider value={group.id}>
            <FeedList
                feed={feed}
                cacheKey={`group/${group.id}`}
                label={t('{{name}}, posts', { name: group.display_name })}
                empty={{
                    icon: 'square-pen',
                    title: t('No posts in {{name}} yet', { name: group.display_name }),
                    actions: write ? (
                        <button type="button" className="btn btn-primary" onClick={write}>
                            {t('Write the first post')}
                        </button>
                    ) : undefined,
                }}
                selectedId={selectedId}
                // on a page j and k move through these posts; in a window the arrow keys do
                listCommands={page}
            />
        </FeedGroupContext.Provider>
    );
    if (!page) return list;
    // on its page, the site's blocks about it beside its posts (Info, Members), from its page on the site
    return (
        <PageColumns path={sitePath(group.url, siteUrl)} title={group.display_name} ended={feed.query.isSuccess && !feed.query.hasNextPage} about>
            {list}
        </PageColumns>
    );
}

type MembersPage = Schema<'Page_Member'>;

/** The group's (or space's) members, newest first, page by page; names open the profile. */
function Members({ group, kind }: { group: Group; kind: ContextKind }) {
    const { api } = useApp();
    const query = useInfiniteQuery({
        queryKey: groupMembersKey(group.id),
        queryFn: async ({ pageParam }): Promise<MembersPage> => fetchMembers(api, kind, group.id, pageParam as string | undefined, MEMBERS_PAGE),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        retry: retryOnce,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = emptyListText(query, items.length, kind === 'event' ? t('No one is going yet.') : t('No members yet.'));
    const headingId = `group-${group.id}-members`;

    return (
        <section className="connections" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {kind === 'event' ? t('Attendees') : t('Members')}
            </h3>
            {query.isLoading ? <p className="muted">{t('Loading…')}</p> : null}
            {query.isError ? (
                <div className="inline-error" role="alert">
                    <p className="error">{errorMessage(query.error)}</p>
                    <button type="button" className="btn" onClick={() => void query.refetch()} aria-busy={query.isFetching}>
                        {t('Try again')}
                    </button>
                </div>
            ) : null}
            <p className={empty ? 'muted empty' : 'sr-only'} role="status">
                {empty}
            </p>
            {items.length ? (
                <ul className="list rows" aria-labelledby={headingId}>
                    {items.map((m) => (
                        <li key={m.profile.id} className="list-row">
                            <ProfileAvatar profile={m.profile} size={32} />
                            <div className="list-main">
                                <ProfileName profile={m.profile} />
                                {m.role !== 'member' ? <div className="muted small">{ROLE_TEXT[m.role]}</div> : null}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}
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
                    {t('Load more members')}
                </button>
            ) : null}
        </section>
    );
}
