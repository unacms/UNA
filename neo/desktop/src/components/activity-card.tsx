import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type FocusEvent, type KeyboardEvent, type MouseEvent, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

import type { Schema } from 'una-api';

import { EDIT_POST_EVENT, PostEditor, requestEdit, takeEditRequest } from '../features/compose/post-editor';
import { dropFromFeeds } from '../features/feed/cache';
import { MediaGrid } from '../features/feed/media';
import { type PostMenuItem, postMenuEntries, postMenuItems } from '../features/feed/post-menu';
import { REACT_WITH, ReactionButton, ReactionCount, useReactionKinds } from '../features/feed/reaction-button';
import { PollCard } from '../features/polls/poll-card';
import { activityDetail } from '../features/posts/posts';
import { fetchAnyContext, type Group, groupKey, MY_GROUPS_KEY, MY_SPACES_KEY } from '../features/groups/groups';
import { ProfileAvatar, ProfileName } from '../features/profile/profile-link';
import { commentBoxId } from '../features/thread/comment-tree';
import { useWindowAnnounce } from '../lib/announce';
import { ago, ensureOk } from '../lib/api';
import { useApp } from '../lib/context';
import { errorMessage } from '../lib/errors';
import { locale, t, tn } from '../lib/i18n';
import { rich } from '../lib/i18n-rich';
import { useCopyLink } from '../lib/copy-link';
import { confirmAction } from '../lib/native';
import { isContextMenuKey, showMenu, useMenuExpanded } from '../lib/native-menu';
import { useNavigation } from '../lib/navigation';
import { isWindowGesture, useOpenInWindow } from '../lib/open-in-window';
import { platform } from '../lib/platform';
import { Avatar } from './avatar';
import { Icon, type IconName } from './icon';
import { ProfileBadges } from './profile-badges';
import { RichText } from './rich-text';
import { Tooltip } from './tooltip';
import { VisuallyHidden } from './visually-hidden';

export { dropFromFeeds };

