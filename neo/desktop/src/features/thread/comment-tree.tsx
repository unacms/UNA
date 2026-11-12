import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { Avatar } from '../../components/avatar';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { Tooltip } from '../../components/tooltip';
import { ago, ApiError, ensureOk, retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { draftStore, useDraftKey } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { locale, t, tn } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { coalesce, useRealtime } from '../../lib/realtime';
import { paneHeadingId } from '../../shell/pane';
import { updateItem } from '../feed/cache';
import { appendComment, commentItems, commentsKey, countReply, dropComment, putComment, repliesKey } from './cache';
import { normalizeHtml } from '../../components/rich-editor/schema';
import { BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS } from '../../lib/rich-html';
import { CommentComposer } from './comment-composer';

type Comment = Schema<'Comment'>;
type Item = Schema<'Item'>;

const PAGE = 20;
/** Live comment events reload an item's comments at most this often. */
const LIVE_COMMENTS_MS = 1_000;
/** Pages of comments (and of a thread's replies) loaded at most to find the comment a post was opened for. */
const SEEK_PAGES = 10;

/** The text box under the post: the post's Comment button focuses it. */
export const commentBoxId = (itemId: string) => `comment-box-${itemId}`;
const replyButtonId = (id: string) => `comment-${id}-reply`;
const editButtonId = (id: string) => `comment-${id}-edit`;
const headingId = (itemId: string) => `comments-${itemId}-title`;

/** What is open in the tree: at most one reply box or one edit at a time. */
type Open = { kind: 'reply' | 'edit'; id: string } | null;
type Box = NonNullable<Open>;

const boxKey = (box: Box) => `${box.kind}:${box.id}`;

type TreeValue = {
    item: Item;
    /** What its comments are called (comments of a post, replies of a discussion). */
    words: CommentWords;
    open: Open;
    /** Open another box, or none. What was typed in the box it closes is kept for next time. */
    setOpen: (open: Open, focusAfter?: string) => void;
    /** Cancel or Esc: put the box away, after asking when that throws away what was typed. */
    cancel: (box: Box, focusAfter: string) => Promise<void>;
    /** Unsent text of a box, kept while the box is closed. */
    draft: (box: Box) => string | undefined;
    /** The lasting draft of a reply box (none for an edit). */
    draftKeyOf: (box: Box) => string | null;
    /** The box's text changed: it is a draft unless it is empty or still `initial`. */
    /** Keep a box's unsent text (its HTML) while another box is open; `initial` is what it started as. */
    keepDraft: (box: Box, initial: string, html: string, text: string) => void;
    /** Write `parent`'s reply; it goes in the thread under `threadId` (a top-level comment). */
    reply: (parent: Comment, threadId: string, text: string, html: string) => Promise<void>;
    edit: (comment: Comment, text: string, html: string) => Promise<void>;
    remove: (comment: Comment) => Promise<void>;
    announce: (message: string) => void;
    /** The comment the post was opened for (a notification, a link). */
    target: CommentTarget | undefined;
    /** Which opening for a target this is: a new one when the target changes on an open post. */
    targetKey: string | null;
    /** The target is drawn: focus it (once per opening). */
    targetFound: (el: HTMLElement | null) => void;
    /** The target can't be shown (deleted, or further than SEEK_PAGES): say so, once per opening. */
    targetMissing: () => void;
};

/** A comment to show when the post opens: its id, and for a reply the top-level comment it is under. */
export type CommentTarget = { id: string; thread?: string };

/**
 * What the tree calls its comments: a post's are comments, a discussion's are replies. Every
 * sentence the tree says about one ("Delete this reply?", "Loaded 3 more replies", "Edit the
 * reply by Lily") is here whole, so a thread never mixes the two words, and another language
 * words each sentence its own way.
 */
export type CommentWords = {
    title: string;
    none: string;
    more: string;
    write: string;
    submit: string;
    /** The send button of the box under the post. */
    send: string;
    posted: string;
    /** Above the box under the post: who writes ("Commenting as Lily"). */
    as: (name: string) => string;
    loading: string;
    /** More of them were loaded: how many. */
    loaded: (count: number) => string;
    /** The one the post was opened for can't be shown. */
    missing: string;
    /** The name of a thread's list when what it is under has no author. */
    repliesTo: string;
    editBy: (name: string) => string;
    deleteBy: (name: string) => string;
    /** Under "Discard your changes?". */
    stays: string;
    saved: string;
    deleteTitle: string;
    deleted: string;
};

export const COMMENT_WORDS: CommentWords = {
    title: t('Comments'),
    none: t('No comments yet.'),
    more: t('More comments'),
    write: t('Write a comment'),
    submit: t('Comment'),
    send: t('Send comment'),
    posted: t('Comment posted'),
    as: (name) => t('Commenting as {{name}}', { name }),
    loading: t('Loading comments…'),
    loaded: (count) => tn(count, 'Loaded {{count}} more comment', 'Loaded {{count}} more comments'),
    missing: t('That comment can’t be shown here. It may have been deleted.'),
    repliesTo: t('Replies to the comment'),
    editBy: (name) => t('Edit the comment by {{name}}', { name }),
    deleteBy: (name) => t('Delete the comment by {{name}}', { name }),
    stays: t('The comment stays as it was.'),
    saved: t('Comment saved'),
    deleteTitle: t('Delete this comment?'),
    deleted: t('Comment deleted'),
};

export const REPLY_WORDS: CommentWords = {
    title: t('Replies'),
    none: t('No replies yet.'),
    more: t('More replies'),
    write: t('Write a reply'),
    submit: t('Reply'),
    send: t('Send reply'),
    posted: t('Reply posted'),
    as: (name) => t('Replying as {{name}}', { name }),
    loading: t('Loading replies…'),
    loaded: (count) => tn(count, 'Loaded {{count}} more reply', 'Loaded {{count}} more replies'),
    missing: t('That reply can’t be shown here. It may have been deleted.'),
    repliesTo: t('Replies to the reply'),
    editBy: (name) => t('Edit the reply by {{name}}', { name }),
    deleteBy: (name) => t('Delete the reply by {{name}}', { name }),
    stays: t('The reply stays as it was.'),
    saved: t('Reply saved'),
    deleteTitle: t('Delete this reply?'),
    deleted: t('Reply deleted'),
};

const TreeContext = createContext<TreeValue | null>(null);

function useTree(): TreeValue {
    const value = useContext(TreeContext);
    if (!value) throw new Error('comment outside CommentTree');
    return value;
}

function useCommentPages(key: readonly unknown[], fetchPage: (cursor: string | undefined) => Promise<Schema<'Page_Comment'>>, enabled = true) {
    return useInfiniteQuery({ queryKey: key, queryFn: ({ pageParam }) => fetchPage(pageParam as string | undefined), getNextPageParam: (last) => last.next_cursor ?? undefined, retry: retryOnce, enabled });
}

/**
 * A post's comments: the top-level ones, each with its replies loaded when opened ("N
 * replies"), a reply box under the comment being answered, edits in place, and a box for a new
 * comment at the end. The Timeline nests one level, so each top-level comment's replies are one
 * flat thread; "replying to" names who a deeper reply answers.
 */
export function CommentTree({ item, target, words = COMMENT_WORDS }: { item: Item; target?: CommentTarget; words?: CommentWords }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [open, setOpenState] = useState<Open>(null);
    const [message, setMessage] = useState('');
    const pendingFocus = useRef<string | null>(null);
    // only one box is open, but switching boxes must not throw away what was typed in one
    const drafts = useRef(new Map<string, string>());
    // lasting drafts (lib/drafts.ts): the new comment's, and each reply's under it
    const commentDraft = useDraftKey(`comment:${item.id}`);

    const top = useCommentPages(commentsKey(item.id), async (cursor) => unwrap(await api.GET('/content/{id}/comments', { params: { path: { id: item.id }, query: { cursor, limit: PAGE } } })));
    const comments = commentItems(top.data);
    // someone commented, edited or removed a comment (lib/realtime.ts): this item's comments and
    // its count load again, at most every second
    const reloadComments = useMemo(
        () =>
            coalesce(() => {
                void queryClient.invalidateQueries({ queryKey: commentsKey(item.id) });
                void queryClient.invalidateQueries({ queryKey: ['replies'] });
                void queryClient.invalidateQueries({ queryKey: ['activity', item.id], exact: true });
            }, LIVE_COMMENTS_MS),
        [queryClient, item.id],
    );
    useRealtime(item.live?.comments, reloadComments);

    // focus moves once React drew what it goes to (a button the open box replaced), in the
    // commit that put the box away; if that is gone too, focus is not taken later by surprise
    useLayoutEffect(() => {
        const id = pendingFocus.current;
        if (!id) return;
        pendingFocus.current = null;
        document.getElementById(id)?.focus();
    });

    const announce = useCallback((text: string) => {
        // the same words twice in a row must still be read
        setMessage('');
        requestAnimationFrame(() => setMessage(text));
    }, []);

    // The comment the post was opened for: pages load until its thread is there (and the thread's
    // replies until a reply is: Replies), then it is focused (and so scrolled to) once it is drawn;
    // a reply's thread opens by itself (TopComment). When it can't be shown, that is said and focus
    // goes to the comments heading. Focus the person moved meanwhile is left alone.
    const targetKey = target ? `${target.id}:${target.thread ?? ''}` : null;
    const settled = useRef<string | null>(null);
    const startedOn = useRef<Element | null>(null);
    // a layout effect: it runs before the comments' effects that focus the target
    useLayoutEffect(() => {
        startedOn.current = targetKey ? document.activeElement : null;
    }, [targetKey]);
    const focusIfFree = useCallback((el: HTMLElement | null) => {
        const active = document.activeElement;
        if (!el || (active && active !== document.body && active !== startedOn.current && active.id !== paneHeadingId('detail'))) return;
        el.focus();
    }, []);
    const settle = useCallback(() => {
        if (!targetKey || settled.current === targetKey) return false;
        settled.current = targetKey;
        return true;
    }, [targetKey]);
    const targetFound = useCallback(
        (el: HTMLElement | null) => {
            if (settle()) focusIfFree(el);
        },
        [settle, focusIfFree],
    );
    const targetMissing = useCallback(() => {
        if (!settle()) return;
        // after the commit that found it missing (the loads run from effects)
        requestAnimationFrame(() => {
            announce(words.missing);
            focusIfFree(document.getElementById(headingId(item.id)));
        });
    }, [settle, announce, focusIfFree, item.id, words.missing]);

    const threadOfTarget = target?.thread ?? target?.id;
    const topPages = top.data?.pages.length ?? 0;
    const threadShown = !!threadOfTarget && comments.some((c) => c.id === threadOfTarget);
    useEffect(() => {
        if (!threadOfTarget || threadShown || !top.isSuccess || top.isFetchingNextPage) return;
        if (top.hasNextPage && topPages < SEEK_PAGES) void top.fetchNextPage();
        else targetMissing();
    }, [threadOfTarget, threadShown, top, topPages, targetMissing]);

    /**
     * The post's comment count as the site has it now, wherever the post is shown. Only that:
     * the rest of the post may be changing here meanwhile (a reaction on its way), and a copy
     * read before that change is saved would undo it.
     */
    const refreshItem = useCallback(async () => {
        try {
            const fresh = unwrap(await api.GET('/content/{id}', { params: { path: { id: item.id } } }));
            const comments = fresh.stats.comments;
            updateItem(queryClient, item.id, (old) => (old.stats.comments === comments ? old : { ...old, stats: { ...old.stats, comments } }));
        } catch {
            // the counts stay a little off until the next refresh
        }
    }, [api, queryClient, item.id]);

    const value = useMemo<TreeValue>(() => {
        return {
            item,
            words,
            open,
            setOpen: (next, focusAfter) => {
                if (open && (!next || boxKey(next) !== boxKey(open)) && drafts.current.has(boxKey(open))) announce(open.kind === 'reply' ? t('Reply draft kept') : t('Edit draft kept'));
                pendingFocus.current = focusAfter ?? null;
                setOpenState(next);
            },
            cancel: async (box, focusAfter) => {
                if (drafts.current.has(boxKey(box))) {
                    const discard = await confirmAction({
                        title: box.kind === 'reply' ? t('Discard this reply?') : t('Discard your changes?'),
                        message: box.kind === 'reply' ? t('What you wrote is not sent.') : words.stays,
                        okLabel: t('Discard'),
                    });
                    if (!discard) return;
                    drafts.current.delete(boxKey(box));
                    const lasting = box.kind === 'reply' && commentDraft ? `${commentDraft}:${box.id}` : null;
                    if (lasting) void draftStore().delete(lasting);
                }
                pendingFocus.current = focusAfter;
                setOpenState(null);
            },
            draft: (box) => drafts.current.get(boxKey(box)),
            draftKeyOf: (box) => (box.kind === 'reply' && commentDraft ? `${commentDraft}:${box.id}` : null),
            keepDraft: (box, initial, html, text) => {
                if (text.trim() && html !== initial) drafts.current.set(boxKey(box), html);
                else drafts.current.delete(boxKey(box));
            },
            announce,
            target,
            targetKey,
            targetFound,
            targetMissing,
            reply: async (parent, threadId, text, html) => {
                const created = unwrap(await api.POST('/content/{id}/comments', { params: { path: { id: item.id } }, body: { ...commentBody(text, html), parent_id: parent.id } }));
                drafts.current.delete(boxKey({ kind: 'reply', id: parent.id }));
                countReply(queryClient, parent.id);
                appendComment(queryClient, repliesKey(threadId), created);
                pendingFocus.current = replyButtonId(parent.id);
                setOpenState(null);
                announce(t('Reply posted'));
                void refreshItem();
            },
            edit: async (comment, text, html) => {
                const saved = unwrap(await api.PATCH('/comments/{id}', { params: { path: { id: comment.id } }, body: commentBody(text, html) }));
                drafts.current.delete(boxKey({ kind: 'edit', id: comment.id }));
                putComment(queryClient, saved);
                pendingFocus.current = editButtonId(comment.id);
                setOpenState(null);
                announce(words.saved);
            },
            remove: async (comment) => {
                const ok = await confirmAction({ title: words.deleteTitle, message: t('It is deleted for everyone. This cannot be undone.'), okLabel: t('Delete') });
                if (!ok) return;
                try {
                    ensureOk(await api.DELETE('/comments/{id}', { params: { path: { id: comment.id } } }));
                } catch (e) {
                    // already gone: it leaves the list all the same
                    if (!(e instanceof ApiError && e.status === 404)) throw e;
                }
                // the comment's own buttons go with it: focus goes to the comments heading
                pendingFocus.current = headingId(item.id);
                setOpenState(null);
                drafts.current.delete(boxKey({ kind: 'reply', id: comment.id }));
                drafts.current.delete(boxKey({ kind: 'edit', id: comment.id }));
                dropComment(queryClient, comment);
                announce(words.deleted);
                void refreshItem();
            },
        };
    }, [api, queryClient, item, words, open, announce, refreshItem, commentDraft, target, targetKey, targetFound, targetMissing]);

    return (
        <TreeContext.Provider value={value}>
            <section className="comments" aria-labelledby={headingId(item.id)} aria-busy={top.isLoading || undefined}>
                <h3 id={headingId(item.id)} className="comments-title" tabIndex={-1}>
                    {words.title}
                    {item.stats.comments ? <span className="comments-count"> {item.stats.comments}</span> : null}
                </h3>
                <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {message}
                </p>

                {top.isLoading ? <p className="muted small">{words.loading}</p> : null}
                {top.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="error">{errorMessage(top.error)}</p>
                        <button type="button" className="btn" onClick={() => void top.refetch()} aria-busy={top.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {top.isSuccess && !comments.length ? <p className="comments-none">{words.none}</p> : null}

                {comments.length ? (
                    <ul className="comment-list" aria-label={words.title}>
                        {comments.map((c) => (
                            <TopComment key={c.id} comment={c} />
                        ))}
                    </ul>
                ) : null}

                {top.hasNextPage ? (
                    <MoreButton
                        busy={top.isFetchingNextPage}
                        label={words.more}
                        onClick={async () => {
                            const before = comments.length;
                            const result = await top.fetchNextPage();
                            const loaded = commentItems(result.data).length - before;
                            if (loaded > 0) announce(words.loaded(loaded));
                        }}
                    />
                ) : null}
            </section>
            {/* docked at the pane's bottom: a child of the thread's column, not of this section,
                so it sticks while the comments are still below the fold */}
            {item.viewer?.can_comment ? (
                <CommentComposer
                    docked
                    id={commentBoxId(item.id)}
                    draftKey={commentDraft}
                    label={words.write}
                    submitLabel={words.submit}
                    sendLabel={words.send}
                    asText={words.as}
                    onSubmit={async (text, html) => {
                        const created = unwrap(await api.POST('/content/{id}/comments', { params: { path: { id: item.id } }, body: commentBody(text, html) }));
                        appendComment(queryClient, commentsKey(item.id), created);
                        announce(words.posted);
                        void refreshItem();
                    }}
                />
            ) : null}
        </TreeContext.Provider>
    );
}

function MoreButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => Promise<unknown> }) {
    return (
        <button type="button" className="btn btn-quiet small more-comments" onClick={() => void onClick()} disabled={busy} aria-busy={busy}>
            {busy ? t('Loading…') : label}
        </button>
    );
}

/**
 * A top-level comment and its thread, as one card (as Linear's): the comment, its replies under
 * it, each past a hairline, and at the card's foot the thread's own reply ("Leave a reply…"),
 * which opens a box in its place. Replies answer the thread: a reply to a reply is not written
 * here (older ones still say whom they answer). A line the site wrote itself (a task's activity)
 * is no thread: it stands between the cards as a plain line.
 */
function TopComment({ comment }: { comment: Comment }) {
    const { item, open, setOpen, cancel, draft, draftKeyOf, keepDraft, reply } = useTree();
    const { me } = useApp();
    if (comment.automated)
        return (
            <li className="comment-line">
                <CommentView comment={comment} />
            </li>
        );
    const name = comment.author?.display_name ?? t('Someone');
    const replyBox: Box = { kind: 'reply', id: comment.id };
    const replying = open?.kind === 'reply' && open.id === comment.id;
    const writer = me.profiles.find((p) => p.id === me.active_profile_id) ?? null;

    return (
        <li className="comment-thread">
            <CommentView comment={comment} />
            {comment.replies > 0 ? <Replies top={comment} /> : null}
            {item.viewer?.can_comment ? (
                <div className="thread-reply">
                    {replying ? (
                        <CommentComposer
                            label={t('Reply to {{name}}', { name })}
                            submitLabel={t('Reply')}
                            draft={draft(replyBox)}
                            draftKey={draftKeyOf(replyBox)}
                            onTextChange={(html, text) => keepDraft(replyBox, '', html, text)}
                            autoFocus
                            onSubmit={(text, html) => reply(comment, comment.id, text, html)}
                            onCancel={() => void cancel(replyBox, replyButtonId(comment.id))}
                        />
                    ) : (
                        <button
                            type="button"
                            id={replyButtonId(comment.id)}
                            className="thread-reply-open"
                            // the visible words start the name (WCAG 2.5.3); the rest says which thread
                            aria-label={t('Leave a reply to {{name}}', { name })}
                            aria-expanded={false}
                            onClick={() => setOpen(replyBox)}
                        >
                            <Avatar profile={writer} size={24} />
                            <span>{t('Leave a reply…')}</span>
                        </button>
                    )}
                </div>
            ) : null}
        </li>
    );
}

function Replies({ top }: { top: Comment }) {
    const { api } = useApp();
    const { words, announce, target, targetMissing } = useTree();
    const replies = useCommentPages(repliesKey(top.id), async (cursor) => unwrap(await api.GET('/comments/{id}/replies', { params: { path: { id: top.id }, query: { cursor, limit: PAGE } } })));
    const items = commentItems(replies.data);

    // the reply the post was opened for: pages load until it is there
    const seeking = target?.thread === top.id ? target.id : null;
    const seekShown = !!seeking && items.some((c) => c.id === seeking);
    const pages = replies.data?.pages.length ?? 0;
    useEffect(() => {
        if (!seeking || seekShown || !replies.isSuccess || replies.isFetchingNextPage) return;
        if (replies.hasNextPage && pages < SEEK_PAGES) void replies.fetchNextPage();
        else targetMissing();
    }, [seeking, seekShown, replies, pages, targetMissing]);
    // who each comment of the thread is by, for "replying to"
    const names = new Map<string, string>([[top.id, top.author?.display_name ?? t('Someone')], ...items.map((c) => [c.id, c.author?.display_name ?? t('Someone')] as [string, string])]);

    return (
        <div className="replies" aria-busy={replies.isLoading || undefined}>
            {replies.isLoading ? <p className="muted small">{t('Loading replies…')}</p> : null}
            {replies.isError ? (
                <div className="inline-error" role="alert">
                    <p className="error">{errorMessage(replies.error)}</p>
                    <button type="button" className="btn" onClick={() => void replies.refetch()} aria-busy={replies.isFetching}>
                        {t('Try again')}
                    </button>
                </div>
            ) : null}
            {items.length ? (
                <ul className="comment-list" aria-label={top.author ? t('Replies to {{name}}', { name: top.author.display_name }) : words.repliesTo}>
                    {items.map((c) => (
                        <li key={c.id}>
                            <CommentView comment={c} replyingTo={c.parent_id && c.parent_id !== top.id ? (names.get(c.parent_id) ?? null) : null} />
                        </li>
                    ))}
                </ul>
            ) : null}
            {replies.hasNextPage ? (
                <MoreButton
                    busy={replies.isFetchingNextPage}
                    label={t('More replies')}
                    onClick={async () => {
                        const before = items.length;
                        const result = await replies.fetchNextPage();
                        const loaded = commentItems(result.data).length - before;
                        if (loaded > 0) announce(tn(loaded, 'Loaded {{count}} more reply', 'Loaded {{count}} more replies'));
                    }}
                />
            ) : null}
        </div>
    );
}

type ViewProps = {
    comment: Comment;
    /** The author of the reply this one answers, when that is not the thread's top comment. */
    replyingTo?: string | null;
};

function CommentView({ comment: c, replyingTo }: ViewProps) {
    const { words, open, setOpen, cancel, draft, keepDraft, edit, remove, target, targetKey, targetFound } = useTree();
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const name = c.author?.display_name ?? t('Someone');
    const editing = open?.kind === 'edit' && open.id === c.id;
    const byId = `comment-${c.id}-by`;
    const editBox: Box = { kind: 'edit', id: c.id };
    const isTarget = target?.id === c.id;
    const articleRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (isTarget) targetFound(articleRef.current);
    }, [isTarget, targetKey, targetFound]);

    // a line the site wrote itself (a task's activity: "Eric Novak completed the task"): its text
    // and when, with no author, picture or actions, as the site shows it
    if (c.automated)
        return (
            <article ref={articleRef} className="comment comment-activity" id={`comment-${c.id}`} tabIndex={-1} data-target={isTarget || undefined}>
                <Icon name="list-checks" size={14} />
                <div className="comment-activity-text">
                    <RichText html={c.body_html} />{' '}
                    <time className="comment-time" dateTime={c.created_at} title={new Date(c.created_at).toLocaleString(locale())}>
                        {ago(c.created_at)}
                    </time>
                </div>
            </article>
        );

    return (
        <article ref={articleRef} className="comment" id={`comment-${c.id}`} aria-labelledby={byId} tabIndex={-1} data-target={isTarget || undefined}>
            <ProfileAvatar profile={c.author} size={24} />
            <div className="comment-main">
                <div className="comment-body">
                    <div className="comment-meta">
                        {/* who, with their badges: the comment's name says both (the pills are aria-hidden, the list is text) */}
                        <span id={byId} className={`comment-by${c.author?.badges?.length ? ' with-badges' : ''}`}>
                            {c.author ? <ProfileName profile={c.author} className="strong" /> : <strong>{name}</strong>}
                            <ProfileBadges badges={c.author?.badges} />
                        </span>
                        {replyingTo ? <span className="comment-to"> {t('replying to {{name}}', { name: replyingTo })}</span> : null}{' '}
                        <time className="comment-time" dateTime={c.created_at} title={new Date(c.created_at).toLocaleString(locale())}>
                            {ago(c.created_at)}
                        </time>
                        {c.pinned ? <span className="comment-time"> · {t('pinned')}</span> : null}
                    </div>
                    {editing ? (
                        <CommentComposer
                            label={words.editBy(name)}
                            submitLabel={t('Save')}
                            initialHtml={c.body_html}
                            draft={draft(editBox)}
                            onTextChange={(html, text) => keepDraft(editBox, normalizeHtml(c.body_html, 'mini'), html, text)}
                            autoFocus
                            onSubmit={(text, html) => edit(c, text, html)}
                            onCancel={() => void cancel(editBox, editButtonId(c.id))}
                        />
                    ) : (
                        <RichText html={c.body_html} />
                    )}
                </div>
                {/* Edit and Delete: quiet icon buttons at the comment's top right, shown while the comment
                    is pointed at or holds focus (always there for the keyboard and screen readers) */}
                {!editing && (c.viewer?.can_edit || c.viewer?.can_delete) ? (
                    <div className="comment-tools" data-busy={deleting || undefined}>
                        {c.viewer?.can_edit ? (
                            <Tooltip text={t('Edit')}>
                                <button type="button" id={editButtonId(c.id)} className="comment-tool" aria-label={words.editBy(name)} onClick={() => setOpen(editBox)}>
                                    <Icon name="pencil" size={16} />
                                </button>
                            </Tooltip>
                        ) : null}
                        {c.viewer?.can_delete ? (
                            <Tooltip text={t('Delete')}>
                                <button
                                    type="button"
                                    className="comment-tool"
                                    // not disabled while asking: a disabled button would drop focus to the page
                                    aria-disabled={deleting || undefined}
                                    aria-label={words.deleteBy(name)}
                                    aria-busy={deleting}
                                    onClick={() => {
                                        if (deleting) return;
                                        setError(null);
                                        setDeleting(true);
                                        remove(c).then(
                                            () => setDeleting(false),
                                            (e: unknown) => {
                                                setDeleting(false);
                                                setError(errorMessage(e));
                                            },
                                        );
                                    }}
                                >
                                    <Icon name="trash-2" size={16} />
                                </button>
                            </Tooltip>
                        ) : null}
                    </div>
                ) : null}
                {error ? (
                    <p className="error small" role="alert">
                        {error}
                    </p>
                ) : null}
            </div>
        </article>
    );
}

/** A comment as the API takes it: its HTML (mentions, links), or its plain text where comments are sent as text. */
function commentBody(text: string, html: string): { body_html: string } | { body: string } {
    return BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? { body_html: html } : { body: text };
}
