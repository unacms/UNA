import { type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { Icon } from '../../components/icon';
import { RichEditor, type RichEditorHandle } from '../../components/rich-editor/rich-editor';
import { Tooltip } from '../../components/tooltip';
import { useApp } from '../../lib/context';
import { type Draft, useDraft } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { platform } from '../../lib/platform';
import { textToRichHtml } from '../../lib/rich-html';
import { useSettings } from '../../lib/settings';
import { makeUploader, photoUploader, type Uploader } from '../../lib/uploads';
import { AttachmentTray } from '../compose/attachment-tray';
import { draftMedia, fromDraft, mediaIds, postBlocker, useAttachments } from '../compose/attachments';

type Props = {
    /** The text box's id, for focusing it from elsewhere (r in a conversation). */
    id?: string;
    placeholder: string;
    submitLabel?: string;
    /** Where the photos go: a reply (`message`) or the message that starts a conversation. */
    purpose: 'message' | 'conversation';
    /** A lasting draft (lib/drafts.ts) of the text, the finished uploads and `recipients`. */
    draftKey: string | null;
    autoFocus?: boolean;
    /** Kept with the draft: a new conversation's recipients. */
    recipients?: Schema<'Profile'>[];
    /** The draft once read, before the box shows it (a new conversation takes its recipients). */
    onRestore?: (draft: Draft) => void;
    /** Why it can't be sent yet, from outside the box (nobody to send it to). */
    blocker?: string | null;
    /**
     * Send it: the text as the site keeps it (mini HTML: mentions, links) with the uploads, and
     * the plain text; the box empties once this resolves, and keeps everything when it throws.
     */
    onSend: (html: string, mediaIds: string[], text: string) => Promise<unknown>;
    announce: (text: string) => void;
    /** Tests give their own; the app makes the one for where it runs. */
    uploader?: Uploader;
};

type SendKeyEvent = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'altKey'> & { metaKey?: boolean; ctrlKey?: boolean; isComposing?: boolean; keyCode?: number };

/**
 * Enter sends, Shift+Enter starts a new line; Cmd/Ctrl+Enter sends too. With Settings' "Send
 * messages with ⌘↩" (`cmdEnter`) Enter starts a new line and only Cmd+Enter (Ctrl+Enter on
 * Windows and Linux) sends. Never while an IME composes: WebKit (the macOS and Linux web views)
 * ends the composition before the keydown of the Enter that accepts a candidate, so that keydown
 * has isComposing false, but keyCode 229.
 */
export function isSendKey(e: SendKeyEvent, cmdEnter = false, mac = platform.mac): boolean {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.isComposing || e.keyCode === 229) return false;
    if (!cmdEnter) return true;
    return mac ? !!e.metaKey : !!e.ctrlKey;
}

/** The line under the field: which key sends. */
export function sendHint(cmdEnter: boolean, mac = platform.mac): string {
    return cmdEnter ? t('{{keys}} sends, Enter starts a new line', { keys: mac ? '⌘↩' : 'Ctrl+Enter' }) : t('Enter sends, Shift+Enter starts a new line');
}

/**
 * The box under a conversation: text (the rich editor, mini mode: links, mentions, hashtags),
 * photos (picked, pasted, or dropped on the box) with their uploads, and Send. The site needs
 * text with every message, so photos alone wait for a few words.
 */
