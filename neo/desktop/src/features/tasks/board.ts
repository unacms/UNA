/**
 * The Tasks section's lists (the site's Tasks page, arranged as Linear arranges issues): whose
 * tasks (My tasks, assigned or created; a context's, or one of its lists), open or completed,
 * the filters of the site's Tasks page (type, priority, estimate, state, label, assignee, list,
 * a saved filter), how they are grouped (state, priority, list, none) and ordered; the counts of
 * each group (GET /tasks/facets) and the choices a task may have (GET /tasks/choices).
 */
import type { QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { t, tn } from '../../lib/i18n';
import type { IconName } from '../../components/icon';
import type { Task, TaskPage } from './tasks';

export type TaskChoice = Schema<'TaskChoice'>;
export type TaskChoices = Schema<'TaskChoices'>;
export type TaskFacets = Schema<'TaskFacets'>;
export type TaskFacetBucket = Schema<'TaskFacetBucket'>;
export type SavedFilter = Schema<'TaskFilter'>;
export type TaskContext = Schema<'TaskContext'>;
export type TaskTimers = Schema<'TaskTimers'>;
export type TaskTime = Schema<'TaskTime'>;
export type TimeRecord = Schema<'TimeRecord'>;

/** Whose tasks a board shows: one's own (assigned or created), or a context's (one of its lists, `inbox` its Inbox). */
export type TaskScope = { kind: 'mine'; role: 'assigned' | 'created' } | { kind: 'context'; contextId: string; listId?: string };

export type TaskShow = 'open' | 'completed';
export type GroupBy = 'state' | 'priority' | 'list' | 'none';
export type SortBy = 'due' | 'priority' | 'created' | 'updated';

export const GROUP_BY: readonly GroupBy[] = ['state', 'priority', 'list', 'none'];
export const SORT_BY: readonly SortBy[] = ['due', 'priority', 'created', 'updated'];
export const GROUP_LABELS: Record<GroupBy, string> = { state: t('State'), priority: t('Priority'), list: t('List'), none: t('No grouping') };
export const SORT_LABELS: Record<SortBy, string> = { due: t('Due date'), priority: t('Priority'), created: t('Newest'), updated: t('Last updated') };

/** The filters of a list, as the site's Tasks page has them; `saved` a saved filter's id. */
export type FilterField = 'type' | 'priority' | 'estimate' | 'state' | 'label' | 'assignee';
export type TaskFilters = Partial<Record<FilterField, readonly string[]>> & { saved?: string };

export const FILTER_FIELDS: readonly FilterField[] = ['type', 'priority', 'estimate', 'state', 'label', 'assignee'];
export const FILTER_LABELS: Record<FilterField, string> = { type: t('Type'), priority: t('Priority'), estimate: t('Estimate'), state: t('State'), label: t('Label'), assignee: t('Assignee') };
const FILTER_PARAMS: Record<FilterField, 'type_id' | 'priority_id' | 'estimate_id' | 'state_id' | 'label_id' | 'assignee'> = {
    type: 'type_id',
    priority: 'priority_id',
    estimate: 'estimate_id',
    state: 'state_id',
    label: 'label_id',
    assignee: 'assignee',
};

export type BoardView = { scope: TaskScope; show: TaskShow; filters: TaskFilters; sort: SortBy };

/** The board's query parameters for GET /tasks or /me/tasks (and their facets, without paging). */
export function boardParams(view: Omit<BoardView, 'show' | 'sort'> & { show?: TaskShow; sort?: SortBy }): Record<string, string> {
    const q: Record<string, string> = {};
    if (view.scope.kind === 'context') {
        q.context_id = view.scope.contextId;
        if (view.scope.listId) q.list_id = view.scope.listId;
    } else if (view.scope.role === 'created') q.role = 'created';
    if (view.show) q.state = view.show;
    for (const f of FILTER_FIELDS) {
        const values = view.filters[f];
        // one's own tasks are assigned to one: no assignee filter there
        if (!values?.length || (f === 'assignee' && view.scope.kind === 'mine')) continue;
        q[FILTER_PARAMS[f]] = values.join(',');
    }
    if (view.filters.saved) q.filter_id = view.filters.saved;
    if (view.sort && view.sort !== 'due') q.sort = view.sort;
    return q;
}

/** Board pages are under ['tasks'], so completing or changing a task reaches them (putTask, dropTask). */
export const boardKey = (view: BoardView) => ['tasks', 'board', boardParams(view)] as const;
export const facetsKey = (view: Omit<BoardView, 'show' | 'sort'>) => ['task-facets', boardParams(view)] as const;
export const choicesKey = (contextId: string | null) => ['task-choices', contextId ?? ''] as const;
export const savedFiltersKey = (contextId: string | null) => ['task-filters', contextId ?? ''] as const;
export const TASK_CONTEXTS_KEY = ['task-contexts'] as const;
export const TIMERS_KEY = ['task-timers'] as const;
export const taskTimeKey = (id: string) => ['task-time', id] as const;

export async function fetchBoard(api: UnaApi, view: BoardView, cursor: string | undefined, limit: number): Promise<TaskPage> {
    const query = { ...boardParams(view), cursor, limit } as Record<string, unknown>;
    if (view.scope.kind === 'mine') return unwrap(await api.GET('/me/tasks', { params: { query } }));
    return unwrap(await api.GET('/tasks', { params: { query } }));
}

export async function fetchFacets(api: UnaApi, view: Omit<BoardView, 'show' | 'sort'>): Promise<TaskFacets> {
    const query = boardParams(view) as Record<string, unknown>;
    if (view.scope.kind === 'mine') return unwrap(await api.GET('/me/tasks/facets', { params: { query } }));
    return unwrap(await api.GET('/tasks/facets', { params: { query } }));
}

export async function fetchChoices(api: UnaApi, contextId: string | null): Promise<TaskChoices> {
    return unwrap(await api.GET('/tasks/choices', { params: { query: contextId ? { context_id: contextId } : {} } }));
}

export async function fetchSavedFilters(api: UnaApi, contextId: string | null): Promise<SavedFilter[]> {
    return unwrap(await api.GET('/task-filters', { params: { query: contextId ? { context_id: contextId } : {} } })).items;
}

/** Whether a list has any filter on. */
export function hasFilters(filters: TaskFilters): boolean {
    return !!filters.saved || FILTER_FIELDS.some((f) => !!filters[f]?.length);
}

/** A filter's value turned on or off. */
export function toggleFilter(filters: TaskFilters, field: FilterField, value: string): TaskFilters {
    const now = filters[field] ?? [];
    const next = now.includes(value) ? now.filter((v) => v !== value) : [...now, value];
    const out: TaskFilters = { ...filters };
    if (next.length) out[field] = next;
    else delete out[field];
    return out;
}

/*
 * States, priorities and what they look like
 */

/** The site's states (BX_TASKS_STATE_*): their order on a board, done ones last. */
const STATE_RANK: Record<string, number> = { '4': 0, '3': 1, '2': 2, '1': 3, '': 4, '7': 5, '5': 6, '6': 7 };
const STATE_ICONS: Record<string, IconName> = { '1': 'circle-dashed', '2': 'circle', '3': 'circle-dot', '4': 'eye', '5': 'circle-x', '6': 'copy', '7': 'circle-check' };
/** Urgent first, No Priority after the others, none last. */
const PRIORITY_RANK: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '': 5 };
const PRIORITY_ICONS: Record<string, IconName> = { '1': 'octagon-alert', '2': 'signal-high', '3': 'signal-medium', '4': 'signal-low', '5': 'signal-zero' };

