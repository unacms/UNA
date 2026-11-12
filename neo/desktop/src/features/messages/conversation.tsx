import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { useWindowAnnounce } from '../../lib/announce';
import { ensureOk, isGone, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { type Draft, useDraftKey } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { locale, t, tn } from '../../lib/i18n';
import { useMediaSrc } from '../../lib/media';
import { confirmAction, isSecondaryWindow } from '../../lib/native';
import { useCopyLink } from '../../lib/copy-link';
import { type MenuEntry, showMenu, useMenuExpanded } from '../../lib/native-menu';
import { useNavigation } from '../../lib/navigation';
import { useOpenInWindow } from '../../lib/open-in-window';
import { requestSync } from '../../lib/sync';
import type { Uploader } from '../../lib/uploads';
import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { Tooltip } from '../../components/tooltip';
import { CloseDetailButton, Pane, ToolbarButton } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { aspectRatio, mediaLabel, pictureOf } from '../feed/media';
import { profileSummaryKey } from '../profile/graph';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { Lightbox } from '../thread/lightbox';
import { type Anchor, captureAnchor, isAtBottom, measureRows, nearTop, restoreScrollTop } from './anchor';
import { timeLabel, withDays } from './days';
import { MessageComposer } from './message-composer';
import { choosePreopened, PREOPEN_READ_MS, usePreopened, useShownFor } from './preopen';
import { RecipientField } from './recipient-field';
import { chronological, firstUnreadAtOpen, type Message, messagesKey, type Thread, withEdited, withHead, withOlderAt, withSent } from './thread-cache';
import { MessageEditor } from './message-editor';

type Conv = Schema<'Conversation'>;
type Profile = Schema<'Profile'>;
type Media = Schema<'Media'>;

/** The reply box of the open conversation (r focuses it). */
export const CONVERSATION_REPLY_FIELD = 'conversation-reply';

/** Replies asked for at a time. */
export const MESSAGES_PAGE = 30;
/** How often an open conversation asks for new replies (the sync also refetches it on a new one). */
export const MESSAGES_POLL_MS = 15_000;

/** The id the first message (the conversation's own body) has among the rows. */
const FIRST = 'first';

const conversationKey = (id: string) => ['conversation', id] as const;

/** Conversations just started here: their reply box takes focus when they open (NewConversation). */
const focusReplyOnOpen = new Set<string>();

/** How long the log stays quiet after a page of messages went in, so it is not read out as new. */
const BULK_QUIET_MS = 300;

/** The first message as a row of the chat, once the whole conversation is loaded. */
function firstMessage(c: Conv, myIds: ReadonlySet<string>): Message {
    return { id: FIRST, author: c.author, mine: !!c.author && myIds.has(c.author.id), can_edit: false, body: c.body, body_html: c.body_html, media: c.media, created_at: c.created_at };
}

/** A conversation's name: the others in it. */
export function conversationTitle(c: Conv, myIds: ReadonlySet<string>): string {
    return (
        c.participants
            .filter((p) => !myIds.has(p.id))
            .map((p) => p.display_name)
            .join(', ') || t('Only you')
    );
}

/**
 * A conversation in the detail pane, as a chat: a `role="log"` with the newest message at the
 * bottom, where it opens. Older messages load when the top comes into view (or with the button
 * there), and the message on screen stays where it is (anchor.ts). Days are separated, one's own
 * messages sit on the right, photos open in the lightbox, and the messages that were unread when
 * it opened follow a "New" line. New replies come every 15 s (and with the sync); while one reads
 * further up they wait behind "N new messages", which goes to the end.
 */
export function Conversation({ id, uploader }: { id: string; uploader?: Uploader }) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const openInWindow = useOpenInWindow();
    const myIds = new Set(me.profiles.map((p) => p.id));
    const draftKey = useDraftKey(`conversation:${id}`);
    const [announcement, announce] = useAnnouncer();
    const copyLink = useCopyLink(announce);
    // the reply being edited in place (one at a time)
    const [editing, setEditing] = useState<string | null>(null);

    const conv = useQuery({ queryKey: conversationKey(id), queryFn: async () => unwrap(await api.GET('/conversations/{id}', { params: { path: { id } } })) });
    const thread = useQuery({
        queryKey: messagesKey(id),
        // the newest page on top of what is loaded: older pages stay, nothing opens a gap
        queryFn: async (): Promise<Thread> => {
            const page = unwrap(await api.GET('/conversations/{id}/messages', { params: { path: { id }, query: { limit: MESSAGES_PAGE } } }));
            return withHead(queryClient.getQueryData<Thread>(messagesKey(id)), page);
        },
        refetchInterval: MESSAGES_POLL_MS,
        enabled: !!conv.data,
    });
    const gone = conv.isError && isGone(conv.error);

    // a reply that came (the sync refetches the conversation): its messages too
    const replies = conv.data?.replies;
    const seenReplies = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (replies === undefined) return;
        if (seenReplies.current !== undefined && replies !== seenReplies.current) void queryClient.invalidateQueries(messagesKey(id));
        seenReplies.current = replies;
    }, [replies, id, queryClient]);

    // One the inbox opened by itself (preopen.ts) is read once it has been in view for a while in
    // a focused window, or once the person chooses it: its row, or focus going into it.
    const preopened = usePreopened(id);
    const seen = useShownFor(PREOPEN_READ_MS, preopened);
    useEffect(() => {
        if (!preopened) return;
        const onFocusIn = (e: FocusEvent) => {
            if ((e.target as Element | null)?.closest?.('[data-pane="detail"]')) choosePreopened();
        };
        document.addEventListener('focusin', onFocusIn);
        return () => document.removeEventListener('focusin', onFocusIn);
    }, [preopened]);

    // opening a conversation reads it, and so does a message that comes while it is open; not
    // after Mark as Unread, until another reply comes
    const keptUnread = useRef<number | null>(null);
    useEffect(() => {
        if (!conv.data?.unread || !seen) return;
        if (keptUnread.current !== null && keptUnread.current === conv.data.replies) return;
        keptUnread.current = null;
        void api.POST('/conversations/{id}/read', { params: { path: { id } } }).then((r) => {
            ensureOk(r);
            void queryClient.invalidateQueries(['conversations']);
            // read now, so the next unread message changes the flag again
            void queryClient.invalidateQueries(conversationKey(id));
            requestSync();
        });
    }, [conv.data?.unread, conv.data?.replies, seen, id, api, queryClient]);

    // How many were unread when it opened, and the newest message then: the "New" line stays
    // before those, whatever is sent or comes later. Both from what was fetched since it opened,
    // not from a copy cached earlier (that may say nothing is unread, or miss the new replies).
    const [unreadAtOpen, setUnreadAtOpen] = useState<number | null>(null);
    if (unreadAtOpen === null && conv.data && conv.isFetchedAfterMount) setUnreadAtOpen(conv.data.unread);

    const data = thread.data;
    const complete = !!data && data.older === null;
    const messages = chronological(data);
    const shown = conv.data && complete ? [firstMessage(conv.data, myIds), ...messages] : messages;
    const newest = shown[shown.length - 1]?.id ?? null;
    const [newestAtOpen, setNewestAtOpen] = useState<string | null>(null);
    if (newestAtOpen === null && newest && thread.isFetchedAfterMount) setNewestAtOpen(newest);
    const unreadFrom = firstUnreadAtOpen(
        shown.map((m) => m.id),
        newestAtOpen,
        unreadAtOpen ?? 0,
    );
    const rows = withDays(shown);

    // --- where the chat is scrolled to
    const scroller = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const atBottom = useRef(true);
    const opened = useRef(false);
    const pending = useRef<{ anchor: Anchor; cursor: string | null } | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    // The log is a live region: a page of messages going in (the first, or older ones above)
    // would be read out as new, on top of what the status says. It is quiet while one loads and
    // a moment after, and speaks again for the replies that come.
    const [quiet, setQuiet] = useState(true);
    const quietTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speakSoon = useCallback(() => {
        if (quietTimer.current) clearTimeout(quietTimer.current);
        quietTimer.current = setTimeout(() => setQuiet(false), BULK_QUIET_MS);
    }, []);
    useEffect(
        () => () => {
            if (quietTimer.current) clearTimeout(quietTimer.current);
        },
        [],
    );
    const firstLoaded = !!data;
    useEffect(() => {
        if (firstLoaded) speakSoon();
    }, [firstLoaded, speakSoon]);
    const [seenNewest, setSeenNewest] = useState<string | null>(null);
    // the same as atBottom, for rendering ("N new messages" shows only while one is further up)
    const [bottom, setBottom] = useState(true);
    const lastNewest = useRef<string | null>(null);

    useLayoutEffect(() => {
        const el = scroller.current;
        if (!el || !data) return;
        const p = pending.current;
        if (p) {
            // older messages went in above: the message read stays where it was
            const top = restoreScrollTop(p.anchor, measureRows(el));
            if (top !== null) el.scrollTop = top;
            if (data.older !== p.cursor) pending.current = null;
        } else if (!opened.current) {
            // a conversation opens at its last message
            el.scrollTop = el.scrollHeight;
            opened.current = true;
            atBottom.current = true;
        } else if (newest !== lastNewest.current && atBottom.current) {
            el.scrollTop = el.scrollHeight;
        }
        lastNewest.current = newest;
    });

    // what is read at the bottom: new messages there are seen (and the newest when it opens)
    if (newest && seenNewest !== newest && (seenNewest === null || bottom)) setSeenNewest(newest);

    // images that load (and anything else that grows) keep the end in view while one is there
    useEffect(() => {
        const el = scroller.current;
        const inner = content.current;
        if (!el || !inner || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (atBottom.current && !pending.current) el.scrollTop = el.scrollHeight;
        });
        observer.observe(inner);
        return () => observer.disconnect();
    }, [conv.data]);

    const loadOlder = useCallback(async () => {
        const el = scroller.current;
        const current = queryClient.getQueryData<Thread>(messagesKey(id));
        if (!el || !current?.older || pending.current) return;
        const cursor = current.older;
        pending.current = { anchor: captureAnchor(measureRows(el), el.scrollTop) ?? { id: FIRST, offset: 0 }, cursor };
        setLoadingOlder(true);
        if (quietTimer.current) clearTimeout(quietTimer.current);
        setQuiet(true);
        try {
            const page = unwrap(await api.GET('/conversations/{id}/messages', { params: { path: { id }, query: { limit: MESSAGES_PAGE, cursor } } }));
            // only where the thread still ends: a poll may have started it over meanwhile
            const before = queryClient.getQueryData<Thread>(messagesKey(id));
            queryClient.setQueryData<Thread>(messagesKey(id), (prev) => withOlderAt(prev, cursor, page));
            if (before?.older !== cursor) {
                pending.current = null;
                return;
            }
            // the button goes with the last page: focus stays in the chat, not on the page
            const button = document.activeElement;
            if (!page.next_cursor && button instanceof HTMLElement && button.classList.contains('messages-older') && el.contains(button)) el.focus({ preventScroll: true });
            announce(page.next_cursor ? tn(page.items.length, '{{count}} older messages loaded', '{{count}} older messages loaded') : t('The start of the conversation is loaded'));
        } catch (e) {
            pending.current = null;
            announce(t('Older messages did not load: {{reason}}', { reason: errorMessage(e) }));
        } finally {
            setLoadingOlder(false);
            speakSoon();
        }
    }, [api, id, queryClient, announce, speakSoon]);

    const onScroll = () => {
        const el = scroller.current;
        if (!el) return;
        const b = isAtBottom(el.scrollTop, el.clientHeight, el.scrollHeight);
        atBottom.current = b;
        if (b !== bottom) setBottom(b);
        if (nearTop(el.scrollTop) && data?.older && !loadingOlder) void loadOlder();
    };

    const toEnd = () => {
        const el = scroller.current;
        if (!el) return;
        atBottom.current = true;
        setBottom(true);
        el.scrollTop = el.scrollHeight;
        setSeenNewest(newest);
        el.focus();
    };

    // replies that came while one reads further up
    const seenAt = seenNewest ? shown.findIndex((m) => m.id === seenNewest) : -1;
    const waiting = seenAt >= 0 ? shown.slice(seenAt + 1).filter((m) => !m.mine).length : 0;

    // --- photos full size
    const [lightbox, setLightbox] = useState<{ images: Media[]; index: number; label: string } | null>(null);

    const send = async (html: string, mediaIds: string[]) => {
        const body: Schema<'NewMessage'> = { body: html };
        if (mediaIds.length) body.media_ids = mediaIds;
        const sent = unwrap(await api.POST('/conversations/{id}/messages', { params: { path: { id } }, body }));
        // one's own message goes to the end, and so does the view
        atBottom.current = true;
        setBottom(true);
        // a poll that asked before the reply was there would take it away again when it answers
        await queryClient.cancelQueries(messagesKey(id));
        queryClient.setQueryData<Thread>(messagesKey(id), (prev) => withSent(prev, sent));
        void queryClient.invalidateQueries(['conversations']);
        announce(t('Sent'));
    };

    const [peopleOpen, setPeopleOpen] = useState(false);
    const peopleId = useId();
    // just started here (NewConversation): the reply box has focus, where the first message was typed
    const [focusReply] = useState(() => focusReplyOnOpen.has(id));
    useEffect(() => {
        focusReplyOnOpen.delete(id);
    }, [id]);
    const announceInWindow = useWindowAnnounce();
    const title = conv.data ? conversationTitle(conv.data, myIds) : t('Conversation');
    const moreOwner = `conversation-more-${id}`;
    const moreOpen = useMenuExpanded(moreOwner);
    const markUnread = async () => {
        try {
            ensureOk(await api.DELETE('/conversations/{id}/read', { params: { path: { id } } }));
            // the inbox shows its dot again; this view stays open and does not read it again
            keptUnread.current = conv.data?.replies ?? null;
            void queryClient.invalidateQueries(['conversations']);
            requestSync();
            announce(t('Marked as unread'));
        } catch (e) {
            announce(t('Could not mark it as unread: {{reason}}', { reason: errorMessage(e) }));
        }
    };
    const moreEntries = (): MenuEntry[] => {
        const out: MenuEntry[] = [{ text: t('Mark as Unread'), run: () => void markUnread() }];
        const url = conv.data?.url;
        if (url) {
            out.push(
                'separator',
                {
                    text: t('Copy Link'),
                    run: () => copyLink(url),
                },
            );
        }
        return out;
    };

    return (
        <Pane
            pane="detail"
            title={title}
            fixed
            busy={conv.isLoading}
            actions={
                <>
                    {conv.data ? (
                        <Tooltip text={t('People')}>
                            <button
                                type="button"
                                className="tb-btn tb-btn-count"
                                aria-label={tn(conv.data.participants.length, 'People, {{count}}', 'People, {{count}}')}
                                aria-expanded={peopleOpen}
                                aria-controls={peopleId}
                                onClick={() => setPeopleOpen((o) => !o)}
                            >
                                <Icon name="users" />
                                <span aria-hidden="true">{conv.data.participants.length}</span>
                            </button>
                        </Tooltip>
                    ) : null}
                    {openInWindow && conv.data ? <ToolbarButton icon="app-window" label={t('Open in New Window')} commandId="open-in-window" onClick={() => openInWindow({ kind: 'conversation', id })} /> : null}
                    {conv.data ? (
                        <Tooltip text={t('More')}>
                            <button
                                type="button"
                                className="tb-btn"
                                aria-label={t('More for the conversation')}
                                aria-haspopup="menu"
                                aria-expanded={moreOpen}
                                onClick={(e) => void showMenu(moreEntries(), { anchor: e.currentTarget }, { label: title, owner: moreOwner })}
                            >
                                <Icon name="ellipsis" />
                            </button>
                        </Tooltip>
                    ) : null}
                    <CloseDetailButton />
                </>
            }
        >
            <div className="conversation">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {conv.isError && gone ? (
                    <EmptyState
                        icon="message-circle"
                        title={t('This conversation isn’t available')}
                        hint={t('You may have left it, or it was removed.')}
                        actions={
                            <button type="button" className="btn btn-primary" onClick={() => forget({ kind: 'conversation', id })}>
                                {isSecondaryWindow ? t('Close window') : t('Close')}
                            </button>
                        }
                    />
                ) : conv.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(conv.error)}</span>
                        </p>
                        <button type="button" className="btn" onClick={() => void conv.refetch()} aria-busy={conv.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {!conv.data && conv.isLoading ? (
                    <p className="sr-only" role="status">
                        {t('Loading the conversation…')}
                    </p>
                ) : null}
                {conv.data && peopleOpen ? (
                    <People
                        id={peopleId}
                        conv={conv.data}
                        myIds={myIds}
                        announce={announce}
                        onClose={() => {
                            setPeopleOpen(false);
                            requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(peopleId)}"]`)?.focus());
                        }}
                        onLeft={() => {
                            // said by the window: this pane and its live region go now
                            announceInWindow(t('You left the conversation'));
                            void queryClient.invalidateQueries(['conversations']);
                            queryClient.removeQueries(conversationKey(id));
                            queryClient.removeQueries(messagesKey(id));
                            forget({ kind: 'conversation', id });
                        }}
                    />
                ) : null}
                {conv.data ? (
                    <>
                        <div className="chat">
                            <div
                                ref={scroller}
                                className="messages"
                                role="log"
                                aria-label={t('Messages with {{title}}', { title })}
                                aria-busy={loadingOlder || !data || undefined}
                                aria-live={quiet ? 'off' : 'polite'}
                                tabIndex={0}
                                onScroll={onScroll}
                            >
                                <div ref={content} className="messages-content">
                                    {data?.older ? (
                                        <button
                                            type="button"
                                            className="btn btn-quiet small messages-older"
                                            onClick={() => void loadOlder()}
                                            aria-busy={loadingOlder || undefined}
                                            aria-disabled={loadingOlder || undefined}
                                        >
                                            {loadingOlder ? t('Loading older messages…') : t('Load older messages')}
                                        </button>
                                    ) : complete ? (
                                        <div className="messages-start">
                                            <span className="avatar-stack" aria-hidden="true">
                                                {conv.data.participants.slice(0, 3).map((p) => (
                                                    <Avatar key={p.id} profile={p} size={24} />
                                                ))}
                                            </span>
                                            <p>{t('The start of the conversation')}</p>
                                        </div>
                                    ) : null}
                                    {thread.isError && !data ? (
                                        <p className="error" role="alert">
                                            {errorMessage(thread.error)}
                                        </p>
                                    ) : null}
                                    {!data && thread.isLoading ? <p className="messages-loading">{t('Loading messages…')}</p> : null}
                                    {rows.map((row, i) =>
                                        row.kind === 'day' ? (
                                            <h3 key={`day-${row.key}`} className="day-separator">
                                                <span>{row.label}</span>
                                            </h3>
                                        ) : (
                                            <MessageRow
                                                key={row.message.id}
                                                message={row.message}
                                                continued={row.continued}
                                                last={endsRun(rows, i)}
                                                showName={conv.data.participants.length > 2}
                                                unreadFrom={row.message.id === unreadFrom}
                                                editing={editing === row.message.id}
                                                onEdit={() => setEditing(row.message.id)}
                                                onEdited={(saved) => {
                                                    if (saved) {
                                                        queryClient.setQueryData<Thread>(messagesKey(id), (prev) => withEdited(prev, saved));
                                                        announce(t('Message saved'));
                                                    }
                                                    setEditing(null);
                                                    // back to the message's Edit button, which had focus
                                                    requestAnimationFrame(() => document.getElementById(editButtonId(row.message.id))?.focus());
                                                }}
                                                conversationId={id}
                                                onOpenPhoto={(images, index) => setLightbox({ images, index, label: row.message.mine ? t('Your message') : row.message.author ? t('{{name}}’s message', { name: row.message.author.display_name }) : t('A message') })}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                            {waiting > 0 ? (
                                <button type="button" className="pill messages-jump" onClick={toEnd}>
                                    <Icon name="arrow-down" size={12} strong />
                                    {tn(waiting, '{{count}} new message', '{{count}} new messages')}
                                </button>
                            ) : null}
                        </div>
                        {conv.data ? (
                            <MessageComposer
                                key={id}
                                id={CONVERSATION_REPLY_FIELD}
                                autoFocus={focusReply}
                                purpose="message"
                                draftKey={draftKey}
                                placeholder={t('Write a message')}
                                onSend={send}
                                announce={announce}
                                uploader={uploader}
                            />
                        ) : null}
                    </>
                ) : null}
            </div>
            <Lightbox
                images={lightbox?.images ?? []}
                index={lightbox ? lightbox.index : null}
                onIndex={(index) => setLightbox((l) => (l ? { ...l, index } : l))}
                onClose={() => setLightbox(null)}
                label={lightbox?.label ?? t('Photos')}
            />
        </Pane>
    );
}

/** Whether the message at `i` ends its run: the next row is a day or a message that does not continue it. */
function endsRun(rows: ReturnType<typeof withDays>, i: number): boolean {
    const next = rows[i + 1];
    return !next || next.kind === 'day' || !next.continued;
}

/** The id of a message's Edit button, where focus goes back after the edit. */
const editButtonId = (messageId: string) => `message-${messageId}-edit`;

function MessageRow({
    message: m,
    continued,
    last,
    showName,
    unreadFrom,
    editing,
    onEdit,
    onEdited,
    conversationId,
    onOpenPhoto,
}: {
    message: Message;
    continued: boolean;
    /** The last message of its run (the next is another author's or day's): its time shows. */
    last: boolean;
    /** The name line over a run: only with more than two people (with one other, the toolbar names them). */
    showName: boolean;
    unreadFrom: boolean;
    /** Edited in place now: its text is the editor. */
    editing: boolean;
    onEdit: () => void;
    /** The edit is over: the message as saved, or null when it was put away. */
    onEdited: (saved: Message | null) => void;
    conversationId: string;
    onOpenPhoto: (images: Media[], index: number) => void;
}) {
    const allowed = useMediaSrc();
    const photos = m.media.filter((x) => x.kind === 'image' && !!pictureOf(x, 'medium', allowed));
    const small = photos.length > 2;
    return (
        <>
            {unreadFrom ? (
                <p className="unread-separator" role="separator" aria-label={t('New messages')}>
                    <span aria-hidden="true">{t('New', { context: 'unread' })}</span>
                </p>
            ) : null}
            <article className={`bubble-row${m.mine ? ' mine' : ''}${continued ? ' continued' : ''}${last ? ' last' : ''}`} data-message-id={m.id}>
                {!m.mine ? <span className="bubble-avatar">{!continued ? <ProfileAvatar profile={m.author} size={28} /> : null}</span> : null}
                <div className="bubble">
                    {m.mine ? (
                        <span className="sr-only">{t('You:')} </span>
                    ) : showName && !continued && m.author ? (
                        <span className={`bubble-author small${m.author.badges?.length ? ' with-badges' : ''}`}>
                            <ProfileName profile={m.author} />
                            <ProfileBadges badges={m.author.badges} />
                        </span>
                    ) : m.author ? (
                        <span className="sr-only">{`${m.author.display_name}: `}</span>
                    ) : null}
                    {photos.length ? (
                        <div className={`message-photos${small ? ' small' : ''}`} role="group" aria-label={mediaLabel(photos)}>
                            {photos.map((p, i) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    className="message-photo"
                                    style={small ? undefined : { aspectRatio: aspectRatio(p) }}
                                    aria-label={photos.length > 1 ? t('Open photo {{n}} of {{total}}', { n: i + 1, total: photos.length }) : t('Open the photo')}
                                    aria-haspopup="dialog"
                                    onClick={() => onOpenPhoto(photos, i)}
                                >
                                    <img src={pictureOf(p, small ? 'thumb' : 'medium', allowed) ?? ''} alt="" loading="lazy" decoding="async" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {editing ? (
                        <MessageEditor conversationId={conversationId} message={m} onDone={onEdited} />
                    ) : (
                        <div dir="auto">
                            <RichText html={m.body_html} />
                        </div>
                    )}
                </div>
                {m.can_edit && !editing ? (
                    <button type="button" id={editButtonId(m.id)} className="btn btn-quiet small bubble-edit" aria-label={t('Edit your message')} onClick={onEdit}>
                        {t('Edit')}
                    </button>
                ) : null}
                <time className="bubble-time" dateTime={m.created_at} title={new Date(m.created_at).toLocaleString(locale())}>
                    {timeLabel(m.created_at)}
                </time>
            </article>
        </>
    );
}

/**
 * Who is in a conversation, and the changes the site allows: who started it adds people and
 * takes them out (`can_add_participants`), anyone in it may leave (`can_leave`, asked first).
 */
function People({ id, conv, myIds, announce, onLeft, onClose }: { id: string; conv: Conv; myIds: ReadonlySet<string>; announce: (text: string) => void; onLeft: () => void; onClose: () => void }) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState<Profile[]>([]);
    const [busy, setBusy] = useState(false);
    const working = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const fieldId = `${id}-add`;
    const inIt = new Set(conv.participants.map((p) => p.id));
    const exclude = new Set([...inIt, ...myIds]);

    // The buttons are never disabled while busy (aria-disabled, and this ignores them): a
    // focused control that becomes disabled drops focus to the page, and a refusal would leave
    // it there.
    const run = async (work: () => Promise<void>) => {
        if (working.current) return;
        working.current = true;
        setBusy(true);
        setError(null);
        try {
            await work();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            working.current = false;
            setBusy(false);
        }
    };

    const add = () =>
        run(async () => {
            const next = unwrap(await api.POST('/conversations/{id}/participants', { params: { path: { id: conv.id } }, body: { profile_ids: adding.map((p) => p.id) } }));
            queryClient.setQueryData(conversationKey(conv.id), next);
            const added = next.participants.filter((p) => !inIt.has(p.id)).map((p) => p.display_name);
            const left = adding.filter((p) => !next.participants.some((x) => x.id === p.id)).map((p) => p.display_name);
            setAdding([]);
            const addedNames = added.join(', ');
            const leftNames = left.join(', ');
            announce(
                added.length && left.length
                    ? t('Added {{added}}. You may not contact {{left}}', { added: addedNames, left: leftNames })
                    : added.length
                      ? t('Added {{names}}', { names: addedNames })
                      : left.length
                        ? t('You may not contact {{names}}', { names: leftNames })
                        : '',
            );
            document.getElementById(fieldId)?.focus();
        });

    const remove = (p: Profile) =>
        run(async () => {
            ensureOk(await api.DELETE('/conversations/{id}/participants/{profile_id}', { params: { path: { id: conv.id, profile_id: p.id } } }));
            queryClient.setQueryData<Conv>(conversationKey(conv.id), (c) => (c ? { ...c, participants: c.participants.filter((x) => x.id !== p.id) } : c));
            announce(t('{{name}} is no longer in the conversation', { name: p.display_name }));
            document.getElementById(`${id}-heading`)?.focus();
        });

    const leave = async () => {
        const ok = await confirmAction({ title: t('Leave this conversation?'), message: t('It goes from your messages for good. The others keep it.'), okLabel: t('Leave') });
        if (!ok) return;
        await run(async () => {
            ensureOk(await api.DELETE('/conversations/{id}/participants/{profile_id}', { params: { path: { id: conv.id, profile_id: me.active_profile_id } } }));
            // the pane closes: focus goes back to what opened it (the shell), the window says it
            onLeft();
        });
    };

    return (
        <section
            id={id}
            className="conversation-people"
            aria-labelledby={`${id}-heading`}
            onKeyDown={(e) => {
                if (e.key !== 'Escape' || e.defaultPrevented || (e.target as Element).closest('[role="combobox"][aria-expanded="true"]')) return;
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
        >
            <h3 id={`${id}-heading`} className="people-heading" tabIndex={-1}>
                {t('People in this conversation')}
            </h3>
            <ul className="people-list">
                {conv.participants.map((p) => (
                    <li key={p.id} className="people-row">
                        <ProfileAvatar profile={p} size={24} />
                        <span className={`people-name${p.badges?.length ? ' with-badges' : ''}`}>
                            <ProfileName profile={p} />
                            <ProfileBadges badges={p.badges} />
                        </span>
                        {myIds.has(p.id) ? <span className="people-you">{t('(you)')}</span> : null}
                        {conv.can_add_participants && !myIds.has(p.id) ? (
                            <button type="button" className="btn btn-quiet small" aria-label={t('Remove {{name}}', { name: p.display_name })} aria-disabled={busy || undefined} onClick={() => void remove(p)}>
                                {t('Remove')}
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
            {conv.can_add_participants ? (
                <div className="people-add">
                    <RecipientField id={fieldId} label={t('Add people')} value={adding} onChange={setAdding} exclude={exclude} announce={announce} />
                    <button type="button" className="btn" aria-disabled={busy || !adding.length || undefined} aria-busy={busy || undefined} onClick={() => adding.length && void add()}>
                        {t('Add')}
                    </button>
                </div>
            ) : null}
            {conv.can_leave ? (
                <button type="button" className="btn btn-quiet small people-leave" aria-disabled={busy || undefined} onClick={() => !working.current && void leave()}>
                    <Icon name="log-out" />
                    {t('Leave conversation')}
                </button>
            ) : null}
            {error ? (
                <p className="error" role="alert">
                    {error}
                </p>
            ) : null}
        </section>
    );
}

/**
 * A new conversation in the detail pane: whom it goes to (a field that finds people, chips for
 * those chosen; one already there when it opened from someone's Message button) and the first
 * message, with photos. Sent, it becomes the conversation.
 */
export function NewConversation({ profileId, uploader }: { profileId?: string; uploader?: Uploader }) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const [announcement, announce] = useAnnouncer();
    const to = useQuery({
        queryKey: profileSummaryKey(profileId ?? ''),
        queryFn: async (): Promise<Profile> => unwrap(await api.GET('/profiles/{id}', { params: { path: { id: profileId ?? '' } } })),
        enabled: !!profileId,
        staleTime: Infinity,
    });
    const draftKey = useDraftKey(profileId ? `message-to:${profileId}` : 'message-new');
    const myIds = new Set(me.profiles.map((p) => p.id));
    const fieldId = useId();

    const [recipients, setRecipients] = useState<Profile[]>([]);
    // the profile it opened for goes first, once known
    const [seeded, setSeeded] = useState(false);
    if (!seeded && to.data) {
        setSeeded(true);
        if (!recipients.some((p) => p.id === to.data.id)) setRecipients([to.data, ...recipients]);
    }
    const onRestore = useCallback((d: Draft) => {
        if (!d.recipients?.length) return;
        setRecipients((now) => [...now, ...(d.recipients ?? []).filter((p) => !now.some((x) => x.id === p.id))]);
    }, []);

    const names = recipients.map((p) => p.display_name).join(', ');
    return (
        <Pane pane="detail" title={names ? t('New message to {{names}}', { names }) : t('New message')} actions={<CloseDetailButton />} fixed>
            <div className="conversation new-conversation">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {to.isError ? (
                    <p className="error" role="alert">
                        {errorMessage(to.error)}
                    </p>
                ) : null}
                <RecipientField id={fieldId} label={t('To')} value={recipients} onChange={setRecipients} exclude={myIds} autoFocus={!profileId} announce={announce} />
                <div className="chat-spacer" />
                <MessageComposer
                    purpose="conversation"
                    draftKey={draftKey}
                    autoFocus={!!profileId}
                    recipients={profileId ? undefined : recipients}
                    onRestore={profileId ? undefined : onRestore}
                    blocker={recipients.length ? null : t('Add someone to send it to')}
                    placeholder={names ? t('Message {{names}}', { names }) : t('Write a message')}
                    announce={announce}
                    uploader={uploader}
                    onSend={async (html, mediaIds) => {
                        // the route this was sent from: the person may go elsewhere while it sends
                        const from = history.current;
                        const body: Schema<'NewConversation'> = { recipients: recipients.map((p) => p.id), body: html };
                        if (mediaIds.length) body.media_ids = mediaIds;
                        const c = unwrap(await api.POST('/conversations', { body }));
                        queryClient.setQueryData(conversationKey(c.id), c);
                        await queryClient.invalidateQueries(['conversations']);
                        const left = recipients.filter((p) => !c.participants.some((x) => x.id === p.id)).map((p) => p.display_name);
                        if (left.length) announce(t('You may not contact {{names}}: they were left out', { names: left.join(', ') }));
                        // its reply box takes focus: this pane and the box that had it go now
                        focusReplyOnOpen.add(c.id);
                        replaceDetail({ kind: 'conversation', id: c.id }, from);
                    }}
                />
            </div>
        </Pane>
    );
}
