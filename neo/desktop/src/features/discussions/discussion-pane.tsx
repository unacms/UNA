import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { longTime, useContextGroup } from '../../components/activity-card';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { inlineUploader } from '../../components/rich-editor/images';
import { RichEditor } from '../../components/rich-editor/rich-editor';
import { normalizeHtml } from '../../components/rich-editor/schema';
import { RichText } from '../../components/rich-text';
import { ago, ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { t, tn } from '../../lib/i18n';
import { isMac } from '../../lib/platform';
import { BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS, textToRichHtml } from '../../lib/rich-html';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { makeUploader, type Uploader } from '../../lib/uploads';
import { confirmAction } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { DetailShell, focusMoreButton } from '../../shell/detail-shell';
import { useCopyLink } from '../../lib/copy-link';
import { useAnnouncer } from '../feed/feed-list';
import { ReactionButton, ReactionCount } from '../feed/reaction-button';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { commentBoxId, type CommentTarget, CommentTree, REPLY_WORDS } from '../thread/comment-tree';
import { type Discussion, discussionKey, dropDiscussion, fromLists, putDiscussion, repliesText, useDiscussionSetup } from './discussions';

type Activity = Schema<'Activity'>;

/** The title, text and category as the edit form has them. */
/**
 * The form's fields. `body` is the text as plain text, what the API takes until phase 2;
 * `bodyHtml` the editor's HTML (BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS sends it then), made
 * from `body` when the form starts from plain text.
 */
export type Changes = { title: string; body: string; bodyHtml?: string; categoryId: string };

/** The editor's mode for a discussion's text: full once the API takes its HTML, plain paragraphs until then. */
export const DISCUSSION_EDITOR_MODE = BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? 'full' : 'mini';

/** A field the form refused, with what is said under it. */
export type FieldError = { field: 'title' | 'body'; text: string };

/** Cmd+Enter (Ctrl+Enter elsewhere) sends a discussion form, as it does the post editor. */
export function isSubmitKey(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>): boolean {
    return e.key === 'Enter' && (isMac ? e.metaKey : e.ctrlKey);
}

/**
 * A discussion in the detail pane (or a window of its own): its title, who started it, when, in
 * which category and group, its text, and its replies (the comment tree of its Item, with the
 * reply box docked at the bottom). Its author, and moderators, edit it in place and delete it
 * from the More menu.
 */
export function DiscussionPane({ id, comment }: { id: string; comment?: CommentTarget }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget } = useNavigation();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const [editing, setEditing] = useState(false);

    const discussion = useQuery({
        queryKey: discussionKey(id),
        queryFn: async () => unwrap(await api.GET('/discussions/{id}', { params: { path: { id } } })),
        initialData: () => fromLists(queryClient, id),
        // what a list had may be old: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = discussion.isError && isGone(discussion.error);
    const d = gone ? undefined : discussion.data;
    const itemId = d?.content_id ?? null;

    // its Item, whose comments are the replies: the same cache entry as the post's thread
    const activity = useQuery({
        queryKey: ['activity', itemId ?? ''],
        queryFn: async (): Promise<Activity> => unwrap(await api.GET('/activities/{id}', { params: { path: { id: itemId ?? '' } } })),
        enabled: !!itemId,
        retry: retryOnce,
    });
    const item = activity.data?.object;

    // a reply posted or deleted here changes the count the lists show
    const comments = item?.stats.comments;
    const replies = d?.stats.replies;
    useEffect(() => {
        if (comments === undefined || replies === undefined || comments === replies) return;
        void queryClient.invalidateQueries(discussionKey(id));
        void queryClient.invalidateQueries(['discussions', 'list']);
    }, [comments, replies, id, queryClient]);

    const group = useContextGroup(d ?? { context_id: null, audience: 'public' });

    const remove = async () => {
        if (!d) return;
        const ok = await confirmAction({ title: t('Delete this discussion?'), message: t('It is deleted for everyone, with its replies. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/discussions/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        // said by the window: this pane and its live region go now
        announceInWindow(t('Discussion deleted'));
        dropDiscussion(queryClient, id);
        forget({ kind: 'discussion', id });
    };

    const copyLink = useCopyLink(announce);

    return (
        <DetailShell
            detail={{ kind: 'discussion', id }}
            noun="discussion"
            icon="messages-square"
            query={discussion}
            item={d}
            title={d?.title ?? t('Discussion')}
            // in a group only when a list showed it in one: otherwise a 403 is any audience
            inContext={!!discussion.data?.context_id}
            // while it is edited the hero's title is gone, so the toolbar's shows
            heroTitle={!editing}
            announcement={announcement}
            announce={announce}
            className="thread discussion"
            more={(shown) => ({
                link: shown.url,
                own: [
                    ...(shown.viewer?.can_edit ? [{ text: t('Edit Discussion'), run: () => setEditing(true) }] : []),
                    ...(shown.viewer?.can_delete ? [{ text: t('Delete Discussion…'), run: () => void remove() }] : []),
                ],
            })}
            before={
                discussion.isLoading ? (
                    <p className="sr-only" role="status">
                        {t('Loading the discussion…')}
                    </p>
                ) : null
            }
        >
            {(d) => (
                    <>
                        {editing ? (
                            <EditDiscussion
                                discussion={d}
                                onDone={(saved) => {
                                    setEditing(false);
                                    if (saved) {
                                        putDiscussion(queryClient, saved);
                                        announce(t('Discussion saved'));
                                    }
                                    focusMoreButton('discussion');
                                }}
                            />
                        ) : (
                            <DiscussionHead
                                discussion={d}
                                groupName={group?.display_name ?? null}
                                replies={item?.stats.comments ?? d.stats.replies}
                                actions={
                                    <footer className="activity-actions activity-actions-detail">
                                        {item && activity.data ? (
                                            item.viewer?.can_react ? (
                                                <ReactionButton activityId={activity.data.id} item={item} onError={(e) => (e ? announce(e) : undefined)} />
                                            ) : (
                                                <ReactionCount count={item.stats.reactions} />
                                            )
                                        ) : null}
                                        {item?.viewer?.can_comment ? (
                                            <button type="button" className="act-btn act-labelled" onClick={() => document.getElementById(commentBoxId(item.id))?.focus()}>
                                                <Icon name="message-square" />
                                                <span>{t('Reply')}</span>
                                            </button>
                                        ) : null}
                                        {d.url ? (
                                            <button type="button" className="act-btn act-labelled" onClick={() => copyLink(d.url ?? '')}>
                                                <Icon name="link" />
                                                <span>{t('Copy link')}</span>
                                            </button>
                                        ) : null}
                                    </footer>
                                }
                            />
                        )}
                        {item ? (
                            <>
                                <CommentTree item={item} target={comment} words={REPLY_WORDS} />
                                {/* in place of the docked reply box */}
                                {!item.viewer?.can_comment ? (
                                    <p className="muted small discussion-note">{d.locked ? t('Closed to replies.') : t('You can’t reply to this discussion.')}</p>
                                ) : null}
                            </>
                        ) : activity.isError ? (
                            <p className="muted small discussion-note" role="status">
                                {t('Its replies can’t be shown: {{reason}}', { reason: errorMessage(activity.error) })}
                            </p>
                        ) : !itemId ? (
                            <p className="muted small discussion-note">{t('Its replies are on the network’s site only.')}</p>
                        ) : (
                            <p className="muted small discussion-note">{t('Loading replies…')}</p>
                        )}
                    </>
            )}
        </DetailShell>
    );
}

/** The discussion itself: its title, who started it and where, its text and its counts. */
function DiscussionHead({ discussion: d, groupName, replies, actions }: { discussion: Discussion; groupName: string | null; replies: number; actions: ReactNode }) {
    return (
        <article className="discussion-post" aria-labelledby="detail-title">
            {/* the pane's heading names it (and shows once this has scrolled away) */}
            <div className="profile-name discussion-title" aria-hidden="true" dir="auto">
                {d.title}
            </div>
            <div className="discussion-by">
                <ProfileAvatar profile={d.author} size={44} />
                <div className="activity-head-detail">
                    {d.author && !d.anonymous ? (
                        // as the post's head: the badges after the name
                        <span className={`activity-by${d.author.badges?.length ? ' with-badges' : ''}`}>
                            <ProfileName profile={d.author} className="strong" />
                            <ProfileBadges badges={d.author.badges} />
                        </span>
                    ) : (
                        <strong className="activity-by">{t('Anonymous')}</strong>
                    )}
                    <p className="activity-meta">
                        <time dateTime={d.created_at} title={longTime(d.created_at)}>
                            {longTime(d.created_at)}
                        </time>
                        {d.category ? (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>{d.category.title}</span>
                            </>
                        ) : null}
                        {groupName ? (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>{t('in {{group}}', { group: groupName })}</span>
                            </>
                        ) : null}
                    </p>
                </div>
            </div>
            {d.sticky || d.locked || d.resolved === true ? (
                <p className="discussion-flags">
                    {d.sticky ? <span className="discussion-flag">{t('Pinned')}</span> : null}
                    {d.locked ? (
                        <span className="discussion-flag">
                            <Icon name="lock" size={12} strong /> {t('Closed to replies')}
                        </span>
                    ) : null}
                    {d.resolved === true ? (
                        <span className="discussion-flag">
                            <Icon name="check" size={12} strong /> {t('Answered')}
                        </span>
                    ) : null}
                </p>
            ) : null}
            <RichText html={d.body_html} className="discussion-body" />
            <p className="activity-stats">
                {repliesText(replies)}
                {d.last_reply_at ? ` · ${t('last {{when}}', { when: ago(d.last_reply_at) })}` : ''}
                {` · ${tn(d.stats.views, '{{count}} view', '{{count}} views')}`}
            </p>
            {actions}
        </article>
    );
}

/**
 * Its title, text and category in place. A text with links or formatting is edited on the site
 * (the API takes plain text, which would lose them): then only the title and category change
 * here, and the text is shown as it reads. Esc and Cancel ask first when that throws changes
 * away; Cmd+Enter (Ctrl+Enter) saves.
 */
function EditDiscussion({ discussion: d, onDone }: { discussion: Discussion; onDone: (saved: Discussion | null) => void }) {
    const { api } = useApp();
    const setup = useDiscussionSetup();
    const categories = setup.data?.categories ?? [];
    // the HTML is edited as it is (body_html); plain text only where it has no markup to lose
    const textEditable = BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? !!d.viewer?.can_edit : !!d.viewer?.can_edit_text;
    const [initial] = useState<Changes>(() => ({ title: d.title, body: d.body, bodyHtml: BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? normalizeHtml(d.body_html, DISCUSSION_EDITOR_MODE) : undefined, categoryId: d.category?.id ?? '' }));
    const [value, setValue] = useState<Changes>(initial);
    const [fieldError, setFieldError] = useState<FieldError | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const formId = useId();
    const textChanged = BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? value.bodyHtml !== initial.bodyHtml : value.body !== initial.body;
    const changed = value.title !== initial.title || (textEditable && textChanged) || value.categoryId !== initial.categoryId;

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (saving) return;
        if (!value.title.trim()) {
            setFieldError({ field: 'title', text: t('Give it a title.') });
            document.getElementById(`${formId}-title`)?.focus();
            return;
        }
        if (textEditable && !value.body.trim()) {
            setFieldError({ field: 'body', text: t('Write what it is about.') });
            document.getElementById(`${formId}-body`)?.focus();
            return;
        }
        setFieldError(null);
        const body: Schema<'DiscussionChanges'> = {};
        if (value.title.trim() !== d.title) body.title = value.title.trim();
        if (textEditable && BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS && textChanged && value.bodyHtml) body.body_html = value.bodyHtml;
        else if (textEditable && !BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS && value.body.trim() !== d.body.trim()) body.body = value.body;
        if (value.categoryId && value.categoryId !== d.category?.id) body.category_id = value.categoryId;
        if (!Object.keys(body).length) {
            onDone(null);
            return;
        }
        setSaving(true);
        setError(null);
        const result = await api.PATCH('/discussions/{id}', { params: { path: { id: d.id } }, body });
        setSaving(false);
        if (result.error !== undefined || !result.data) {
            setError(problemMessage(result.error, t('It was not saved')));
            return;
        }
        onDone(result.data);
    };

    const cancel = async () => {
        if (saving) return;
        if (changed) {
            const discard = await confirmAction({ title: t('Discard your changes?'), message: t('The discussion stays as it was.'), okLabel: t('Discard') });
            if (!discard) return;
        }
        onDone(null);
    };

    return (
        <form
            className="settings-form discussion-form discussion-edit"
            aria-label={t('Edit the discussion')}
            // single keys are the form's while focus is in it (OWN_KEYS_ATTR, lib/shortcuts.ts)
            data-own-keys=""
            onSubmit={(e) => void submit(e)}
            onKeyDown={(e) => {
                if (isSubmitKey(e)) {
                    e.preventDefault();
                    void submit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    void cancel();
                }
            }}
            noValidate
        >
            <DiscussionFields id={formId} value={value} onChange={setValue} categories={categories} textEditable={textEditable} textHtml={d.body_html} error={fieldError} autoFocus />
            {error ? (
                <p className="error" role="alert">
                    {error}
                </p>
            ) : null}
            <div className="settings-actions">
                <span className="muted small" aria-hidden="true">
                    {t('{{keys}} to save', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                </span>
                <button type="button" className="btn" onClick={() => void cancel()}>
                    {t('Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" aria-disabled={saving || undefined} aria-busy={saving || undefined} aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}>
                    {t('Save')}
                </button>
            </div>
        </form>
    );
}

/**
 * The title, the text and the category (when there is more than one to choose from). A field
 * the form refused says why under it, marked invalid and described by that message, so a
 * screen reader landing on it hears the reason. A text that is edited on the site
 * (`textEditable` false) is shown as it reads, in a grouped box, not as a field.
 */
export function DiscussionFields({
    id,
    value,
    onChange,
    categories,
    textEditable = true,
    textHtml,
    error,
    autoFocus,
    uploader,
}: {
    id: string;
    value: Changes;
    onChange: (value: Changes) => void;
    categories: readonly Schema<'DiscussionCategory'>[];
    textEditable?: boolean;
    /** The text as the site shows it, for a text edited on the site. */
    textHtml?: string;
    error?: FieldError | null;
    autoFocus?: boolean;
    /** Tests give their own; the app makes the one for where it runs. */
    uploader?: Uploader;
}) {
    const { api } = useApp();
    // pictures go in the text (POST /uploads/inline) where the text is HTML
    const images = useMemo(() => {
        const base = uploader ?? makeUploader(api);
        return BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS ? { uploader: base, uploadInline: inlineUploader(base) } : { refusal: t('Pictures can’t be added to a discussion’s text here.') };
    }, [uploader, api]);
    const errorId = `${id}-error`;
    const bodyHint = `${id}-body-hint`;
    const invalid = (field: FieldError['field']) => (error?.field === field ? true : undefined);
    const message = (field: FieldError['field']) =>
        error?.field === field ? (
            <p id={errorId} className="error small" role="alert">
                {error.text}
            </p>
        ) : null;
    return (
        <>
            <div className="settings-field">
                <label htmlFor={`${id}-title`}>{t('Title')}</label>
                <input
                    id={`${id}-title`}
                    value={value.title}
                    maxLength={255}
                    required
                    dir="auto"
                    autoFocus={autoFocus}
                    aria-invalid={invalid('title')}
                    aria-describedby={error?.field === 'title' ? errorId : undefined}
                    onChange={(e) => onChange({ ...value, title: e.target.value })}
                />
                {message('title')}
            </div>
            {categories.length > 1 ? (
                <div className="settings-field">
                    <label htmlFor={`${id}-category`}>{t('Category')}</label>
                    <select id={`${id}-category`} value={value.categoryId} onChange={(e) => onChange({ ...value, categoryId: e.target.value })}>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}
            {textEditable ? (
                <div className="settings-field">
                    {/* names the text box, which is no form control: a click puts the caret in it (RichEditor, labelledBy) */}
                    <label id={`${id}-body-label`} htmlFor={`${id}-body`}>
                        {t('Text')}
                    </label>
                    <RichEditor
                        mode={DISCUSSION_EDITOR_MODE}
                        id={`${id}-body`}
                        rows={8}
                        value={value.bodyHtml ?? textToRichHtml(value.body)}
                        label={t('Text')}
                        labelledBy={`${id}-body-label`}
                        invalid={!!invalid('body')}
                        describedBy={error?.field === 'body' ? `${errorId} ${bodyHint}` : bodyHint}
                        // mentions only where they are sent as the site's links
                        mentions={BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS}
                        images={images}
                        windowDrops
                        onChange={(html, text) => onChange({ ...value, body: text, bodyHtml: html })}
                    />
                    {message('body')}
                    <p id={bodyHint} className="small muted">
                        {BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS
                            ? t('{{bold}}, {{italic}} and {{underline}} format the selected words, {{link}} adds a link.', {
                                  bold: isMac ? '⌘B' : 'Ctrl+B',
                                  italic: isMac ? '⌘I' : 'Ctrl+I',
                                  underline: isMac ? '⌘U' : 'Ctrl+U',
                                  link: isMac ? '⌘K' : 'Ctrl+K',
                              })
                            : t('Each line is a paragraph; links and #hashtags are kept as typed.')}
                    </p>
                </div>
            ) : (
                <div className="settings-field" role="group" aria-labelledby={`${id}-body-label`} aria-describedby={bodyHint}>
                    <span id={`${id}-body-label`} className="discussion-text-label">
                        {t('Text')}
                    </span>
                    <RichText html={textHtml ?? ''} className="discussion-text-preview" />
                    <p id={bodyHint} className="small muted">
                        {t('This text has links or formatting, so it is edited on the network’s site.')}
                    </p>
                </div>
            )}
        </>
    );
}
