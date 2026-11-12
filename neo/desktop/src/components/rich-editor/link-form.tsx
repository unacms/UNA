import type { Editor } from '@tiptap/core';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { t } from '../../lib/i18n';
import { isAllowedHref } from '../../lib/rich-html';

/** What was typed as a link: a web address (https:// added to a bare domain) or an email; null when it is neither. */
export function normalizeHref(typed: string): string | null {
    const text = typed.trim();
    if (!text) return null;
    if (isAllowedHref(text)) return text;
    if (/^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i.test(text)) return `mailto:${text}`;
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}([/?#]\S*)?$/i.test(text)) return `https://${text}`;
    return null;
}

/**
 * ⌘K's form under the text: the link's address for the selected words (or, with none
 * selected, the address put in as its own text), the link under the caret edited or removed.
 * Enter adds it, Esc goes back to the text without it.
 */
export function LinkForm({ editor, onClose, announce }: { editor: Editor; onClose: () => void; announce: (text: string) => void }) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const current = editor.getAttributes('link').href as string | undefined;
    const [href, setHref] = useState(current ?? '');
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        input.current?.focus();
        input.current?.select();
    }, []);

    const apply = () => {
        const url = normalizeHref(href);
        if (!url) {
            setError(t('Type a web address, such as https://example.com, or an email address.'));
            input.current?.focus();
            return;
        }
        const { empty } = editor.state.selection;
        const chain = editor.chain().focus();
        if (empty && !editor.isActive('link')) chain.insertContent({ type: 'text', text: href.trim(), marks: [{ type: 'link', attrs: { href: url } }] }).run();
        else chain.extendMarkRange('link').setLink({ href: url }).run();
        announce(current ? t('Link changed') : t('Link added'));
        onClose();
    };

    const remove = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        announce(t('Link removed'));
        onClose();
    };

    return (
        <div
            className="rich-link-form"
            role="group"
            aria-labelledby={`${id}-label`}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    // the form's, not the dialog's or the pane's
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                } else if (e.key === 'Enter' && e.target === input.current) {
                    // not the composer's form: that would send it
                    e.preventDefault();
                    e.stopPropagation();
                    apply();
                }
            }}
        >
            <label id={`${id}-label`} htmlFor={`${id}-href`} className="small strong">
                {t('Link address')}
            </label>
            <input
                ref={input}
                id={`${id}-href`}
                type="url"
                inputMode="url"
                value={href}
                placeholder="https://" // i18n-ok: the start of an address
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(e) => {
                    setHref(e.target.value);
                    setError(null);
                }}
            />
            <div className="rich-link-buttons">
                <button type="button" className="btn btn-primary small" onClick={apply}>
                    {current ? t('Save link') : t('Add link')}
                </button>
                {current ? (
                    <button type="button" className="btn small" onClick={remove}>
                        {t('Remove link')}
                    </button>
                ) : null}
                <button type="button" className="btn btn-quiet small" onClick={onClose}>
                    {t('Cancel')}
                </button>
            </div>
            {error ? (
                <p id={`${id}-error`} className="error small" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
