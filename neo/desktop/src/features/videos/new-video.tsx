import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { type DragEvent, type FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { Icon } from '../../components/icon';
import { retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot, settleIdempotency } from '../../lib/idempotency';
import { inApp } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { isMac } from '../../lib/platform';
import { claimWindowDrops, makeUploader, type Picked, type Staging, UploadError, type Uploader, videoUploader } from '../../lib/uploads';
import { CloseDetailButton, Pane } from '../../shell/pane';
import { POLL_FIRST_MS, POLL_MAX_MS, sizeText } from '../compose/attachments';
import { contextKind, fetchAnyContext, groupKey } from '../groups/groups';
import { afterVideoAdded, textToHtml } from './videos';

type Media = Schema<'Media'>;
type Audience = NonNullable<Schema<'NewVideo'>['audience']>;

const AUDIENCES: { value: Audience; label: string }[] = [
    { value: 'public', label: t('Everyone') },
    { value: 'members', label: t('Members of the network') },
    { value: 'friends', label: t('Friends') },
    { value: 'private', label: t('Only me') },
];

/** The upload of the form: its file, how far it got, the site's Media once it arrived. */
export type VideoUpload =
    | { status: 'uploading'; picked: Picked; sent: number; total: number }
    | { status: 'done'; picked: Picked; media: Media }
    | { status: 'failed'; picked: Picked; error: string };

/** The file name without its extension: the title a video takes by default. */
export function titleFromName(name: string): string {
    return name.replace(/\.[^.]+$/, '').trim();
}

/** What the upload's line says: its progress, the site converting it, or that it is ready. */
export function uploadStatusText(u: VideoUpload): string {
    if (u.status === 'uploading') return u.total ? t('Uploading… {{percent}}%', { percent: Math.min(100, Math.round((u.sent / u.total) * 100)) }) : t('Uploading…');
    if (u.status === 'failed') return t('Not uploaded: {{reason}}', { reason: u.error });
    if (u.media.state === 'processing') return t('Uploaded. The network is converting it; you can add it now, and it plays once that is done.');
    if (u.media.state === 'failed') return t('Uploaded, but the network could not convert it.');
    return t('Uploaded and ready.');
}

/** Whether the link is an http(s) address. */
export function isVideoLink(s: string): boolean {
    try {
        const u = new URL(s.trim());
        return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
        return false;
    }
}

/**
 * Adding a video in the detail pane: an upload (picked in the system's dialog, or dropped on the
 * window), whose progress shows until it arrived and whose conversion the site reports
 * (GET /uploads/{id}, asked less and less often), or a link to a video on another site; its
 * title (the file's name by default), description and who can see it, or the group it goes in
 * when it was started from one. Added, it opens as the video; an upload nothing took is
 * deleted when the form goes.
 */
export function NewVideo({ contextId, uploader: given }: { contextId?: string; uploader?: Uploader }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, replaceDetail } = useNavigation();
    // the group, space or event it goes in, whatever its kind (the page it was started from has read it)
    const contextQuery = useQuery({ queryKey: groupKey(contextId ?? ''), queryFn: () => fetchAnyContext(api, contextId ?? ''), enabled: !!contextId, retry: retryOnce });
    const context = contextId ? contextQuery.data : undefined;
    const uploader = useMemo(() => videoUploader(given ?? makeUploader(api)), [given, api]);
    const id = useId();
    const [source, setSource] = useState<'upload' | 'link'>('upload');
    const [upload, setUpload] = useState<VideoUpload | null>(null);
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [audience, setAudience] = useState<Audience>('public');
    const [dragging, setDragging] = useState(false);
    const [note, setNote] = useState('');
    const [fieldError, setFieldError] = useState<{ field: 'file' | 'link' | 'title'; text: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    // the Idempotency-Key it went with: sending the same again after an answer that never came
    // gets the site's first answer, not a second video
    const sent = useRef<IdempotencySlot['current']>(null);

    // the upload as it is now, for what runs later (a reply, the form going)
    const latest = useRef(upload);
    useEffect(() => {
        latest.current = upload;
    }, [upload]);
    const added = useRef(false);

    // an upload the form no longer needs: stopped on its way, its staged file let go (kept for a
    // retry of the same file), deleted on the site once it arrived (its converting is queued then)
    const drop = (u: VideoUpload, keepFile = false) => {
        if (u.status === 'uploading') uploader.cancel(u.picked);
        if (!keepFile) uploader.release(u.picked);
        if (u.status === 'done') void api.DELETE('/uploads/{id}', { params: { path: { id: u.media.id } } }).catch(() => undefined);
    };
    const dropRef = useRef(drop);
    useEffect(() => {
        dropRef.current = drop;
    });

    // the form goes: an upload nothing took goes with it
    useEffect(
        () => () => {
            const u = latest.current;
            if (u && !added.current) dropRef.current(u);
        },
        [],
    );

    const start = (staging: Staging) => {
        const [picked, ...extra] = staging.files;
        for (const f of extra) uploader.release(f);
        if (!picked) {
            if (staging.refused.length) setNote(t('Not a video: {{names}}', { names: staging.refused.join(', ') }));
            return;
        }
        // another file in place of the one there: that one goes. Try again sends the same file,
        // whose staged copy must stay for it
        const was = latest.current;
        if (was) drop(was, was.picked === picked);
        setFieldError(null);
        setUpload({ status: 'uploading', picked, sent: 0, total: picked.size });
        setNote(extra.length ? t('Uploading {{name}}. A video takes one file: the others were left out', { name: picked.name }) : t('Uploading {{name}}', { name: picked.name }));
        if (!title.trim()) setTitle(titleFromName(picked.name));
        uploader.upload(picked, (sent, total) => setUpload((u) => (u && u.status === 'uploading' && u.picked === picked ? { ...u, sent, total } : u))).then(
            (media) => {
                if (latest.current?.picked !== picked) return;
                setUpload({ status: 'done', picked, media });
                setNote(media.state === 'processing' ? t('{{name}} uploaded; the network is converting it', { name: picked.name }) : t('{{name}} uploaded', { name: picked.name }));
            },
            (e: unknown) => {
                if (e instanceof UploadError && e.code === 'cancelled') return;
                if (latest.current?.picked !== picked) return;
                const message = errorMessage(e);
                setUpload({ status: 'failed', picked, error: message });
                setNote(t('{{name}} was not uploaded: {{reason}}', { name: picked.name, reason: message }));
            },
        );
    };

    // the site converting the upload: asked again, less and less often, until it says
    const processingId = upload?.status === 'done' && upload.media.state === 'processing' ? upload.media.id : null;
    useEffect(() => {
        if (!processingId) return;
        let live = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const poll = (delay: number) => {
            timer = setTimeout(() => {
                void api.GET('/uploads/{id}', { params: { path: { id: processingId } } }).then(
                    (r) => {
                        if (!live) return;
                        const media = r.data;
                        if (!media) return poll(Math.min(delay * 2, POLL_MAX_MS));
                        setUpload((u) => (u && u.status === 'done' && u.media.id === media.id ? { ...u, media } : u));
                        if (media.state === 'ready') setNote(t('The video is converted and ready'));
                        else if (media.state === 'failed') setNote(t('The network could not convert the video'));
                        else poll(Math.min(delay * 2, POLL_MAX_MS));
                    },
                    () => live && poll(Math.min(delay * 2, POLL_MAX_MS)),
                );
            }, delay);
        };
        poll(POLL_FIRST_MS);
        return () => {
            live = false;
            if (timer) clearTimeout(timer);
        };
    }, [processingId, api]);

    // files dropped on the app window come here while uploading is chosen (Rust saw the drop)
    const startRef = useRef(start);
    useEffect(() => {
        startRef.current = start;
    });
    useEffect(() => {
        if (!inApp || source !== 'upload') return;
        const release = claimWindowDrops();
        let stop: (() => void) | null = null;
        let live = true;
        void getCurrentWebview()
            .onDragDropEvent((e) => {
                const p = e.payload;
                if (p.type === 'enter') setDragging(true);
                else if (p.type === 'leave') setDragging(false);
                else if (p.type === 'drop') {
                    setDragging(false);
                    void uploader.fromPaths(p.paths).then((s) => startRef.current(s));
                }
            })
            .then(
                (fn) => {
                    if (live) stop = fn;
                    else fn();
                },
                (err: unknown) => console.error('drag and drop', err),
            );
        return () => {
            live = false;
            release();
            stop?.();
        };
    }, [source, uploader]);

    // a drop in a plain browser
    const dropProps = inApp
        ? {}
        : {
              onDragOver: (e: DragEvent) => {
                  if (!e.dataTransfer.types.includes('Files')) return;
                  e.preventDefault();
                  setDragging(true);
              },
              onDragLeave: (e: DragEvent) => {
                  if (e.currentTarget === e.target) setDragging(false);
              },
              onDrop: (e: DragEvent) => {
                  if (!e.dataTransfer.files.length) return;
                  e.preventDefault();
                  setDragging(false);
                  void uploader.fromFiles(Array.from(e.dataTransfer.files)).then(start);
              },
          };

    const pick = () => uploader.pick().then(start, (e: unknown) => setError(errorMessage(e)));

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (sending) return;
        const body: Schema<'NewVideo'> = {};
        if (source === 'upload') {
            if (upload?.status !== 'done') {
                setFieldError({ field: 'file', text: upload?.status === 'uploading' ? t('Wait until the upload is done.') : t('Choose a video to upload.') });
                document.getElementById(`${id}-pick`)?.focus();
                return;
            }
            body.media_id = upload.media.id;
        } else {
            if (!isVideoLink(link)) {
                setFieldError({ field: 'link', text: t('Paste the address of the video, starting with https://.') });
                document.getElementById(`${id}-link`)?.focus();
                return;
            }
            if (!title.trim()) {
                setFieldError({ field: 'title', text: t('Give it a title.') });
                document.getElementById(`${id}-title`)?.focus();
                return;
            }
            body.embed_url = link.trim();
        }
        setFieldError(null);
        if (title.trim()) body.title = title.trim();
        if (text.trim()) body.text_html = textToHtml(text);
        if (contextId) body.context_id = contextId;
        else body.audience = audience;
        const from = history.current;
        setSending(true);
        setError(null);
        let result;
        try {
            result = await api.POST('/videos', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/videos', body]) } }, body });
        } catch (e) {
            // no answer came: the key stays, so sending it again gets the site's answer to this one
            setSending(false);
            setError(t('The video was not added: {{reason}}', { reason: errorMessage(e) }));
            return;
        }
        settleIdempotency(sent, result.response.status);
        if (result.error !== undefined || !result.data) {
            setSending(false);
            const problem = result.error as { errors?: { field?: string; message?: string }[] } | undefined;
            const field = problem?.errors?.[0]?.field;
            const message = problemMessage(result.error, t('The video was not added'));
            if (field === 'embed_url') setFieldError({ field: 'link', text: problem?.errors?.[0]?.message ?? message });
            else setError(message);
            return;
        }
        added.current = true;
        // a file uploaded before the link was chosen instead: nothing takes it now
        if (source === 'link' && upload) {
            drop(upload);
            latest.current = null;
            setUpload(null);
        }
        const created = unwrap(result);
        await afterVideoAdded(queryClient, created);
        if (!replaceDetail({ kind: 'video', id: created.id }, from)) setSending(false);
    };

    const invalid = (field: 'file' | 'link' | 'title') => (fieldError?.field === field ? true : undefined);
    const message = (field: 'file' | 'link' | 'title') =>
        fieldError?.field === field ? (
            <p id={`${id}-${field}-error`} className="error small" role="alert">
                {fieldError.text}
            </p>
        ) : null;

    return (
        <Pane pane="detail" title={context ? t('Add video to {{name}}', { name: context.display_name }) : t('Add video')} actions={<CloseDetailButton />}>
            <div className="column settings">
                <p className="sr-only" role="status" aria-live="polite">
                    {note}
                </p>
                <form
                    className="settings-form discussion-form new-video"
                    aria-labelledby="detail-title"
                    onSubmit={(e) => void submit(e)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter' || !(isMac ? e.metaKey : e.ctrlKey)) return;
                        e.preventDefault();
                        void submit();
                    }}
                    noValidate
                >
                    <fieldset className="settings-field video-source">
                        <legend>{t('Video')}</legend>
                        <label>
                            <input type="radio" name={`${id}-source`} value="upload" checked={source === 'upload'} onChange={() => setSource('upload')} /> {t('Upload a file')}
                        </label>
                        <label>
                            <input type="radio" name={`${id}-source`} value="link" checked={source === 'link'} onChange={() => setSource('link')} /> {t('Link to a video on another site')}
                        </label>
                    </fieldset>
                    {source === 'upload' ? (
                        <div className="settings-field">
                            <div className="video-drop" data-dragging={dragging || undefined} {...dropProps}>
                                <Icon name="upload" size={20} />
                                <button
                                    type="button"
                                    id={`${id}-pick`}
                                    className="btn"
                                    onClick={() => void pick()}
                                    aria-describedby={fieldError?.field === 'file' ? `${id}-file-error ${id}-drop-hint` : `${id}-drop-hint`}
                                >
                                    {upload ? t('Choose another video…') : t('Choose a video…')}
                                </button>
                                <span id={`${id}-drop-hint`} className="small muted">
                                    {t('or drop one here')}
                                </span>
                            </div>
                            {upload ? (
                                <div className="video-upload">
                                    <span className="strong truncate">{upload.picked.name}</span>
                                    <span className="small muted">{sizeText(upload.picked.size)}</span>
                                    {upload.status === 'uploading' ? <progress max={upload.total || 1} value={upload.sent} aria-label={t('Uploading {{name}}', { name: upload.picked.name })} /> : null}
                                    <span className={`small${upload.status === 'failed' ? ' error' : ' muted'}`}>{uploadStatusText(upload)}</span>
                                    {upload.status === 'failed' ? (
                                        <button type="button" className="btn" onClick={() => start({ files: [upload.picked], refused: [] })}>
                                            {t('Try again')}
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                            {message('file')}
                        </div>
                    ) : (
                        <div className="settings-field">
                            <label htmlFor={`${id}-link`}>{t('Address of the video')}</label>
                            <input
                                id={`${id}-link`}
                                type="url"
                                inputMode="url"
                                value={link}
                                // i18n-ok: the start of an address
                                placeholder="https://"
                                autoFocus
                                aria-invalid={invalid('link')}
                                aria-describedby={fieldError?.field === 'link' ? `${id}-link-error` : undefined}
                                onChange={(e) => setLink(e.target.value)}
                            />
                            {message('link')}
                        </div>
                    )}
                    <div className="settings-field">
                        <label htmlFor={`${id}-title`}>{t('Title')}</label>
                        <input
                            id={`${id}-title`}
                            value={title}
                            maxLength={255}
                            dir="auto"
                            aria-invalid={invalid('title')}
                            aria-describedby={fieldError?.field === 'title' ? `${id}-title-error` : undefined}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        {message('title')}
                    </div>
                    <div className="settings-field">
                        <label htmlFor={`${id}-text`}>{t('Description')}</label>
                        <textarea id={`${id}-text`} rows={4} value={text} maxLength={50000} dir="auto" onChange={(e) => setText(e.target.value)} />
                    </div>
                    {contextId ? (
                        <p className="settings-field small muted">
                            {context
                                ? contextKind(context) === 'space'
                                    ? t('Who can see it: whoever can see what is in {{name}}, as for everything in this space.', { name: context.display_name })
                                    : contextKind(context) === 'event'
                                      ? t('Who can see it: whoever can see what is in {{name}}, as for everything in this event.', { name: context.display_name })
                                      : t('Who can see it: whoever can see what is in {{name}}, as for everything in this group.', { name: context.display_name })
                                : t('Who can see it: whoever can see what is in the place it goes in.')}
                        </p>
                    ) : (
                        <div className="settings-field">
                            <label htmlFor={`${id}-audience`}>{t('Who can see it')}</label>
                            <select id={`${id}-audience`} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                                {AUDIENCES.map((a) => (
                                    <option key={a.value} value={a.value}>
                                        {a.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error ? (
                        <p className="error" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <div className="settings-actions">
                        <span className="muted small" aria-hidden="true">
                            {t('{{keys}} adds it', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                        </span>
                        <button type="submit" className="btn btn-primary" aria-disabled={sending || upload?.status === 'uploading' || undefined} aria-busy={sending || undefined} aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}>
                            {t('Add video')}
                        </button>
                    </div>
                </form>
            </div>
        </Pane>
    );
}
