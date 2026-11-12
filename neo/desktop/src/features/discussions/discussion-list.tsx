import { useInfiniteQuery } from '@tanstack/react-query';

import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { Tooltip } from '../../components/tooltip';
import { useContextGroup } from '../../components/activity-card';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, openElsewhereHint, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { categoryPage } from '../../lib/router';
import { inboxTime } from '../../screens/messages';
import { Pane, ToolbarButton } from '../../shell/pane';
import { CategoryFilter, PageColumns } from '../page-blocks/page-blocks';
import { SECTION_PAGES } from '../page-blocks/page-layout';
import {
    type Discussion,
    DISCUSSIONS_PAGE,
    discussionListKey,
    discussionSort,
    type DiscussionSort,
    lastActivity,
    repliesLine,
    SORT_LABELS,
    startedLine,
    stateText,
    useDiscussionSetup,
} from './discussions';

const SORTS: readonly DiscussionSort[] = ['latest', 'new'];
const PANEL_ID = 'discussions-panel';
const sortTabId = (sort: DiscussionSort) => `discussions-sort-${sort}`;

/**
 * One discussion in a list: its title, who started it in which category (and group), and its
 * replies, with the time of the last one. It opens in the detail pane; Cmd+Enter or Cmd+click
 * (Ctrl elsewhere) opens it in a window of its own.
 */
export function DiscussionRow({ discussion: d, selected, myIds }: { discussion: Discussion; selected: boolean; myIds: ReadonlySet<string> }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const group = useContextGroup(d);
    const detail = { kind: 'discussion', id: d.id } as const;
    const when = lastActivity(d);
    return (
        <li>
            <button
                type="button"
                className="conv conv-discussion"
                aria-current={selected ? 'true' : undefined}
                title={openInWindow ? openElsewhereHint() : undefined}
                onClick={(e) => {
                    if (openInWindow && isWindowGesture(e)) openInWindow(detail);
                    else openDetail(detail);
                }}
                onKeyDown={(e) => {
                    if (!openInWindow || !isWindowKey(e)) return;
                    e.preventDefault();
                    openInWindow(detail);
                }}
            >
                <Avatar profile={d.author} size={40} />
                <span className="conv-main">
                    <span className="conv-line">
                        <span className="conv-names truncate">
                            <bdi>{d.title}</bdi>
                        </span>
                        <span className="sr-only">{stateText(d)}</span>
                        <DiscussionMarks discussion={d} />
                        <time className="conv-time" dateTime={when} title={new Date(when).toLocaleString(locale())}>
                            {inboxTime(when)}
                        </time>
                    </span>
                    <span className="conv-preview one-line">{startedLine(d, group?.display_name)}</span>
                    <span className="conv-preview one-line">{repliesLine(d, myIds)}</span>
                </span>
            </button>
        </li>
    );
}

/**
 * Pinned, closed to replies and answered, seen: 12px icons after the title, each with its word as
 * a tooltip. Hidden from screen readers, which hear the same from the row's name (stateText).
 */
function DiscussionMarks({ discussion: d }: { discussion: Pick<Discussion, 'sticky' | 'locked' | 'resolved'> }) {
    const marks: { icon: 'pin' | 'lock' | 'check'; words: string }[] = [];
    if (d.sticky) marks.push({ icon: 'pin', words: t('Pinned') });
    if (d.locked) marks.push({ icon: 'lock', words: t('Closed to replies') });
    if (d.resolved === true) marks.push({ icon: 'check', words: t('Answered') });
    if (!marks.length) return null;
    return (
        <span className="discussion-marks" aria-hidden="true">
            {marks.map((m) => (
                <Tooltip key={m.icon} text={m.words}>
                    <span className="discussion-mark" data-mark={m.icon}>
                        <Icon name={m.icon} size={12} strong />
                    </span>
                </Tooltip>
            ))}
        </span>
    );
}

/**
 * Discussions in the list pane: Active (the latest reply first) or New (the newest started),
 * the network's discussions outside groups, as the site lists them. One opens in the detail
 * pane (features/discussions/discussion-pane.tsx); New discussion is in the toolbar.
 */
