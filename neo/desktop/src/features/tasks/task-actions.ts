/**
 * Changing a task's properties (PATCH /tasks/{id}: state, priority, type, estimate, labels,
 * assignees, list, due date), its timer (POST /tasks/{id}/timer) and its time (POST
 * /tasks/{id}/time), and the menus that pick a property: native menus with the current value
 * checked (menu-popover.tsx outside the app), as Linear's pickers are.
 */
import type { QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { MenuEntry } from '../../lib/native-menu';
import { afterTaskChange, TIMERS_KEY, type TaskChanges, type TaskChoice, type TaskChoices, taskTimeKey } from './board';
import { putTask, type Task, type TaskList } from './tasks';

/**
 * Change a task: shown at once in every list that shows it (`shown`, what the change will look
 * like), saved, then as the site saved it; put back when the site refuses.
 */
export async function changeTask(api: UnaApi, queryClient: QueryClient, task: Task, changes: TaskChanges, shown: Partial<Task> = {}): Promise<Task> {
    putTask(queryClient, { ...task, ...shown });
    try {
        const saved = unwrap(await api.PATCH('/tasks/{id}', { params: { path: { id: task.id } }, body: changes }));
        putTask(queryClient, saved);
        afterTaskChange(queryClient, saved);
        return saved;
    } catch (e) {
        putTask(queryClient, task);
        throw e;
    }
}

export type TimerAction = 'start' | 'pause' | 'resume' | 'clear' | 'log';

/** The viewer's timer on a task: the task as it is after, in every list; My timers loads again. */
export async function timerAction(api: UnaApi, queryClient: QueryClient, task: Pick<Task, 'id'>, action: TimerAction): Promise<Task> {
    const saved = unwrap(await api.POST('/tasks/{id}/timer', { params: { path: { id: task.id } }, body: { action } }));
    putTask(queryClient, saved);
    void queryClient.invalidateQueries({ queryKey: TIMERS_KEY });
    // starting one pauses another: every list's timers are stale
    if (action === 'start' || action === 'resume') void queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
    if (action === 'log') {
        void queryClient.invalidateQueries({ queryKey: taskTimeKey(task.id) });
        void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
    return saved;
}

/** Log minutes on a day with a note; the task's time loads again. */
export async function logTime(api: UnaApi, queryClient: QueryClient, task: Pick<Task, 'id'>, minutes: number, date: string | null, text: string): Promise<Schema<'TimeRecord'>> {
    const saved = unwrap(await api.POST('/tasks/{id}/time', { params: { path: { id: task.id } }, body: { minutes, date, text: text.trim() || null } }));
    void queryClient.invalidateQueries({ queryKey: taskTimeKey(task.id) });
    void queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    return saved;
}

/** What a picked value changes: the request, what it looks like at once, and what is said. */
export type PropertyPick = { changes: TaskChanges; shown: Partial<Task>; said: string };

/** The menu of one of the choices, the current one checked (none: `noneText`, when it can be none). */
function choiceEntries(values: readonly TaskChoice[], current: string | null | undefined, pick: (p: TaskChoice | null) => void, noneText?: string): MenuEntry[] {
    const out: MenuEntry[] = values.map((v) => ({ text: v.title, checked: v.id === current, run: () => pick(v) }));
    if (noneText) out.push('separator', { text: noneText, checked: !current, run: () => pick(null) });
    return out;
}

/** The kinds of property a picker changes, and their keys in the detail (S, P, T, E, L, A). */
export type PropertyKind = 'state' | 'priority' | 'type' | 'estimate' | 'labels' | 'assignees' | 'list';
export const PROPERTY_KEYS: Partial<Record<PropertyKind | 'due', string>> = { state: 's', priority: 'p', assignees: 'a', labels: 'l', estimate: 'e', type: 't', due: 'd' };
export const PROPERTY_LABELS: Record<PropertyKind | 'due', string> = { state: t('State'), priority: t('Priority'), type: t('Type'), estimate: t('Estimate'), labels: t('Labels'), assignees: t('Assignees'), list: t('List'), due: t('Due date') };

/**
 * The menu that picks a property of a task. Labels and assignees are sets: an item turns one on
 * or off (the menu closes; it opens again with the key or the button).
 */
export function propertyEntries(
    kind: PropertyKind,
    task: Task,
    { choices, lists, members }: { choices?: TaskChoices; lists?: readonly TaskList[]; members?: readonly Schema<'Profile'>[] },
    pick: (p: PropertyPick) => void,
): MenuEntry[] {
    switch (kind) {
        case 'state':
            return choiceEntries(choices?.states ?? [], task.state?.id, (s) => s && pick({ changes: { state_id: s.id }, shown: { state: s, completed: !!s.done }, said: t('State: {{state}}', { state: s.title }) }));
        case 'priority':
            return choiceEntries(choices?.priorities ?? [], task.priority?.id, (p) => pick({ changes: { priority_id: p?.id ?? null }, shown: { priority: p }, said: p ? t('Priority: {{priority}}', { priority: p.title }) : t('Priority: none') }), t('No priority'));
        case 'type':
            return choiceEntries(choices?.types ?? [], task.type?.id, (type) => pick({ changes: { type_id: type?.id ?? null }, shown: { type }, said: type ? t('Type: {{type}}', { type: type.title }) : t('Type: none') }), t('No type'));
        case 'estimate':
            return choiceEntries(choices?.estimates ?? [], task.estimate?.id, (e) => pick({ changes: { estimate_id: e?.id ?? null }, shown: { estimate: e }, said: e ? t('Estimate: {{estimate}}', { estimate: e.title }) : t('Estimate: none') }), t('No estimate'));
        case 'labels': {
            const on = new Set(task.labels.map((l) => l.id));
            return (choices?.labels ?? []).map((l) => ({
                text: l.title,
                checked: on.has(l.id),
                run: () => {
                    const next = on.has(l.id) ? task.labels.filter((x) => x.id !== l.id) : [...task.labels, l];
                    pick({ changes: { label_ids: next.map((x) => x.id) }, shown: { labels: next }, said: on.has(l.id) ? t('Removed label {{label}}', { label: l.title }) : t('Added label {{label}}', { label: l.title }) });
                },
            }));
        }
        case 'assignees': {
            const on = new Set(task.assignees.map((p) => p.id));
            return (members ?? []).map((m) => ({
                text: m.display_name,
                checked: on.has(m.id),
                run: () => {
                    const next = on.has(m.id) ? task.assignees.filter((x) => x.id !== m.id) : [...task.assignees, m];
                    pick({ changes: { assignee_ids: next.map((x) => x.id) }, shown: { assignees: next }, said: on.has(m.id) ? t('Unassigned {{name}}', { name: m.display_name }) : t('Assigned to {{name}}', { name: m.display_name }) });
                },
            }));
        }
        case 'list':
            return (lists ?? []).map((l) => ({
                text: l.title,
                checked: (l.id ?? null) === (task.list_id ?? null),
                run: () => pick({ changes: { list_id: l.id ?? null }, shown: { list_id: l.id ?? null, list_title: l.title }, said: t('Moved to {{list}}', { list: l.title }) }),
            }));
    }
}

/** A due date from a date field (YYYY-MM-DD), at the time of day it had (5 pm here for a new one). */
export function dueFromDate(date: string, before: string | null): string | null {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return null;
    const at = before ? new Date(before) : null;
    const local = new Date(y, m - 1, d, at ? at.getHours() : 17, at ? at.getMinutes() : 0, 0, 0);
    return local.toISOString();
}

/** The date field's value of a due date, in the viewer's zone. */
export function dateOf(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
