import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useId, useMemo, useRef, useState } from 'react';

import { isProblem, problemMessage, type Schema } from 'una-api';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot, settleIdempotency } from '../../lib/idempotency';
import { useNavigation } from '../../lib/navigation';
import { isMac } from '../../lib/platform';
import { makeUploader, type Uploader } from '../../lib/uploads';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { useMyGroups, useMySpaces } from '../groups/groups';
import { type Audience, AudienceField, submitKeys, useFormContext } from '../photos/new-media';
import { PhotoDropZone, usePhotoUploads } from '../photos/photo-uploads';
import { inlineUploader } from '../../components/rich-editor/images';
import { RichEditor, type RichEditorHandle } from '../../components/rich-editor/rich-editor';
import { textToRichHtml } from '../../lib/rich-html';
import { postCategoriesKey, postKey, SUMMARY_MAX, TEXT_MAX, TITLE_MAX, TITLE_MIN } from './posts';

type Field = 'title' | 'summary' | 'text' | 'cover' | 'category';
type FieldError = { field: Field; text: string };

/** The form's field of each field the API names in a 422. */
const API_FIELDS: Record<string, Field> = { title: 'title', summary: 'summary', body_html: 'text', cover_media_id: 'cover', category_id: 'category' };

/**
 * Why a new post can't be sent yet, by its field, or null. Lengths are counted in characters, as
 * the site counts them: the title and the summary as typed, the text as the HTML it is sent as
 * (`html`, the editor's; plain `text` as paragraphs when there is none).
 */
export function newPostBlocker({ title, summary = '', text, html, coverBlocker, categoryMissing = false }: { title: string; summary?: string; text: string; html?: string; coverBlocker: string | null; categoryMissing?: boolean }): FieldError | null {
    const trimmed = title.trim();
    if (!trimmed) return { field: 'title', text: t('Give it a title.') };
    if ([...trimmed].length < TITLE_MIN) return { field: 'title', text: tn(TITLE_MIN, 'A title has at least {{count}} character.', 'A title has at least {{count}} characters.') };
    if ([...trimmed].length > TITLE_MAX) return { field: 'title', text: tn(TITLE_MAX, 'A title has at most {{count}} character (this one has {{length}}).', 'A title has at most {{count}} characters (this one has {{length}}).', { length: [...trimmed].length }) };
    if ([...summary.trim()].length > SUMMARY_MAX) return { field: 'summary', text: tn(SUMMARY_MAX, 'A summary has at most {{count}} character.', 'A summary has at most {{count}} characters.') };
    if (!text.trim()) return { field: 'text', text: t('Write the post.') };
    if ([...(html ?? textToRichHtml(text))].length > TEXT_MAX) return { field: 'text', text: tn(TEXT_MAX, 'The text is too long: the site keeps at most {{count}} character, its paragraphs included.', 'The text is too long: the site keeps at most {{count}} characters, its paragraphs included.') };
    if (categoryMissing) return { field: 'category', text: t('Choose a category.') };
    if (coverBlocker) return { field: 'cover', text: `${coverBlocker}.` };
    return null;
}

/** The field a 422 of the site names, with its words, when it is one of the form's. */
export function newPostFieldError(error: unknown): FieldError | null {
    if (!isProblem(error)) return null;
    for (const e of error.errors ?? []) {
        const field = API_FIELDS[e.field];
        if (field) return { field, text: e.message.endsWith('.') ? e.message : `${e.message}.` };
    }
    return null;
}

/** The categories a post can be in (GET /posts/categories), in the site's order; the Posts list names the one it shows from them too. */
export function usePostCategories() {
    const { api } = useApp();
    return useQuery({ queryKey: postCategoriesKey, queryFn: async () => unwrap(await api.GET('/posts/categories')), staleTime: 10 * 60_000 });
}

/** The contexts one may write a post in: one's groups and spaces that take posts and let one post. */
function usePostContexts(fixed: string | undefined) {
    const groups = useMyGroups();
    const spaces = useMySpaces();
    if (fixed) return [];
    return [...(groups.data ?? []), ...(spaces.data ?? [])].filter((g) => g.viewer?.can_post && g.content_kinds?.includes('posts'));
}

/**
 * Writing a post of the Posts module in the detail pane: its title (3 to 160 characters, as the
 * site takes it), its text, a cover (one photo, uploading as it is picked or dropped), and who can
 * see it, or where it goes: a context it was started from, or one of one's groups and spaces that
 * take posts. Sent, it opens; the lists show it. The site's refusal (a membership level that may
 * not write posts) is said in the form.
 */