export function stateIcon(state: Pick<TaskChoice, 'id' | 'done'> | null | undefined, completed = false): IconName {
    if (!state) return completed ? 'circle-check' : 'circle';
    return STATE_ICONS[state.id] ?? (state.done ? 'circle-check' : 'circle');
}

export function priorityIcon(priority: Pick<TaskChoice, 'id'> | null | undefined): IconName {
    return (priority && PRIORITY_ICONS[priority.id]) || 'signal-zero';
}

/** Where a state goes on a board (an unknown one after the open ones, before the done ones). */
export function stateRank(id: string | null | undefined, done = false): number {
    return STATE_RANK[id ?? ''] ?? (done ? 4.5 : 3.5);
}

export function priorityRank(id: string | null | undefined): number {
    return PRIORITY_RANK[id ?? ''] ?? 4.5;
}

/** A label's colour: the context's, else one of the app's by its id (a dot beside its name: the name says it). */
const LABEL_PALETTE = ['#e5484d', '#3e63dd', '#30a46c', '#f76b15', '#8e4ec6', '#12a594', '#d6409f', '#ad7f58'];
export function labelColor(label: Pick<TaskChoice, 'id' | 'color'>): string {
    return label.color ?? LABEL_PALETTE[(Number(label.id) - 1 + LABEL_PALETTE.length * 4) % LABEL_PALETTE.length]!;
}

