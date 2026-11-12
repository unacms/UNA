import { useQueryClient } from '@tanstack/react-query';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import {
    type ClipboardEvent,
    createContext,
    type DragEvent,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type { Schema } from 'una-api';

import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { type Audience, useDraft, useDraftKey } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot } from '../../lib/idempotency';
import { inApp } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { linksIn, textToRichHtml } from '../../lib/rich-html';
import { makeUploader, type Staging, type Uploader, windowDropsClaimed } from '../../lib/uploads';
import { useAudiences, useSiteHasTag } from '../../lib/site-modules';
import { closeModal, openModal } from '../../components/dialog';
import { Icon } from '../../components/icon';
import { isOverDropTarget } from '../../components/rich-editor/images';
import { RichEditor, type RichEditorHandle } from '../../components/rich-editor/rich-editor';
import { prependToFeed } from '../feed/cache';
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_MAX_LENGTH } from '../polls/polls';
import { AttachmentTray } from './attachment-tray';
import { draftMedia, fromDraft, MAX_ATTACHMENTS, mediaIds, postBlocker, useAttachments } from './attachments';
import { AudiencePicker, ContextPicker, isAudience, usePostContexts } from './pickers';
import { groupFeedKey } from '../groups/groups';

/** The longest question a poll takes, in characters. */
const QUESTION_MAX = 5000;

/** The new post's text box: Cmd+N puts the cursor there. */
export const NEW_POST_FIELD = 'new-post';
const ADD_MEDIA_BUTTON = 'compose-add-media';

type ComposeValue = {
    /**
     * Open the sheet, with these files attached (a drop), posting into this group or other
     * context; `poll` opens it asking a question (a context's New poll).
     */
    open: (staging?: Staging, contextId?: string, options?: { poll?: boolean }) => void;
    isOpen: boolean;
};

const ComposeContext = createContext<ComposeValue | null>(null);

/** The compose sheet's controls; null outside a ComposeProvider. */
export function useCompose(): ComposeValue | null {
    return useContext(ComposeContext);
}

type SheetHandle = { add: (staging: Staging) => void; setContext: (contextId: string) => void; setPoll: (on: boolean) => void };

/**
 * The compose sheet of the signed-in window, and what opens it: Cmd+N (the shell), Home's
 * "What's new?" and files dropped on the window. Its text, audience and uploads are a lasting
 * draft: closing the sheet, or the app, keeps them.
 */
export function ComposeProvider({ children, uploader }: { children: ReactNode; uploader?: Uploader }) {
    const { siteUrl, me } = useApp();
    // UNA profiles are separate identities: the sheet starts over for each (its text, audience,
    // uploads and lasting draft), so one's draft is never shown, saved or posted as the other
    const identity = `${siteUrl}|${me.active_profile_id}`;
    const [isOpen, setOpen] = useState(false);
    const [openFor, setOpenFor] = useState(identity);
    if (openFor !== identity) {
        setOpenFor(identity);
        setOpen(false);
    }
    const sheet = useRef<SheetHandle>(null);
    const [said, setSaid] = useState<{ text: string; seq: number }>({ text: '', seq: 0 });
    const sayOutside = useCallback((text: string) => setSaid((s) => ({ text, seq: s.seq + 1 })), []);

    const open = useCallback((staging?: Staging, contextId?: string, options?: { poll?: boolean }) => {
        setOpen(true);
        if (staging) sheet.current?.add(staging);
        if (contextId) sheet.current?.setContext(contextId);
        if (options?.poll) sheet.current?.setPoll(true);
    }, []);
    const value = useMemo(() => ({ open, isOpen }), [open, isOpen]);

    return (
        <ComposeContext.Provider value={value}>
            {children}
            <ComposeSheet key={identity} ref={sheet} open={isOpen} onClose={() => setOpen(false)} uploader={uploader} sayOutside={sayOutside} onDropFiles={open} />
            <p className="sr-only" role="status" aria-live="polite">
                {said.text ? <span key={said.seq}>{said.text}</span> : null}
            </p>
        </ComposeContext.Provider>
    );
}

