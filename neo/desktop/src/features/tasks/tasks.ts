/**
 * Tasks (GET /tasks, /me/tasks, /task-lists, /tasks/{id}): a task is in a context (a group,
 * space or event), in one of its lists or its Inbox, assigned to some of its members and maybe
 * due on a day. Here: the query keys, the fetchers, completing (PATCH `completed`, written into
 * every list that shows the task), and the words and groups of due dates in the viewer's zone.
 */
import type { InfiniteQueryObserverResult, QueryClient, QueryKey } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { ensureOk, unwrap } from '../../lib/api';
import { list, locale, t, tn } from '../../lib/i18n';

export type Task = Schema<'Task'>;
export type TaskList = Schema<'TaskList'>;
export type TaskLists = Schema<'TaskLists'>;
export type TaskPage = Schema<'Page_Task'>;

export const TASKS_PAGE = 50;

export const taskKey = (id: string) => ['task', id] as const;
/** A context's tasks, every list's (its Inbox's too) in one list: the Tasks tab groups them. */
export const contextTasksKey = (contextId: string) => ['tasks', 'context', contextId] as const;
export const taskListsKey = (contextId: string) => ['task-lists', contextId] as const;

/**
 * A page of a context's tasks, of all its lists at once (open ones first, then by due date):
 * one request for the tab, where a request per list cost a page's queries each on the site.
 */
export async function fetchContextTasks(api: UnaApi, contextId: string, cursor: string | undefined, limit = TASKS_PAGE): Promise<TaskPage> {
    return unwrap(await api.GET('/tasks', { params: { query: { context_id: contextId, state: 'all', cursor, limit } } }));
}

/** Tasks by the list they are in (null: the Inbox), each list's in the order they came. */
export function tasksByList(tasks: readonly Task[]): Map<string | null, Task[]> {
    const lists = new Map<string | null, Task[]>();
    for (const task of tasks) {
        const key = task.list_id ?? null;
        const shown = lists.get(key);
        if (shown) shown.push(task);
        else lists.set(key, [task]);
    }
    return lists;
}

/**
 * More of a list. Its cursors are places in an order that completing, adding or deleting a task
 * changes (open ones first), so after such a change (the list marked stale, `isInvalidated`)
 * the pages load again from the first before the next one: none is skipped or shown twice.
 */
export async function loadMoreTasks(queryClient: QueryClient, queryKey: QueryKey, query: Pick<InfiniteQueryObserverResult<TaskPage>, 'isFetching' | 'refetch' | 'fetchNextPage'>): Promise<void> {
    if (query.isFetching) return;
    if (queryClient.getQueryState(queryKey)?.isInvalidated) {
        const pages = (await query.refetch()).data?.pages ?? [];
        if (!pages[pages.length - 1]?.next_cursor) return;
    }
    await query.fetchNextPage();
}

/** A task's or a list's title, as the site's forms take it (3 to 160 characters). */
export const TITLE_MIN = 3;
export const TITLE_MAX = 160;

/** Why a title would be refused, before it is sent; null when it will do. */
export function titleProblem(title: string): string | null {
    const length = Array.from(title.trim()).length;
    if (length < TITLE_MIN) return tn(TITLE_MIN, 'A title needs at least {{count}} character', 'A title needs at least {{count}} characters');
    if (length > TITLE_MAX) return tn(TITLE_MAX, 'A title can have up to {{count}} character', 'A title can have up to {{count}} characters');
    return null;
}

/*
 * Whether a field that adds a task is shown (a context's Tasks tab where the viewer may add
 * one): Cmd+N goes there then, so the menu and the palette call it New Task.
 */
let addFields = 0;
const addFieldListeners = new Set<() => void>();
const changedAddFields = () => addFieldListeners.forEach((l) => l());

export function subscribeTaskAddShown(listener: () => void): () => void {
    addFieldListeners.add(listener);
    return () => addFieldListeners.delete(listener);
}

export function taskAddShown(): boolean {
    return addFields > 0;
}

/** Counts a task's add field while it is shown. */
export function useTaskAddField(): void {
    useEffect(() => {
        addFields++;
        changedAddFields();
        return () => {
            addFields--;
            changedAddFields();
        };
    }, []);
}

export function useTaskAddShown(): boolean {
    return useSyncExternalStore(subscribeTaskAddShown, taskAddShown, () => false);
}

export async function fetchTaskLists(api: UnaApi, contextId: string): Promise<TaskLists> {
    return unwrap(await api.GET('/task-lists', { params: { query: { context_id: contextId } } }));
}

/**
 * A context's lists changed (added, renamed, deleted): its lists, the sidebar's contexts, the
 * counts, and the tasks (they name their list, and a deleted list's tasks are gone) load again.
 */
