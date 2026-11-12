import { useInfiniteQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useRef } from 'react';

import type { Schema } from 'una-api';

import { unwrap } from '../lib/api';
import { useApp } from '../lib/context';
import { errorMessage } from '../lib/errors';
import { locale, t, tn } from '../lib/i18n';
import { useNavigation, useRoute } from '../lib/navigation';
import { isWindowGesture, isWindowKey, openElsewhereHint, useOpenInWindow } from '../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../lib/paging';
import { Avatar } from '../components/avatar';
import { EmptyState } from '../components/empty-state';
import { ProfileBadges } from '../components/profile-badges';
import { InlineError, SkeletonRows } from '../components/skeleton';
import { VisuallyHidden } from '../components/visually-hidden';
import { choosePreopened, isPreopened, markPreopenedEntry, preopenedId, setPreopened } from '../features/messages/preopen';
import { usePanesMode } from '../shell/layout';
import { Pane, paneHeadingId, ToolbarButton } from '../shell/pane';

type Conversation = Schema<'Conversation'>;

/** When the conversation last moved: its last reply, else when it was started. */
export function lastActivity(c: Pick<Conversation, 'last_reply_at' | 'created_at'>): string {
    return c.last_reply_at ?? c.created_at;
}

/** Newest first, by the last reply (or the start). */
export function newestFirst(list: readonly Conversation[]): Conversation[] {
    return [...list].sort((a, b) => Date.parse(lastActivity(b)) - Date.parse(lastActivity(a)));
}

