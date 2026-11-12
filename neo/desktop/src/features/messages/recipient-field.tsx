import { useQuery } from '@tanstack/react-query';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import { Avatar } from '../../components/avatar';

type Profile = Schema<'Profile'>;

/** How long after the last key people are searched for. */
export const RECIPIENT_SEARCH_DELAY_MS = 200;
/** Recipients a conversation takes (NewConversation.recipients). */
export const MAX_RECIPIENTS = 50;

type Props = {
    /** The field's id (a label points at it; focus goes there). */
    id: string;
    label: string;
    value: readonly Profile[];
    onChange: (next: Profile[]) => void;
    /** Profiles that are not offered: the viewer's own, people already in the conversation. */
    exclude?: ReadonlySet<string>;
    autoFocus?: boolean;
    announce: (text: string) => void;
};

/** People found for the words, without those chosen or left out. */
export function offered(found: readonly Profile[], chosen: readonly Profile[], exclude: ReadonlySet<string> = new Set()): Profile[] {
    const taken = new Set(chosen.map((p) => p.id));
    return found.filter((p) => !taken.has(p.id) && !exclude.has(p.id) && (p.kind === 'person' || p.kind === 'organization'));
}

/**
 * Whom a new message goes to: the chosen people as chips (each with its Remove button), then a
 * field that finds people as one types (GET /search/profiles), as the ARIA combobox pattern:
 * ↓ ↑ move through the people found, Enter or a click adds one, Esc closes the list, and
 * Backspace in the empty field takes the last chip off. What happens is said politely.
 */
export function RecipientField({ id, label, value, onChange, exclude, autoFocus, announce }: Props) {
    const { api } = useApp();
    const listId = useId();
    const [words, setWords] = useState('');
    const [searched, setSearched] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const field = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const q = words.trim();
        const timer = setTimeout(() => setSearched(q), q ? RECIPIENT_SEARCH_DELAY_MS : 0);
        return () => clearTimeout(timer);
    }, [words]);

    const found = useQuery({
        queryKey: ['recipients', searched],
        queryFn: async () => unwrap(await api.GET('/search/profiles', { params: { query: { q: searched, limit: 8 } } })),
        enabled: searched.length > 0,
        staleTime: 30_000,
    });
    const options = searched && searched === words.trim() ? offered(found.data ?? [], value, exclude) : [];
    const showList = open && options.length > 0;
    const activeIndex = Math.min(active, Math.max(0, options.length - 1));
    const optionId = (i: number) => `${listId}-option-${i}`;

    const full = value.length >= MAX_RECIPIENTS;
    const choose = (p: Profile) => {
        if (full) {
            announce(tn(MAX_RECIPIENTS, 'A conversation takes up to {{count}} people', 'A conversation takes up to {{count}} people'));
            return;
        }
        onChange([...value, p]);
        setWords('');
        setSearched('');
        setOpen(false);
        setActive(0);
        announce(t('{{name}} added', { name: p.display_name }));
        field.current?.focus();
    };
    const remove = (p: Profile) => {
        onChange(value.filter((x) => x.id !== p.id));
        announce(t('{{name}} removed', { name: p.display_name }));
        field.current?.focus();
    };

    // a found list said once it is there
    const count = options.length;
    const status = !words.trim() ? '' : found.isFetching && !count ? t('Searching…') : searched === words.trim() && !found.isFetching ? (count ? tn(count, '{{count}} person found', '{{count}} people found') : t('Nobody found')) : '';

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!options.length) return;
            e.preventDefault();
            setOpen(true);
            setActive((i) => (Math.min(i, options.length - 1) + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
            return;
        }
        if (e.key === 'Enter') {
            const p = showList ? options[activeIndex] : undefined;
            // Enter never submits the form from here
            e.preventDefault();
            if (p) choose(p);
            return;
        }
        if (e.key === 'Escape' && showList) {
            // the list closes; the pane stays open
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            return;
        }
        if (e.key === 'Backspace' && !words) {
            const last = value[value.length - 1];
            if (last) {
                e.preventDefault();
                remove(last);
            }
        }
    };

    return (
        <div className="recipient-field">
            <label className="recipient-label" htmlFor={id}>
                {label}
            </label>
            <div className="recipient-box" onClick={(e) => e.target === e.currentTarget && field.current?.focus()}>
                {value.length ? (
                    <ul className="recipient-chips" aria-label={tn(value.length, '{{count}} recipient', '{{count}} recipients')}>
                        {value.map((p) => (
                            <li key={p.id} className="recipient-chip">
                                <Avatar profile={p} size={20} />
                                <span>{p.display_name}</span>
                                <button type="button" className="recipient-chip-remove" aria-label={t('Remove {{name}}', { name: p.display_name })} onClick={() => remove(p)}>
                                    <span aria-hidden="true">×</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
                <input
                    ref={field}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-activedescendant={showList ? optionId(activeIndex) : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus={autoFocus}
                    placeholder={value.length ? t('Add someone else') : t('Type a name')}
                    value={words}
                    maxLength={100}
                    onChange={(e) => {
                        setWords(e.target.value);
                        setOpen(true);
                        setActive(0);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onKeyDown}
                />
            </div>
            <ul id={listId} role="listbox" aria-label={t('People found')} className="recipient-options" hidden={!showList}>
                {options.map((p, i) => (
                    <li
                        key={p.id}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === activeIndex}
                        className="recipient-option"
                        // keep focus in the field: a mousedown on an option would blur it first
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(p)}
                        onMouseEnter={() => setActive(i)}
                    >
                        <Avatar profile={p} size={24} />
                        <span className="truncate">{p.display_name}</span>
                    </li>
                ))}
            </ul>
            <p className="sr-only" role="status" aria-live="polite">
                {status}
            </p>
        </div>
    );
}
