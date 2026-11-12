import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type RefObject, useId, useMemo, useRef, useState } from 'react';

import { isProblem, problemMessage, type Schema } from 'una-api';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { heldSelect } from '../../lib/held-select';
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
import { RichText } from '../../components/rich-text';
import { textToRichHtml } from '../../lib/rich-html';
import { postCategoriesKey, postKey, SUMMARY_MAX, TEXT_MAX, TITLE_MAX, TITLE_MIN } from './posts';

export type Field = 'title' | 'summary' | 'text' | 'cover' | 'category';
export type FieldError = { field: Field; text: string };

/** The form's field of each field the API names in a 422. */
const API_FIELDS: Record<string, Field> = { title: 'title', summary: 'summary', body_html: 'text', cover_media_id: 'cover', category_id: 'category' };

/** Why a title can't be sent, or null: 3 to 160 characters, counted as the site counts them. */
export function titleBlocker(title: string): FieldError | null {
    const trimmed = title.trim();
    if (!trimmed) return { field: 'title', text: t('Give it a title.') };
    if ([...trimmed].length < TITLE_MIN) return { field: 'title', text: tn(TITLE_MIN, 'A title has at least {{count}} character.', 'A title has at least {{count}} characters.') };
    if ([...trimmed].length > TITLE_MAX) return { field: 'title', text: tn(TITLE_MAX, 'A title has at most {{count}} character (this one has {{length}}).', 'A title has at most {{count}} characters (this one has {{length}}).', { length: [...trimmed].length }) };
    return null;
}

/** Why a summary can't be sent, or null. */
export function summaryBlocker(summary: string): FieldError | null {
    return [...summary.trim()].length > SUMMARY_MAX ? { field: 'summary', text: tn(SUMMARY_MAX, 'A summary has at most {{count}} character.', 'A summary has at most {{count}} characters.') } : null;
}

/** A picture, a video or an embed in the text: content without a word, as the site takes it. */
const MEDIA_IN_TEXT = /<(img|iframe|video)\b|\bbx-embed-link\b/i;

/**
 * Why a text can't be sent, or null: it has words, or a picture or an embed, and its HTML
 * (`html`, the editor's; plain `text` as paragraphs when there is none) is no longer than the
 * site keeps.
 */
export function textBlocker(text: string, html?: string): FieldError | null {
    if (!text.trim() && !MEDIA_IN_TEXT.test(html ?? '')) return { field: 'text', text: t('Write the post.') };
    if ([...(html ?? textToRichHtml(text))].length > TEXT_MAX) return { field: 'text', text: tn(TEXT_MAX, 'The text is too long: the site keeps at most {{count}} character, its paragraphs included.', 'The text is too long: the site keeps at most {{count}} characters, its paragraphs included.') };
    return null;
}

/**
 * Why a new post can't be sent yet, by its field, or null. Lengths are counted in characters, as
 * the site counts them: the title and the summary as typed, the text as the HTML it is sent as.
 */