type SheetProps = {
    ref: RefObject<SheetHandle | null>;
    open: boolean;
    onClose: () => void;
    uploader?: Uploader;
    /** Said after the sheet closed (posted, draft kept): a region outside the modal. */
    sayOutside: (text: string) => void;
    /** Files dropped on the window while the sheet was closed. */
    onDropFiles: (staging: Staging) => void;
};

function ComposeSheet({ ref, open, onClose, uploader: given, sayOutside, onDropFiles }: SheetProps) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const dialog = useRef<HTMLDialogElement>(null);
    const returnTo = useRef<HTMLElement | null>(null);
    // a post just sent closes the sheet with nothing kept: "Posted" is what is said
    const posted = useRef(false);
    const uploader = useMemo(() => given ?? makeUploader(api), [given, api]);

    // the text as the site keeps it (mini HTML) and as plain text (a poll's question, what is empty)
    const [content, setContent] = useState({ html: '', text: '' });
    const text = content.text;
    const setText = (html: string, plain = '') => setContent({ html, text: plain });
    const editor = useRef<RichEditorHandle>(null);
    const [audience, setAudience] = useState<Audience>('public');
    const [contextId, setContextId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [said, setSaid] = useState<{ text: string; seq: number }>({ text: '', seq: 0 });
    const say = useCallback((words: string) => setSaid((s) => ({ text: words, seq: s.seq + 1 })), []);
    const { contexts, unavailable: contextGone } = usePostContexts(contextId);
    // a context one can no longer post in (a draft's group one left) is not sent: the picker would
    // show Your timeline while the post went into the group, so the post goes to the timeline now
    if (contextGone) {
        setContextId(null);
        say(t('The group this post was for is not one you can post in now. It goes to your timeline.'));
    }

    const attachments = useAttachments({ uploader, api, announce: say });
    const { add, reset, restore } = attachments;
    // a poll instead of a post: the text is its question, with its answers (POST /polls), where
    // the site has Polls and the chosen context takes them
    const sitePolls = useSiteHasTag('polls') === true;
    const pollAudiences = useAudiences('polls');
    const [poll, setPoll] = useState(false);
    const [answers, setAnswers] = useState<string[]>(['', '']);
    const [hiddenResults, setHiddenResults] = useState(false);
    const focusAnswer = useRef<number | null>(null);
    // the Idempotency-Key a post or poll went with: sending the same again after an answer that
    // never came gets the site's first answer, not a second post; cleared once it is posted
    const sent = useRef<IdempotencySlot['current']>(null);
    useImperativeHandle(ref, () => ({ add, setContext: setContextId, setPoll: (on: boolean) => setPoll(on) }), [add]);

    // the lasting draft: read once, then kept as it changes
    const draft = useDraft(useDraftKey('feed'));
    const [restored, setRestored] = useState(false);
    if (!restored && draft.loaded !== undefined) {
        setRestored(true);
        const d = draft.loaded;
        if (d && !text) {
            setContent({ html: d.html ?? textToRichHtml(d.text), text: d.text });
            if (isAudience(d.audience)) setAudience(d.audience);
            setContextId(d.contextId ?? null);
        }
    }
    useEffect(() => {
        // checked with the site: one it deleted meanwhile leaves the tray, and that is said
        if (restored && draft.loaded?.media?.length) restore(fromDraft(draft.loaded.media));
        // only the draft read at start brings uploads back
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restored]);

    const media = draftMedia(attachments.items);
    const mediaKey = media.map((m) => m.media.id).join(',');
    const { save } = draft;
    useEffect(() => {
        if (!restored) return;
        save({ text, html: content.html, audience, contextId, media });
        // media is new each render: its ids say when it changed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restored, text, content.html, audience, contextId, mediaKey, save]);

    // open and close the modal dialog with `open`; focus goes back to what opened it
    useLayoutEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open) {
            if (d.open) return;
            posted.current = false;
            returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            openModal(d);
            editor.current?.focus('end');
            return;
        }
        if (d.open) closeModal(d);
        const back = returnTo.current;
        returnTo.current = null;
        if (back?.isConnected && !back.closest('[inert], [hidden]')) back.focus();
    }, [open]);

    // while a post is sent the sheet stays open, so what the site answers is seen and heard
    const sending = useRef(false);
    const close = useCallback(() => {
        if (sending.current && !posted.current) return;
        onClose();
        setDragging(false);
    }, [onClose]);

    // Esc closes the dialog itself (cancel, then close): not while sending; keep React's state in step
    const hasDraft = !!text.trim() || attachments.items.length > 0;
    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        const onCancel = (e: Event) => {
            if (sending.current) e.preventDefault();
        };
        const onDialogClose = () => {
            // a sheet closed anyway while sending (the web view may force it): the outcome is
            // said outside it, not 'Draft kept'
            if (!posted.current && hasDraft && !sending.current) sayOutside(t('Draft kept'));
            posted.current = false;
            if (sending.current) sending.current = false;
            onClose();
            setDragging(false);
        };
        d.addEventListener('cancel', onCancel);
        d.addEventListener('close', onDialogClose);
        return () => {
            d.removeEventListener('cancel', onCancel);
            d.removeEventListener('close', onDialogClose);
        };
    }, [onClose, hasDraft, sayOutside]);

    // files dropped on the app window: Rust saw the drop and stages those paths only
    useEffect(() => {
        if (!inApp) return;
        let stop: (() => void) | null = null;
        let live = true;
        void getCurrentWebview()
            .onDragDropEvent((e) => {
                const p = e.payload;
                // a new video's form takes the drop instead, and a text box that takes drops (a
                // message's) the ones over it
                if (windowDropsClaimed() || ('position' in p && isOverDropTarget(p.position))) return;
                if (p.type === 'enter') setDragging(true);
                else if (p.type === 'leave') setDragging(false);
                else if (p.type === 'drop') {
                    setDragging(false);
                    void uploader.fromPaths(p.paths).then((staging) => {
                        if (staging.files.length || staging.refused.length) onDropFiles(staging);
                    });
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
            stop?.();
        };
    }, [uploader, onDropFiles]);

    const addFiles = (files: File[]) => {
        if (!files.length) return;
        void uploader.fromFiles(files).then(add);
    };

    const onPaste = (e: ClipboardEvent) => {
        const files = Array.from(e.clipboardData.files);
        if (!files.length) return;
        e.preventDefault();
        addFiles(files);
    };

    // a drop in a plain browser (the app gets drops from Rust instead)
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
                  addFiles(Array.from(e.dataTransfer.files));
              },
          };

    const pick = () => {
        uploader.pick().then(add, (e: unknown) => setError(errorMessage(e)));
    };

    const chosenContext = contextId ? (contexts.find((c) => c.id === contextId) as (Schema<'Profile'> & { content_kinds?: string[] }) | undefined) : undefined;
    // a context that says what goes in it and has no polls; the site decides for one that does not say
    const pollsRefused = !!chosenContext?.content_kinds && !chosenContext.content_kinds.includes('polls');
    const pollMode = poll && sitePolls;
    const filled = answers.map((a) => a.trim()).filter(Boolean);
    const blocker = pollMode && [...text].length > QUESTION_MAX ? tn(QUESTION_MAX, 'A question has at most {{count}} character.', 'A question has at most {{count}} characters.') : pollMode ? pollBlocker({ pollsRefused, contextName: chosenContext?.display_name, audienceOk: !!contextId || pollAudiences.includes(audience), attached: attachments.items.length, question: text.trim(), filled }) : postBlocker(attachments.items);
    // a poll's empty question is a blocker, which says why Post poll is off
    const links = useMemo(() => linksIn(content.html), [content.html]);
    const empty = !pollMode && !text.trim() && !mediaIds(attachments.items).length;
    const canPost = !busy && !blocker && !empty;
    useLayoutEffect(() => {
        const i = focusAnswer.current;
        if (i === null) return;
        focusAnswer.current = null;
        document.getElementById(`compose-answer-${i}`)?.focus();
    });
    const setAnswer = (i: number, value: string) => setAnswers((all) => all.map((a, j) => (j === i ? value : a)));
    const addAnswer = () => {
        if (answers.length >= MAX_OPTIONS) return;
        focusAnswer.current = answers.length;
        setAnswers((all) => [...all, '']);
    };
    const removeAnswer = (i: number) => {
        focusAnswer.current = Math.min(i, answers.length - 2);
        setAnswers((all) => all.filter((_, j) => j !== i));
        say(t('Answer {{number}} removed', { number: i + 1 }));
    };
    const togglePoll = () => {
        const next = !poll;
        setPoll(next);
        say(next ? t('Poll: the text is its question, the answers follow it') : t('Poll removed'));
        if (next) focusAnswer.current = 0;
    };

    const sendPoll = async () => {
        const body: Schema<'NewPoll'> = { question: text.trim(), options: filled, hidden_results: hiddenResults };
        if (contextId) body.context_id = contextId;
        else body.audience = audience as NonNullable<Schema<'NewPoll'>['audience']>;
        const created = unwrap(await api.POST('/polls', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/polls', body]) } }, body }));
        // its feed item, on top of Following (and the group's feed) as a post's goes
        const itemId = created.content_id;
        if (itemId) {
            const res = await api.GET('/activities/{id}', { params: { path: { id: itemId } } });
            if (res.data) {
                prependToFeed(queryClient, ['feed', 'following'], res.data);
                if (contextId) prependToFeed(queryClient, groupFeedKey(contextId), res.data);
            }
        }
        await queryClient.invalidateQueries(['polls', 'list']);
    };

    const send = async () => {
        if (!canPost || sending.current) return;
        sending.current = true;
        setBusy(true);
        setError(null);
        try {
            if (pollMode) await sendPoll();
            else {
                const ids = mediaIds(attachments.items);
                const body: Schema<'NewFeedPost'> = contextId ? { context_id: contextId } : { audience };
                if (text.trim() && content.html) body.body_html = content.html;
                if (ids.length) body.media_ids = ids;
                // the text's links get their previews, as the site's post form attaches them
                if (links.length) body.links = links;
                const created = unwrap(await api.POST('/feed-posts', { params: { header: { 'Idempotency-Key': idempotencyKeyFor(sent, ['/feed-posts', body]) } }, body }));
                // Your own post goes on top of Following at once (and of its polled first page,
                // so showing new posts keeps it); other feeds load it when next shown.
                prependToFeed(queryClient, ['feed', 'following'], created);
                // and on top of the group's feed, when it went into one
                if (contextId) prependToFeed(queryClient, groupFeedKey(contextId), created);
            }
            await queryClient.invalidateQueries({
                predicate: (q) =>
                    (q.queryKey[0] === 'feed' && q.queryKey[1] !== 'following' && !(contextId && q.queryKey[1] === 'profile' && q.queryKey[2] === contextId)) ||
                    q.queryKey[0] === 'feed-head',
                refetchType: 'none',
            });
            sent.current = null;
            draft.clear();
            const wasOpen = !!dialog.current?.open;
            posted.current = wasOpen;
            setText('');
            setContextId(null);
            reset();
            const wasPoll = pollMode;
            setPoll(false);
            setAnswers(['', '']);
            setHiddenResults(false);
            close();
            sayOutside(wasPoll ? t('Poll posted') : t('Posted'));
        } catch (e) {
            const message = errorMessage(e);
            setError(!pollMode && e instanceof ApiError && e.status === 422 && ids422(message) ? t('{{reason}}. Remove the attachments the site no longer has and add them again.', { reason: message }) : message);
            // the sheet was closed meanwhile: the error would be in a closed dialog
            if (!dialog.current?.open) sayOutside(pollMode ? t('Your poll was not sent: {{reason}}. It is kept as a draft.', { reason: message }) : t('Your post was not sent: {{reason}}. It is kept as a draft.', { reason: message }));
        } finally {
            sending.current = false;
            setBusy(false);
        }
    };

    const blockerId = 'compose-blocker';
    return (
        <dialog
            ref={dialog}
            className={`compose-sheet${dragging ? ' dragging' : ''}`}
            aria-labelledby="compose-title"
            onPaste={onPaste}
            {...dropProps}
        >
            <form
                className="compose-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                }}
            >
                <header className="compose-head">
                    <h2 id="compose-title">{pollMode ? t('New poll') : t('New post')}</h2>
                    <button type="button" className="btn btn-quiet small" onClick={close} aria-disabled={busy || undefined} aria-keyshortcuts="Escape">
                        {t('Close')}
                    </button>
                </header>
                <RichEditor
                    ref={editor}
                    mode="mini"
                    id={NEW_POST_FIELD}
                    value={content.html}
                    rows={5}
                    placeholder={pollMode ? t('Ask a question') : t("What's new?")}
                    label={pollMode ? t('Question') : t("What's new?")}
                    describedBy={links.length && !pollMode ? 'compose-hint compose-links' : 'compose-hint'}
                    // a poll's question is plain text
                    mentions={!pollMode}
                    images={pollMode ? { uploader, refusal: t('A poll takes no photos or videos here.') } : { uploader, attach: add }}
                    announce={say}
                    onChange={setText}
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return false;
                        void send();
                        return true;
                    }}
                    // not disabled while it sends: a disabled box would drop focus to the page
                    readOnly={busy}
                />
                {pollMode ? (
                    <fieldset className="compose-poll" aria-describedby="compose-poll-hint">
                        <legend className="small strong">{t('Answers')}</legend>
                        <p id="compose-poll-hint" className="muted small">
                            {tn(MAX_OPTIONS, '{{min}} to {{count}} answer. People choose one, and can’t change it.', '{{min}} to {{count}} answers. People choose one, and can’t change it.', { min: MIN_OPTIONS })}
                        </p>
                        <ol className="compose-answers">
                            {answers.map((a, i) => (
                                <li key={i} className="compose-answer">
                                    <input
                                        id={`compose-answer-${i}`}
                                        type="text"
                                        value={a}
                                        maxLength={OPTION_MAX_LENGTH}
                                        placeholder={t('Answer {{number}}', { number: i + 1 })}
                                        aria-label={t('Answer {{number}}', { number: i + 1 })}
                                        readOnly={busy}
                                        onChange={(e) => setAnswer(i, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key !== 'Enter') return;
                                            e.preventDefault();
                                            if (e.metaKey || e.ctrlKey) void send();
                                            // the next answer, or a new one at the end
                                            else if (i + 1 < answers.length) document.getElementById(`compose-answer-${i + 1}`)?.focus();
                                            else addAnswer();
                                        }}
                                    />
                                    {answers.length > MIN_OPTIONS ? (
                                        <button type="button" className="btn btn-quiet small" aria-label={t('Remove answer {{number}}', { number: i + 1 })} onClick={() => removeAnswer(i)}>
                                            <Icon name="x" size={14} />
                                        </button>
                                    ) : null}
                                </li>
                            ))}
                        </ol>
                        <div className="compose-poll-foot">
                            {answers.length < MAX_OPTIONS ? (
                                <button type="button" className="btn small" onClick={addAnswer}>
                                    {t('Add answer')}
                                </button>
                            ) : null}
                            <label className="compose-poll-check small">
                                <input type="checkbox" checked={hiddenResults} onChange={(e) => setHiddenResults(e.target.checked)} />
                                {t('Show results only to people who voted')}
                            </label>
                        </div>
                    </fieldset>
                ) : null}
                {!pollMode && links.length ? (
                    <p id="compose-links" className="muted small compose-links">
                        {tn(links.length, 'A preview of this link is added: {{links}}', 'Previews of these links are added: {{links}}', { links: links.map((l) => hostOf(l)).join(', ') })}
                    </p>
                ) : null}
                <AttachmentTray items={attachments.items} onRemove={attachments.remove} onRetry={attachments.retry} fallbackFocusId={ADD_MEDIA_BUTTON} />
                {dragging ? (
                    <p className="compose-drop" aria-hidden="true">
                        {t('Drop photos or videos to attach them')}
                    </p>
                ) : null}
                {error ? (
                    <p className="error" role="alert">
                        {error}
                    </p>
                ) : null}
                <footer className="compose-foot">
                    <button
                        type="button"
                        id={ADD_MEDIA_BUTTON}
                        className="btn"
                        onClick={pick}
                        disabled={attachments.items.length >= MAX_ATTACHMENTS || pollMode}
                    >
                        {t('Add photos or videos')}
                    </button>
                    {sitePolls ? (
                        <button type="button" className="btn" aria-pressed={pollMode} onClick={togglePoll} disabled={busy}>
                            <Icon name="vote" size={16} />
                            {t('Poll')}
                        </button>
                    ) : null}
                    <ContextPicker id="compose-context" contexts={contexts} value={contextId} onChange={setContextId} />
                    <AudiencePicker id="compose-audience" value={audience} onChange={setAudience} disabled={!!contextId} />
                    <span id="compose-hint" className="muted small compose-hint">
                        {t('{{keys}} to post; paste or drop photos to attach them', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                    </span>
                    {blocker ? (
                        <span id={blockerId} className="muted small">
                            {blocker}
                        </span>
                    ) : null}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!canPost}
                        aria-busy={busy}
                        aria-describedby={blocker ? blockerId : undefined}
                        aria-keyshortcuts="Meta+Enter Control+Enter"
                    >
                        {pollMode ? t('Post poll') : t('Post', { context: 'verb' })}
                    </button>
                </footer>
                <p className="sr-only" role="status" aria-live="polite">
                    {said.text ? <span key={said.seq}>{said.text}</span> : null}
                </p>
            </form>
        </dialog>
    );
}

