import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import type { ContextAction } from '../../components/context-actions';
import { Dialog } from '../../components/dialog';
import { ensureOk, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import type { MenuEntry } from '../../lib/native-menu';
import './site-more.css';

export type SiteAction = Schema<'ProfileAction'>;

export const profileActionsKey = (id: string) => ['profile-actions', id] as const;

/**
 * The site's own More of a profile's or a context's page, of what the app does (GET
 * /profiles/{id}/actions: Report, Edit Profile), asked for once the page is shown. Until it is
 * here (or when it fails) the More has the app's own items only.
 */
export function useSiteActions(id: string, enabled: boolean): SiteAction[] {
    const { api } = useApp();
    const query = useQuery({
        queryKey: profileActionsKey(id),
        queryFn: async () => unwrap(await api.GET('/profiles/{id}/actions', { params: { path: { id } } })),
        enabled,
        retry: false,
        staleTime: 60_000,
    });
    return query.data ?? [];
}

/**
 * The menu entries of the site's items, in the site's order: Report opens the report dialog
 * (Reported, off, once the viewer has), Edit Profile the profile's editor. `skip` leaves out the
 * actions the page shows already (one's own Edit profile in the hero).
 */
export function siteMoreEntries(items: readonly SiteAction[], on: { report: (item: SiteAction) => void; edit: () => void }, skip: readonly SiteAction['action'][] = []): MenuEntry[] {
    const out: MenuEntry[] = [];
    for (const item of items) {
        if (skip.includes(item.action)) continue;
        if (item.action === 'report') out.push(item.done ? { text: t('Reported'), enabled: false, run: () => undefined } : { text: `${item.title}…`, run: () => on.report(item) });
        else if (item.action === 'edit') out.push({ text: item.title, run: on.edit });
    }
    return out;
}

/** The app's own entries after the site's, with a line between when both are there. */
export function joinEntries(site: MenuEntry[], own: MenuEntry[]): MenuEntry[] {
    return site.length && own.length ? [...site, 'separator', ...own] : [...site, ...own];
}

/**
 * The More of a hero (a profile's or a context's page), next to its actions: an ellipsis button
 * that opens the menu, drawn in the hero and, once docked, in the toolbar (components/context-actions).
 */
export function moreAction(owner: string, name: string, entries: () => MenuEntry[]): ContextAction {
    return { key: 'more', label: t('More'), name: t('More for {{name}}', { name }), icon: 'ellipsis', menu: { owner, title: name, entries } };
}

/** A reason as the site writes it ("spam"), with a capital to start a choice's label. */
function reasonText(title: string): string {
    return title ? title.charAt(0).toLocaleUpperCase() + title.slice(1) : title;
}

const NOTE_MAX = 1000;

export type ReportTarget = { id: string; name: string; choices: NonNullable<SiteAction['choices']> };

/**
 * Report a profile or a context to the site's moderators (POST /profiles/{id}/report), in a
 * small modal dialog: one of the site's reasons and a note. Esc or Cancel closes it, focus goes
 * back to what opened it (the More button), and a report sent is said there (`onDone`).
 */
export function ReportDialog({ target, onClose, onDone }: { target: ReportTarget | null; onClose: () => void; onDone: (text: string) => void }) {
    const titleId = useId();
    const open = target !== null;

    return (
        <Dialog open={open} onClose={onClose} className="dialog report-dialog" labelledBy={titleId}>
            {target ? <ReportForm key={target.id} target={target} titleId={titleId} onClose={onClose} onDone={onDone} /> : null}
        </Dialog>
    );
}

function ReportForm({ target, titleId, onClose, onDone }: { target: ReportTarget; titleId: string; onClose: () => void; onDone: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    const first = useRef<HTMLInputElement>(null);

    useEffect(() => first.current?.focus(), []);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy) return;
        if (!reason) {
            setError(t('Choose why you report it.'));
            first.current?.focus();
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const text = note.trim();
            ensureOk(await api.POST('/profiles/{id}/report', { params: { path: { id: target.id } }, body: text ? { type: reason, text } : { type: reason } }));
            void queryClient.invalidateQueries({ queryKey: profileActionsKey(target.id) });
            onDone(t('Reported {{name}}. The site’s moderators have it.', { name: target.name }));
            onClose();
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    };

    return (
        <form className="report-form" onSubmit={(e) => void submit(e)} onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), onClose())}>
            <div className="dialog-head">
                <h2 id={titleId}>{t('Report {{name}}', { name: target.name })}</h2>
                <button type="button" className="btn btn-quiet icon-btn" aria-label={t('Close')} onClick={onClose}>
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div className="dialog-body">
                <p className="muted small">{t('The site’s moderators get your report and your note; {{name}} is not told who sent it.', { name: target.name })}</p>
                <fieldset className="report-reasons" aria-describedby={error ? errorId : undefined} aria-invalid={error && !reason ? true : undefined}>
                    <legend>{t('Reason')}</legend>
                    {target.choices.map((c, i) => (
                        <label key={c.name} className="report-reason">
                            <input ref={i === 0 ? first : undefined} type="radio" name="report-reason" value={c.name} checked={reason === c.name} onChange={() => setReason(c.name)} />
                            <span>{reasonText(c.title)}</span>
                        </label>
                    ))}
                </fieldset>
                <label className="report-field">
                    <span>{t('Note for the moderators (optional)')}</span>
                    <textarea rows={3} value={note} maxLength={NOTE_MAX} dir="auto" onChange={(e) => setNote(e.target.value)} />
                </label>
                {error ? (
                    <p id={errorId} className="error" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="report-form-actions">
                    <button type="button" className="btn" onClick={onClose}>
                        {t('Cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" aria-disabled={busy || undefined} data-busy={busy || undefined} aria-busy={busy || undefined}>
                        <span>{t('Report')}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
