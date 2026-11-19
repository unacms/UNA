import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { loadedEditor, RichEditor, useEditor, withEditor } from '../../components/rich-editor/lazy';

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
export const CommentComposer = withEditor(CommentComposerForm);

type Content = { html: string; text: string };

/** Mini HTML with its plain text. */
const contentOf = (html: string): Content => ({ html, text: plainOf(html) });

/**
 * The box's text: its draft, else what is being edited. A lasting draft comes in once read,
 * unless something was typed already; a new key (another profile) starts over with that key's
 * draft, never keeping the other one's text.
 */
function useComposerText(startHtml: string, draft: string | undefined, draftKey: string | null, onTextChange: Props['onTextChange']) {
    const [content, setContent] = useState<Content>(() => contentOf(draft || startHtml));
    const lasting = useDraft(draftKey);
    const [restoredFor, setRestoredFor] = useState<{ key: string | null } | null>(null);
    if (lasting.loaded !== undefined && restoredFor?.key !== draftKey) {
        const first = restoredFor === null;
        setRestoredFor({ key: draftKey });
        const kept = lasting.loaded?.text ?? '';
        const keptHtml = kept ? (lasting.loaded?.html ?? textToRichHtml(kept)) : null;
        // the first read only fills an untouched box; a new key takes its draft, or the start
        let next: string | null = keptHtml ?? startHtml;
        if (first) next = keptHtml && content.html === startHtml && !draft ? keptHtml : null;
        if (next !== null) {
            const restored = contentOf(next);
            setContent(restored);
            onTextChange?.(restored.html, restored.text);
        }
    }
    const setText = (html: string, text: string) => {
        setContent({ html, text });
        onTextChange?.(html, text);
        if (draftKey) lasting.save({ text, html });
    };
    const clear = () => {
        setContent({ html: textToRichHtml(''), text: '' });
        onTextChange?.('', '');
        lasting.clear();
    };
    return { content, setText, clear };
}

/** Cmd/Ctrl+Enter sends; Esc cancels when the box can be put away. True when the key was the box's. */
function composerKeys(e: KeyboardEvent, submit: () => void, onCancel: (() => void) | undefined): boolean {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        submit();
        return true;
    }
    if (e.key === 'Escape' && onCancel) {
        onCancel();
        return true;
    }
    return false;
}

const SEND_KEYS = isMac ? '⌘↩' : 'Ctrl+Enter';

function CommentComposerForm({ label, submitLabel, onSubmit, onCancel, initialHtml, initialText = '', draft, onTextChange, draftKey = null, autoFocus, id, rows = 2, docked = false, asText = (name) => t('Commenting as {{name}}', { name }), sendLabel = t('Send comment') }: Readonly<Props>) {
    const { normalizeHtml } = useEditor();
    // what is being edited, as the editor writes it back
    const startHtml = useMemo(() => (initialHtml !== undefined ? normalizeHtml(initialHtml, 'mini') : textToRichHtml(initialText)), [initialHtml, initialText, normalizeHtml]);
    const editing = initialHtml !== undefined || initialText !== '';
    const { content, setText, clear } = useComposerText(startHtml, draft, draftKey, onTextChange);
    const text = content.text.trim();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    const hintId = useId();
    const blocked = !text || busy || (editing && content.html === startHtml);

    const submit = async () => {
        if (blocked) return;
        setBusy(true);
        setError(null);
        try {
            await onSubmit(text, content.html);
            clear();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };
    const onFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        void submit();
    };

    // an edit or a draft starts with the caret after the text (the editor's start)
    const field = (
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
            onKeyDown={(e) => composerKeys(e, () => void submit(), onCancel)}
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
        return <DockedComposer field={field} errorText={errorText} empty={!text} busy={busy} hintId={hintId} asText={asText} sendLabel={sendLabel} onSubmit={onFormSubmit} />;
    }
    return (
        <form className="composer comment-composer" onSubmit={onFormSubmit}>
            {field}
            {errorText}
            <div className="composer-row">
                <span className="composer-hint" aria-hidden="true">
                    {t('{{keys}} to send', { keys: SEND_KEYS })}
                </span>
                <div className="composer-buttons">
                    {onCancel ? (
                        <button type="button" className="btn" onClick={onCancel} disabled={busy}>
                            {t('Cancel')}
                        </button>
                    ) : null}
                    <button className="btn btn-primary" type="submit" disabled={blocked} aria-busy={busy} aria-keyshortcuts="Meta+Enter Control+Enter">
                        {submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
}

type DockedProps = {
    field: ReactNode;
    errorText: ReactNode;
    empty: boolean;
    busy: boolean;
    hintId: string;
    asText: (name: string) => string;
    sendLabel: string;
    onSubmit: (e: FormEvent) => void;
};

/**
 * The post's own box under its comments: who writes it above the field (a reply or an edit is
 * under one's own name already), the send button a circle beside it, a hint under it.
 */
function DockedComposer({ field, errorText, empty, busy, hintId, asText, sendLabel, onSubmit }: Readonly<DockedProps>) {
    const { me } = useApp();
    const writer = me.profiles.find((p) => p.id === me.active_profile_id) ?? null;
    return (
        <form className="comment-composer docked" onSubmit={onSubmit}>
            {writer ? <p className="composer-as">{asText(writer.display_name)}</p> : null}
            <div className="composer-field-row">
                <Avatar profile={writer} size={24} />
                {field}
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
                {empty ? t('Write something to send · {{keys}} sends', { keys: SEND_KEYS }) : t('{{keys}} sends', { keys: SEND_KEYS })}
            </p>
            {errorText}
        </form>
    );
}

/** The plain text of mini HTML. */
function plainOf(html: string): string {
    return docToText(loadedEditor().htmlToDoc(html, 'mini'));
}