export function MessageComposer({ id, placeholder, submitLabel = t('Send'), purpose, draftKey, autoFocus, recipients, onRestore, blocker: outside, onSend, announce, uploader: given }: Props) {
    const { api } = useApp();
    const uploader = useMemo(() => photoUploader(given ?? makeUploader(api), purpose), [given, api, purpose]);
    const attachments = useAttachments({ uploader, api, announce, forMessage: true });
    const { add, reset, restore, wait, staging } = attachments;
    // the box makes pasted and dropped files ready with this one: they count as on their way
    // into the tray from then, so a message is not sent without them (`staging`)
    const boxUploader = useMemo<Uploader>(
        () => ({ ...uploader, fromFiles: (...args: Parameters<Uploader['fromFiles']>) => wait(uploader.fromFiles(...args)), fromPaths: (...args: Parameters<Uploader['fromPaths']>) => wait(uploader.fromPaths(...args)) }),
        [uploader, wait],
    );
    // Send was pressed while files were on their way into the tray: it waits, and says so until
    // the tray shows them
    const [waitingWith, setWaitingWith] = useState<{ items: typeof attachments.items; settled: number } | null>(null);
    const waiting = waitingWith?.items === attachments.items && waitingWith.settled === attachments.settled;
    const hintId = useId();
    const { sendWithCmdEnter } = useSettings();
    const addId = `${useId()}-add`;

    const [content, setContent] = useState({ html: '', text: '' });
    const text = content.text;
    const setText = (plain: string, html?: string) => setContent({ html: html ?? textToRichHtml(plain), text: plain.trim() });
    const [busy, setBusy] = useState(false);
    const box = useRef<RichEditorHandle>(null);
    // one send at a time, before the busy state renders (a double click)
    const sending = useRef(false);
    const [error, setError] = useState<string | null>(null);

    // the lasting draft of this key, once read; another key starts over with its own
    const lasting = useDraft(draftKey);
    const [restoredFor, setRestoredFor] = useState<{ key: string | null } | null>(null);
    if (lasting.loaded !== undefined && restoredFor?.key !== draftKey) {
        setRestoredFor({ key: draftKey });
        const d = lasting.loaded;
        setText(d?.text ?? '', d?.html);
    }
    const restored = restoredFor?.key === draftKey && lasting.loaded !== undefined;
    useEffect(() => {
        // checked with the site: an upload it deleted meanwhile leaves the tray, and that is said
        if (!restored) return;
        if (lasting.loaded) onRestore?.(lasting.loaded);
        if (lasting.loaded?.media?.length) restore(fromDraft(lasting.loaded.media));
        else reset();
        // only the draft read for this key brings uploads back
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restored, draftKey]);

    const media = draftMedia(attachments.items);
    const mediaKey = media.map((m) => m.media.id).join(',');
    const recipientsKey = recipients?.map((r) => r.id).join(',') ?? '';
    const { save } = lasting;
    useEffect(() => {
        if (!restored) return;
        save({ text, html: content.html, media, ...(recipients ? { recipients } : {}) });
        // media and recipients are new each render: their ids say when they changed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restored, text, content.html, mediaKey, recipientsKey, save]);

    const uploads = postBlocker(attachments.items);
    const ids = mediaIds(attachments.items);
    const needsText = !text.trim() && ids.length > 0 ? t('Add a few words: the site needs text with every message') : null;
    const blocker = outside ?? uploads ?? needsText;
    const canSend = !busy && !blocker && !!text.trim();

    const send = useCallback(async () => {
        if (!canSend || sending.current) return;
        // photos on their way into the tray: the message would go without them
        if (staging()) {
            setWaitingWith({ items: attachments.items, settled: attachments.settled });
            announce(t('Wait until the uploads are done'));
            return;
        }
        sending.current = true;
        setBusy(true);
        setError(null);
        try {
            await onSend(content.html, ids, text);
            setText('');
            reset();
            lasting.clear();
            // sent from the button (or anywhere): the next message is typed here; a box that went
            // with its pane (a new conversation becomes the conversation) has nothing to focus
            box.current?.focus();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            sending.current = false;
            setBusy(false);
        }
    }, [canSend, onSend, text, content.html, ids, reset, lasting, staging, announce, attachments.items, attachments.settled]);

    const onKeyDown = (e: globalThis.KeyboardEvent): boolean => {
        if (!isSendKey(e, sendWithCmdEnter)) return false;
        if (canSend) void send();
        else if (blocker && text.trim()) announce(blocker);
        return true;
    };

    return (
        <form
            className="composer message-composer"
            onSubmit={(e) => {
                e.preventDefault();
                void send();
            }}
        >
            <AttachmentTray items={attachments.items} onRemove={attachments.remove} onRetry={attachments.retry} fallbackFocusId={addId} />
            <div className="message-composer-row">
                <Tooltip text={t('Add photos')}>
                    <button type="button" id={addId} className="tb-btn" aria-label={t('Add photos')} onClick={() => wait(uploader.pick()).then(add, (e: unknown) => setError(errorMessage(e)))}>
                        <Icon name="image-plus" />
                    </button>
                </Tooltip>
                <RichEditor
                    ref={box}
                    mode="mini"
                    id={id}
                    value={content.html}
                    rows={1}
                    placeholder={placeholder}
                    label={placeholder}
                    describedBy={hintId}
                    autoFocus={autoFocus}
                    images={{ uploader: boxUploader, attach: add }}
                    windowDrops
                    announce={announce}
                    onChange={(html, plain) => setContent({ html, text: plain })}
                    onKeyDown={onKeyDown}
                />
                {/* never disabled: a focused button that is disabled drops focus to the page (send() ignores it while busy) */}
                <button className="send-circle" type="submit" aria-label={submitLabel} aria-disabled={!canSend || undefined} aria-busy={busy || undefined}>
                    <Icon name="arrow-up" strong />
                </button>
            </div>
            <p id={hintId} className="message-composer-hint">
                {blocker && (text.trim() || ids.length) ? blocker : waiting ? t('Wait until the uploads are done') : sendHint(sendWithCmdEnter)}
            </p>
            {error ? (
                <p className="error" role="alert">
                    {error}
                </p>
            ) : null}
        </form>
    );
}
