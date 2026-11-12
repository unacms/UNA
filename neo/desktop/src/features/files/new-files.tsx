import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useId, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot, settleIdempotency } from '../../lib/idempotency';
import { useNavigation } from '../../lib/navigation';
import { isMac } from '../../lib/platform';
import type { Uploader } from '../../lib/uploads';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { type Audience, AudienceField, submitKeys, useFormContext } from '../photos/new-media';
import { PhotoDropZone, usePhotoUploads } from '../photos/photo-uploads';
import { textToHtml } from '../videos/videos';
import { afterFilesAdded, filesAddedText } from './files';

/**
 * Adding files in the detail pane: files of any type picked in the system's dialog or dropped on
 * the window (each uploading at once, with its progress, Retry and Remove; the network's
 * storage decides which types and sizes it takes), one title and description for all of them
 * (each file's name when no title is given), and who can see them, or the group they go in when
 * it was started from one. Added, the first one opens; uploads nothing took are deleted when the
 * form goes.
 */
export function NewFiles({ contextId, uploader }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    const context = useFormContext(contextId);
    const id = useId();
    const [announcement, announce] = useAnnouncer();
    const uploads = usePhotoUploads({ purpose: 'file', uploader, announce });
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
        const blocker = uploads.blocker ?? (uploads.ids.length ? null : t('Choose the files to add.'));
        if (blocker) {
            setFieldError(blocker);
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        setFieldError(null);
        const body: Schema<'NewFiles'> = { media_ids: uploads.ids };
        if (title.trim()) body.title = title.trim();
        if (text.trim()) body.text_html = textToHtml(text);
        if (contextId) body.context_id = contextId;
        else body.audience = audience;
        const from = history.current;
        setSending(true);
        setError(null);
        let result;
        try {
            result = await api.POST('/files', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/files', body]) } }, body });
        } catch (e) {
            // no answer came: the key stays, so sending it again gets the site's answer to this one
            setSending(false);
            setError(t('The files were not added: {{reason}}', { reason: errorMessage(e) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        if (result.error !== undefined || !result.data) {
            setSending(false);
            setError(problemMessage(result.error, t('The files were not added')));
            return;
        }
        // the site stops adding once the membership level's limit is reached: what it did not take stays here
        const asked = body.media_ids.length;
        const partial = result.data.length < asked;
        uploads.markTaken(partial ? result.data.flatMap((f) => (f.media ? [f.media.id] : [])) : undefined);
        await afterFilesAdded(queryClient, result.data);
        if (partial) {
            setSending(false);
            const left = asked - result.data.length;
            setFieldError(`${filesAddedText(result.data.length, asked)} ${tn(left, 'The site took no more; the one left is still here: send it again later, or remove it.', 'The site took no more; the {{count}} left are still here: send them again later, or remove them.')}`);
            document.getElementById(`${id}-pick`)?.focus();
            return;
        }
        const first = result.data[0];
        if (!first || !replaceDetail({ kind: 'file', id: first.id }, from)) setSending(false);
    };

    return (
        <Pane pane="detail" title={context ? t('Add files to {{name}}', { name: context.display_name }) : t('Add files')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <form className="settings-form discussion-form new-files" aria-labelledby="detail-title" onSubmit={(e) => void submit(e)} onKeyDown={(e) => submitKeys(() => void submit())(e)} noValidate>
                    <fieldset className="settings-field settings-fieldset photo-field">
                        <legend>{t('Files')}</legend>
                        <PhotoDropZone uploads={uploads} pickId={`${id}-pick`} describedBy={fieldError ? `${id}-files-error` : undefined} label={uploads.items.length ? t('Add more files…') : t('Choose files…')} icon="file-up" />
                        {fieldError ? (
                            <p id={`${id}-files-error`} className="error small" role="alert">
                                {fieldError}
                            </p>
                        ) : null}
                    </fieldset>
                    <div className="settings-field">
                        <label htmlFor={`${id}-title`}>{t('Title')}</label>
                        <input id={`${id}-title`} value={title} maxLength={255} dir="auto" aria-describedby={`${id}-title-hint`} onChange={(e) => setTitle(e.target.value)} />
                        <p id={`${id}-title-hint`} className="small muted">
                            {t('Every file’s title. Leave it empty to title each with its file’s name, which whoever can see the file sees.')}
                        </p>
                    </div>
                    <div className="settings-field">
                        <label htmlFor={`${id}-text`}>{t('Description')}</label>
                        <textarea id={`${id}-text`} rows={4} value={text} maxLength={50000} dir="auto" onChange={(e) => setText(e.target.value)} />
                    </div>
                    <AudienceField id={id} tag="files" contextId={contextId} context={context} audience={audience} onAudience={setAudience} noun="them" />
                    <p className="small muted">{t('Whoever can see a file can download it.')}</p>
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
                            {uploads.ids.length > 1 ? tn(uploads.ids.length, 'Add {{count}} file', 'Add {{count}} files') : t('Add files')}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}