export function newPostBlocker({ title, summary = '', text, html, coverBlocker, categoryMissing = false }: { title: string; summary?: string; text: string; html?: string; coverBlocker: string | null; categoryMissing?: boolean }): FieldError | null {
    const blocker = titleBlocker(title) ?? summaryBlocker(summary) ?? textBlocker(text, html);
    if (blocker) return blocker;
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

/** What a field is described by: its hint, and its error while it has one. */
function describedBy(id: string, fieldError: FieldError | null, field: Field, hint?: string): string | undefined {
    return [hint, fieldError?.field === field ? `${id}-${field}-error` : undefined].filter(Boolean).join(' ') || undefined;
}

/** What a field was refused for, under it. */
function FieldMessage({ id, fieldError, field }: { id: string; fieldError: FieldError | null; field: Field }) {
    if (fieldError?.field !== field) return null;
    return (
        <p id={`${id}-${field}-error`} className="error small" role="alert">
            {fieldError.text}
        </p>
    );
}

/** Said where a form is held for a picture of its text. */
export const uploadsHold = () => `${t('Wait until the uploads are done')}.`;

/**
 * The pictures of a post's text: the site's editor storage (POST /uploads/inline). The editor
 * puts a picture in the text only when its upload is done, so the form is told while one is on
 * its way (`pending` for what it shows, `busy()` for a press before it is drawn again): from the
 * paste or the drop being made ready until the editor has had the site's answer. A form that
 * sent its text meanwhile would send it without the picture.
 */
export function usePostImages(uploader?: Uploader) {
    const { api } = useApp();
    const count = useRef(0);
    const [pending, setPending] = useState(0);
    const sink = useMemo(() => {
        const base = uploader ?? makeUploader(api);
        const counted =
            <A extends unknown[], R>(run: (...args: A) => Promise<R>) =>
            (...args: A): Promise<R> => {
                setPending(++count.current);
                const done = run(...args);
                const over = () => setPending(--count.current);
                // one turn later than who waits for it (the editor, which then starts the upload or puts the picture in)
                const settled = () => undefined;
                void done.then(settled, settled).then(over);
                return done;
            };
        return { uploader: { ...base, fromFiles: counted((...args: Parameters<Uploader['fromFiles']>) => base.fromFiles(...args)), fromPaths: counted((...args: Parameters<Uploader['fromPaths']>) => base.fromPaths(...args)) }, uploadInline: counted(inlineUploader(base)), busy: () => count.current > 0 };
    }, [uploader, api]);
    return useMemo(() => ({ ...sink, pending }), [sink, pending]);
}

/** Moves focus to the field a form refused (the text box is the editor's, the cover its Choose button). */
export function focusPostField(id: string, field: Field, editor: RichEditorHandle | null): void {
    if (field === 'text') editor?.focus();
    else document.getElementById(field === 'cover' ? `${id}-pick` : `${id}-${field}`)?.focus();
}

/**
 * A post's title, summary and text, as the new post form and the edit form have them: each
 * labelled, and marked invalid and described by the reason when it is the one refused. A text
 * the editor would lose something of (`textEditable` false) and a summary the app has only the
 * start of (`summaryEditable` false) are shown as they read, in a grouped box, with a note that
 * they are edited on the site.
 */
export function PostTextFields({
    id,
    title,
    summary,
    html,
    textEditable = true,
    summaryEditable = true,
    readOnly = false,
    fieldError,
    editor,
    images,
    announce,
    onTitle,
    onSummary,
    onContent,
}: {
    id: string;
    title: string;
    summary: string;
    /** The text as the site keeps it (the editor's full mode). */
    html: string;
    textEditable?: boolean;
    summaryEditable?: boolean;
    /** While the form is being saved: the fields show what they hold, keep focus and take no change. */
    readOnly?: boolean;
    fieldError: FieldError | null;
    editor: RefObject<RichEditorHandle | null>;
    images: ReturnType<typeof usePostImages>;
    announce?: (text: string) => void;
    onTitle: (title: string) => void;
    onSummary: (summary: string) => void;
    onContent: (content: { html: string; text: string }) => void;
}) {
    return (
        <>
            <div className="settings-field">
                <label htmlFor={`${id}-title`}>{t('Title')}</label>
                <input id={`${id}-title`} value={title} dir="auto" autoFocus readOnly={readOnly} aria-invalid={fieldError?.field === 'title' || undefined} aria-describedby={describedBy(id, fieldError, 'title')} onChange={(e) => onTitle(e.target.value)} />
                <FieldMessage id={id} fieldError={fieldError} field="title" />
            </div>
            {summaryEditable ? (
                <div className="settings-field">
                    <label htmlFor={`${id}-summary`}>{t('Summary')}</label>
                    <textarea
                        id={`${id}-summary`}
                        rows={2}
                        value={summary}
                        dir="auto"
                        readOnly={readOnly}
                        aria-invalid={fieldError?.field === 'summary' || undefined}
                        aria-describedby={describedBy(id, fieldError, 'summary', `${id}-summary-hint`)}
                        onChange={(e) => onSummary(e.target.value)}
                    />
                    <p id={`${id}-summary-hint`} className="small muted">
                        {t('Optional. Lists show it under the title; without one they show the start of the text.')}
                    </p>
                    <FieldMessage id={id} fieldError={fieldError} field="summary" />
                </div>
            ) : (
                <div className="settings-field" role="group" aria-labelledby={`${id}-summary-label`} aria-describedby={`${id}-summary-hint`}>
                    <span id={`${id}-summary-label`} className="discussion-text-label">
                        {t('Summary')}
                    </span>
                    <p className="discussion-text-preview" dir="auto">
                        {summary}
                    </p>
                    <p id={`${id}-summary-hint`} className="small muted">
                        {t('This summary ends with “…”, so the app may have only its start: it is edited on the network’s site.')}
                    </p>
                </div>
            )}
            {textEditable ? (
                <div className="settings-field">
                    {/* a label for the text box, which is no form control: a click puts the caret in it (RichEditor, labelledBy) */}
                    <label id={`${id}-text-label`} htmlFor={`${id}-text`}>
                        {t('Text')}
                    </label>
                    <RichEditor
                        ref={editor}
                        mode="full"
                        id={`${id}-text`}
                        className="article-text-input"
                        rows={12}
                        value={html}
                        label={t('Text')}
                        labelledBy={`${id}-text-label`}
                        invalid={fieldError?.field === 'text'}
                        readOnly={readOnly}
                        describedBy={describedBy(id, fieldError, 'text', `${id}-text-hint`)}
                        images={images}
                        windowDrops
                        announce={announce}
                        onChange={(value, plain) => onContent({ html: value, text: plain })}
                    />
                    <p id={`${id}-text-hint`} className="small muted">
                        {t('{{bold}}, {{italic}} and {{underline}} format the selected words, {{link}} adds a link.', { bold: isMac ? '⌘B' : 'Ctrl+B', italic: isMac ? '⌘I' : 'Ctrl+I', underline: isMac ? '⌘U' : 'Ctrl+U', link: isMac ? '⌘K' : 'Ctrl+K' })}
                    </p>
                    <FieldMessage id={id} fieldError={fieldError} field="text" />
                </div>
            ) : (
                <div className="settings-field" role="group" aria-labelledby={`${id}-text-label`} aria-describedby={`${id}-text-hint`}>
                    <span id={`${id}-text-label`} className="discussion-text-label">
                        {t('Text')}
                    </span>
                    <RichText html={html} className="discussion-text-preview" />
                    <p id={`${id}-text-hint`} className="small muted">
                        {t('This text has formatting that editing here would remove, so it is edited on the network’s site.')}
                    </p>
                </div>
            )}
        </>
    );
}

/**
 * The category of a post, one of the site's (nothing where the site has none): none is chosen
 * until one is. A new post needs one (`required`); a post that is edited keeps what it has.
 */
export function PostCategoryField({
    id,
    categories,
    category,
    required = true,
    held = false,
    fieldError,
    onCategory,
}: {
    id: string;
    categories: readonly Schema<'PostCategory'>[];
    category: string;
    required?: boolean;
    /** While the form is being saved: it takes no change and keeps the keyboard (heldSelect). */
    held?: boolean;
    fieldError: FieldError | null;
    onCategory: (id: string) => void;
}) {
    if (!categories.length) return null;
    return (
        <div className="settings-field">
            <label htmlFor={`${id}-category`}>{t('Category')}</label>
            <select id={`${id}-category`} value={category} required={required} aria-invalid={fieldError?.field === 'category' || undefined} aria-describedby={describedBy(id, fieldError, 'category')} {...heldSelect(held, (e) => onCategory(e.target.value))}>
                <option value="" disabled>
                    {t('Choose a category')}
                </option>
                {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
            <FieldMessage id={id} fieldError={fieldError} field="category" />
        </div>
    );
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
 * take posts. While a picture pasted or dropped in the text is uploading, Post is held and says
 * why, since the picture is in the text only once it is there. Sent, it opens; the lists show it. The site's refusal (a membership level that may
 * not write posts) is said in the form.
 */
export function NewPost({ contextId, uploader }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const id = useId();
    const [announcement, announce] = useAnnouncer();
    const cover = usePhotoUploads({ purpose: 'post_cover', uploader, announce });
    const images = usePostImages(uploader);
    // a picture of the text still on its way holds Post, and ⌘↩ with it
    const uploading = images.pending > 0;
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
        focusPostField(id, blocker.field, editor.current);
    };

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        // a picture on its way is not in the text yet: sent now, the post would go without it
        if (images.busy()) {
            announce(uploadsHold());
            return;
        }
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
    return (
        <Pane pane="detail" title={context ? t('New post in {{name}}', { name: context.display_name }) : t('New post')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <form className="settings-form discussion-form new-article" aria-labelledby="detail-title" onSubmit={(e) => void submit(e)} onKeyDown={(e) => submitKeys(() => void submit())(e)} noValidate>
                    <PostTextFields id={id} title={title} summary={summary} html={content.html} fieldError={fieldError} editor={editor} images={images} announce={announce} onTitle={setTitle} onSummary={setSummary} onContent={setContent} />
                    <fieldset className="settings-field settings-fieldset photo-field">
                        <legend>{t('Cover')}</legend>
                        <PhotoDropZone uploads={cover} pickId={`${id}-pick`} describedBy={fieldError?.field === 'cover' ? `${id}-cover-error` : undefined} label={cover.items.length ? t('Choose another…') : t('Choose a cover…')} dropHint={t('or drop a photo here')} />
                        {errorFor('cover') ? (
                            <p id={`${id}-cover-error`} className="error small" role="alert">
                                {errorFor('cover')}
                            </p>
                        ) : null}
                    </fieldset>
                    <PostCategoryField id={id} categories={categories} category={category} fieldError={fieldError} onCategory={setCategory} />
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
                        {uploading ? (
                            <span id={`${id}-held`} className="muted small">
                                {uploadsHold()}
                            </span>
                        ) : (
                            <span className="muted small" aria-hidden="true">
                                {t('{{keys}} to post', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                            </span>
                        )}
                        <button type="submit" className="btn btn-primary" aria-disabled={sending || uploading || undefined} aria-busy={sending || undefined} aria-describedby={uploading ? `${id}-held` : undefined}>
                            {t('Post', { context: 'verb' })}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}
