import { type FormEvent, useId, useRef, useState } from 'react';

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
import { type Audience, AudienceField, useFormContext } from '../photos/new-media';
import { type FieldError, focusPostField, newPostBlocker, newPostFieldError, PostCategoryField, PostTextFields, usePostCategories, usePostImages } from './new-post';
import type { Post } from './posts';

type PostChanges = Schema<'PostChanges'>;

/** A post's title, summary, text, category and audience as the edit form has them. */
export type PostValue = { title: string; summary: string; html: string; category: string; audience: Post['audience'] };

/** What the form starts from: the post as the site has it, its text as the editor writes it back. */
export function postValue(post: Post): PostValue {
    return { title: post.title, summary: post.summary, html: normalizeHtml(post.body_html ?? '', 'full'), category: post.category?.id ?? '', audience: post.audience };
}

/**
 * What PATCH /posts/{id} is sent: only the fields that differ from what the form started with
 * (PostChanges; the ones left out stay). `audience` only where the form offered it: never for a
 * post in a context, which the site refuses.
 */
export function postChanges(initial: PostValue, value: PostValue, withAudience: boolean): PostChanges {
    const body: PostChanges = {};
    if (value.title.trim() !== initial.title.trim()) body.title = value.title.trim();
    if (value.summary.trim() !== initial.summary.trim()) body.summary = value.summary.trim();
    if (value.html !== initial.html) body.body_html = value.html;
    if (value.category && value.category !== initial.category) body.category_id = value.category;
    if (withAudience && value.audience !== initial.audience && value.audience !== 'context') body.audience = value.audience;
    return body;
}

/**
 * A post of the Posts module edited in place: the fields of the new post form that
 * PATCH /posts/{id} takes (title, summary, text, category, and who sees it for a post outside a
 * context); its cover, photos and videos change on the site. Only what changed is sent; a field
 * the site refuses (422) says why under it; Esc and Cancel ask first when that throws changes
 * away; Cmd+Enter (Ctrl+Enter) saves. Like the new post form it keeps no draft.
 */
export function EditPost({ post, uploader, announce, onDone }: { post: Post; uploader?: Uploader; announce?: (text: string) => void; onDone: (saved: Post | null) => void }) {
    const { api } = useApp();
    const id = useId();
    const images = usePostImages(uploader);
    const categories = usePostCategories().data ?? [];
    const contextId = post.context_id ?? undefined;
    const place = useFormContext(contextId);
    // who sees it changes here only for a post outside a context whose audience the site offers
    const offered = useAudiences('posts');
    const withAudience = !contextId && (offered as readonly string[]).includes(post.audience);
    const [initial] = useState(() => postValue(post));
    const [value, setValue] = useState(initial);
    // the text as plain text: whether there is any
    const [plain, setPlain] = useState<string | null>(null);
    const editor = useRef<RichEditorHandle>(null);
    const [fieldError, setFieldError] = useState<FieldError | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const sent = useRef<IdempotencySlot['current']>(null);
    const changed = Object.keys(postChanges(initial, value, withAudience)).length > 0;

    const showError = (blocker: FieldError) => {
        setFieldError(blocker);
        focusPostField(id, blocker.field, editor.current);
    };

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (saving) return;
        // an untouched text is as the site has it: only one typed here can be empty
        const blocker = newPostBlocker({ title: value.title, summary: value.summary, text: plain ?? 'kept', html: value.html, coverBlocker: null });
        if (blocker) {
            showError(blocker);
            return;
        }
        setFieldError(null);
        const body = postChanges(initial, value, withAudience);
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
            <PostCategoryField id={id} categories={categories} category={value.category} fieldError={fieldError} onCategory={(category) => setValue((v) => ({ ...v, category }))} />
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
