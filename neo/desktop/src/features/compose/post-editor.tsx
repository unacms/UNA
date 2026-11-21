import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';

import type { Schema } from 'una-api';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import type { Audience } from '../../lib/drafts';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { docToHtml, docToText } from '../../lib/rich-html';
import { loadedEditor, RichEditor, useEditor, withEditor } from '../../components/rich-editor/lazy';
import { putActivity } from '../feed/cache';
import { AudiencePicker, isAudience } from './pickers';
import { isEditableHtml } from './post-text';

type Activity = Schema<'Activity'>;

// "Edit" on a post in a list opens it in the thread pane with the editor open
const requested = new Set<string>();

/** The event a thread pane already showing the post opens its editor on. */
export const EDIT_POST_EVENT = 'una:edit-post';

/** Open the editor of this post in its thread pane: the one shown now, or the next one. */
export function requestEdit(activityId: string): void {
    requested.add(activityId);
    window.dispatchEvent(new CustomEvent<string>(EDIT_POST_EVENT, { detail: activityId }));
}

/** Whether "Edit" was pressed for this post on its way to the thread pane (once). */
export function takeEditRequest(activityId: string): boolean {
    return requested.delete(activityId);
}

/** A post's stored HTML as the editor writes it back (so an untouched text is no change). */
export function editedHtml(stored: string): string {
    return docToHtml(loadedEditor().htmlToDoc(stored, 'mini'), 'mini');
}

/**
 * What the editor would send: only what changed. `html` is the text as the editor wrote it
 * (null when its text can't be edited here); a text with nothing in it is not sent.
 */
export function postChanges(
    activity: Activity,
    next: { html: string | null; audience: Audience | null },
): Schema<'FeedPostChanges'> {
    const item = activity.object;
    const body: Schema<'FeedPostChanges'> = {};
    if (next.html !== null && docToText(loadedEditor().htmlToDoc(next.html, 'mini'))) {
        if (next.html !== editedHtml(item.card.body_html ?? '')) body.body_html = next.html;
    }
    if (next.audience !== null && next.audience !== item.audience) body.audience = next.audience;
    return body;
}

/**
 * One's own post edited in place, in the thread pane: its text in the rich editor (mini mode:
 * links, mentions and hashtags stay as they were; a post with markup the editor would lose,
 * written on the site, keeps its text and only its audience changes here) and who can see it
 * (not for a post in a group or event, which decides that).
 * Cmd/Ctrl+Enter saves, Esc or Cancel puts it away (asking first when that throws changes away).
 */
export const PostEditor = withEditor(PostEditorForm);