/** What a virtualized feed (FeedList) gives each of its posts. */
export type FeedRowProps = {
    /** The virtualizer measures the post's height through it. */
    rowRef: (el: HTMLElement | null) => void;
    index: number;
    /** aria-setsize: the number of posts, or -1 while more pages may follow. */
    setSize: number;
    /** Where the virtualizer places the post, in px from the top of the feed. */
    offset: number;
    /** Called just before the post leaves the list (deleted), so the list can move focus on. */
    onRemove: () => void;
    tabIndex: number;
    onFocus: (e: FocusEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
};

/**
 * The group whose own feed the posts are in: their context line would only repeat it, so it
 * is not drawn there (the Posts tab of the group's page, group-view.tsx).
 */
export const FeedGroupContext = createContext<string | null>(null);

type Props = {
    activity: Schema<'Activity'>;
    /**
     * In a list the time and the comment count open the post in the detail pane; in the detail
     * pane (the thread, features/thread) the comment count goes to the comment box below.
     */
    variant?: 'list' | 'detail';
    /** The post open in the detail pane. */
    selected?: boolean;
    /** A post of a virtualized feed: an article of the feed pattern. */
    listItem?: FeedRowProps;
    /** Photos open full size (the thread's lightbox), with the photo's index. */
    onOpenPhoto?: (index: number) => void;
};

const AUDIENCE_LOOK: Partial<Record<Schema<'Audience'>, { icon: IconName; words: string }>> = {
    friends: { icon: 'users-round', words: t('Visible to friends') },
    members: { icon: 'users', words: t('Visible to members') },
    private: { icon: 'lock', words: t('Only me') },
};

/**
 * Who can see a post, when not everyone: the words of its icon ("Visible to friends", "Only
 * me"). Nothing for a post in a context (a group): the context line says where it is, and who
 * sees it is the group's to say.
 */
export function audienceText(audience: Schema<'Item'>['audience']): string | null {
    return AUDIENCE_LOOK[audience]?.words ?? null;
}

/** The hours a group context stays known before it is asked again. */
const CONTEXT_STALE_MS = 5 * 60_000;

/**
 * The group a post is in, from `Item.context_id` (not `Activity.owner_id`, which can be a
 * person's timeline): from one's own groups when they are loaded, else GET /groups/{id} once
 * per group, or GET /spaces/{id} for a space (cached 5 minutes, never per post). Only posts whose audience is the context's
 * are asked about: another context id is a person's timeline. Refused (403, 404) or not a
 * group: null.
 */
export function useContextGroup(item: Pick<Schema<'Item'>, 'context_id' | 'audience'>): Group | null {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const own = useContext(FeedGroupContext);
    const id = item.context_id && item.context_id !== own ? item.context_id : null;
    // one's own groups as the sidebar loads them: subscribed, so rows drawn before /me/groups
    // answers switch to it (and never ask about a group of one's own); no fetch of its own here
    const myGroups = useSyncExternalStore(
        (onChange) => queryClient.getQueryCache().subscribe(onChange),
        () => queryClient.getQueryData<Group[] | null>(MY_GROUPS_KEY),
    );
    // and one's spaces: a post in a space says "in <space>" the same way
    const mySpaces = useSyncExternalStore(
        (onChange) => queryClient.getQueryCache().subscribe(onChange),
        () => queryClient.getQueryData<Group[] | null>(MY_SPACES_KEY),
    );
    const mine = id ? (myGroups?.find((g) => g.id === id) ?? mySpaces?.find((g) => g.id === id)) : undefined;
    const ask = !!id && !mine && item.audience === 'context';
    const q = useQuery({
        queryKey: groupKey(id ?? ''),
        // a group, else a space (GET /groups/{id}, then /spaces/{id} on a site with Spaces)
        queryFn: () => fetchAnyContext(api, id ?? ''),
        enabled: ask,
        staleTime: CONTEXT_STALE_MS,
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false,
    });
    if (!id) return null;
    const g = mine ?? (ask ? q.data : undefined);
    return g && g.kind === 'group' ? g : null;
}

/**
 * The posts whose body was expanded in a list. Kept outside the row, since a virtualized row
 * unmounts when it scrolls away and the feed's measurements (kept across routes for scroll
 * memory) hold its expanded height: a row that clamped again would shift the rows under it.
 */
const expandedPosts = new Set<string>();

/** How a post's body is cut in a list: 10 lines, then Show more; once expanded, Show less (spec 4.1). */
function useClamp(id: string, enabled: boolean) {
    const ref = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(() => expandedPosts.has(id));
    const [overflows, setOverflows] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!enabled || expanded || !el) return;
        const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
        check();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [enabled, expanded]);
    const toggle = () => {
        const next = !expanded;
        if (next) expandedPosts.add(id);
        else expandedPosts.delete(id);
        // a body that was expanded overflowed: Show more stays the same button until it is measured again
        if (!next) setOverflows(true);
        setExpanded(next);
    };
    // the button stays while the post is expanded (Show less), so focus never falls to the page
    return { ref, clamped: enabled && !expanded, expanded, toggleable: enabled && (expanded || overflows), toggle };
}

/**
 * A post. It renders from the cached activity it is given, so a refetch, a poll or an
 * optimistic reaction (cache.ts) shows here at once. In a list it is a flat row; its actions
 * beyond React and Comment are in its More menu, which right-click, Shift+F10 and the Menu key
 * open too.
 */