export function Discussions() {
    const { api, me } = useApp();
    const route = useRoute();
    const { history, openDetail } = useNavigation();
    const setup = useDiscussionSetup();
    const sort = discussionSort(route.list.feed);
    // one category's, as the site's Categories block opens it
    const category = route.list.category ?? null;
    const categoryName = category ? (setup.data ? (setup.data.categories.find((c) => c.id === category)?.title ?? null) : undefined) : undefined;
    const selected = route.detail?.kind === 'discussion' ? route.detail.id : null;
    const none = setup.data === null;

    const list = useInfiniteQuery({
        queryKey: discussionListKey(sort, null, category),
        queryFn: async ({ pageParam }) =>
            unwrap(await api.GET('/discussions', { params: { query: { sort, cursor: pageParam as string | undefined, limit: DISCUSSIONS_PAGE, ...(category ? { category } : {}) } } })),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        // once the site says it has Discussions (or that question failed: the list says why then)
        enabled: setup.isSuccess ? !none : setup.isError,
        refetchInterval: 60_000,
    });
    useFillEmptyPages(list);
    // a list that may not load yet (or never, on a site without Discussions) is not loading
    const loading = setup.isLoading || list.isInitialLoading;
    const items = list.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = t('No discussions yet');
    const emptyText = none ? '' : emptyListText(list, items.length, empty);
    const myIds = new Set(me.profiles.map((p) => p.id));
    const canStart = !!setup.data?.can_create;
    const start = () => openDetail({ kind: 'new-discussion' });

    return (
        <Pane
            pane="list"
            title={t('Discussions')}
            ready={!loading}
            busy={loading}
            scope={
                none ? undefined : (
                    <SegmentedTabs
                        label={t('Order')}
                        values={SORTS}
                        labels={SORT_LABELS}
                        current={sort}
                        onChange={(s) => history.push({ list: categoryPage('discussions', category, s), detail: history.current.detail })}
                        panelId={PANEL_ID}
                        tabId={sortTabId}
                    />
                )
            }
            actions={
                none || !setup.data ? undefined : (
                    <ToolbarButton icon="square-pen" label={t('New discussion')} disabled={!canStart} note={t('you can’t start discussions in this network')} onClick={start} />
                )
            }
        >
            {/* the site's discussions page: its Categories and Featured Discussions beside the list (PageColumns) */}
            <PageColumns path={none ? null : SECTION_PAGES.discussions} title={t('Discussions')} ended>
                <div className="inbox" id={PANEL_ID} role={none ? undefined : 'tabpanel'} aria-labelledby={none ? undefined : sortTabId(sort)}>
                    {none ? <EmptyState icon="messages-square" title={t('This network has no discussions.')} /> : null}
                    {category && !none ? <CategoryFilter name={categoryName} all={t('All discussions')} onAll={() => history.push({ list: categoryPage('discussions', null, sort), detail: history.current.detail })} /> : null}
                    <SkeletonRows loading={loading} />
                    {list.isError ? <InlineError message={errorMessage(list.error)} onRetry={() => void list.refetch()} busy={list.isFetching} /> : null}
                    <EmptyState
                        shown={!!emptyText}
                        icon="messages-square"
                        title={emptyText || empty}
                        hint={emptyText === empty ? t('Ask a question or start a conversation for everyone here.') : undefined}
                        actions={
                            emptyText === empty && canStart ? (
                                <button type="button" className="btn btn-primary" onClick={start}>
                                    {t('New discussion')}
                                </button>
                            ) : undefined
                        }
                    />
                    {items.length ? (
                        <ul
                            className="list conv-list"
                            aria-label={
                                sort === 'new'
                                    ? categoryName
                                        ? t('Discussions, newest first, in {{category}}', { category: categoryName })
                                        : t('Discussions, newest first')
                                    : categoryName
                                      ? t('Discussions, latest reply first, in {{category}}', { category: categoryName })
                                      : t('Discussions, latest reply first')
                            }
                        >
                            {items.map((d) => (
                                <DiscussionRow key={d.id} discussion={d} selected={selected === d.id} myIds={myIds} />
                            ))}
                        </ul>
                    ) : null}
                    {list.hasNextPage ? (
                        <button
                            type="button"
                            className="btn btn-wide"
                            onClick={() => {
                                if (!list.isFetchingNextPage) void list.fetchNextPage();
                            }}
                            aria-disabled={list.isFetchingNextPage || undefined}
                            data-busy={list.isFetchingNextPage || undefined}
                        >
                            <span>{t('More discussions')}</span>
                        </button>
                    ) : null}
                </div>
            </PageColumns>
        </Pane>
    );
}
