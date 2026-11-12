import { useId, useState } from 'react';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { RichEditor } from '../../components/rich-editor/rich-editor';
import { normalizeHtml } from '../../components/rich-editor/schema';
import type { Message } from './thread-cache';
import './message-editor.css';

/**
 * One's own reply edited in place, in its bubble (PATCH /conversations/{id}/messages/{id}, where
 * the site lets its author edit it: `can_edit`). The rich editor loads its HTML (mentions,
 * links); ⌘↩ (Ctrl+Enter) or Save saves, Esc or Cancel puts it away, asking first when that
 * throws a change away. Its photos stay as they are.
 */
export function MessageEditor({ conversationId, message, onDone }: { conversationId: string; message: Message; onDone: (saved: Message | null) => void }) {
    const { api } = useApp();
    const ids = useId();
    const [initial] = useState(() => normalizeHtml(message.body_html, 'mini'));
    const [value, setValue] = useState({ html: initial, text: message.body });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const changed = value.html !== initial;
    const empty = !value.text.trim();

    const save = async () => {
        if (busy) return;
        if (!changed) {
            onDone(null);
            return;
        }
        if (empty) {
            setError(t('The site needs text with every message.'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const saved = unwrap(await api.PATCH('/conversations/{id}/messages/{message_id}', { params: { path: { id: conversationId, message_id: message.id } }, body: { body: value.html } }));
            onDone(saved);
        } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
        }
    };

    const cancel = async () => {
        if (busy) return;
        if (changed && !(await confirmAction({ title: t('Discard your changes?'), message: t('The message stays as it was.'), okLabel: t('Discard') }))) return;
        onDone(null);
    };

    return (
        <div className="message-editor" role="group" aria-label={t('Edit your message')} data-own-keys="">
            <RichEditor
                mode="mini"
                value={value.html}
                rows={2}
                label={t('Message text')}
                autoFocus
                invalid={!!error}
                describedBy={[`${ids}-hint`, error ? `${ids}-error` : ''].filter(Boolean).join(' ')}
                readOnly={busy}
                images={{ refusal: t('Photos of a message are not changed here.') }}
                onChange={(html, text) => setValue({ html, text })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (isMac ? e.metaKey : e.ctrlKey)) {
                        void save();
                        return true;
                    }
                    if (e.key === 'Escape') {
                        void cancel();
                        return true;
                    }
                    return false;
                }}
            />
            {error ? (
                <p id={`${ids}-error`} className="error small" role="alert">
                    {error}
                </p>
            ) : null}
            <div className="message-editor-row">
                <span id={`${ids}-hint`} className="muted small">
                    {t('{{keys}} saves, Esc cancels', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                </span>
                <button type="button" className="btn small" onClick={() => void cancel()} aria-disabled={busy || undefined}>
                    {t('Cancel')}
                </button>
                <button type="button" className="btn btn-primary small" onClick={() => void save()} aria-disabled={busy || undefined} aria-busy={busy || undefined} aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}>
                    {t('Save')}
                </button>
            </div>
        </div>
    );
}