async function listsChanged(queryClient: QueryClient, contextId: string): Promise<void> {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskListsKey(contextId) }),
        queryClient.invalidateQueries({ queryKey: ['task-contexts'] }),
        queryClient.invalidateQueries({ queryKey: ['task-facets'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ]);
}

/** POST /task-lists: a new list in a context (who may post there). */
export async function createTaskList(api: UnaApi, queryClient: QueryClient, contextId: string, title: string): Promise<TaskList> {
    const made = unwrap(await api.POST('/task-lists', { body: { context_id: contextId, title: title.trim() } }));
    await listsChanged(queryClient, contextId);
    return made;
}

/** PATCH /task-lists/{id}: a list's new name. */
export async function renameTaskList(api: UnaApi, queryClient: QueryClient, list: TaskList & { id: string }, title: string): Promise<TaskList> {
    const saved = unwrap(await api.PATCH('/task-lists/{id}', { params: { path: { id: list.id } }, body: { title: title.trim() } }));
    await listsChanged(queryClient, list.context_id);
    return saved;
}

/** DELETE /task-lists/{id}: the list and its tasks (the context's administrators). */
export async function deleteTaskList(api: UnaApi, queryClient: QueryClient, list: TaskList & { id: string }): Promise<void> {
    try {
        ensureOk(await api.DELETE('/task-lists/{id}', { params: { path: { id: list.id } } }));
    } finally {
        // a 409 can leave some of its tasks deleted: what is left is loaded either way
        await listsChanged(queryClient, list.context_id);
    }
}

type Pages = { pages: TaskPage[]; pageParams: unknown[] };

/** The task as it is now, in every list that shows it and its own answer (kept where it is in each list). */
export function putTask(queryClient: QueryClient, task: Task): void {
    queryClient.setQueriesData<Pages>({ queryKey: ['tasks'] }, (data) =>
        data?.pages ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((item) => (item.id === task.id ? task : item)) })) } : data,
    );
    const own = queryClient.getQueryData<Task>(taskKey(task.id));
    // a list's copy has no text: the single answer keeps its own
    queryClient.setQueryData<Task>(taskKey(task.id), own ? { ...task, body_html: task.body_html ?? own.body_html } : task);
}

/** A task that is gone: out of every list, which are stale now (their cursors moved: loadMoreTasks). */
export function dropTask(queryClient: QueryClient, id: string): void {
    queryClient.setQueriesData<Pages>({ queryKey: ['tasks'] }, (data) => (data?.pages ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((item) => item.id !== id) })) } : data));
    void queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
    queryClient.removeQueries({ queryKey: taskKey(id) });
}

/** The task as a list showed it, for its detail to show at once. */
export function taskFromLists(queryClient: QueryClient, id: string): Task | undefined {
    for (const [, data] of queryClient.getQueriesData<Pages>({ queryKey: ['tasks'] })) {
        const found = data?.pages?.flatMap((p) => p.items).find((item) => item.id === id);
        if (found) return found;
    }
    return undefined;
}

/**
 * Completing or reopening (PATCH /tasks/{id} `completed`): shown at once in every list, put back
 * when the site refuses. The lists stay as they are (a completed task keeps its place until the
 * list loads again, so the row under the keyboard does not go away), marked stale: they load
 * again when next shown, and from their first page when more of them is asked for
 * (loadMoreTasks); their counts load again.
 */
export async function setCompleted(api: UnaApi, queryClient: QueryClient, task: Task, completed: boolean): Promise<Task> {
    putTask(queryClient, { ...task, completed });
    try {
        const saved = unwrap(await api.PATCH('/tasks/{id}', { params: { path: { id: task.id } }, body: { completed } }));
        putTask(queryClient, saved);
        void queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
        if (saved.context_id) void queryClient.invalidateQueries({ queryKey: taskListsKey(saved.context_id) });
        return saved;
    } catch (e) {
        putTask(queryClient, task);
        throw e;
    }
}

/** What completing said: "Completed: Print the posters", "Reopened: Print the posters". */
export function completedText(task: Pick<Task, 'title'>, completed: boolean): string {
    return completed ? t('Completed: {{title}}', { title: task.title }) : t('Reopened: {{title}}', { title: task.title });
}

/** The viewer's own zone. */
export function viewerZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function dayParts(d: Date, zone: string): { y: number; m: number; d: number } {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { y: get('year'), m: get('month'), d: get('day') };
}

