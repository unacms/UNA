import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { Schema } from 'una-api';

import { Avatar, Cover } from '../../components/avatar';
import { type ContextAction, HeroActions } from '../../components/context-actions';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { Tooltip } from '../../components/tooltip';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { useWindowAnnounce } from '../../lib/announce';
import { ApiError, isGone, retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { useCopyLink } from '../../lib/copy-link';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { openExternal } from '../../lib/native';
import { type MenuEntry, showMenu, useMenuExpanded } from '../../lib/native-menu';
import { useNavigation, useRoute } from '../../lib/navigation';
import { openInWindowEntry, useOpenInWindow } from '../../lib/open-in-window';
import { connectionsRoute, contextPage, profilePage, profileRoute, type ProfileTab, sameRoute } from '../../lib/router';
import { contextKindOf, useSiteHasTag } from '../../lib/site-modules';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useCompose } from '../compose/compose-sheet';
import { EventsOfTab } from '../events/event-list';
import { FilesOfTab } from '../files/file-list';
import { AlbumsOfTab } from '../photos/album-list';
import { PhotosOfTab } from '../photos/photo-list';
import { PollsOfTab } from '../polls/poll-list';
import { PostsOfTab } from '../posts/post-list';
import { VideosOfTab } from '../videos/video-list';
import { FeedList, useAnnouncer } from '../feed/feed-list';
import { type FeedSource, PAGE_SIZE, useFeed } from '../feed/use-feed';
import { PageColumns } from '../page-blocks/page-blocks';
import { sitePath } from '../page-blocks/page-layout';
import { ConnectionsList } from './connections-list';
import { useFriendRequestsAction } from './friend-requests';
import { type ConnectionList, connectionsKey, countText, profileKey, profileSummaryKey, relationSummary } from './graph';
import { relationItems, useRelation } from './relation-buttons';
import { joinEntries, moreAction, ReportDialog, type ReportTarget, siteMoreEntries, useSiteActions } from './site-more';

const TAB_LABELS: Record<ProfileTab, string> = { posts: t('Posts'), friends: t('Friends'), followers: t('Followers'), following: t('Following'), events: t('Events'), articles: t('Posts'), videos: t('Videos'), photos: t('Photos'), albums: t('Albums'), files: t('Files'), polls: t('Polls'), about: t('About') };

/** What a tab that can't be opened, or that waits, says: a whole sentence for each tab (the feed and About always open). */
const NOT_LOADED: Partial<Record<ProfileTab, string>> = {
    friends: t('Could not load Friends; showing the posts.'),
    followers: t('Could not load Followers; showing the posts.'),
    following: t('Could not load Following; showing the posts.'),
};
const NOT_SHOWN: Partial<Record<ProfileTab, string>> = {
    friends: t('Friends isn’t shown for this profile; showing the posts.'),
    followers: t('Followers isn’t shown for this profile; showing the posts.'),
    following: t('Following isn’t shown for this profile; showing the posts.'),
    events: t('Events isn’t shown for this profile; showing the posts.'),
    articles: t('Posts isn’t shown for this profile; showing the posts.'),
    videos: t('Videos isn’t shown for this profile; showing the posts.'),
    photos: t('Photos isn’t shown for this profile; showing the posts.'),
    albums: t('Albums isn’t shown for this profile; showing the posts.'),
    files: t('Files isn’t shown for this profile; showing the posts.'),
    polls: t('Polls isn’t shown for this profile; showing the posts.'),
};
const LOADING: Partial<Record<ProfileTab, string>> = {
    friends: t('Loading friends…'),
    followers: t('Loading followers…'),
    following: t('Loading following…'),
    events: t('Loading events…'),
    articles: t('Loading posts…'),
    videos: t('Loading videos…'),
    photos: t('Loading photos…'),
    albums: t('Loading albums…'),
    files: t('Loading files…'),
    polls: t('Loading polls…'),
};

