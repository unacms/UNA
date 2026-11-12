import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { retryOnce } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { heldSelect } from '../../lib/held-select';
import { t, tn } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot, settleIdempotency } from '../../lib/idempotency';
import { useNavigation } from '../../lib/navigation';
import { isMac } from '../../lib/platform';
import { useAudiences } from '../../lib/site-modules';
import type { Uploader } from '../../lib/uploads';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { contextKind, fetchAnyContext, groupKey } from '../groups/groups';
import { textToHtml } from '../videos/videos';
import { PhotoDropZone, usePhotoUploads } from './photo-uploads';
import { addedText, afterAlbumAdded, afterPhotosAdded } from './photos';

export type Audience = NonNullable<Schema<'NewPhotos'>['audience']>;

const AUDIENCES: { value: Audience; label: string }[] = [
    { value: 'public', label: t('Everyone') },
    { value: 'members', label: t('Members of the network') },
    { value: 'friends', label: t('Friends') },
    { value: 'private', label: t('Only me') },
];

/** The context a form adds to, by its id whatever its kind (the page it was started from has read it). */
export function useFormContext(contextId: string | undefined) {
    const { api } = useApp();
    const q = useQuery({ queryKey: groupKey(contextId ?? ''), queryFn: () => fetchAnyContext(api, contextId ?? ''), enabled: !!contextId, retry: retryOnce });
    return contextId ? q.data : undefined;
}

/**
 * That whoever sees the place it goes in sees it, as a whole sentence by what is added (`noun`:
 * "them", else "it"; an id here) and the kind of place: another language words each its own way.
 */
function seenAsItsPlaceText(noun: string, context: ReturnType<typeof useFormContext>): string {
    const them = noun === 'them';
    if (!context) return them ? t('Who can see them: whoever can see what is in the place it goes in.') : t('Who can see it: whoever can see what is in the place it goes in.');
    const name = context.display_name;
    const kind = contextKind(context);
    if (kind === 'space') return them ? t('Who can see them: whoever can see what is in {{name}}, as for everything in this space.', { name }) : t('Who can see it: whoever can see what is in {{name}}, as for everything in this space.', { name });
    if (kind === 'event') return them ? t('Who can see them: whoever can see what is in {{name}}, as for everything in this event.', { name }) : t('Who can see it: whoever can see what is in {{name}}, as for everything in this event.', { name });
    return them ? t('Who can see them: whoever can see what is in {{name}}, as for everything in this group.', { name }) : t('Who can see it: whoever can see what is in {{name}}, as for everything in this group.', { name });
}

/**
 * Who will see it: the context's members, or the audience picked from those the site offers for
 * the module of `tag` (GET /api/v2's `modules`: a privacy group the site turned off is not one).
 */
