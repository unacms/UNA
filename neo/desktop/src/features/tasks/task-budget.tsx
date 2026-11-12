import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useId, useState } from 'react';

import { longTime } from '../../components/activity-card';
import { Dialog } from '../../components/dialog';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { Tooltip } from '../../components/tooltip';
import { ago, ApiError } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { confirmAction } from '../../lib/native';
import { Pane, paneHeadingId } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import {
    addBudgetEntry,
    BUDGET_QUERY_MAX,
    budgetEntriesKey,
    budgetKey,
    type BudgetEntry,
    changeBudgetEntry,
    deleteBudgetEntry,
    entryHoursText,
    entryText,
    fetchBudget,
    fetchBudgetEntries,
    hoursProblem,
    hoursText,
    NOTE_MAX,
    parseHours,
    percentText,
    spentShare,
    spentText,
    type TaskBudget,
} from './budget';
import { useTaskContexts } from './task-board';

/** The value, once it has stayed the same for `ms`: a search sent as one stops typing. */
function useSettled<T>(value: T, ms = 250): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const id = window.setTimeout(() => setSettled(value), ms);
        return () => window.clearTimeout(id);
    }, [value, ms]);
    return settled;
}

/**
 * The summary, as the site's Budget summary: what remains (its share of the total as a pill), a
 * bar of what is spent (a progressbar named and valued in words, and over budget said in text,
 * not by its colour alone), then the total and what is spent.
 */
function BudgetSummary({ budget }: { budget: TaskBudget }) {
    const titleId = useId();
    const over = budget.remaining_seconds < 0;
    const share = spentShare(budget);
    return (
        <section className="budget-summary card" aria-labelledby={titleId}>
            <h2 id={titleId} className="budget-summary-title">
                {t('Summary', { context: 'budget' })}
            </h2>
            <div className="budget-remaining">
                <div className="budget-remaining-main">
                    <span className="budget-label">
                        <Icon name="wallet" size={16} />
                        {over ? t('Over budget') : t('Remaining')}
                    </span>
                    <span className="budget-figure" data-over={over || undefined}>
                        {hoursText(Math.abs(budget.remaining_seconds))}
                    </span>
                </div>
                {budget.remaining_percent !== null ? (
                    <span className="budget-pill" data-over={over || undefined}>
                        {rich(over ? t('<sr>Over by </sr>{{percent}}', { percent: percentText(Math.abs(budget.remaining_percent)) }) : t('<sr>Remaining: </sr>{{percent}}', { percent: percentText(Math.abs(budget.remaining_percent)) }), {
                            sr: (text) => <span className="sr-only">{text}</span>,
                        })}
                    </span>
                ) : null}
            </div>
            <div
                className="budget-bar"
                role="progressbar"
                aria-label={t('Budget spent')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(share)}
                aria-valuetext={spentText(budget)}
                data-over={over || undefined}
            >
                <span style={{ width: `${share}%` }} />
            </div>
            <dl className="budget-stats">
                <div>
                    <dt>{t('Total')}</dt>
                    <dd>{hoursText(budget.total_seconds)}</dd>
                </div>
                <div>
                    <dt>{t('Spent')}</dt>
                    <dd>{hoursText(budget.spent_seconds)}</dd>
                </div>
            </dl>
            {budget.total_seconds <= 0 ? <p className="muted small">{t('No hours budgeted yet: add an entry to set the budget.')}</p> : null}
        </section>
    );
}

type Editing = { entry: BudgetEntry | null };

/**
 * Add or change an entry, in a small modal dialog: whole hours (fewer than 0 take hours off) and
 * a note. Checked before it is sent as the site checks it; what the site refuses is said in it.
 * Esc or Cancel closes it, and focus goes back to what opened it.
 */
function BudgetEntryDialog({ editing, contextId, onClose, announce }: { editing: Editing | null; contextId: string; onClose: () => void; announce: (text: string) => void }) {
    const titleId = useId();
    const open = editing !== null;

    return (
        <Dialog open={open} onClose={onClose} className="dialog budget-dialog" labelledBy={titleId}>
            {editing ? <EntryForm key={editing.entry?.id ?? 'new'} entry={editing.entry} contextId={contextId} titleId={titleId} onClose={onClose} announce={announce} /> : null}
        </Dialog>
    );
}