/** The tabs a viewer may open: Posts always, a list when the site lets the viewer see it (About comes last, always). */
export function profileTabs(connections: Schema<'Connections'> | undefined): ProfileTab[] {
    const lists: ConnectionList[] = ['friends', 'followers', 'following'];
    return ['posts', ...lists.filter((l) => !!connections?.lists[l])];
}

/** Where a profile is shown: a page in the main window's content pane, or a window of its own. */
export type ProfilePlace = 'page' | 'window';

const tabId = (profileId: string, tab: ProfileTab) => `profile-${profileId}-tab-${tab}`;
const panelId = (profileId: string) => `profile-${profileId}-panel`;

/** Why a profile can't be shown: gone (404, 410) or not for this viewer (403). */
function goneText(error: unknown): string {
    return error instanceof ApiError && error.status === 403 ? t('You can’t see this profile') : t('This profile is no longer here');
}

/** What a profile shown only in part says, and where to go on with it. */
export function partlyText(kind: Schema<'ProfileKind'> | undefined): string {
    return kind === 'group'
        ? t('You can’t see this group here. To see what it shows you or to ask to join, open it on the site (More).')
        : t('You can’t see this profile here. To see what it shows you or to connect, open it on the site (More).');
}

function refusedError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 403;
}

/** "Member since March 2026". */
export function memberSince(iso: string): string | null {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return t('Member since {{month}}', { month: new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(d) });
}

/** The hero while a profile or group loads: the cover band, the picture's place and three bars. */
export function HeroSkeleton() {
    return (
        <div className="hero hero-skeleton" aria-hidden="true">
            <div className="cover skeleton-fill" />
            <div className="hero-body">
                <span className="hero-avatar">
                    <span className="skeleton-circle skeleton-80" />
                </span>
                <div className="skeleton-bars hero-identity">
                    <span className="skeleton-bar" style={{ width: '40%' }} />
                    <span className="skeleton-bar" style={{ width: '90%' }} />
                    <span className="skeleton-bar" style={{ width: '60%' }} />
                </div>
            </div>
        </div>
    );
}

/**
 * A profile's page: cover, picture, name and handle, its counts, the viewer's relation buttons
 * (Follow, Add friend, Accept, Message ...; one's own: Edit profile, Friend requests) and its
 * tabs: Posts (the timeline), Friends, Followers and Following when the site lets the viewer see
 * them, and About. In the main window it fills the content pane (a post opens beside it); in a
 * window of its own it is that window's detail.
 */
