import { type FormEvent, useId, useMemo, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { type RichEditorHandle } from '../../components/rich-editor/rich-editor';
import { normalizeHtml } from '../../components/rich-editor/schema';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot, settleIdempotency } from '../../lib/idempotency';
import { confirmAction } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { useAudiences } from '../../lib/site-modules';
import type { Uploader } from '../../lib/uploads';
import { isEditableHtml } from '../compose/post-text';
import { type Audience, AudienceField, useFormContext } from '../photos/new-media';
import { type FieldError, focusPostField, newPostFieldError, PostCategoryField, PostTextFields, summaryBlocker, textBlocker, titleBlocker, usePostCategories, usePostImages } from './new-post';
import type { Post } from './posts';

type PostChanges = Schema<'PostChanges'>;

/** A post's title, summary, text, category and audience as the edit form has them. */
export type PostValue = { title: string; summary: string; html: string; category: string; audience: Post['audience'] };

/** Which of a post's fields the form may send: the others stay as the site has them. */
export type PostEditable = { text: boolean; summary: boolean; audience: boolean };

/** Whether anything is styled beyond the alignment the editor keeps (a colour, a size, a width). */
function hasLossyStyle(html: string): boolean {
    for (const m of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
        if (!/^\s*text-align\s*:[^;]*;?\s*$/i.test(m[1] ?? m[2] ?? '')) return true;
    }
    return false;
}

/**
 * Whether a post's text can be edited here without losing anything: every tag is one the
 * editor's full mode keeps (isEditableHtml: no h1 or h4 to h6, table, iframe or video), and
 * nothing is styled beyond its alignment. The API keeps no revisions, so a text the editor would
 * rewrite with less is edited on the site.
 */
export function isEditableText(html: string): boolean {
    return isEditableHtml(html, 'full') && !hasLossyStyle(html);
}

/** A text without its white space: how a summary is compared with the start of the post's text. */
const squeezed = (text: string) => text.replace(/\s+/g, '');

/** The longest summary the API answers with (the site's abstract may be longer): one cut ends in "…". */
const SUMMARY_SHOWN = 300;

/**
 * What the form may do with `Post.summary`, which is not always what the author wrote: the API
 * cuts it at 300 characters with a "…", and answers with the start of the text when the post has
 * no summary. One that is the start of the text is taken as none (the field starts empty); one
 * that was cut is not edited here, since saving it would replace the whole with its start.
 */
export function postSummary(post: Pick<Post, 'summary' | 'body_html'>): { editable: boolean; text: string } {
    const summary = post.summary.trim();
    const cut = summary.endsWith('…') && [...summary].length >= SUMMARY_SHOWN - 10;
    const start = squeezed(cut ? summary.slice(0, -1) : summary);
    const body = squeezed(new DOMParser().parseFromString(post.body_html ?? '', 'text/html').body.textContent ?? '');
    if (start && (cut ? body.startsWith(start) : body === start)) return { editable: true, text: '' };
    return { editable: !cut, text: post.summary };
}

/**
 * What the form starts from: the post as the site has it. Its text as the editor writes it back
 * when the editor can have it (as it is otherwise: shown, never sent); its summary when it is
 * the author's (postSummary).
 */
export function postValue(post: Post): PostValue {
    const html = post.body_html ?? '';
    return { title: post.title, summary: postSummary(post).text, html: isEditableText(html) ? normalizeHtml(html, 'full') : html, category: post.category?.id ?? '', audience: post.audience };
}

/**
 * What PATCH /posts/{id} is sent: only the fields that differ from what the form started with
 * (PostChanges; the ones left out stay), and of those only the ones the form offered
 * (`editable`): never a text the editor would lose something of, a summary the app has only the
 * start of, or the audience of a post in a context, which the site refuses.
 */
export function postChanges(initial: PostValue, value: PostValue, editable: PostEditable): PostChanges {
    const body: PostChanges = {};
    if (value.title.trim() !== initial.title.trim()) body.title = value.title.trim();
    if (editable.summary && value.summary.trim() !== initial.summary.trim()) body.summary = value.summary.trim();
    if (editable.text && value.html !== initial.html) body.body_html = value.html;
    if (value.category && value.category !== initial.category) body.category_id = value.category;
    if (editable.audience && value.audience !== initial.audience && value.audience !== 'context') body.audience = value.audience;
    return body;
}

/**
 * Why the changes can't be sent, by field, or null: only a field that is sent is checked, as the
 * site checks only what it receives (a post with a short title can still change its category).
 */
export function postChangesBlocker(body: PostChanges, plain: string): FieldError | null {
    return (typeof body.title === 'string' ? titleBlocker(body.title) : null) ?? (typeof body.summary === 'string' ? summaryBlocker(body.summary) : null) ?? (typeof body.body_html === 'string' ? textBlocker(plain, body.body_html) : null);
}