/** The dialog's form, made anew for each entry it opens on (its fields start from the entry). */
function EntryForm({ entry, contextId, titleId, onClose, announce }: { entry: BudgetEntry | null; contextId: string; titleId: string; onClose: () => void; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [hours, setHours] = useState(entry ? String(entry.hours) : '');
    const [note, setNote] = useState(entry?.note ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hintId = useId();
    const errorId = useId();

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy) return;
        const problem = hoursProblem(hours);
        if (problem) {
            setError(problem);
            return;
        }
        const n = parseHours(hours)!;
        const said = entryText({ hours: n, note: note.trim() || null });
        setBusy(true);
        setError(null);
        try {
            if (entry) {
                await changeBudgetEntry(api, queryClient, entry, n, note);
                announce(t('Saved the entry: {{entry}}', { entry: said }));
            } else {
                await addBudgetEntry(api, queryClient, contextId, n, note);
                announce(t('Added to the budget: {{entry}}', { entry: said }));
            }
            onClose();
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    };

    return (
        <form className="budget-form" onSubmit={(e) => void submit(e)} onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), onClose())}>
            <div className="dialog-head">
                <h2 id={titleId}>{entry ? t('Edit entry') : t('Add entry')}</h2>
                <button type="button" className="btn btn-quiet icon-btn" aria-label={t('Close')} onClick={onClose}>
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div className="dialog-body">
                <label className="budget-field">
                    <span>{t('Hours')}</span>
                    {/* the dialog opens to type how many */}
                    <input
                        type="text"
                        inputMode="numeric"
                        value={hours}
                        autoFocus
                        autoComplete="off"
                        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                        aria-invalid={error ? true : undefined}
                        onChange={(e) => setHours(e.target.value)}
                    />
                </label>
                <span id={hintId} className="small muted budget-hint">
                    {t('Whole hours added to the budget; a negative number, as -4, takes hours off')}
                </span>
                <label className="budget-field">
                    <span>{t('Note')}</span>
                    <textarea rows={3} value={note} maxLength={NOTE_MAX} dir="auto" onChange={(e) => setNote(e.target.value)} />
                </label>
                {error ? (
                    <p id={errorId} className="error" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="budget-form-actions">
                    <button type="button" className="btn" onClick={onClose}>
                        {t('Cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" aria-disabled={busy || undefined} data-busy={busy || undefined} aria-busy={busy || undefined}>
                        <span>{entry ? t('Save') : t('Add entry')}</span>
                    </button>
                </div>
            </div>
        </form>
    );
}

/** An entry: who added it, when, its note and its hours, with Edit and Delete where the viewer may. */
function BudgetRow({ entry, onEdit, onDelete }: { entry: BudgetEntry; onEdit: (entry: BudgetEntry) => void; onDelete: (entry: BudgetEntry) => void }) {
    const what = entryText(entry);
    return (
        <li className="list-row budget-row">
            <ProfileAvatar profile={entry.author} size={36} />
            <div className="list-main">
                <span className="budget-row-head">
                    {entry.author ? <ProfileName profile={entry.author} className="strong" /> : <strong className="muted">{t('Someone')}</strong>}
                    <time className="row-sub" dateTime={entry.created_at} title={longTime(entry.created_at)}>
                        {ago(entry.created_at)}
                    </time>
                </span>
                {entry.note ? (
                    <span className="budget-note" dir="auto">
                        {entry.note}
                    </span>
                ) : null}
            </div>
            <span className="budget-hours" data-negative={entry.hours < 0 || undefined}>
                {entryHoursText(entry.hours)}
            </span>
            <div className="row-actions">
                {entry.can_edit ? (
                    <Tooltip text={t('Edit')}>
                        <button type="button" className="tb-btn" aria-label={t('Edit entry: {{entry}}', { entry: what })} onClick={() => onEdit(entry)}>
                            <Icon name="pencil" size={16} />
                        </button>
                    </Tooltip>
                ) : null}
                {entry.can_delete ? (
                    <Tooltip text={t('Delete')}>
                        <button type="button" className="tb-btn" aria-label={t('Delete entry: {{entry}}', { entry: what })} onClick={() => onDelete(entry)}>
                            <Icon name="trash-2" size={16} />
                        </button>
                    </Tooltip>
                ) : null}
            </div>
        </li>
    );
}

/**
 * A context's budget (the site's Budget page of its Tasks): time, in hours. The summary (what
 * remains, a bar of what is spent, the total and the spent time: the time logged on its tasks),
 * then its entries, the newest first, which a search keeps to those whose note has the words;
 * Add entry (the toolbar's +), and Edit and Delete on each (Delete asks first). Only the
 * context's administrators see it: anyone else is told so.
 */
export function TaskBudgetView({ contextId }: { contextId: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [announcement, announce] = useAnnouncer();
    const [search, setSearch] = useState('');
    const q = useSettled(search.trim());
    const [editing, setEditing] = useState<Editing | null>(null);
    const searchId = useId();

    const contexts = useTaskContexts();
    // the sidebar's contexts already say whether the viewer may see it: no request for the entries then
    const allowed = contexts.data?.find((c) => c.context.id === contextId)?.can_view_budget;
    const budget = useQuery({ queryKey: budgetKey(contextId), queryFn: () => fetchBudget(api, contextId) });
    const refused = (e: unknown) => e instanceof ApiError && (e.status === 403 || e.status === 404);
    const entries = useInfiniteQuery({
        queryKey: budgetEntriesKey(contextId, q),
        queryFn: ({ pageParam }) => fetchBudgetEntries(api, contextId, q, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        keepPreviousData: true,
        // the sidebar has them already, as a rule
        enabled: (contexts.isFetched || contexts.isError) && allowed !== false && !refused(budget.error),
    });
    const denied = allowed === false || refused(budget.error) || refused(entries.error);
    const context = budget.data?.context ?? contexts.data?.find((c) => c.context.id === contextId)?.context ?? null;
    const items = entries.data?.pages.flatMap((p) => p.items) ?? [];
    const canAdd = !!budget.data?.can_add;

    const remove = async (entry: BudgetEntry) => {
        const what = entryText(entry);
        if (!(await confirmAction({ title: t('Delete this entry?'), message: t("{{entry}}. Its hours come off the budget's total. This can't be undone.", { entry: what }), okLabel: t('Delete') }))) return;
        try {
            await deleteBudgetEntry(api, queryClient, entry);
            announce(t('Deleted the entry: {{entry}}', { entry: what }));
            // its row and buttons are gone: focus to the pane's heading
            requestAnimationFrame(() => document.getElementById(paneHeadingId('list'))?.focus());
        } catch (e) {
            announce(t('Could not delete the entry: {{reason}}', { reason: errorMessage(e) }));
        }
    };

    const actions = canAdd ? (
        <Tooltip text={t('Add entry')}>
            <button type="button" className="tb-btn" aria-label={t('Add budget entry')} aria-haspopup="dialog" onClick={() => setEditing({ entry: null })}>
                <Icon name="plus" />
            </button>
        </Tooltip>
    ) : null;
    const searching = q !== '';
    return (
        <Pane pane="list" title={t('Budget')} subtitle={context?.display_name} ready={!budget.isLoading && !entries.isLoading} busy={budget.isLoading} actions={actions}>
            <div className="budget-view">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {budget.isLoading ? <SkeletonRows loading shape="row" count={2} /> : null}
                {denied ? (
                    <EmptyState icon="lock" title={t('Only the administrators of this context see its budget')} />
                ) : budget.isError ? (
                    <InlineError message={errorMessage(budget.error)} onRetry={() => void budget.refetch()} busy={budget.isFetching} />
                ) : null}
                {budget.data ? <BudgetSummary budget={budget.data} /> : null}
                {!denied ? (
                    <section className="budget-entries" aria-labelledby={`${searchId}-title`}>
                        <div className="budget-entries-head">
                            <h2 id={`${searchId}-title`} className="budget-summary-title">
                                {t('Entries')}
                            </h2>
                            <form role="search" className="budget-search" onSubmit={(e) => e.preventDefault()}>
                                <label htmlFor={searchId} className="sr-only">
                                    {t('Search the notes of the entries')}
                                </label>
                                <Icon name="search" size={14} />
                                <input
                                    id={searchId}
                                    className="search-input"
                                    type="search"
                                    dir="auto"
                                    placeholder={t('Search notes')}
                                    maxLength={BUDGET_QUERY_MAX}
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape' && search) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSearch('');
                                        }
                                    }}
                                />
                            </form>
                        </div>
                        <SkeletonRows loading={entries.isLoading} />
                        {entries.isError ? <InlineError message={errorMessage(entries.error)} onRetry={() => void entries.refetch()} busy={entries.isFetching} /> : null}
                        <EmptyState
                            shown={entries.isSuccess && !items.length}
                            icon={searching ? 'search-x' : 'wallet'}
                            title={searching ? t('No entries match') : t('No entries yet')}
                            hint={searching ? t('No note has these words.') : t('Each entry adds hours to the budget; time logged on the tasks here is spent from it.')}
                            actions={
                                !searching && canAdd ? (
                                    <button type="button" className="btn btn-primary" aria-haspopup="dialog" onClick={() => setEditing({ entry: null })}>
                                        {t('Add entry')}
                                    </button>
                                ) : undefined
                            }
                        />
                        {items.length ? (
                            <ul className="list budget-list" aria-label={searching ? t('Entries whose note matches, the newest first') : t('Entries, the newest first')}>
                                {items.map((e) => (
                                    <BudgetRow key={e.id} entry={e} onEdit={(entry) => setEditing({ entry })} onDelete={(entry) => void remove(entry)} />
                                ))}
                            </ul>
                        ) : null}
                        {entries.hasNextPage ? (
                            <button type="button" className="btn btn-wide" onClick={() => void entries.fetchNextPage()} aria-disabled={entries.isFetching || undefined} aria-busy={entries.isFetchingNextPage || undefined}>
                                {t('More entries')}
                            </button>
                        ) : null}
                    </section>
                ) : null}
            </div>
            <BudgetEntryDialog editing={editing} contextId={contextId} onClose={() => setEditing(null)} announce={announce} />
        </Pane>
    );
}
