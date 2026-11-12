import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { type MouseEvent, useState } from 'react';

import type { Schema } from 'una-api';

import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon, type IconName } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { useNavigation } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { contextDetailRoute, feedRoute } from '../../lib/router';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { FEED_LABELS } from '../feed/feed-tabs';
import { Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { browseContextsKey, type Context, CONTEXTS, type ContextKind, type Group, groupKey, membersText, membershipText, subspacesText, useMyContexts, visibilityText } from './groups';
import { JoinButtons } from './join-button';

const BROWSE_PAGE = 30;

/** The small icon beside a group's privacy (spec 4.4). */
const PRIVACY_ICON: Partial<Record<Group['visibility'], IconName>> = { public: 'globe', members: 'users', closed: 'lock', secret: 'eye-off' };

/** "Public group · 128 members", "Public space · 12 members · 3 subspaces", with the privacy's icon (decorative: the words say it). */
export function GroupFacts({ group, kind = 'group' }: { group: Pick<Context, 'visibility' | 'member_count' | 'child_count'>; kind?: ContextKind }) {
    const icon = PRIVACY_ICON[group.visibility];
    const subspaces = kind === 'space' && group.child_count ? ` · ${subspacesText(group.child_count)}` : '';
    return (
        <span className="row-sub">
            {icon ? <Icon name={icon} size={12} strong /> : null}
            <span>
                {visibilityText(group.visibility, kind)} · {membersText(group.member_count)}
                {subspaces}
            </span>
        </span>
    );
}

/**
 * One group or space in a list: its picture and name open its page (Cmd+click, Cmd+Enter or a
 * double-click on the row: in a window of its own), its badges after the name, its facts, and
 * Join next to it while one is not in it. `acted`: the viewer acted on it here, so its buttons
 * stay (Leave, Cancel request) and focus with them.
 */
export function ContextRow({ context: g, kind, announce, acted, onAction }: { context: Context; kind: ContextKind; announce: (text: string) => void; acted: boolean; onAction: () => void }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const role = g.viewer?.status === 'active' ? null : membershipText(g.viewer);
    const detail = contextDetailRoute(kind, g.id);
    const open = (e?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && e && isWindowGesture(e)) {
            openInWindow(detail);
            return;
        }
        // the page shows it at once while it loads its own copy, which it fetches (stale)
        if (!queryClient.getQueryData(groupKey(g.id))) queryClient.setQueryData(groupKey(g.id), g, { updatedAt: 0 });
        openDetail(detail);
    };
    // as a notification's row: not over Join and the other buttons of the row
    const onDoubleClick = (e: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (e.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    return (
        <li className="list-row group-row" onDoubleClick={onDoubleClick}>
            <span className="avatar-link" onClick={(e) => open(e)}>
                <Avatar profile={g} size={40} shape="square" />
            </span>
            <div className="list-main">
                <span className={g.badges?.length ? 'with-badges' : undefined}>
                    <button
                        type="button"
                        className="profile-link strong"
                        data-open=""
                        onClick={(e) => open(e)}
                        onKeyDown={(e) => {
                            if (!openInWindow || !isWindowKey(e)) return;
                            e.preventDefault();
                            openInWindow(detail);
                        }}
                    >
                        {g.display_name}
                    </button>
                    <ProfileBadges badges={g.badges} />
                </span>
                <GroupFacts group={g} kind={kind} />
                {role ? <span className="row-sub">{role}</span> : null}
            </div>
            {g.viewer?.status === 'none' || acted ? (
                <JoinButtons group={g} kind={kind} announce={announce} small onAction={onAction} />
            ) : g.viewer?.status === 'active' ? (
                <span className="row-state">
                    <Icon name="check" size={12} strong />
                    {g.viewer.role && g.viewer.role !== 'member' ? membershipText(g.viewer) : t('Joined')}
                </span>
            ) : null}
        </li>
    );
}

type ContextPage = Schema<'Page_Group'> | Schema<'Page_Space'>;

/**
 * The Groups list: the groups the viewer may find (GET /groups), newest first, page by page, or
 * (`joined`, the Yours tab) the ones one is a member of. A name opens the group's page; Join is
 * next to it for groups one is not in.
 */
export function GroupsBrowse({ joined = false }: { joined?: boolean }) {
    return <ContextsBrowse kind="group" joined={joined} />;
}

const CONTEXT_TABS = ['all', 'joined'] as const;
const CONTEXTS_PANEL = 'contexts-panel';
const contextsTabId = (tab: string) => `contexts-tab-${tab}`;

/** What a list of a kind says, a whole sentence for each kind. */
const NO_MODULE: Record<ContextKind, string> = { group: t('This network has no groups.'), space: t('This network has no spaces.'), event: t('This network has no events.') };
const IN_NONE: Record<ContextKind, string> = { group: t('You aren’t in any groups yet'), space: t('You aren’t in any spaces yet'), event: t('You aren’t in any events yet') };
const NONE_YET: Record<ContextKind, string> = { group: t('No groups yet'), space: t('No spaces yet'), event: t('No events yet') };
const LOAD_MORE: Record<ContextKind, string> = { group: t('Load more groups'), space: t('Load more spaces'), event: t('Load more events') };

/**
 * The groups (GET /groups) or the top level spaces (GET /spaces?top_level=true: the spaces in
 * no other space; a space's page lists its subspaces) the viewer may find, newest first, page
 * by page; `joined` (the Yours tab): the ones one is a member of, most recently joined first
 * (GET /me/groups, /me/spaces, as the sidebar's Your groups lists them).
 */
export function ContextsBrowse({ kind, joined = false }: { kind: ContextKind; joined?: boolean }) {
    const { api } = useApp();
    const { history } = useNavigation();
    const mine = useMyContexts(kind);
    const info = CONTEXTS[kind];
    const [announcement, announce] = useAnnouncer();
    // contexts acted on here keep their buttons (Leave, Cancel request), so focus stays on them
    const [acted, setActed] = useState<ReadonlySet<string>>(() => new Set());
    const query = useInfiniteQuery({
        queryKey: browseContextsKey(kind),
        // null: a site without the module has no such list (404), which is no error
        queryFn: async ({ pageParam }): Promise<ContextPage | null> => {
            const cursor = pageParam as string | undefined;
            try {
                if (kind === 'space') return unwrap(await api.GET('/spaces', { params: { query: { top_level: true, cursor, limit: BROWSE_PAGE } } }));
                return unwrap(await api.GET('/groups', { params: { query: { cursor, limit: BROWSE_PAGE } } }));
            } catch (e) {
                if (e instanceof ApiError && e.status === 404 && !pageParam) return null;
                throw e;
            }
        },
        getNextPageParam: (last) => last?.next_cursor ?? undefined,
    });
    useFillEmptyPages({
        isSuccess: query.isSuccess,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
        data: query.data ? { pages: query.data.pages.map((p) => p ?? { items: [] }) } : undefined,
    });
    const none = query.data?.pages[0] === null;
    const shown = joined ? mine : query;
    const items: Context[] = joined ? (mine.data ?? []) : (query.data?.pages.flatMap((p) => p?.items ?? []) ?? []);
    const empty = none ? NO_MODULE[kind] : joined ? emptyListText({ isSuccess: mine.isSuccess, hasNextPage: false, isFetchingNextPage: false }, items.length, IN_NONE[kind]) : emptyListText(query, items.length, NONE_YET[kind]);
    const section = kind === 'space' ? 'spaces' : 'groups';

    return (
        <Pane
            pane="list"
            title={info.plural}
            ready={!shown.isLoading}
            busy={shown.isLoading}
            scope={
                none ? undefined : (
                    <SegmentedTabs
                        label={info.plural}
                        values={CONTEXT_TABS}
                        labels={FEED_LABELS}
                        current={joined ? 'joined' : 'all'}
                        onChange={(tab) => history.push({ list: feedRoute(section, tab), detail: history.current.detail })}
                        panelId={CONTEXTS_PANEL}
                        tabId={contextsTabId}
                    />
                )
            }
        >
            <div className="column" id={CONTEXTS_PANEL} role={none ? undefined : 'tabpanel'} aria-labelledby={none ? undefined : contextsTabId(joined ? 'joined' : 'all')}>
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <SkeletonRows loading={shown.isLoading} />
                {shown.isError ? <InlineError message={errorMessage(shown.error)} onRetry={() => void shown.refetch()} busy={shown.isFetching} /> : null}
                <EmptyState shown={!!empty} icon={kind === 'space' ? info.icon : 'layout-grid'} title={empty} />
                {items.length ? (
                    <ul className="list rows group-list" aria-label={info.plural}>
                        {items.map((g) => (
                            <ContextRow key={g.id} context={g} kind={kind} announce={announce} acted={acted.has(g.id)} onAction={() => setActed((s) => new Set(s).add(g.id))} />
                        ))}
                    </ul>
                ) : null}
                {!joined && query.hasNextPage ? (
                    <button
                        type="button"
                        className="btn btn-wide"
                        onClick={() => {
                            if (!query.isFetchingNextPage) void query.fetchNextPage();
                        }}
                        aria-disabled={query.isFetchingNextPage || undefined}
                        aria-busy={query.isFetchingNextPage}
                    >
                        {LOAD_MORE[kind]}
                    </button>
                ) : null}
            </div>
        </Pane>
    );
}