export function ActivityCard({ activity, variant = 'list', selected = false, listItem, onOpenPhoto }: Props) {
    const { api, me, messageTo, runCommand } = useApp();
    const { openDetail, forget } = useNavigation();
    const openInWindow = useOpenInWindow();
    const announce = useWindowAnnounce();
    const queryClient = useQueryClient();
    const item = activity.object;
    const [error, setError] = useState<string | null>(null);
    const copyLink = useCopyLink(announce, setError);
    // the thread pane edits a post in place; "Edit" in a list opens the thread with the editor
    const [editing, setEditing] = useState(() => variant === 'detail' && takeEditRequest(activity.id));
    const [saved, setSaved] = useState<{ text: string; seq: number }>({ text: '', seq: 0 });
    useEffect(() => {
        if (variant !== 'detail') return;
        const onRequest = (e: Event) => {
            if ((e as CustomEvent<string>).detail === activity.id && takeEditRequest(activity.id)) setEditing(true);
        };
        window.addEventListener(EDIT_POST_EVENT, onRequest);
        return () => window.removeEventListener(EDIT_POST_EVENT, onRequest);
    }, [variant, activity.id]);
    const focusAfter = useRef<string | null>(null);
    useLayoutEffect(() => {
        const id = focusAfter.current;
        if (!id) return;
        focusAfter.current = null;
        document.getElementById(id)?.focus();
    });
    const articleRef = useRef<HTMLElement | null>(null);
    const group = useContextGroup(item);
    // React in the menu presses the toggle (or gives it one kind), which is drawn only once the site's kinds are known
    const reactionKinds = useReactionKinds();
    const canReactHere = (reactionKinds?.length ?? 0) > 0;

    // an anonymous post never shows who wrote it
    const author = item.anonymous ? null : (item.author ?? activity.actor ?? null);
    const authorName = author?.display_name ?? (item.anonymous ? t('Anonymous') : t('Someone'));
    const mine = !!author && me.profiles.some((p) => p.id === author.id);
    const reposter = activity.verb === 'reposted' ? (activity.actor ?? null) : null;
    // a post of the Posts module opens its own view (Item.entry_id), anything else its thread
    const detail = activityDetail(activity);
    const open = () => openDetail(detail);
    // unique while the same post is in the list and in the detail pane
    const idBase = `post-${activity.id}-${variant}`;
    const moreId = `${idBase}-more`;
    const menuOwner = `post-menu-${idBase}`;
    const menuOpen = useMenuExpanded(menuOwner);
    const { ref: bodyRef, clamped, expanded, toggleable, toggle: toggleClamp } = useClamp(activity.id, variant === 'list' && !editing && !item.poll);
    const edit = () => {
        if (variant === 'detail') {
            setEditing(true);
            return;
        }
        requestEdit(activity.id);
        open();
    };

    const remove = async () => {
        const ok = await confirmAction({
            title: t('Delete this post?'),
            // for another module's content the API removes the activity only (deleteActivity)
            message: item.kind === 'feed_post' ? t('The post and its comments are deleted. This cannot be undone.') : t('It leaves the feeds. The content itself stays on the site.'),
            okLabel: t('Delete'),
        });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/activities/{id}', { params: { path: { id: activity.id } } }));
            // closes the post if it is open in the detail pane, and Back cannot reopen it
            forget({ kind: 'post', id: activity.id });
            queryClient.removeQueries(['activity', activity.id], { exact: true });
            listItem?.onRemove();
            dropFromFeeds(queryClient, activity.id);
        } catch (e) {
            setError(errorMessage(e));
        }
    };

    // what each menu item does: the same controls and commands a click or a key would use
    const runItem = (id: PostMenuItem, kind?: string) => {
        const article = articleRef.current;
        switch (id) {
            case 'open':
                open();
                return;
            case 'comment':
                if (variant === 'detail') {
                    document.getElementById(commentBoxId(item.id))?.focus();
                    return;
                }
                // c on the focused post: the thread opens with its comment box focused
                article?.focus({ preventScroll: true });
                if (runCommand) runCommand('comment');
                else open();
                return;
            case 'react': {
                const toggle = article?.querySelector<HTMLButtonElement>('[data-react-toggle]');
                if (kind) toggle?.dispatchEvent(new CustomEvent(REACT_WITH, { detail: kind }));
                else toggle?.click();
                return;
            }
            case 'message':
                if (author) messageTo(author);
                return;
            case 'author':
                article?.querySelector<HTMLElement>('[data-profile-link]')?.click();
                return;
            case 'copy-link': {
                const url = item.card.url;
                if (!url) return;
                copyLink(url);
                return;
            }
            case 'open-in-window':
                openInWindow?.(detail);
                return;
            case 'edit':
                // the editor takes focus (autoFocus); More gets it back once the edit is done (onDone)
                edit();
                return;
            case 'delete':
                void remove();
                return;
        }
    };

    const menuEntries = () =>
        postMenuEntries(
            postMenuItems({ item, author, mine, detail: variant === 'detail', canOpenWindow: !!openInWindow, canReactHere }),
            { authorName, reacted: !!item.viewer?.reaction, mac: platform.mac, reactions: reactionKinds, reaction: item.viewer?.reaction ?? null },
            runItem,
        );
    const openMenu = (at: Parameters<typeof showMenu>[1]) => {
        void showMenu(menuEntries(), at, { label: t('Actions for {{name}}’s post', { name: authorName }), owner: menuOwner }).catch((e: unknown) => console.error('menu', e));
    };
    const onContextMenu = (e: MouseEvent<HTMLElement>) => {
        // one taken already (a long press on a touch screen), a link's, selected text's, the
        // editor's and its fields' (paste, spelling) and a video's: the system's. The reaction
        // toggle's is this menu, which lists the reactions
        if (e.defaultPrevented || (e.target as Element).closest('a[href], input, textarea, select, [contenteditable], video') || window.getSelection()?.toString()) return;
        e.preventDefault();
        openMenu({ x: e.clientX, y: e.clientY, returnFocus: (e.target as Element).closest<HTMLElement>('button') ?? articleRef.current });
    };
    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (isContextMenuKey(e) && (e.target === e.currentTarget || !(e.target as Element).closest('input, textarea, [contenteditable]'))) {
            e.preventDefault();
            const more = document.getElementById(moreId);
            const from = (e.target as HTMLElement).getBoundingClientRect();
            const r = more?.getBoundingClientRect() ?? from;
            openMenu({ x: r.left, y: r.bottom + 4, returnFocus: e.target as HTMLElement });
            return;
        }
        listItem?.onKeyDown(e);
    };
    // a double-click on a row in a list: the post in a window of its own (the main window only)
    const onDoubleClick = (e: MouseEvent<HTMLElement>) => {
        if (!listItem || !openInWindow || (e.target as Element).closest('button, a[href], input, textarea, select, [contenteditable], video')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };

    const time = (
        <time id={`${idBase}-time`} dateTime={activity.created_at} title={new Date(activity.created_at).toLocaleString(locale())}>
            {ago(activity.created_at)}
        </time>
    );
    const audience = AUDIENCE_LOOK[item.audience];
    const comments = item.stats.comments;

    return (
        <article
            ref={(el) => {
                articleRef.current = el;
                listItem?.rowRef(el);
            }}
            className={`activity${listItem ? ' feed-row' : ''}${variant === 'detail' ? ' activity-detail' : ' activity-list'}`}
            aria-current={selected ? 'true' : undefined}
            aria-labelledby={`${reposter ? `${idBase}-repost ` : ''}${idBase}-by ${idBase}-time`}
            aria-posinset={listItem ? listItem.index + 1 : undefined}
            aria-setsize={listItem?.setSize}
            data-index={listItem?.index}
            data-id={activity.id}
            data-item-id={item.id}
            // the Posts module's post the card opens (c and r open it, not the thread)
            data-article-id={detail.kind === 'article' ? detail.id : undefined}
            // c and r read it: a post closed to comments opens without a comment box to go to
            data-can-comment={item.viewer?.can_comment ? 'true' : 'false'}
            tabIndex={listItem?.tabIndex}
            onFocus={listItem?.onFocus}
            onKeyDown={onKeyDown}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            style={listItem ? { transform: `translateY(${listItem.offset}px)` } : undefined}
        >
            {reposter ? (
                <p className="activity-above" id={`${idBase}-repost`}>
                    <Icon name="repeat-2" size={12} strong />
                    <span>
                        {rich(t('<name></name> reposted'), { name: () => <bdi>{reposter.display_name}</bdi> })}
                    </span>
                </p>
            ) : null}
            <div className="activity-avatar">
                <ProfileAvatar profile={author} size={variant === 'detail' ? 44 : 40} />
            </div>
            <div className="activity-main">
                {variant === 'detail' ? (
                    <header className="activity-head-detail">
                        <span id={`${idBase}-by`} className={`activity-by${author?.badges?.length ? ' with-badges' : ''}`}>
                            {author ? <ProfileName profile={author} className="strong" /> : <strong>{authorName}</strong>}
                            <ProfileBadges badges={author?.badges} />
                        </span>
                        <p className="activity-meta">
                            <time id={`${idBase}-time`} dateTime={activity.created_at}>
                                {longTime(activity.created_at)}
                            </time>
                            {audience ? (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span className="activity-audience">
                                        <Icon name={audience.icon} size={12} strong />
                                        <span>{audience.words}</span>
                                    </span>
                                </>
                            ) : null}
                            {group ? (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                        {rich(t('in <name></name>'), { name: () => <bdi>{group.display_name}</bdi> })}
                                    </span>
                                </>
                            ) : null}
                        </p>
                    </header>
                ) : (
                    <header className="activity-head">
                        {/* first line: who, with their badges; second: who sees it, where, when */}
                        <span id={`${idBase}-by`} className={`activity-by${author?.badges?.length ? ' with-badges' : ''}`}>
                            {author ? <ProfileName profile={author} className="strong" /> : <strong>{authorName}</strong>}
                            <ProfileBadges badges={author?.badges} />
                        </span>
                        <span className="activity-meta-line">
                            {/* when, then where ("in" before the group's picture and name), then who may see it */}
                            <span className="activity-time">
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={(e) => {
                                        if (openInWindow && isWindowGesture(e)) openInWindow(detail);
                                        else open();
                                    }}
                                    tabIndex={-1}
                                >
                                    {time}
                                    <VisuallyHidden>{t(', open the post')}</VisuallyHidden>
                                </button>
                            </span>
                            {group ? (
                                <span className="activity-context">
                                    {rich(t('<in>in</in><name></name>'), {
                                        in: (text) => <span className="activity-in">{text}</span>,
                                        name: () => (
                                            <>
                                                <Avatar profile={group} size={14} shape="square" />
                                                <bdi className="truncate">{group.display_name}</bdi>
                                            </>
                                        ),
                                    })}
                                </span>
                            ) : null}
                            {audience ? (
                                <>
                                    <span className="activity-sep" aria-hidden="true">
                                        ·
                                    </span>
                                    <Tooltip text={audience.words}>
                                        <span className="activity-audience">
                                            <Icon name={audience.icon} size={12} label={audience.words} />
                                        </span>
                                    </Tooltip>
                                </>
                            ) : null}
                        </span>
                    </header>
                )}
                {/* More: at the card's top right, opposite the author's name (after the name in reading order) */}
                <Tooltip text={t('More')}>
                    <button
                        type="button"
                        id={moreId}
                        className="act-btn act-more act-more-top"
                        aria-label={t('More actions for {{name}}’s post', { name: authorName })}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={(e) => openMenu({ anchor: e.currentTarget })}
                    >
                        <Icon name="ellipsis" />
                    </button>
                </Tooltip>

                {/* a poll's question is its card's title: the poll draws it, with its answers */}
                {item.card.title && !item.poll ? <h2 className="activity-title">{item.card.title}</h2> : null}
                {item.poll && !editing ? (
                    <PollCard poll={item.poll} headingLevel={variant === 'detail' ? 3 : 2} />
                ) : editing ? (
                    <PostEditor
                        activity={activity}
                        onDone={(wasSaved) => {
                            setEditing(false);
                            focusAfter.current = moreId;
                            if (wasSaved) setSaved((v) => ({ text: t('Post saved'), seq: v.seq + 1 }));
                        }}
                    />
                ) : (
                    <div ref={bodyRef} id={`${idBase}-body`} className="activity-body" data-clamped={clamped || undefined}>
                        {item.card.body_html ? <RichText html={item.card.body_html} /> : <p className="activity-text">{item.card.text}</p>}
                    </div>
                )}
                {toggleable ? (
                    <button type="button" className="show-more" aria-expanded={expanded} aria-controls={`${idBase}-body`} onClick={toggleClamp}>
                        {expanded ? t('Show less') : t('Show more')}
                    </button>
                ) : null}
                {variant === 'detail' ? (
                    <p className="sr-only" role="status" aria-live="polite">
                        {saved.text ? <span key={saved.seq}>{saved.text}</span> : null}
                    </p>
                ) : null}

                <MediaGrid media={item.media} large={variant === 'detail'} by={author?.display_name} onOpen={onOpenPhoto} />

                {/* an event's Item is shown by the event itself: its page has the time, the place and Going */}
                {item.kind === 'event' && author?.kind === 'group' ? (
                    <p className="activity-event">
                        <button type="button" className="btn small" onClick={() => openDetail({ kind: 'event', id: author.id })}>
                            <Icon name="calendar" />
                            {t('Open event')}
                        </button>
                    </p>
                ) : null}

                {error ? (
                    <p className="error small" role="alert">
                        {error}
                    </p>
                ) : null}

                {variant === 'detail' ? <StatsLine stats={item.stats} /> : null}
                <footer className={variant === 'detail' ? 'activity-actions activity-actions-detail' : 'activity-actions'}>
                    {item.viewer?.can_react ? <ReactionButton activityId={activity.id} item={item} onError={setError} /> : <ReactionCount count={item.stats.reactions} />}
                    {variant === 'list' ? (
                        <button type="button" className="act-btn" aria-label={comments ? tn(comments, '{{count}} comment, open the post', '{{count}} comments, open the post') : t('Comment, open the post')} onClick={open}>
                            <Icon name="message-square" />
                            {comments ? (
                                <span className="act-count" aria-hidden="true">
                                    {comments}
                                </span>
                            ) : null}
                        </button>
                    ) : item.viewer?.can_comment ? (
                        <button type="button" className="act-btn act-labelled" onClick={() => document.getElementById(commentBoxId(item.id))?.focus()}>
                            <Icon name="message-square" />
                            <span>{t('Comment')}</span>
                        </button>
                    ) : null}
                    {variant === 'detail' && item.card.url ? (
                        <button type="button" className="act-btn act-labelled" onClick={() => runItem('copy-link')}>
                            <Icon name="link" />
                            <span>{t('Copy link')}</span>
                        </button>
                    ) : null}
                </footer>
            </div>
        </article>
    );
}

/** "6 November 2026 at 09:14": the open post says when exactly (spec 6.1). */
export function longTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat(locale(), { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
    } catch {
        return new Date(iso).toLocaleString(locale());
    }
}

/** "1.2K" for the stats line. */
function compact(n: number): string {
    try {
        return new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    } catch {
        return String(n);
    }
}

/** The open post's counts in words, between hairlines: "12 reactions · 5 comments · 1.2K views". */
function StatsLine({ stats }: { stats: Schema<'ItemStats'> }) {
    const parts = [
        stats.reactions ? tn(stats.reactions, '{{number}} reaction', '{{number}} reactions', { number: compact(stats.reactions) }) : null,
        stats.comments ? tn(stats.comments, '{{number}} comment', '{{number}} comments', { number: compact(stats.comments) }) : null,
        stats.reposts ? tn(stats.reposts, '{{number}} repost', '{{number}} reposts', { number: compact(stats.reposts) }) : null,
        stats.views ? tn(stats.views, '{{number}} view', '{{number}} views', { number: compact(stats.views) }) : null,
    ].filter((x): x is string => !!x);
    if (!parts.length) return null;
    return <p className="activity-stats">{parts.join(' · ')}</p>;
}