/*
 * Time
 */

/** "1:05" for 65 minutes, "0:00" for none (a task's time, as the site's list writes it). */
export function clockText(seconds: number): string {
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "1:05:09": a running timer. */
export function timerText(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** "1 hour 5 minutes", "45 minutes", "no time": what a screen reader says of a duration. */
export function durationWords(seconds: number): string {
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hours = h ? tn(h, '{{count}} hour', '{{count}} hours') : '';
    const mins = m ? tn(m, '{{count}} minute', '{{count}} minutes') : '';
    if (hours && mins) return t('{{hours}} {{minutes}}', { hours, minutes: mins });
    return hours || mins || t('no time');
}

/** A task's estimate in seconds, as the site's list counts it: a point is an hour. */
export function estimateSeconds(task: Pick<Task, 'estimate'>): number | null {
    return task.estimate?.points ? task.estimate.points * 3600 : null;
}

/** The seconds a timer has counted now: what the answer said, and the time since while it runs. */
export function timerSeconds(timer: Task['timer'], fetchedAt: number, now: number = Date.now()): number {
    if (!timer) return 0;
    return timer.seconds + (timer.state === 'running' ? Math.max(0, Math.floor((now - fetchedAt) / 1000)) : 0);
}

/** Minutes from what a person types in Log time: "1:30", "1h 30m", "90", "1.5h", "45m". Null for nothing it can read. */
export function parseDuration(text: string): number | null {
    const typed = text.trim().toLowerCase();
    if (!typed) return null;
    let m: RegExpExecArray | null;
    if ((m = /^(\d+):([0-5]?\d)$/.exec(typed))) return Number(m[1]) * 60 + Number(m[2]);
    if ((m = /^(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?$/.exec(typed))) return Math.round(Number(m[1]!.replace(',', '.')) * 60) || null;
    if ((m = /^(?:(\d+)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/.exec(typed)) && (m[1] || m[2])) return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) || null;
    if ((m = /^\d+$/.exec(typed))) return Number(typed) || null;
    return null;
}

/*
 * Groups
 */

export type TaskGroup = {
    key: string;
    label: string;
    icon: IconName | null;
    /** A label's or context's colour dot. */
    color?: string;
    /** How many tasks the group has in all (the facets: more than the pages loaded may show). */
    count: number;
    tasks: Task[];
    /** What a task added under this group's + gets. */
    preset: { state_id?: string; priority_id?: string; list_id?: string | null };
};

type Facets = Pick<TaskFacets, 'states' | 'priorities' | 'lists'> | undefined;

function facetCount(buckets: readonly TaskFacetBucket[] | undefined, id: string | null, show: TaskShow): number | null {
    const b = buckets?.find((x) => (x.id ?? null) === id);
    if (!b) return null;
    return show === 'open' ? b.open : b.count - b.open;
}

/**
 * The tasks of the pages loaded under their groups, in the board's order: by state (the site's
 * board order, done ones last), by priority (Urgent first, none last), by list (a context's
 * Inbox first; in My tasks by context, then list), or one group. Each group's count is the
 * facets' (all its tasks, open or completed as shown) where they have it.
 */
export function groupTasks(tasks: readonly Task[], by: GroupBy, show: TaskShow, facets?: Facets): TaskGroup[] {
    if (by === 'none') return tasks.length ? [{ key: 'all', label: t('Tasks'), icon: null, count: tasks.length, tasks: [...tasks], preset: {} }] : [];
    const groups = new Map<string, TaskGroup & { rank: number }>();
    for (const task of tasks) {
        let key: string;
        let make: () => TaskGroup & { rank: number };
        if (by === 'state') {
            key = task.state?.id ?? '';
            make = () => ({ key: `state-${key}`, label: task.state?.title ?? t('No state'), icon: stateIcon(task.state, task.completed), count: facetCount(facets?.states, task.state?.id ?? null, show) ?? 0, tasks: [], preset: task.state ? { state_id: task.state.id } : {}, rank: stateRank(task.state?.id, task.state?.done) });
        } else if (by === 'priority') {
            key = task.priority?.id ?? '';
            make = () => ({ key: `priority-${key}`, label: task.priority?.title ?? t('No priority'), icon: priorityIcon(task.priority), count: facetCount(facets?.priorities, task.priority?.id ?? null, show) ?? 0, tasks: [], preset: task.priority ? { priority_id: task.priority.id } : {}, rank: priorityRank(task.priority?.id) });
        } else {
            key = `${task.context_id ?? ''}:${task.list_id ?? ''}`;
            const bucket = facets?.lists.find((l) => (l.context_id ?? null) === (task.context_id ?? null) && (l.id ?? null) === (task.list_id ?? null));
            make = () => ({
                key: `list-${key}`,
                label: task.list_title ?? t('No list'),
                icon: task.list_id ? 'list' : 'inbox',
                count: bucket ? (show === 'open' ? bucket.open : bucket.count - bucket.open) : 0,
                tasks: [],
                preset: { list_id: task.list_id ?? null },
                rank: 0,
            });
        }
        let g = groups.get(key);
        if (!g) {
            g = make();
            groups.set(key, g);
        }
        g.tasks.push(task);
    }
    const out = [...groups.values()];
    if (by !== 'list') out.sort((a, b) => a.rank - b.rank);
    else {
        // by context (My tasks: its name before the list's), each context's Inbox first, then its lists in their order
        const name = (g: TaskGroup) => g.tasks[0]?.context?.display_name ?? '';
        out.sort((a, b) => name(a).localeCompare(name(b)) || Number(!!a.preset.list_id) - Number(!!b.preset.list_id) || Number(a.preset.list_id ?? 0) - Number(b.preset.list_id ?? 0));
        for (const g of out) if (g.tasks[0]?.context && tasks.some((other) => other.context_id !== g.tasks[0]?.context_id)) g.label = `${g.tasks[0].context.display_name} · ${g.label}`;
    }
    // a group's count is at least what is loaded of it (the facets may be older than a change)
    return out.map(({ rank: _rank, ...g }) => ({ ...g, count: Math.max(g.count, g.tasks.length) }));
}

/** "Todo, 26 tasks": what a group's heading says. */
export function groupHeadingText(g: Pick<TaskGroup, 'label' | 'count'>): string {
    return tn(g.count, '{{label}}, {{count}} task', '{{label}}, {{count}} tasks', { label: g.label });
}

/*
 * The order of the list shown, for the detail's Previous and Next ("3 / 26")
 */

let order: readonly string[] = [];
const orderListeners = new Set<() => void>();

/** The board shown says which tasks it lists, in its order (collapsed groups left out). */
export function setTaskOrder(ids: readonly string[]): void {
    if (ids.length === order.length && ids.every((id, i) => order[i] === id)) return;
    order = ids;
    orderListeners.forEach((l) => l());
}

export function subscribeTaskOrder(listener: () => void): () => void {
    orderListeners.add(listener);
    return () => orderListeners.delete(listener);
}

export function taskOrder(): readonly string[] {
    return order;
}

/** Where a task is in the order shown, and the ones before and after it. */
export function neighbours(ids: readonly string[], id: string): { index: number; total: number; previous: string | null; next: string | null } {
    const index = ids.indexOf(id);
    return { index, total: ids.length, previous: index > 0 ? ids[index - 1]! : null, next: index >= 0 && index < ids.length - 1 ? ids[index + 1]! : null };
}

/*
 * Changing a task
 */

export type TaskChanges = Schema<'TaskChanges'>;

/** After a change: the boards' and the counts' copies are stale (their orders and groups moved). */
export function afterTaskChange(queryClient: QueryClient, task: Pick<Task, 'context_id'>): void {
    void queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
    void queryClient.invalidateQueries({ queryKey: ['task-facets'] });
    void queryClient.invalidateQueries({ queryKey: TASK_CONTEXTS_KEY });
    if (task.context_id) void queryClient.invalidateQueries({ queryKey: ['task-lists', task.context_id] });
}
