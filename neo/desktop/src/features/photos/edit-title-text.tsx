import { type FormEvent, useId, useState } from 'react';

import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { isMac } from '../../lib/platform';
import { textToHtml } from '../videos/videos';

/** The plain text of an entry's text (a textarea edits it as plain text). */
export function plainText(html: string | null | undefined): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const paragraphs = Array.from(doc.body.querySelectorAll('p'));
    return paragraphs.length ? paragraphs.map((p) => p.textContent ?? '').join('\n') : (doc.body.textContent ?? '');
}

/**
 * The form's name and what Discard says, as whole sentences by the noun the panes name (an id
 * here, never shown by itself): another language gives each noun its own gender and case. A noun
 * not listed gets the sentence with the noun put in.
 */
const EDIT_THE: Record<string, string> = {
    photo: t('Edit the photo'),
    album: t('Edit the album'),
    video: t('Edit the video'),
    file: t('Edit the file'),
};
const STAYS: Record<string, string> = {
    photo: t('The photo stays as it was.'),
    album: t('The album stays as it was.'),
    video: t('The video stays as it was.'),
    file: t('The file stays as it was.'),
};

/** What a save answers: the entry as the site has it now, or why it was not saved. */
export type SaveResult<T> = { saved: T } | { error: string };

/**
 * A photo's, album's or video's title and text in place (the text as plain text: links and
 * formatting are not kept). Only what changed is sent; Esc and Cancel ask first when that throws
 * changes away; Cmd+Enter (Ctrl+Enter) saves.
 */
export function EditTitleText<T>({ noun, title, html, save, onDone }: { noun: string; title: string; html: string | null | undefined; save: (body: { title?: string; text_html?: string }) => Promise<SaveResult<T>>; onDone: (saved: T | null) => void }) {
    const id = useId();
    const initial = { title, text: plainText(html) };
    const [value, setValue] = useState(initial);
    const [error, setError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState(false);
    const [saving, setSaving] = useState(false);
    const changed = value.title !== initial.title || value.text !== initial.text;

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (saving) return;
        if (!value.title.trim()) {
            setTitleError(true);
            document.getElementById(`${id}-title`)?.focus();
            return;
        }
        setTitleError(false);
        const body: { title?: string; text_html?: string } = {};
        if (value.title.trim() !== title) body.title = value.title.trim();
        if (value.text !== initial.text) body.text_html = textToHtml(value.text);
        if (!Object.keys(body).length) {
            onDone(null);
            return;
        }
        setSaving(true);
        setError(null);
        const result = await save(body);
        setSaving(false);
        if ('error' in result) {
            setError(result.error);
            return;
        }
        onDone(result.saved);
    };

    const cancel = async () => {
        if (saving) return;
        if (changed && !(await confirmAction({ title: t('Discard your changes?'), message: STAYS[noun] ?? t('The {{noun}} stays as it was.', { noun }), okLabel: t('Discard') }))) return;
        onDone(null);
    };

    return (
        <form
            className="settings-form discussion-form"
            aria-label={EDIT_THE[noun] ?? t('Edit the {{noun}}', { noun })}
            data-own-keys=""
            onSubmit={(e) => void submit(e)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (isMac ? e.metaKey : e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    void cancel();
                }
            }}
            noValidate
        >
            <div className="settings-field">
                <label htmlFor={`${id}-title`}>{t('Title')}</label>
                <input
                    id={`${id}-title`}
                    value={value.title}
                    maxLength={255}
                    required
                    dir="auto"
                    autoFocus
                    aria-invalid={titleError || undefined}
                    aria-describedby={titleError ? `${id}-title-error` : undefined}
                    onChange={(e) => setValue({ ...value, title: e.target.value })}
                />
                {titleError ? (
                    <p id={`${id}-title-error`} className="error small" role="alert">
                        {t('Give it a title.')}
                    </p>
                ) : null}
            </div>
            <div className="settings-field">
                <label htmlFor={`${id}-text`}>{t('Description')}</label>
                <textarea id={`${id}-text`} rows={5} value={value.text} maxLength={50000} dir="auto" aria-describedby={`${id}-text-hint`} onChange={(e) => setValue({ ...value, text: e.target.value })} />
                <p id={`${id}-text-hint`} className="small muted">
                    {t('Plain text; each line is a paragraph.')}
                </p>
            </div>
            {error ? (
                <p className="error" role="alert">
                    {error}
                </p>
            ) : null}
            <div className="settings-actions">
                <span className="muted small" aria-hidden="true">
                    {t('{{keys}} to save', { keys: isMac ? '⌘↩' : 'Ctrl+Enter' })}
                </span>
                <button type="button" className="btn" onClick={() => void cancel()}>
                    {t('Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" aria-disabled={saving || undefined} aria-busy={saving || undefined}>
                    {t('Save')}
                </button>
            </div>
        </form>
    );
}
