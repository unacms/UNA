/**
 * A context's budget (GET /task-contexts/{id}/budget and its entries): time, as the site's Tasks
 * module keeps it. Its entries add whole hours to its total (fewer than 0 take hours off), the
 * time logged on the context's tasks is what is spent. Only the context's administrators see it
 * (`TaskContext.can_view_budget`). Here: the query keys, the fetchers, the changes, and the
 * words and numbers in the viewer's locale.
 */
import type { QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { ensureOk, unwrap } from '../../lib/api';
import { locale, t, tn } from '../../lib/i18n';

export type TaskBudget = Schema<'TaskBudget'>;
export type BudgetEntry = Schema<'TaskBudgetEntry'>;
export type BudgetEntryPage = Schema<'Page_TaskBudgetEntry'>;

export const BUDGET_PAGE = 50;
/** As the site's budget form and API v2 take them. */
export const HOURS_MAX = 100_000;
export const NOTE_MAX = 2000;
export const BUDGET_QUERY_MAX = 100;

export const budgetKey = (contextId: string) => ['task-budget', contextId] as const;
/** A context's entries for a search (`''`: all of them); without `q`, every search's. */
export const budgetEntriesKey = (contextId: string, q?: string) => (q === undefined ? (['task-budget-entries', contextId] as const) : (['task-budget-entries', contextId, q] as const));

export async function fetchBudget(api: UnaApi, contextId: string): Promise<TaskBudget> {
    return unwrap(await api.GET('/task-contexts/{id}/budget', { params: { path: { id: contextId } } }));
}

export async function fetchBudgetEntries(api: UnaApi, contextId: string, q: string, cursor: string | undefined, limit = BUDGET_PAGE): Promise<BudgetEntryPage> {
    return unwrap(await api.GET('/task-contexts/{id}/budget/entries', { params: { path: { id: contextId }, query: { q: q || undefined, cursor, limit } } }));
}

/** After an entry is added, changed or deleted: the total and every search of the entries load again. */
function changed(queryClient: QueryClient, contextId: string): void {
    void queryClient.invalidateQueries({ queryKey: budgetKey(contextId) });
    void queryClient.invalidateQueries({ queryKey: budgetEntriesKey(contextId) });
}

export async function addBudgetEntry(api: UnaApi, queryClient: QueryClient, contextId: string, hours: number, note: string): Promise<BudgetEntry> {
    const entry = unwrap(await api.POST('/task-contexts/{id}/budget/entries', { params: { path: { id: contextId } }, body: { hours, note: note.trim() || null } }));
    changed(queryClient, contextId);
    return entry;
}

export async function changeBudgetEntry(api: UnaApi, queryClient: QueryClient, entry: BudgetEntry, hours: number, note: string): Promise<BudgetEntry> {
    const saved = unwrap(await api.PATCH('/task-budget-entries/{id}', { params: { path: { id: entry.id } }, body: { hours, note: note.trim() || null } }));
    changed(queryClient, entry.context_id);
    return saved;
}

export async function deleteBudgetEntry(api: UnaApi, queryClient: QueryClient, entry: BudgetEntry): Promise<void> {
    ensureOk(await api.DELETE('/task-budget-entries/{id}', { params: { path: { id: entry.id } } }));
    changed(queryClient, entry.context_id);
}

/** Why hours typed in the form would be refused, before they are sent; null when they will do. */
export function hoursProblem(text: string): string | null {
    const typed = text.trim();
    if (!typed) return t('Write how many hours');
    if (!/^[-+−]?\d+$/.test(typed)) return t('Write whole hours, as 8 or -2');
    const n = parseHours(typed)!;
    if (n === 0) return t('Write a number of hours other than 0');
    if (Math.abs(n) > HOURS_MAX) return tn(HOURS_MAX, 'Up to {{count}} hour', 'Up to {{count}} hours');
    return null;
}

/** The hours typed ("8", "-2", "−2"), or null for what is no whole number. */
export function parseHours(text: string): number | null {
    const typed = text.trim().replace('−', '-');
    return /^[-+]?\d+$/.test(typed) ? Number(typed) : null;
}

function format(value: number, options: Intl.NumberFormatOptions, tag: string = locale()): string {
    try {
        return new Intl.NumberFormat(tag, options).format(value);
    } catch {
        return String(value);
    }
}

/** "148 hours", "7.3 hours", "1 hour": seconds as hours, in the viewer's locale. */
export function hoursText(seconds: number, locale?: string): string {
    return format(seconds / 3600, { style: 'unit', unit: 'hour', unitDisplay: 'long', maximumFractionDigits: 1 }, locale);
}

/** "+120 hours", "-12 hours": an entry's hours, with its sign. */
export function entryHoursText(hours: number, locale?: string): string {
    return format(hours, { style: 'unit', unit: 'hour', unitDisplay: 'long', signDisplay: 'exceptZero' }, locale);
}

/** "95.1%": a share already in percent. */
export function percentText(percent: number, locale?: string): string {
    return format(percent / 100, { style: 'percent', maximumFractionDigits: 1 }, locale);
}

/** How much of the total is spent, from 0 to 100 (the bar's share; 0 without a total). */
export function spentShare(budget: Pick<TaskBudget, 'total_seconds' | 'spent_seconds'>): number {
    if (budget.total_seconds <= 0) return budget.spent_seconds > 0 ? 100 : 0;
    return Math.min(100, Math.max(0, (budget.spent_seconds / budget.total_seconds) * 100));
}

/** What the bar says to screen readers: "7.3 hours spent of 148 hours, 141 hours remaining". */
export function spentText(budget: TaskBudget, locale?: string): string {
    const spent = hoursText(budget.spent_seconds, locale);
    if (budget.total_seconds <= 0) return t('{{spent}} spent, no budget set', { spent });
    const total = hoursText(budget.total_seconds, locale);
    return budget.remaining_seconds < 0
        ? t('{{spent}} spent of {{total}}, {{over}} over budget', { spent, total, over: hoursText(-budget.remaining_seconds, locale) })
        : t('{{spent}} spent of {{total}}, {{left}} remaining', { spent, total, left: hoursText(budget.remaining_seconds, locale) });
}

/** An entry as a control's name says it: "+120 hours, Autumn season" (the note cut short). */
export function entryText(entry: Pick<BudgetEntry, 'hours' | 'note'>, locale?: string): string {
    const note = entry.note ? Array.from(entry.note) : [];
    const short = note.length > 40 ? `${note.slice(0, 39).join('').trimEnd()}…` : note.join('');
    return `${entryHoursText(entry.hours, locale)}${short ? `, ${short}` : ''}`;
}