/** "09:14" today, "Yesterday", the weekday within the week ("Mon"), else "3 Nov" (with the year when not this one). */
export function inboxTime(iso: string, now: Date = new Date()): string {
    const d = new Date(iso);
    const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const days = Math.round((start(now) - start(d)) / 86_400_000);
    if (days <= 0) return d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return t('Yesterday');
    if (days < 7) return d.toLocaleDateString(locale(), { weekday: 'short' });
    return d.toLocaleDateString(locale(), d.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The row's second line (spec 4.3): the newest message's text, whoever wrote it, one's own too
 * (no "You:"; the row is a conversation, not a message). Without text, what it carries:
 * "Photo" or "Attachment" (`media`, drawn as a stand-in, not as the message).
 */
export function previewOf(c: Pick<Conversation, 'last_message'>): { text: string; media: boolean } {
    const last = c.last_message;
    const text = last.text.replace(/\s+/g, ' ').trim();
    if (text || !last.has_media) return { text, media: false };
    return { text: last.media_kind === 'file' ? t('Attachment') : t('Photo'), media: true };
}

/**
 * The inbox in the list pane; a conversation opens in the detail pane (features/messages). In a
 * window with room for three panes, entering Messages with nothing open opens the newest
 * conversation beside the list (preopen.ts), in place of the empty route, so Back does not
 * land on an inbox alone. Once on each visit, decided by the inbox's first answer: closing it
 * leaves the list alone until Messages is entered again, and a conversation that comes after an
 * empty first answer opens nothing. A narrow window keeps the list until it widens, and goes
 * back to it when it narrows before the conversation is chosen.
 */
export function Messages() {
    const { api, me } = useApp();
    const route = useRoute();
    const { history, openDetail, replaceDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const selected = route.detail?.kind === 'conversation' ? route.detail.id : null;

    const inbox = useInfiniteQuery({
        queryKey: ['conversations'],
        queryFn: async ({ pageParam }) => unwrap(await api.GET('/conversations', { params: { query: { cursor: pageParam as string | undefined, limit: 30 } } })),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        refetchInterval: 30_000,
    });
    const conversations = newestFirst(inbox.data?.pages.flatMap((p) => p.items) ?? []);
    useFillEmptyPages(inbox);
    const empty = t('No conversations yet');
    const emptyText = emptyListText(inbox, conversations.length, empty);
    const myIds = new Set(me.profiles.map((p) => p.id));
    const windowHint = openInWindow ? openElsewhereHint() : undefined;
    const newMessage = () => openDetail({ kind: 'new-message' });

    const mode = usePanesMode();
    const newestId = conversations[0]?.id ?? null;
    // the inbox answered with nothing (empty, or an error)
    const answeredEmpty = !newestId && ((inbox.isSuccess && !inbox.hasNextPage) || (inbox.isError && !inbox.data));
    // decided on this visit: something was open (preopened, chosen, or named by the route it came
    // with), or the inbox's first answer had nothing to open
    const decided = useRef(false);
    useEffect(() => {
        if (route.detail) {
            decided.current = true;
            // narrowed into the cover before it was chosen: the list again, not a conversation
            // nobody opened covering it (the shell keeps focus where it was, or gives it its row)
            if (mode === 'cover' && isPreopened(route.detail)) replaceDetail(null, route);
            return;
        }
        if (decided.current) return;
        if (answeredEmpty) {
            decided.current = true;
            return;
        }
        if (mode !== 'three' || !newestId) return;
        setPreopened(newestId);
        if (replaceDetail({ kind: 'conversation', id: newestId }, route)) {
            decided.current = true;
            markPreopenedEntry(history.current);
        } else setPreopened(null);
    }, [route, mode, newestId, answeredEmpty, replaceDetail, history]);

    return (
        <Pane
            pane="list"
            title={t('Messages')}
            ready={!inbox.isLoading}
            busy={inbox.isLoading}
            actions={<ToolbarButton icon="square-pen" label={t('New message')} commandId="new-message" onClick={newMessage} />}
        >
            <div className="inbox">
                <SkeletonRows loading={inbox.isLoading} shape="conversation" />
                {inbox.isError ? <InlineError message={errorMessage(inbox.error)} onRetry={() => void inbox.refetch()} busy={inbox.isFetching} /> : null}
                <EmptyState
                    shown={!!emptyText}
                    icon="message-circle"
                    title={emptyText || empty}
                    hint={emptyText === empty ? t('Message someone from their profile or a post.') : undefined}
                    actions={
                        emptyText === empty ? (
                            <button type="button" className="btn btn-primary" onClick={newMessage}>
                                {t('New message')}
                            </button>
                        ) : undefined
                    }
                />
                <ul className="list conv-list">
                    {conversations.map((c) => {
                        const detail = { kind: 'conversation', id: c.id } as const;
                        const others = c.participants.filter((p) => !myIds.has(p.id));
                        const front = others[0] ?? c.author ?? null;
                        const back = others[1];
                        // badges only beside a single name: in a group's list of names they would say whose they are only by place
                        const badged = others.length === 1 && others[0]?.badges?.length ? others[0] : null;
                        const preview = previewOf(c);
                        // the time of the message the row shows: `last_reply_at` keeps a deleted reply's time (it orders the list, as the server does)
                        const when = c.last_message.created_at;
                        return (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    className={`conv${c.unread ? ' unread' : ''}`}
                                    aria-current={selected === c.id ? 'true' : undefined}
                                    data-conversation={c.id}
                                    title={windowHint}
                                    onClick={(e) => {
                                        if (openInWindow && isWindowGesture(e)) openInWindow(detail);
                                        else if (selected === c.id && preopenedId() === c.id) {
                                            // the preopened one chosen: read as any other, and gone to as one opened is
                                            choosePreopened();
                                            document.getElementById(paneHeadingId('detail'))?.focus();
                                        } else openDetail(detail);
                                    }}
                                    onKeyDown={(e) => {
                                        if (!openInWindow || !isWindowKey(e)) return;
                                        e.preventDefault();
                                        openInWindow(detail);
                                    }}
                                >
                                    {back ? (
                                        <span className="conv-pair" aria-hidden="true">
                                            <Avatar profile={back} size={28} />
                                            <Avatar profile={front} size={28} />
                                        </span>
                                    ) : (
                                        <Avatar profile={front} size={40} />
                                    )}
                                    <span className="conv-main">
                                        <span className="conv-line">
                                            {/* one other person: their name and badges (the row's name says them); several: names only, as many as fit */}
                                            <span className={`conv-names truncate${badged ? ' with-badges' : ''}`}>
                                                {badged ? (
                                                    <>
                                                        <bdi>{badged.display_name}</bdi>
                                                        <ProfileBadges badges={badged.badges} />
                                                    </>
                                                ) : others.length ? (
                                                    others.map((p, i) => (
                                                        <Fragment key={p.id}>
                                                            {i ? ', ' : null}
                                                            <bdi>{p.display_name}</bdi>
                                                        </Fragment>
                                                    ))
                                                ) : (
                                                    t('Only you')
                                                )}
                                            </span>
                                            {c.unread ? <VisuallyHidden>{tn(c.unread, ', {{count}} unread', ', {{count}} unread')}</VisuallyHidden> : null}
                                            <time className="conv-time" dateTime={when} title={new Date(when).toLocaleString(locale())}>
                                                {inboxTime(when)}
                                            </time>
                                        </span>
                                        {/* the newest message in one line, as a notification's text; the count at its end, under the time */}
                                        <span className="conv-sub">
                                            <span className={`conv-snippet${preview.media ? ' media' : ''}`}>{preview.text}</span>
                                            {/* the row's name says it */}
                                            {c.unread ? (
                                                <span className="conv-count" aria-hidden="true">
                                                    {c.unread > 99 ? '99+' : c.unread}
                                                </span>
                                            ) : null}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {inbox.hasNextPage ? (
                    <button
                        type="button"
                        className="btn btn-wide"
                        onClick={() => {
                            if (!inbox.isFetchingNextPage) void inbox.fetchNextPage();
                        }}
                        aria-disabled={inbox.isFetchingNextPage || undefined}
                        data-busy={inbox.isFetchingNextPage || undefined}
                    >
                        <span>{t('Older conversations')}</span>
                    </button>
                ) : null}
            </div>
        </Pane>
    );
}