export function NewPost({ contextId, uploader }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const id = useId();
    const [announcement, announce] = useAnnouncer();
    const cover = usePhotoUploads({ purpose: 'post_cover', uploader, announce });
    // pictures in the text: the site's editor storage (POST /uploads/inline)
    const images = useMemo(() => {
        const base = uploader ?? makeUploader(api);
        return { uploader: base, uploadInline: inlineUploader(base) };
    }, [uploader, api]);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    // the text as the site keeps it (full mode's HTML) and as plain text (whether there is any)
    const [content, setContent] = useState({ html: '', text: '' });
    const text = content.text;
    const editor = useRef<RichEditorHandle>(null);
    const [audience, setAudience] = useState<Audience>('public');
    const categories = usePostCategories().data ?? [];
    // none chosen until one is: the site's form has no default
    const [category, setCategory] = useState('');
    // where it goes when the form was not started from a context: '' is outside any
    const [chosen, setChosen] = useState('');
    const contexts = usePostContexts(contextId);
    const where = contextId ?? (chosen || undefined);
    const context = useFormContext(where);
    const [fieldError, setFieldError] = useState<FieldError | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const sent = useRef<IdempotencySlot['current']>(null);

    const showError = (blocker: FieldError) => {
        setFieldError(blocker);
        if (blocker.field === 'text') editor.current?.focus();
        else document.getElementById(blocker.field === 'cover' ? `${id}-pick` : `${id}-${blocker.field}`)?.focus();
    };

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        const blocker = newPostBlocker({ title, summary, text, html: content.html, coverBlocker: cover.blocker, categoryMissing: categories.length > 0 && !category });
        if (blocker) {
            showError(blocker);
            return;
        }
        setFieldError(null);
        const body: Schema<'NewPost'> = { title: title.trim(), body_html: content.html };
        if (summary.trim()) body.summary = summary.trim();
        if (category) body.category_id = category;
        if (cover.ids[0]) body.cover_media_id = cover.ids[0];
        if (where) body.context_id = where;
        else body.audience = audience;
        const from = history.current;
        setSending(true);
        setError(null);
        let result;
        try {
            result = await api.POST('/posts', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/posts', body]) } }, body });
        } catch (err) {
            // no answer came: the key stays, so sending it again gets the site's answer to this one
            setSending(false);
            setError(t('The post was not sent: {{reason}}', { reason: errorMessage(err) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        if (result.error !== undefined || !result.data) {
            setSending(false);
            const fieldBlocker = result.response.status === 422 ? newPostFieldError(result.error) : null;
            if (fieldBlocker) {
                showError(fieldBlocker);
                return;
            }
            if (result.response.status !== 403) setError(problemMessage(result.error, t('The post was not sent')));
            // the site's reason when it gave one (a Problem), else that it refused
            else if (!isProblem(result.error)) setError(where ? t('You can’t write posts there: the site refused it') : t('You can’t write posts in this network: the site refused it'));
            else setError(where ? t('You can’t write posts there: {{reason}}', { reason: problemMessage(result.error) }) : t('You can’t write posts in this network: {{reason}}', { reason: problemMessage(result.error) }));
            return;
        }
        cover.markTaken();
        const created = result.data;
        queryClient.setQueryData(postKey(created.id), created);
        void queryClient.invalidateQueries(['posts', 'list']);
        void queryClient.invalidateQueries(['feed']);
        if (!replaceDetail({ kind: 'article', id: created.id }, from)) setSending(false);
    };

    const errorFor = (field: FieldError['field']) => (fieldError?.field === field ? fieldError.text : null);
    const describe = (field: FieldError['field'], hint?: string) => [hint, fieldError?.field === field ? `${id}-${field}-error` : undefined].filter(Boolean).join(' ') || undefined;
    return (
        <Pane pane="detail" title={context ? t('New post in {{name}}', { name: context.display_name }) : t('New post')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <form className="settings-form discussion-form new-article" aria-labelledby="detail-title" onSubmit={(e) => void submit(e)} onKeyDown={(e) => submitKeys(() => void submit())(e)} noValidate>
                    <div className="settings-field">
                        <label htmlFor={`${id}-title`}>{t('Title')}</label>
                        <input
                            id={`${id}-title`}
                            value={title}
                            dir="auto"
                            autoFocus
                            aria-invalid={fieldError?.field === 'title' || undefined}
                            aria-describedby={describe('title')}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        {errorFor('title') ? (
                            <p id={`${id}-title-error`} className="error small" role="alert">
                                {errorFor('title')}
                            </p>
                        ) : null}
                    </div>
                    <div className="settings-field">
                        <label htmlFor={`${id}-summary`}>{t('Summary')}</label>
                        <textarea
                            id={`${id}-summary`}
                            rows={2}
                            value={summary}
                            dir="auto"
                            aria-invalid={fieldError?.field === 'summary' || undefined}
                            aria-describedby={describe('summary', `${id}-summary-hint`)}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                        <p id={`${id}-summary-hint`} className="small muted">
                            {t('Optional. Lists show it under the title; without one they show the start of the text.')}
                        </p>
                        {errorFor('summary') ? (
                            <p id={`${id}-summary-error`} className="error small" role="alert">
                                {errorFor('summary')}
                            </p>
                        ) : null}
                    </div>
                    <div className="settings-field">
                        {/* a label for the text box, which is no form control: a click puts the caret in it */}
                        <label id={`${id}-text-label`} htmlFor={`${id}-text`} onClick={() => editor.current?.focus()}>
                            {t('Text')}
                        </label>
                        <RichEditor
                            ref={editor}
                            mode="full"
                            id={`${id}-text`}
                            className="article-text-input"
                            rows={12}
                            value={content.html}
                            label={t('Text')}
                            labelledBy={`${id}-text-label`}
                            invalid={fieldError?.field === 'text'}
                            describedBy={describe('text', `${id}-text-hint`)}
                            images={images}
                            windowDrops
                            announce={announce}
                            onChange={(html, plain) => setContent({ html, text: plain })}
                        />
                        <p id={`${id}-text-hint`} className="small muted">
                            {t('{{bold}}, {{italic}} and {{underline}} format the selected words, {{link}} adds a link.', { bold: isMac ? '⌘B' : 'Ctrl+B', italic: isMac ? '⌘I' : 'Ctrl+I', underline: isMac ? '⌘U' : 'Ctrl+U', link: isMac ? '⌘K' : 'Ctrl+K' })}
                        </p>
                        {errorFor('text') ? (
                            <p id={`${id}-text-error`} className="error small" role="alert">
                                {errorFor('text')}
                            </p>
                        ) : null}
                    </div>
                    <fieldset className="settings-field settings-fieldset photo-field">
                        <legend>{t('Cover')}</legend>
                        <PhotoDropZone uploads={cover} pickId={`${id}-pick`} describedBy={fieldError?.field === 'cover' ? `${id}-cover-error` : undefined} label={cover.items.length ? t('Choose another…') : t('Choose a cover…')} dropHint={t('or drop a photo here')} />
                        {errorFor('cover') ? (
                            <p id={`${id}-cover-error`} className="error small" role="alert">
                                {errorFor('cover')}
                            </p>
                        ) : null}
                    </fieldset>
                    {categories.length ? (
                        <div className="settings-field">
                            <label htmlFor={`${id}-category`}>{t('Category')}</label>
                            <select
                                id={`${id}-category`}
                                value={category}
                                required
                                aria-invalid={fieldError?.field === 'category' || undefined}
                                aria-describedby={describe('category')}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="" disabled>
                                    {t('Choose a category')}
                                </option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errorFor('category') ? (
                                <p id={`${id}-category-error`} className="error small" role="alert">
                                    {errorFor('category')}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                    {!contextId && contexts.length ? (
                        <div className="settings-field">
                            <label htmlFor={`${id}-where`}>{t('Where')}</label>
                            <select id={`${id}-where`} value={chosen} onChange={(e) => setChosen(e.target.value)}>
                                <option value="">{t('On your own (choose who sees it)')}</option>
                                {contexts.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                    <AudienceField id={id} tag="posts" contextId={where} context={context} audience={audience} onAudience={setAudience} noun="it" />
                    {error ? (
                        <p className="error" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <div className="settings-actions">
                        <span className="muted small" aria-hidden="true">
                            {t('{{keys}} to post', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                        </span>
                        <button type="submit" className="btn btn-primary" aria-disabled={sending || undefined} aria-busy={sending || undefined}>
                            {t('Post', { context: 'verb' })}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}
