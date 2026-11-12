import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { MouseEvent } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ago } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { useCompose } from '../compose/compose-sheet';
import { fetchPolls, type Poll, pollKey, pollListKey, pollRowText, type PollsOf, votersText } from './polls';

/**
 * One poll in a list: its question opens it beside the list (Cmd+click, Cmd+Enter or a
 * double-click: in a window of its own), who asked with their badges after the name, how many
 * voted, whether the viewer did, and when.
 */
export function PollRow({ poll: p, selected }: { poll: Poll; selected: boolean }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'poll', id: p.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the detail shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(pollKey(p.id))) queryClient.setQueryData(pollKey(p.id), p, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    return (
        <li className="list-row poll-row" data-selected={selected || undefined} onDoubleClick={onDoubleClick}>
            <span className="poll-row-icon" aria-hidden="true">
                <Icon name="vote" size={18} />
            </span>
            <div className="list-main">
                <button
                    type="button"
                    className="profile-link strong poll-row-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi>{p.question}</bdi>
                    <span className="sr-only">{pollRowText(p)}</span>
                </button>
                <span className="row-sub" aria-hidden="true">
                    {p.author ? (
                        <span className={p.author.badges?.length ? 'with-badges' : undefined}>
                            <bdi className="truncate">{p.author.display_name}</bdi>
                            <ProfileBadges badges={p.author.badges} />
                        </span>
                    ) : null}
                    {p.author ? <span>·</span> : null}
                    <time dateTime={p.created_at ?? undefined} title={p.created_at ? new Date(p.created_at).toLocaleString(locale()) : undefined}>
                        {p.created_at ? ago(p.created_at) : ''}
                    </time>
                </span>
                <span className="row-sub" aria-hidden="true">
                    <span>{votersText(p)}</span>
                    {p.viewer?.voted ? (
                        <>
                            <span>·</span>
                            <span className="poll-row-voted">
                                <Icon name="check" size={12} strong /> {t('Voted')}
                            </span>
                        </>
                    ) : null}
                </span>
            </div>
        </li>
    );
}

/**
 * A Polls tab: a group's, space's or event's polls (GET /polls?context=), with New poll for
 * those who may post there (the compose sheet, set to ask a question in it), or the polls a
 * profile asked (`author`). Newest first, a page at a time, the open one marked.
 */
export function PollsOfTab({ of, name, canAdd = false }: { of: PollsOf; name: string; canAdd?: boolean }) {
    const { api } = useApp();
    const route = useRoute();
    const compose = useCompose();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-polls`;
    const query = useInfiniteQuery({
        queryKey: pollListKey(of),
        queryFn: async ({ pageParam }) => fetchPolls(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = 'context' in of ? t('No polls in {{name}} yet', { name }) : t('{{name}} hasn’t asked anything yet', { name });
    const emptyText = emptyListText(query, items.length, empty);
    const selectedId = route.detail?.kind === 'poll' ? route.detail.id : null;
    const add = 'context' in of && canAdd && compose ? () => compose.open(undefined, of.context, { poll: true }) : null;
    return (
        <section className="connections context-polls" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Polls')}
            </h3>
            {add ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={add}>
                        <Icon name="vote" size={16} />
                        <span>{t('New poll')}</span>
                    </button>
                </div>
            ) : null}
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="vote" title={emptyText || empty} />
            {items.length ? (
                <ul className="list rows poll-list" aria-label={'context' in of ? t('Polls in {{name}}, newest first', { name }) : t('Polls by {{name}}, newest first', { name })}>
                    {items.map((p) => (
                        <PollRow key={p.id} poll={p} selected={selectedId === p.id} />
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
                    {t('More polls')}
                </button>
            ) : null}
        </section>
    );
}