function PostEditorForm({ activity, onDone }: Readonly<{ activity: Activity; onDone: (saved: boolean) => void }>) {
    const { htmlToDoc } = useEditor();
    const { api } = useApp();
    const queryClient = useQueryClient();
    const item = activity.object;
    const html = item.card.body_html ?? '';
    const plain = isEditableHtml(html, 'mini');
    const [original] = useState(() => (plain ? editedHtml(html) : ''));
    const originalText = plain ? docToText(htmlToDoc(original, 'mini')) : '';
    const inContext = item.audience === 'context';
    const [value, setValue] = useState({ html: original, text: originalText });
    const text = value.text;
    const [audience, setAudience] = useState<Audience>(isAudience(item.audience) ? item.audience : 'public');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ids = useId();

    const changes = postChanges(activity, { html: plain ? value.html : null, audience: inContext ? null : audience });
    const changed = Object.keys(changes).length > 0;
    const emptyNote = plain ? emptyTextNote(text, originalText, item.media.length > 0) : null;
    const empty = emptyNote !== null;

    // without a text box, focus goes to what can be changed (who sees it), or else to the note
    // saying why: the Edit button that had it is gone (WCAG 2.4.3)
    useEffect(() => {
        if (plain) return;
        const target = document.getElementById(inContext ? `${ids}-note` : `${ids}-audience`);
        target?.focus();
    }, [plain, inContext, ids]);

    const save = async () => {
        if (busy || empty) return;
        if (!changed) {
            onDone(false);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const saved = unwrap(await api.PATCH('/feed-posts/{id}', { params: { path: { id: activity.id } }, body: changes }));
            putActivity(queryClient, saved);
            onDone(true);
        } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
        }
    };

    const cancel = async () => {
        if (changed) {
            const discard = await confirmAction({ title: t('Discard your changes?'), message: t('The post stays as it was.'), okLabel: t('Discard') });
            if (!discard) return;
        }
        onDone(false);
    };

    return (
        <form
            className="composer post-editor"
            aria-label={t('Edit the post')}
            aria-describedby={plain ? undefined : `${ids}-note`}
            // single keys are the editor's while focus is in it, on its buttons too: l, c or r
            // never act on the post, and Esc puts the editor away (asking first) instead of
            // closing the pane under it (OWN_KEYS_ATTR, lib/shortcuts.ts)
            data-own-keys=""
            onSubmit={(e) => {
                e.preventDefault();
                void save();
            }}
            onKeyDown={(e) => editorKeys(e, save, busy ? null : cancel)}
        >
            {plain ? (
                <RichEditor
                    mode="mini"
                    value={value.html}
                    rows={3}
                    label={t('Post text')}
                    invalid={empty || !!error}
                    describedBy={[error ? `${ids}-error` : '', emptyNote ? `${ids}-empty` : ''].filter(Boolean).join(' ') || undefined}
                    autoFocus
                    onChange={(h, plainText) => setValue({ html: h, text: plainText })}
                    readOnly={busy}
                />
            ) : (
                <p className="muted small" id={`${ids}-note`} tabIndex={-1}>
                    {t('This post has links, mentions or formatting that editing here would remove. Edit its text on the site; here you can change who sees it.')}
                </p>
            )}
            {emptyNote ? (
                <p id={`${ids}-empty`} className="muted small">
                    {emptyNote}
                </p>
            ) : null}
            {error ? (
                <p id={`${ids}-error`} className="error" role="alert">
                    {error}
                </p>
            ) : null}
            <EditorRow audienceId={`${ids}-audience`} inContext={inContext} audience={audience} onAudience={setAudience} busy={busy} canSave={!empty && (plain || !inContext)} onCancel={() => void cancel()} />
        </form>
    );
}

/**
 * Why the text can't be saved as it is, or null: no text is no post, unless it has media; and
 * text it had is not taken off here (the edit would keep it: the site keeps a post's text unless
 * it is given new text).
 */
function emptyTextNote(text: string, originalText: string, hasMedia: boolean): string | null {
    if (text.trim() || (hasMedia && !originalText.trim())) return null;
    return hasMedia ? t('The text can’t be removed here: write new text, or remove it on the site.') : t('Write something to save the post.');
}

/** Cmd/Ctrl+Enter saves; Esc puts the editor away (when it can), never the pane under it. */
function editorKeys(e: KeyboardEvent, save: () => Promise<void>, cancel: (() => Promise<void>) | null): void {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void save();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (cancel) void cancel();
    }
}

type EditorRowProps = {
    audienceId: string;
    /** A post in a group or event: who sees it is theirs to decide. */
    inContext: boolean;
    audience: Audience;
    onAudience: (audience: Audience) => void;
    busy: boolean;
    canSave: boolean;
    onCancel: () => void;
};

/** The editor's last row: who sees the post, the keys hint, Cancel and Save. */
function EditorRow({ audienceId, inContext, audience, onAudience, busy, canSave, onCancel }: Readonly<EditorRowProps>) {
    return (
        <div className="composer-row">
            {inContext ? <span className="muted small">{t('The group or event decides who sees it')}</span> : <AudiencePicker id={audienceId} value={audience} onChange={onAudience} />}
            <span className="muted small" aria-hidden="true">
                {t('{{keys}} to save', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
            </span>
            <div className="composer-buttons">
                <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={busy}>
                    {t('Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy || !canSave} aria-busy={busy} aria-keyshortcuts="Meta+Enter Control+Enter">
                    {t('Save')}
                </button>
            </div>
        </div>
    );
}