export function AudienceField({
    id,
    tag,
    contextId,
    context,
    audience,
    held = false,
    onAudience,
    noun,
}: {
    id: string;
    tag: string;
    contextId?: string;
    context: ReturnType<typeof useFormContext>;
    audience: Audience;
    /** While the form is being saved: it takes no change and keeps the keyboard (heldSelect). */
    held?: boolean;
    onAudience: (a: Audience) => void;
    noun: string;
}) {
    const offered = useAudiences(tag);
    const options = AUDIENCES.filter((a) => offered.includes(a.value));
    // the one picked is always one the site offers (the first, when the default is not)
    const value = options.some((a) => a.value === audience) ? audience : options[0]?.value;
    useEffect(() => {
        if (!contextId && value && value !== audience) onAudience(value);
    }, [contextId, value, audience, onAudience]);
    if (contextId)
        return (
            <p className="settings-field small muted">
                {seenAsItsPlaceText(noun, context)}
            </p>
        );
    return (
        <div className="settings-field">
            <label htmlFor={`${id}-audience`}>{noun === 'them' ? t('Who can see them') : t('Who can see it')}</label>
            <select id={`${id}-audience`} value={value} {...heldSelect(held, (e) => onAudience(e.target.value as Audience))}>
                {options.map((a) => (
                    <option key={a.value} value={a.value}>
                        {a.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/** Cmd+Enter (Ctrl+Enter) submits the form. */
export const submitKeys = (submit: () => void) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || !(isMac ? e.metaKey : e.ctrlKey)) return;
    e.preventDefault();
    submit();
};

/**
 * Adding photos in the detail pane: photos picked in the system's dialog or dropped on the window
 * (each uploading at once, with its progress, Retry and Remove), one title and text for all of
 * them (each file's name when no title is given), and who can see them, or the group they go in
 * when it was started from one. Added, the first one opens; uploads nothing took are deleted
 * when the form goes. Photos still being made ready hold Add as ones that are uploading; while it
 * is being sent the form takes no change, as the new post form (NewPost).
 */
export function NewPhotos({ contextId, uploader }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const context = useFormContext(contextId);
    const id = useId();
    const [announcement, announce] = useAnnouncer();
    const uploads = usePhotoUploads({ purpose: 'photo', uploader, announce });
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [audience, setAudience] = useState<Audience>('public');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    // the Idempotency-Key it went with: sending the same again after an answer that never came
    // gets the site's first answer, not a second set
    const sent = useRef<IdempotencySlot['current']>(null);

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        // files being made ready (picked or dropped, not in the tray yet) hold it as ones that are
        // uploading: sent now, it would go without them
        const blocker = uploads.staging() ? t('Wait until the uploads are done') : (uploads.blocker ?? (uploads.ids.length ? null : t('Choose the photos to add.')));
        if (blocker) {
            setFieldError(blocker);
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        setFieldError(null);
        const body: Schema<'NewPhotos'> = { media_ids: uploads.ids };
        if (title.trim()) body.title = title.trim();
        if (text.trim()) body.text_html = textToHtml(text);
        if (contextId) body.context_id = contextId;
        else body.audience = audience;
        const from = history.current;
        setSending(true);
        setError(null);
        let result;
        try {
            // the site stops adding once the membership level's limit is reached: what it did not take stays here
            // (a photo's media id is the upload's: the ones no photo has are those left)
            result = await uploads.claim(api.POST('/photos', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/photos', body]) } }, body }), (r) =>
                r.error !== undefined || !r.data ? false : r.data.length < body.media_ids.length ? r.data.flatMap((p) => (p.media ? [p.media.id] : [])) : true,
            );
        } catch (e) {
            if (uploads.gone()) return;
            // no answer came: the key stays, so sending it again gets the site's answer to this one
            setSending(false);
            setError(t('The photos were not added: {{reason}}', { reason: errorMessage(e) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        if (result.error !== undefined || !result.data) {
            if (uploads.gone()) return;
            setSending(false);
            setError(problemMessage(result.error, t('The photos were not added')));
            return;
        }
        const asked = body.media_ids.length;
        const partial = result.data.length < asked;
        await afterPhotosAdded(queryClient, result.data);
        if (uploads.gone()) return;
        if (partial) {
            setSending(false);
            const left = asked - result.data.length;
            setFieldError(`${addedText(result.data.length, asked)} ${tn(left, 'The site took no more; the one left is still here: send it again later, or remove it.', 'The site took no more; the {{count}} left are still here: send them again later, or remove them.')}`);
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        const first = result.data[0];
        if (!first || !replaceDetail({ kind: 'photo', id: first.id }, from)) setSending(false);
    };

    // while it is sent a change is refused, not only by the fields: an update that was already on its way
    const edit =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            if (!sending) set(value);
        };

    return (
        <Pane pane="detail" title={context ? t('Add photos to {{name}}', { name: context.display_name }) : t('Add photos')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <form className="settings-form discussion-form new-photos" aria-labelledby="detail-title" onSubmit={(e) => void submit(e)} onKeyDown={(e) => submitKeys(() => void submit())(e)} noValidate>
                    <fieldset className="settings-field settings-fieldset photo-field">
                        <legend>{t('Photos')}</legend>
                        <PhotoDropZone uploads={uploads} pickId={`${id}-pick`} describedBy={fieldError ? `${id}-photos-error` : undefined} label={uploads.items.length ? t('Add more photos…') : t('Choose photos…')} held={sending} />
                        {fieldError ? (
                            <p id={`${id}-photos-error`} className="error small" role="alert">
                                {fieldError}
                            </p>
                        ) : null}
                    </fieldset>
                    <div className="settings-field">
                        <label htmlFor={`${id}-title`}>{t('Title')}</label>
                        <input id={`${id}-title`} value={title} maxLength={255} dir="auto" readOnly={sending} aria-describedby={`${id}-title-hint`} onChange={(e) => edit(setTitle)(e.target.value)} />
                        <p id={`${id}-title-hint`} className="small muted">
                            {t('Every photo’s title. Leave it empty to title each with its file’s name, which whoever can see the photo sees.')}
                        </p>
                    </div>
                    <div className="settings-field">
                        <label htmlFor={`${id}-text`}>{t('Description')}</label>
                        <textarea id={`${id}-text`} rows={4} value={text} maxLength={50000} dir="auto" readOnly={sending} onChange={(e) => edit(setText)(e.target.value)} />
                    </div>
                    <AudienceField id={id} tag="photos" contextId={contextId} context={context} audience={audience} held={sending} onAudience={edit(setAudience)} noun="them" />
                    {error ? (
                        <p className="error" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <div className="settings-actions">
                        <span className="muted small" aria-hidden="true">
                            {t('{{keys}} to add', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                        </span>
                        <button type="submit" className="btn btn-primary" aria-disabled={sending || undefined} aria-busy={sending || undefined}>
                            {uploads.ids.length > 1 ? tn(uploads.ids.length, 'Add {{count}} photo', 'Add {{count}} photos') : t('Add photos')}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}

/**
 * Making an album in the detail pane: its title (needed), description, who can see it (or the
 * group it goes in), and photos to put in it now (more can be added later). Made, it opens.
 * Photos still being made ready hold Make album as ones that are uploading; while it is being
 * made the form takes no change, as the new post form (NewPost).
 */
export function NewAlbum({ contextId, uploader }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const context = useFormContext(contextId);
    const id = useId();
    const [announcement, announce] = useAnnouncer();
    const uploads = usePhotoUploads({ purpose: 'album', uploader, announce });
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [audience, setAudience] = useState<Audience>('public');
    const [fieldError, setFieldError] = useState<{ field: 'title' | 'photos'; text: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    // the Idempotency-Key it went with: sending the same again after an answer that never came
    // gets the site's first answer, not a second set
    const sent = useRef<IdempotencySlot['current']>(null);

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        if (!title.trim()) {
            setFieldError({ field: 'title', text: t('Give the album a title.') });
            document.getElementById(`${id}-title`)?.focus();
            return;
        }
        // files being made ready (picked or dropped, not in the tray yet) hold it as ones that are
        // uploading: sent now, it would go without them
        const blocker = uploads.staging() ? t('Wait until the uploads are done') : uploads.blocker;
        if (blocker) {
            setFieldError({ field: 'photos', text: blocker });
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        setFieldError(null);
        const body: Schema<'NewAlbum'> = { title: title.trim() };
        if (text.trim()) body.text_html = textToHtml(text);
        if (uploads.ids.length) body.media_ids = uploads.ids;
        if (contextId) body.context_id = contextId;
        else body.audience = audience;
        const from = history.current;
        setSending(true);
        setError(null);
        let result;
        try {
            result = await uploads.claim(api.POST('/albums', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/albums', body]) } }, body }), (r) => r.error === undefined && !!r.data);
        } catch (e) {
            if (uploads.gone()) return;
            // no answer came: the key stays, so sending it again gets the site's answer to this one
            setSending(false);
            setError(t('The album was not made: {{reason}}', { reason: errorMessage(e) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        if (result.error !== undefined || !result.data) {
            if (uploads.gone()) return;
            setSending(false);
            const problem = result.error as { errors?: { field?: string; message?: string }[] } | undefined;
            const message = problemMessage(result.error, t('The album was not made'));
            if (problem?.errors?.[0]?.field === 'title') setFieldError({ field: 'title', text: problem.errors[0].message ?? message });
            else setError(message);
            return;
        }
        await afterAlbumAdded(queryClient, result.data);
        if (uploads.gone()) return;
        if (!replaceDetail({ kind: 'album', id: result.data.id }, from)) setSending(false);
    };

    // while it is sent a change is refused, not only by the fields: an update that was already on its way
    const edit =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            if (!sending) set(value);
        };

    return (
        <Pane pane="detail" title={context ? t('New album in {{name}}', { name: context.display_name }) : t('New album')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <form className="settings-form discussion-form new-album" aria-labelledby="detail-title" onSubmit={(e) => void submit(e)} onKeyDown={(e) => submitKeys(() => void submit())(e)} noValidate>
                    <div className="settings-field">
                        <label htmlFor={`${id}-title`}>{t('Title')}</label>
                        <input
                            id={`${id}-title`}
                            value={title}
                            maxLength={160}
                            required
                            dir="auto"
                            autoFocus
                            readOnly={sending}
                            aria-invalid={fieldError?.field === 'title' || undefined}
                            aria-describedby={fieldError?.field === 'title' ? `${id}-title-error` : undefined}
                            onChange={(e) => edit(setTitle)(e.target.value)}
                        />
                        {fieldError?.field === 'title' ? (
                            <p id={`${id}-title-error`} className="error small" role="alert">
                                {fieldError.text}
                            </p>
                        ) : null}
                    </div>
                    <div className="settings-field">
                        <label htmlFor={`${id}-text`}>{t('Description')}</label>
                        <textarea id={`${id}-text`} rows={3} value={text} maxLength={50000} dir="auto" readOnly={sending} onChange={(e) => edit(setText)(e.target.value)} />
                    </div>
                    <AudienceField id={id} tag="albums" contextId={contextId} context={context} audience={audience} held={sending} onAudience={edit(setAudience)} noun="it" />
                    <fieldset className="settings-field settings-fieldset photo-field">
                        <legend>{t('Photos')}</legend>
                        <PhotoDropZone uploads={uploads} pickId={`${id}-pick`} describedBy={fieldError?.field === 'photos' ? `${id}-photos-error` : undefined} label={uploads.items.length ? t('Add more photos…') : t('Choose photos…')} held={sending} />
                        {fieldError?.field === 'photos' ? (
                            <p id={`${id}-photos-error`} className="error small" role="alert">
                                {fieldError.text}
                            </p>
                        ) : (
                            <p className="small muted">{t('You can add photos later too.')}</p>
                        )}
                    </fieldset>
                    {error ? (
                        <p className="error" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <div className="settings-actions">
                        <span className="muted small" aria-hidden="true">
                            {t('{{keys}} to make it', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                        </span>
                        <button type="submit" className="btn btn-primary" aria-disabled={sending || undefined} aria-busy={sending || undefined}>
                            {t('Make album')}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}