export function ProfileView({ id, tab, place = 'page' }: { id: string; tab: ProfileTab; place?: ProfilePlace }) {
    const { api, me } = useApp();
    const { history, openDetail, replaceDetail } = useNavigation();
    const route = useRoute();
    const page = place === 'page';
    const [announcement, announce] = useAnnouncer();
    const [linkError, setLinkError] = useState<string | null>(null);
    const openInWindow = useOpenInWindow();
    const announceInWindow = useWindowAnnounce();
    const copyLink = useCopyLink(announceInWindow, setLinkError);

    const queryClient = useQueryClient();
    // the name and picture the profile was opened from, until the profile itself is here
    const summary = { data: queryClient.getQueryData<Schema<'Profile'>>(profileSummaryKey(id)) };
    const profile = useQuery({ queryKey: profileKey(id), queryFn: async () => unwrap(await api.GET('/profiles/{id}', { params: { path: { id } } })), retry: retryOnce });
    const connections = useQuery({ queryKey: connectionsKey(id), queryFn: async () => unwrap(await api.GET('/profiles/{id}/connections', { params: { path: { id } } })), retry: retryOnce, enabled: !profile.isError });

    // A group opened as a profile (a notification says profile for both) is shown as a group,
    // in the same place in history.
    // A space as a space, by its module; a context the app has no page for (an event) stays here.
    const opened = profile.data ?? summary.data;
    const contextKind = opened?.kind === 'group' ? contextKindOf(opened.module) : null;
    useEffect(() => {
        if (!contextKind) return;
        if (!page) replaceDetail({ kind: contextKind, id }, route);
        else if (sameRoute(history.current, route)) history.replace({ list: contextPage(contextKind, id), detail: route.detail });
    }, [contextKind, id, route, replaceDetail, page, history]);

    const gone = profile.isError && isGone(profile.error);
    // Refused (403) but opened from a search, which lists profiles the site shows in part (for
    // friends only, a closed group): their name and picture stay, with the site's page, where
    // the viewer can ask to connect or join, instead of a dead end.
    const partly = gone && profile.error instanceof ApiError && profile.error.status === 403 && !!summary.data;
    const p = gone ? undefined : profile.data;
    const siteUrl = p?.url ?? (partly ? summary.data?.url : null) ?? null;
    // the site only for a profile the app can't show (the rest is here, own profile edits too)
    const partlyUrl = partly ? (summary.data?.url ?? null) : null;
    const shownName = p?.display_name ?? summary.data?.display_name;
    const own = me.profiles.some((x) => x.id === id);
    const c = connections.data;
    // the events they made, on a site with Events (GET /events?author=)
    const hasEvents = useSiteHasTag('events');
    // and the videos they added, on a site with Videos (GET /videos?author=)
    const hasVideos = useSiteHasTag('videos');
    // the photos and albums they added, on a site with Photos and Albums
    const hasPhotos = useSiteHasTag('photos');
    const hasAlbums = useSiteHasTag('albums');
    // and the files they added, on a site with Files (GET /files?author=)
    const hasFiles = useSiteHasTag('files');
    // and the polls they asked, on a site with Polls (GET /polls?author=)
    const hasPolls = useSiteHasTag('polls');
    // and the Posts module's posts they wrote, on a site with Posts (GET /posts?author=); the feed is Feed then
    const hasPosts = useSiteHasTag('posts');
    const label = (which: ProfileTab) => (which === 'posts' && hasPosts ? t('Feed') : TAB_LABELS[which]);
    const available: ProfileTab[] = [
        ...profileTabs(c),
        ...(hasEvents ? (['events'] as const) : []),
        ...(hasPosts ? (['articles'] as const) : []),
        ...(hasVideos ? (['videos'] as const) : []),
        ...(hasPhotos ? (['photos'] as const) : []),
        ...(hasAlbums ? (['albums'] as const) : []),
        ...(hasFiles ? (['files'] as const) : []),
        ...(hasPolls ? (['polls'] as const) : []),
        'about',
    ];
    // A list tab waits for the connections, which say whether the viewer may open it, instead of
    // drawing the posts first (Events, for the site's module list); one the viewer may not open
    // (any more) shows the posts, and says so.
    const listTab = tab !== 'posts' && tab !== 'about';
    // the tabs of a module wait for the site's module list, the others for the connections
    const moduleTab = { events: hasEvents, videos: hasVideos, photos: hasPhotos, albums: hasAlbums, files: hasFiles, polls: hasPolls, articles: hasPosts } as Partial<Record<ProfileTab, boolean | null>>;
    const waiting = listTab && (tab in moduleTab ? moduleTab[tab] === null : !c && connections.isLoading);
    const refused = listTab && !waiting && !available.includes(tab);
    const current: ProfileTab = available.includes(tab) ? tab : 'posts';

    // a page's tab is the page's route (one's own page keeps naming no id); an open post stays open
    const showTab = (to: ProfileTab) =>
        page ? history.push({ list: profilePage(route.list.section === 'profile' && !route.list.profile ? null : id, to), detail: route.detail }) : openDetail(profileRoute(id, to));

    const shown = p ?? summary.data;
    const moreOwner = `profile-more-${id}`;
    const moreOpen = useMenuExpanded(moreOwner);
    // the site's own More (Report ...), once the profile is here
    const siteActions = useSiteActions(id, !!p);
    const [reporting, setReporting] = useState<ReportTarget | null>(null);
    const moreEntries = (): MenuEntry[] => {
        const out: MenuEntry[] = [];
        if (openInWindow) out.push(openInWindowEntry(() => openInWindow(profileRoute(id, current))));
        if (siteUrl) {
            if (out.length) out.push('separator');
            out.push({
                text: t('Copy Link'),
                run: () => copyLink(siteUrl),
            });
        }
        if (partlyUrl) {
            out.push({
                text: t('Open on Site'),
                run: () => {
                    setLinkError(null);
                    openExternal(partlyUrl).catch((e: unknown) => setLinkError(errorMessage(e)));
                },
            });
        }
        // the site's items first, as the site's More lists them; its Edit Profile is the hero's
        // own Edit profile on one's own profile, and the app's editor edits no one else's
        const site = siteMoreEntries(siteActions, { report: (item) => setReporting({ id, name: shownName ?? t('this profile'), choices: item.choices ?? [] }), edit: () => openDetail({ kind: 'edit-profile', id }) }, ['edit']);
        return joinEntries(site, out);
    };

    // With the profile here, More is next to the hero's actions; the toolbar keeps Close (in a
    // window of its own). Without it (a profile shown in part, or while it loads) More is there.
    const close = page ? undefined : <CloseDetailButton />;
    const actions = p ? (
        close
    ) : (
        <>
            {shown && (siteUrl || openInWindow) ? (
                <Tooltip text={t('More')}>
                    <button
                        type="button"
                        className="tb-btn"
                        aria-label={t('More for {{name}}', { name: shown.display_name })}
                        aria-haspopup="menu"
                        aria-expanded={moreOpen}
                        onClick={(e) => void showMenu(moreEntries(), { anchor: e.currentTarget }, { label: shown.display_name, owner: moreOwner })}
                    >
                        <Icon name="ellipsis" />
                    </button>
                </Tooltip>
            ) : null}
            {page ? null : <CloseDetailButton />}
        </>
    );
    // the hero's buttons, and the toolbar's copy of them once they are scrolled under it:
    // one's own profile Edit profile (and on one's page Friend requests), another's the relation's
    const relation = useRelation(p && c ? p : undefined, c, announce);
    const friendRequests = useFriendRequestsAction();
    // and after them More, the site's and the app's items for the profile
    const hasMore = !!p && !!(siteUrl || openInWindow || siteActions.some((a) => a.action === 'report'));
    const heroActions: ContextAction[] = [
        ...(p && own
            ? [
                  { key: 'edit-profile', label: t('Edit profile'), icon: 'square-pen', iconWithLabel: true, run: () => openDetail({ kind: 'edit-profile', id }) } satisfies ContextAction,
                  ...(page && p.id === me.active_profile_id ? [friendRequests] : []),
              ]
            : relationItems(relation)),
        ...(p && hasMore ? [moreAction(moreOwner, p.display_name, moreEntries)] : []),
    ];

    const since = p?.created_at ? memberSince(p.created_at) : null;
    const facts = [p && p.kind !== 'person' ? (p.kind === 'group' ? t('Group') : t('Organization')) : null, c?.viewer ? relationSummary(c.viewer) : null].filter(Boolean).join(' · ');

    return (
        <Pane
            pane={page ? 'list' : 'detail'}
            names
            title={shownName ?? t('Profile')}
            hideTitle={p ? 'until-scrolled' : undefined}
            hero={p ? { picture: <Avatar profile={p} size={24} /> } : undefined}
            actions={actions}
            heroActions={heroActions}
            ready={!!p}
            busy={profile.isLoading}
        >
            <ReportDialog target={reporting} onClose={() => setReporting(null)} onDone={announce} />
            <div className="profile-view">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {gone && !partly ? (
                    <EmptyState
                        icon={refusedError(profile.error) ? 'lock' : 'circle-user-round'}
                        title={goneText(profile.error)}
                        hint={refusedError(profile.error) && shownName ? t('{{name}} shares it with some people only.', { name: shownName }) : undefined}
                    />
                ) : profile.isError && !gone ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(profile.error)}</span>
                        </p>
                        <button type="button" className="btn" onClick={() => void profile.refetch()} aria-busy={profile.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {linkError ? (
                    <p className="error small hero-error" role="alert">
                        {linkError}
                    </p>
                ) : null}

                {(!gone || partly) && shown ? (
                    <header className="hero">
                        <Cover profile={shown} url={p?.cover} />
                        <div className="hero-body">
                            <span className="hero-avatar">
                                <Avatar profile={shown} size={80} />
                            </span>
                            <div className="hero-identity">
                                <div className="hero-text">
                                {/* the pane's heading says the name to screen readers; the badges are said after it */}
                                <div className="hero-name-line">
                                    <div className="profile-name" aria-hidden="true" dir="auto">
                                        {shownName}
                                    </div>
                                    <ProfileBadges badges={shown.badges} max={Infinity} lead={t('Badges: ')} />
                                </div>
                                {p?.handle ? (
                                    <div className="hero-handle handle" dir="auto">
                                        @{p.handle}
                                    </div>
                                ) : null}
                                {facts ? <div className="hero-facts">{facts}</div> : null}
                                {c ? <Counts connections={c} available={available} onOpen={showTab} /> : null}
                                </div>
                                <HeroActions
                                    actions={heroActions}
                                    errors={
                                        relation.error || connections.isError ? (
                                            <>
                                                {relation.error ? (
                                                    <p className="error" role="alert">
                                                        {relation.error}
                                                    </p>
                                                ) : null}
                                                {connections.isError ? (
                                                    <p className="error small" role="alert">
                                                        {errorMessage(connections.error)}
                                                    </p>
                                                ) : null}
                                            </>
                                        ) : undefined
                                    }
                                />
                            </div>
                        </div>
                    </header>
                ) : profile.isLoading ? (
                    <HeroSkeleton />
                ) : null}
                {partly ? (
                    <div className="grouped hero-note" role="alert">
                        <Icon name="lock" size={20} />
                        <p>{partlyText(summary.data?.kind)}</p>
                    </div>
                ) : null}

                {p ? (
                    <>
                        {available.length > 1 ? (
                            <SegmentedTabs
                                label={t('{{name}}’s profile', { name: p.display_name })}
                                values={available}
                                labels={Object.fromEntries(available.map((a) => [a, label(a)])) as Record<ProfileTab, string>}
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
                            {refused ? (
                                <p className="muted small tab-note" role="status">
                                    {connections.isError && !(tab in moduleTab) ? NOT_LOADED[tab] : NOT_SHOWN[tab]}
                                </p>
                            ) : null}
                            {waiting ? (
                                <p className="muted empty" role="status">
                                    {LOADING[tab]}
                                </p>
                            ) : current === 'posts' ? (
                                <ProfileTimeline profile={p} own={own} page={page} selectedId={page && route.detail?.kind === 'post' ? route.detail.id : null} />
                            ) : current === 'about' ? (
                                <ProfileAbout profile={p} since={since} />
                            ) : current === 'events' ? (
                                <EventsOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'articles' ? (
                                <PostsOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'videos' ? (
                                <VideosOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'photos' ? (
                                <PhotosOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'albums' ? (
                                <AlbumsOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'files' ? (
                                <FilesOfTab of={{ author: id }} name={p.display_name} />
                            ) : current === 'polls' ? (
                                <PollsOfTab of={{ author: id }} name={p.display_name} />
                            ) : (
                                <>
                                    {/* one's own lists are managed in Connections (requests, unfriending, unfollowing) */}
                                    {page && id === me.active_profile_id ? (
                                        <p className="connections-manage">
                                            <button type="button" className="link-button" onClick={() => history.push(connectionsRoute(current))}>
                                                {t('Manage in Connections')}
                                            </button>
                                        </p>
                                    ) : null}
                                    <ConnectionsList
                                        key={current}
                                        source={{ kind: 'list', profileId: id, list: current }}
                                        label={current === 'friends' ? t('{{name}}’s friends', { name: p.display_name }) : current === 'followers' ? t('{{name}}’s followers', { name: p.display_name }) : t('{{name}}’s following', { name: p.display_name })}
                                        emptyText={current === 'friends' ? t('No friends yet') : current === 'followers' ? t('No followers yet') : t('Not following anyone yet')}
                                    />
                                </>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </Pane>
    );
}

/** The counts; one the viewer may open is a button that shows its tab. */
function Counts({ connections, available, onOpen }: { connections: Schema<'Connections'>; available: ProfileTab[]; onOpen: (tab: ProfileTab) => void }) {
    const lists: ConnectionList[] = ['followers', 'following', 'friends'];
    return (
        <ul className="profile-counts">
            {lists.map((l) => {
                const text = countText(connections[l], l);
                return (
                    <li key={l}>
                        {available.includes(l) ? (
                            <button type="button" className="link-button" onClick={() => onOpen(l)}>
                                {text}
                            </button>
                        ) : (
                            <span>{text}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/** The About tab: what the profile says about itself and how long it has been here. */
function ProfileAbout({ profile, since }: { profile: Schema<'Profile'>; since: string | null }) {
    return (
        <div className="profile-about-tab">
            {profile.about ? (
                <p className="profile-about" dir="auto">
                    {profile.about}
                </p>
            ) : (
                <p className="muted">{profile.kind === 'person' ? t('{{name}} hasn’t written anything about themselves yet.', { name: profile.display_name }) : t('{{name}} hasn’t written anything about it yet.', { name: profile.display_name })}</p>
            )}
            {since ? (
                <p className="hero-facts">
                    <Icon name="calendar" size={12} strong />
                    <span>{since}</span>
                </p>
            ) : null}
        </div>
    );
}

/**
 * The Feed tab: the profile's timeline, and on its page the site's blocks about it beside it
 * (Info, Friends: PageColumns, from the profile's page on the site); a window of its own shows
 * the timeline alone.
 */
function ProfileTimeline({ profile, own, page, selectedId }: { profile: Schema<'Profile'>; own: boolean; page: boolean; selectedId: string | null }) {
    const { api, siteUrl } = useApp();
    const compose = useCompose();
    const source = useMemo<FeedSource>(
        () => ({ key: ['feed', 'profile', profile.id], load: async (cursor) => unwrap(await api.GET('/profiles/{id}/timeline', { params: { path: { id: profile.id }, query: { cursor, limit: PAGE_SIZE } } })) }),
        [api, profile.id],
    );
    const feed = useFeed(source);
    const list = (
        <FeedList
            feed={feed}
            cacheKey={`profile-detail/${profile.id}`}
            label={t('{{name}}’s posts', { name: profile.display_name })}
            empty={
                own
                    ? {
                          icon: 'square-pen',
                          title: t('Share your first post'),
                          actions: compose ? (
                              <button type="button" className="btn btn-primary" onClick={() => compose.open()}>
                                  {t('New post')}
                              </button>
                          ) : undefined,
                      }
                    : { icon: 'square-pen', title: t('No posts yet') }
            }
            selectedId={selectedId}
            // on a page j and k move through these posts; in a window the arrow keys do
            listCommands={page}
        />
    );
    if (!page) return list;
    return (
        <PageColumns path={sitePath(profile.url, siteUrl)} title={profile.display_name} ended={feed.query.isSuccess && !feed.query.hasNextPage} about>
            {list}
        </PageColumns>
    );
}