/**
 * Why a poll can't be posted yet, or null: the context takes no polls, the audience is one the
 * site's Polls don't offer, photos are attached (a poll takes none here), there is no question
 * yet, an answer is given twice, or fewer than two answers are filled in.
 */
export function pollBlocker({ pollsRefused, contextName, audienceOk, attached, question, filled }: { pollsRefused: boolean; contextName?: string; audienceOk: boolean; attached: number; question: string; filled: readonly string[] }): string | null {
    if (pollsRefused) return contextName === undefined ? t('Polls can’t be added in this group.') : t('Polls can’t be added in {{name}}.', { name: contextName });
    if (!audienceOk) return t('Polls on this site can’t have this audience. Choose another one.');
    if (attached) return t('A poll takes no photos or videos here. Remove them, or post them on their own.');
    if (!question) return t('Ask a question first.');
    if (new Set(filled.map((a) => a.toLocaleLowerCase())).size !== filled.length) return t('Each answer can be given once.');
    if (filled.length < MIN_OPTIONS) return tn(MIN_OPTIONS, 'Add at least {{count}} answer.', 'Add at least {{count}} answers.');
    return null;
}

/** The site refused the post's media ids (an upload it deleted meanwhile). */
function ids422(message: string): boolean {
    return /upload/i.test(message);
}

/** A link's host, for saying which links get previews. */
function hostOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}