/**
 * A post of the Posts module edited in place: the fields of the new post form that
 * PATCH /posts/{id} takes (title, summary, text, category, and who sees it for a post outside a
 * context); its cover, photos and videos change on the site. A text written on the site with
 * what the editor would lose, and a summary the app has only the start of, are shown and left
 * alone. Only what changed is sent, and only that is checked; a field the site refuses (422)
 * says why under it; Esc and Cancel ask first when that throws changes
 * away; Cmd+Enter (Ctrl+Enter) saves. Like the new post form it keeps no draft.
 */
export function EditPost({ post, uploader, announce, onDone }: { post: Post; uploader?: Uploader; announce?: (text: string) => void; onDone: (saved: Post | null) => void }) {
    const { api } = useApp();
    const id = useId();
    const images = usePostImages(uploader);
    const listed = usePostCategories().data;
    // the post's own category stays choosable when the site no longer lists it
    const categories = useMemo(() => {
        const all = listed ?? [];
        return post.category && all.length && !all.some((c) => c.id === post.category?.id) ? [post.category, ...all] : all;
    }, [listed, post.category]);
    const contextId = post.context_id ?? undefined;
    const place = useFormContext(contextId);
    // who sees it changes here only for a post outside a context whose audience the site offers
    const offered = useAudiences('posts');
    const withAudience = !contextId && (offered as readonly string[]).includes(post.audience);
    const [initial] = useState(() => postValue(post));
    // what the form was opened on decides, like `initial`: not a copy read again meanwhile
    const [editable] = useState(() => ({ text: isEditableText(post.body_html ?? ''), summary: postSummary(post).editable }));
    const fields: PostEditable = { ...editable, audience: withAudience };
    const [value, setValue] = useState(initial);
    // the text as plain text, once it was changed: whether there is any
    const [plain, setPlain] = useState<string | null>(null);
    const editor = useRef<RichEditorHandle>(null);
    const [fieldError, setFieldError] = useState<FieldError | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const sent = useRef<IdempotencySlot['current']>(null);
    const changed = Object.keys(postChanges(initial, value, fields)).length > 0;

    const showError = (blocker: FieldError) => {
        setFieldError(blocker);
        focusPostField(id, blocker.field, editor.current);
    };

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (saving) return;
        const body = postChanges(initial, value, fields);
        const blocker = postChangesBlocker(body, plain ?? '');
        if (blocker) {
            showError(blocker);
            return;
        }
        setFieldError(null);
        if (!Object.keys(body).length) {
            onDone(null);
            return;
        }
        setSaving(true);
        setError(null);
        let result;
        try {
            result = await api.PATCH('/posts/{id}', { params: { path: { id: post.id }, header: { 'Idempotency-Key': idempotencyKeyFor(sent, [`/posts/${post.id}`, body]) } }, body });
        } catch (err) {
            // no answer came: the key stays, so saving it again gets the site's answer to this one
            setSaving(false);
            setError(t('It was not saved: {{reason}}', { reason: errorMessage(err) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        setSaving(false);
        if (result.error !== undefined || !result.data) {
            const refused = result.response.status === 422 ? newPostFieldError(result.error) : null;
            if (refused) showError(refused);
            else setError(problemMessage(result.error, t('It was not saved')));
            return;
        }
        onDone(result.data);
    };

    const cancel = async () => {
        if (saving) return;
        if (changed && !(await confirmAction({ title: t('Discard your changes?'), message: t('The post stays as it was.'), okLabel: t('Discard') }))) return;
        onDone(null);
    };

    return (
        <form
            className="settings-form discussion-form discussion-edit new-article"
            aria-label={t('Edit the post')}
            // single keys are the form's while focus is in it (OWN_KEYS_ATTR, lib/shortcuts.ts)
            data-own-keys=""
            onSubmit={(e) => void submit(e)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (isMac ? e.metaKey : e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                } else if (e.key === 'Escape' && !e.defaultPrevented) {
                    e.preventDefault();
                    e.stopPropagation();
                    void cancel();
                }
            }}
            noValidate
        >
            <PostTextFields
                id={id}
                title={value.title}
                summary={value.summary}
                html={value.html}
                textEditable={editable.text}
                summaryEditable={editable.summary}
                fieldError={fieldError}
                editor={editor}
                images={images}
                announce={announce}
                onTitle={(title) => setValue((v) => ({ ...v, title }))}
                onSummary={(summary) => setValue((v) => ({ ...v, summary }))}
                onContent={(content) => {
                    setPlain(content.text);
                    setValue((v) => ({ ...v, html: content.html }));
                }}
            />
            <PostCategoryField id={id} categories={categories} category={value.category} required={false} fieldError={fieldError} onCategory={(category) => setValue((v) => ({ ...v, category }))} />
            {contextId || withAudience ? (
                <AudienceField id={id} tag="posts" contextId={contextId} context={place} audience={value.audience as Audience} onAudience={(audience) => setValue((v) => ({ ...v, audience }))} noun="it" />
            ) : null}
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
