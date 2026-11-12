import { useId, useMemo, useState } from 'react';

import { RichEditor } from '../../components/rich-editor/rich-editor';
import { htmlToDoc, normalizeHtml } from '../../components/rich-editor/schema';

import { Icon } from '../../components/icon';
import { Avatar } from '../../components/avatar';
import { useApp } from '../../lib/context';
import { useDraft } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { isMac } from '../../lib/platform';
import { BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS, docToText, textToRichHtml } from '../../lib/rich-html';

type Props = {
    /** The text box's name for screen readers, also its placeholder. */
    label: string;
    submitLabel: string;
    /** Send it: its plain text and its HTML (mini mode: mentions, links, hashtags). */
    onSubmit: (text: string, html: string) => Promise<unknown>;
    /** A reply or an edit can be put away: Esc or Cancel calls this. */
    onCancel?: () => void;
    /** What is being edited, as the site keeps it: Save is off while the text is still this. */
    initialHtml?: string;
    /** What is being edited, as plain text, when there is no HTML. */
    initialText?: string;
    /** Unsent text (its HTML) to start with, kept from the last time this box was open. */
    draft?: string;
    /** Each change of the text, so the box's draft outlives it. */
    onTextChange?: (html: string, text: string) => void;
    /** A lasting draft (lib/drafts.ts) for a new comment or reply: kept across restarts, cleared once sent. */
    draftKey?: string | null;
    autoFocus?: boolean;
    /** The text box's id, so the post's Comment button can focus it. */
    id?: string;
    rows?: number;
    /**
     * The post's own box under its comments (spec 6.1): docked at the pane's bottom, who writes
     * it said above it, the send button a circle that stays focusable while empty and says why.
     */
    docked?: boolean;
    /** What the docked box says above the field, with the writer's name: "Commenting as Lily". */
    asText?: (name: string) => string;
    /** The name of the docked box's send button: "Send comment". */
    sendLabel?: string;
};

/**
 * Writing a comment, a reply or an edit, in the rich editor (mini mode: links, mentions and
 * hashtags; an edit loads the comment's HTML). Cmd/Ctrl+Enter sends; Esc cancels a reply or an
 * edit (in a text box Esc is the box's, so it never closes the pane). The text stays if sending
 * fails.
 */
export function CommentComposer({ label, submitLabel, onSubmit, onCancel, initialHtml, initialText = '', draft, onTextChange, draftKey = null, autoFocus, id, rows = 2, docked = false, asText = (name) => t('Commenting as {{name}}', { name }), sendLabel = t('Send comment') }: Props) {
    // what is being edited, as the editor writes it back
    const startHtml = useMemo(() => (initialHtml !== undefined ? normalizeHtml(initialHtml, 'mini') : textToRichHtml(initialText)), [initialHtml, initialText]);
    const editing = initialHtml !== undefined || initialText !== '';
    const [content, setContent] = useState(() => (draft ? { html: draft, text: plainOf(draft) } : { html: startHtml, text: plainOf(startHtml) }));
    const text = content.text;
    const setTextState = (plain: string, html?: string) => setContent({ html: html ?? textToRichHtml(plain), text: plain.trim() });
    const lasting = useDraft(draftKey);
    // the lasting draft comes in once read, unless something was typed already; a new key
    // (another profile) starts over with that key's draft, never keeping the other one's text
    const [restoredFor, setRestoredFor] = useState<{ key: string | null } | null>(null);
    if (lasting.loaded !== undefined && restoredFor?.key !== draftKey) {
        const first = restoredFor === null;
        setRestoredFor({ key: draftKey });
        const kept = lasting.loaded?.text ?? '';
        const keptHtml = lasting.loaded?.html;
        if (!first) {
            const html = kept ? (keptHtml ?? textToRichHtml(kept)) : startHtml;
            setContent({ html, text: plainOf(html) });
            onTextChange?.(html, plainOf(html));
        } else if (kept && content.html === startHtml && !draft) {
            const html = keptHtml ?? textToRichHtml(kept);
            setContent({ html, text: plainOf(html) });
            onTextChange?.(html, plainOf(html));
        }
    }
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    const hintId = useId();
    const { me } = useApp();
    // only the post's own box says who writes; a reply or an edit is under one's own name already
    const writer = docked ? (me.profiles.find((p) => p.id === me.active_profile_id) ?? null) : null;
    const unchanged = content.html === startHtml;
    const setText = (html: string, next: string) => {
        setContent({ html, text: next });
        onTextChange?.(html, next);
        if (draftKey) lasting.save({ text: next, html });
    };

    const submit = async () => {
        if (!text.trim() || busy || (editing && unchanged)) return;
        setBusy(true);
        setError(null);
        try {
            await onSubmit(text.trim(), content.html);
            setTextState('');
            onTextChange?.('', '');
            lasting.clear();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    // an edit or a draft starts with the caret after the text (the editor's start)
    const textarea = (
        <RichEditor
            mode="mini"
            id={id}
            value={content.html}
            rows={docked ? 1 : rows}
            label={label}
            placeholder={label}
            invalid={!!error}
            describedBy={[error ? errorId : null, docked ? hintId : null].filter(Boolean).join(' ') || undefined}
            autoFocus={autoFocus}
            mentions={BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS}
            images={{ refusal: t('Photos can’t be added to a comment here.') }}
            onChange={setText}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    void submit();
                    return true;
                }
                if (e.key === 'Escape' && onCancel) {
                    onCancel();
                    return true;
                }
                return false;
            }}
            // not disabled: a disabled box would drop focus to the page while it sends
            readOnly={busy}
        />
    );
    const errorText = error ? (
        <p id={errorId} className="error small" role="alert">
            {error}
        </p>
    ) : null;

    if (docked) {
        const empty = !text.trim();
        return (
            <form
                className="comment-composer docked"
                onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                }}
            >
                {writer ? (
                    <p className="composer-as">{asText(writer.display_name)}</p>
                ) : null}
                <div className="composer-field-row">
                    <Avatar profile={writer} size={24} />
                    {textarea}
                    {/* never disabled: a focused button that is disabled drops focus to the page; submit() ignores it */}
                    <button
                        className="send-circle"
                        type="submit"
                        aria-label={sendLabel}
                        aria-disabled={empty || busy || undefined}
                        aria-busy={busy || undefined}
                        aria-describedby={hintId}
                        aria-keyshortcuts="Meta+Enter Control+Enter"
                    >
                        <Icon name="arrow-up" strong />
                    </button>
                </div>
                <p id={hintId} className="composer-hint">
                    {empty ? t('Write something to send · {{keys}} sends', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' }) : t('{{keys}} sends', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                </p>
                {errorText}
            </form>
        );
    }

    return (
        <form
            className="composer comment-composer"
            onSubmit={(e) => {
                e.preventDefault();
                void submit();
            }}
        >
            {textarea}
            {errorText}
            <div className="composer-row">
                <span className="composer-hint" aria-hidden="true">
                    {t('{{keys}} to send', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                </span>
                <div className="composer-buttons">
                    {onCancel ? (
                        <button type="button" className="btn" onClick={onCancel} disabled={busy}>
                            {t('Cancel')}
                        </button>
                    ) : null}
                    <button className="btn btn-primary" type="submit" disabled={!text.trim() || busy || (editing && unchanged)} aria-busy={busy} aria-keyshortcuts="Meta+Enter Control+Enter">
                        {submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
}

/** The plain text of mini HTML. */
function plainOf(html: string): string {
    return docToText(htmlToDoc(html, 'mini'));
}