/** Days from today to the day the moment is on, in a zone (0 today, 1 tomorrow, -1 yesterday). */
export function daysUntil(iso: string, now: Date = new Date(), zone: string = viewerZone()): number {
    const a = dayParts(now, zone);
    const b = dayParts(new Date(iso), zone);
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export type DueGroup = 'overdue' | 'today' | 'week' | 'later' | 'none';

export const DUE_GROUP_LABELS: Record<DueGroup, string> = { overdue: t('Overdue'), today: t('Today'), week: t('This week'), later: t('Later'), none: t('No due date') };

/**
 * The group My tasks lists a task under, by its due day in the viewer's zone: before today
 * Overdue, Today, the next six days This week, then Later; without a due date, No due date.
 */
export function dueGroup(task: Pick<Task, 'due_at'>, now: Date = new Date(), zone: string = viewerZone()): DueGroup {
    if (!task.due_at) return 'none';
    const days = daysUntil(task.due_at, now, zone);
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days < 7) return 'week';
    return 'later';
}

/** Whether it is past its due day and still open. */
export function isOverdue(task: Pick<Task, 'due_at' | 'completed'>, now: Date = new Date(), zone: string = viewerZone()): boolean {
    return !task.completed && !!task.due_at && daysUntil(task.due_at, now, zone) < 0;
}

/**
 * When a task is due, short, in the viewer's zone: "Today", "Tomorrow", "Yesterday", the weekday
 * within a week ("Thu"), else the date ("12 Dec", with the year when not this one); the time
 * after it unless it is midnight. Empty without a due date.
 */
export function dueText(task: Pick<Task, 'due_at'>, now: Date = new Date(), zone: string = viewerZone(), tag: string = locale()): string {
    if (!task.due_at) return '';
    const at = new Date(task.due_at);
    const days = daysUntil(task.due_at, now, zone);
    const sameYear = dayParts(at, zone).y === dayParts(now, zone).y;
    const day =
        days === 0
            ? t('Today')
            : days === 1
              ? t('Tomorrow')
              : days === -1
                ? t('Yesterday')
                : days > 1 && days < 7
                  ? new Intl.DateTimeFormat(tag, { timeZone: zone, weekday: 'short' }).format(at)
                  : new Intl.DateTimeFormat(tag, { timeZone: zone, day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(at);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
    return time === '00:00' ? day : `${day}, ${new Intl.DateTimeFormat(tag, { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(at)}`;
}

export type TaskRowItem = { kind: 'heading'; key: string; label: string; count: number } | { kind: 'task'; task: Task };

/** Tasks in their list's order (due soonest first), with a heading before each due group. */
export function withDueHeadings(tasks: readonly Task[], now: Date = new Date(), zone: string = viewerZone()): TaskRowItem[] {
    const rows: TaskRowItem[] = [];
    const counts = new Map<DueGroup, number>();
    for (const task of tasks) counts.set(dueGroup(task, now, zone), (counts.get(dueGroup(task, now, zone)) ?? 0) + 1);
    let group: DueGroup | null = null;
    for (const task of tasks) {
        const g = dueGroup(task, now, zone);
        if (g !== group) {
            rows.push({ kind: 'heading', key: g, label: DUE_GROUP_LABELS[g], count: counts.get(g) ?? 0 });
            group = g;
        }
        rows.push({ kind: 'task', task });
    }
    return rows;
}

/** "Lily Carter", "Lily Carter and Eric Novak", "Lily Carter and 2 others". */
export function assigneesText(task: Pick<Task, 'assignees'>): string {
    const names = task.assignees.map((p) => p.display_name);
    if (!names.length) return t('nobody');
    if (names.length === 1) return names[0]!;
    if (names.length === 2) return list(names);
    return tn(names.length - 1, '{{name}} and {{count}} other', '{{name}} and {{count}} others', { name: names[0]! });
}

/**
 * What a row says to screen readers after the task's title: done, overdue, when it is due, where
 * (a context and its list, where the row shows them), and who it is assigned to.
 */
export function taskRowText(task: Task, { where = true, now = new Date(), zone = viewerZone() }: { where?: boolean; now?: Date; zone?: string } = {}): string {
    const parts = [
        task.completed ? t('completed') : null,
        isOverdue(task, now, zone) ? t('overdue') : null,
        task.due_at ? t('due {{when}}', { when: dueText(task, now, zone) }) : null,
        where && task.context ? (task.list_title ? t('in {{place}}, {{list}}', { place: task.context.display_name, list: task.list_title }) : t('in {{place}}', { place: task.context.display_name })) : null,
        task.assignees.length ? t('assigned to {{names}}', { names: assigneesText(task) }) : null,
    ];
    return `, ${parts.filter(Boolean).join(', ')}`;
}

/** "3 open", "All done", "No tasks". */
export function openCountText(list: Pick<TaskList, 'task_count' | 'open_count'>): string {
    if (!list.task_count) return t('No tasks');
    return list.open_count ? tn(list.open_count, '{{count}} open', '{{count}} open') : t('All done');
}
