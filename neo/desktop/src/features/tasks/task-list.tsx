import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type MouseEvent, useEffect, useId, useRef, useState } from 'react';

import { problemMessage } from 'una-api';

import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { Tooltip } from '../../components/tooltip';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { showMenu, useMenuExpanded } from '../../lib/native-menu';
import { useNavigation } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { useAnnouncer } from '../feed/feed-list';
import type { Context } from '../groups/groups';
import {
    assigneesText,
    completedText,
    contextTasksKey,
    dueText,
    fetchContextTasks,
    fetchTaskLists,
    isOverdue,
    loadMoreTasks,
    openCountText,
    setCompleted,
    type Task,
    type TaskList,
    taskKey,
    taskListsKey,
    TITLE_MAX,
    taskRowText,
    tasksByList,
    titleProblem,
    useTaskAddField,
} from './tasks';
import { type TaskListActions, useTaskListActions } from './task-list-actions';

/** The field that adds a task to a list (Cmd+N focuses it): `data-task-add` inside the list's `data-task-list`. */
export const taskAddId = (contextId: string, listId: string | null) => `task-add-${contextId}-${listId ?? 'inbox'}`;

/**
 * Cmd+N on a context's Tasks tab: the add field of the list focus is in, else of the first list
 * that has one on the page. False where no task list is shown (Cmd+N is New Post there).
 */
export function focusTaskAdd(): boolean {
    const active = document.activeElement;
    const within = active instanceof Element ? active.closest('[data-task-list]') : null;
    const field =
        within?.querySelector<HTMLInputElement>('input[data-task-add]') ??
        Array.from(document.querySelectorAll<HTMLInputElement>('[data-task-lists] input[data-task-add]')).find((el) => !el.closest('[inert], [hidden]')) ??
        null;
    if (!field || field.closest('[inert], [hidden]')) return false;
    field.focus();
    return true;
}

/** Who a task is assigned to, as up to three small pictures (the row's text names them). */
function Assignees({ task }: { task: Task }) {
    if (!task.assignees.length) return null;
    const shown = task.assignees.slice(0, 3);
    const more = task.assignees.length - shown.length;
    return (
        <span className="task-assignees" aria-hidden="true" title={assigneesText(task)}>
            {shown.map((p) => (
                <Avatar key={p.id} profile={p} size={22} />
            ))}
            {more > 0 ? <span className="task-assignees-more">+{more}</span> : null}
        </span>
    );
}

/**
 * Done or not: a checkbox (Space toggles it), named by the task. Completing is said in the list's
 * live region ("Completed: Print the posters"), and so is a refusal, after which it is as it was.
 * Disabled for who may not manage the task (its state is in the row's text too).
 */
export function TaskCheck({ task, announce, size = 'row' }: { task: Task; announce: (text: string) => void; size?: 'row' | 'large' }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);
    const toggle = () => {
        if (busy) return;
        const next = !task.completed;
        setBusy(true);
        setCompleted(api, queryClient, task, next).then(
            (saved) => announce(completedText(saved, saved.completed)),
            (e: unknown) => announce(next ? t('Could not complete “{{title}}”: {{reason}}', { title: task.title, reason: errorMessage(e) }) : t('Could not reopen “{{title}}”: {{reason}}', { title: task.title, reason: errorMessage(e) })),
        ).finally(() => setBusy(false));
    };
    return (
        <input
            type="checkbox"
            className={`task-check${size === 'large' ? ' task-check-large' : ''}`}
            checked={task.completed}
            disabled={!task.viewer?.can_complete}
            aria-busy={busy || undefined}
            aria-label={t('Done: {{title}}', { title: task.title })}
            onChange={toggle}
        />
    );
}

/**
 * One task in a list: its checkbox, its title (opens it beside the list; Cmd+click, Cmd+Enter
 * or a double-click: in a window of its own), when it is due (marked when overdue), where it is
 * (`where`: in My tasks) and who does it.
 */
export function TaskRow({ task, selected, where, announce }: { task: Task; selected: boolean; where: boolean; announce: (text: string) => void }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'task', id: task.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the detail shows it at once while it loads its own copy (with its text)
        if (!queryClient.getQueryData(taskKey(task.id))) queryClient.setQueryData(taskKey(task.id), task, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a, input')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    const due = dueText(task);
    const overdue = isOverdue(task);
    return (
        <li className="list-row task-row" data-selected={selected || undefined} data-completed={task.completed || undefined} onDoubleClick={onDoubleClick}>
            <span className="task-check-cell">
                <TaskCheck task={task} announce={announce} />
            </span>
            <div className="list-main">
                <button
                    type="button"
                    className="profile-link strong task-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi>{task.title}</bdi>
                    <span className="sr-only">{taskRowText(task, { where })}</span>
                </button>
                {due || (where && task.context) ? (
                    <span className="row-sub" aria-hidden="true">
                        {due ? (
                            <span className={overdue ? 'task-due task-overdue' : 'task-due'}>
                                <Icon name={overdue ? 'circle-alert' : 'calendar'} size={12} strong />
                                <time dateTime={task.due_at ?? undefined}>{due}</time>
                            </span>
                        ) : null}
                        {due && where && task.context ? <span>·</span> : null}
                        {where && task.context ? (
                            <bdi className="truncate">
                                {task.context.display_name}
                                {task.list_title ? ` · ${task.list_title}` : ''}
                            </bdi>
                        ) : null}
                    </span>
                ) : null}
            </div>
            <Assignees task={task} />
        </li>
    );
}

/** More of a list (its pages again from the first after a change: loadMoreTasks). */
function MoreTasks({ busy, onClick }: { busy: boolean; onClick: () => Promise<void> }) {
    return (
        <button
            type="button"
            className="btn btn-wide"
            onClick={() => {
                if (!busy) void onClick();
            }}
            aria-disabled={busy || undefined}
            aria-busy={busy}
        >
            {t('More tasks')}
        </button>
    );
}

/** The field at the end of a list that adds a task to it (Enter adds; focus stays for the next). */
export function AddTask({ contextId, list, announce, disabled = false }: { contextId: string; list: TaskList; announce: (text: string) => void; disabled?: boolean }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    // Cmd+N comes here while it is shown: the menu says New Task
    useTaskAddField();
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const text = title.trim();
        if (!text || busy || disabled) return;
        const problem = titleProblem(text);
        if (problem) {
            setError(problem);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await api.POST('/tasks', { body: { context_id: contextId, list_id: list.id, title: text } });
            if (result.error !== undefined || !result.data) {
                setError(problemMessage(result.error, t('The task was not added')));
                return;
            }
            setTitle('');
            announce(t('Added “{{title}}” to {{list}}', { title: result.data.title, list: list.title }));
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: contextTasksKey(contextId) }),
                queryClient.invalidateQueries({ queryKey: taskListsKey(contextId) }),
                queryClient.invalidateQueries({ queryKey: ['tasks', 'mine'] }),
                // the Tasks section's boards and their counts
                queryClient.invalidateQueries({ queryKey: ['tasks', 'board'] }),
                queryClient.invalidateQueries({ queryKey: ['task-facets'] }),
                queryClient.invalidateQueries({ queryKey: ['task-contexts'] }),
            ]);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <form className="task-add" onSubmit={(e) => void submit(e)}>
            <Icon name="plus" size={16} />
            <input
                id={taskAddId(contextId, list.id)}
                data-task-add=""
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                placeholder={t('Add a task')}
                aria-label={t('Add a task to {{list}}', { list: list.title })}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setTitle(e.target.value)}
                // shown before the lists have answered, so that nothing moves when they do
                disabled={disabled}
            />
            <button type="submit" className="btn" aria-disabled={disabled || busy || !title.trim() || undefined} aria-busy={busy || undefined}>
                {t('Add')}
            </button>
            {error ? (
                <p id={errorId} className="error" role="alert">
                    {error}
                </p>
            ) : null}
        </form>
    );
}

/**
 * One list of a context: its title and how many are open, its tasks of the pages loaded (open
 * first, then by due date; the tab loads them for every list at once), and its add field.
 */
function ContextTaskList({
    contextId,
    list,
    tasks,
    selectedId,
    announce,
    listActions,
}: {
    contextId: string;
    list: TaskList;
    tasks: readonly Task[];
    selectedId: string | null;
    announce: (text: string) => void;
    listActions: TaskListActions;
}) {
    const headingId = `task-list-${contextId}-${list.id ?? 'inbox'}`;
    const menuOwner = `task-list-menu-${headingId}`;
    const menuOpen = useMenuExpanded(menuOwner);
    // Rename and Delete, where the viewer may (New list is the tab's own button)
    const entries = listActions.entries(contextId, { canAddLists: false, list });
    return (
        <section className="task-list-section" data-task-list="" aria-labelledby={headingId}>
            <div className="task-list-head">
                {/* under the tab's own heading (Tasks, h3) */}
                <h4 id={headingId} className="task-list-heading">
                    <span>{list.title}</span>
                    <span className="task-list-count">
                        <span className="sr-only">, </span>
                        {openCountText(list)}
                    </span>
                </h4>
                {entries.length ? (
                    <Tooltip text={t('List actions')}>
                        <button
                            type="button"
                            className="tb-btn task-list-menu"
                            aria-label={t('Actions for the list {{list}}', { list: list.title })}
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={(e) => void showMenu(entries, { anchor: e.currentTarget }, { label: t('Actions for the list {{list}}', { list: list.title }), owner: menuOwner })}
                        >
                            <Icon name="ellipsis" />
                        </button>
                    </Tooltip>
                ) : null}
            </div>
            {tasks.length ? (
                <ul className="list rows task-list" aria-labelledby={headingId}>
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} selected={selectedId === task.id} where={false} announce={announce} />
                    ))}
                </ul>
            ) : null}
            {list.viewer?.can_add ? <AddTask contextId={contextId} list={list} announce={announce} /> : null}
        </section>
    );
}

/** New list: a title, then the list is there with its add field focused. */
function NewTaskList({ contextId, announce }: { contextId: string; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    // closed by Escape or Cancel while focus was in it: back to New list, not to the page
    const newButton = useRef<HTMLButtonElement>(null);
    const refocus = useRef(false);
    useEffect(() => {
        if (!open && refocus.current) {
            refocus.current = false;
            newButton.current?.focus();
        }
    }, [open]);
    const close = () => {
        refocus.current = true;
        setOpen(false);
        setError(null);
    };
    if (!open)
        return (
            <div className="tab-actions">
                <button ref={newButton} type="button" className="btn" onClick={() => setOpen(true)}>
                    <Icon name="plus" size={16} />
                    <span>{t('New list')}</span>
                </button>
            </div>
        );
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const text = title.trim();
        if (!text || busy) return;
        const problem = titleProblem(text);
        if (problem) {
            setError(problem);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const result = await api.POST('/task-lists', { body: { context_id: contextId, title: text } });
            if (result.error !== undefined || !result.data) {
                setError(problemMessage(result.error, t('The list was not added')));
                return;
            }
            const made = result.data;
            await queryClient.invalidateQueries({ queryKey: taskListsKey(contextId) });
            setTitle('');
            setOpen(false);
            announce(t('List “{{title}}” added', { title: made.title }));
            requestAnimationFrame(() => document.getElementById(taskAddId(contextId, made.id))?.focus());
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <form className="task-add task-new-list" onSubmit={(e) => void submit(e)}>
            <input
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                // it opens on the press of New list, to type its name
                autoFocus
                placeholder={t('List name')}
                aria-label={t('Name of the new list')}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        close();
                    }
                }}
            />
            <button type="submit" className="btn btn-primary" aria-disabled={busy || !title.trim() || undefined} aria-busy={busy || undefined}>
                {t('Add list')}
            </button>
            <button type="button" className="btn" onClick={close}>
                {t('Cancel')}
            </button>
            {error ? (
                <p id={errorId} className="error" role="alert">
                    {error}
                </p>
            ) : null}
        </form>
    );
}

/**
 * A context's Tasks tab: its lists (the Inbox first, shown when it has tasks or the viewer may
 * add some), each with its tasks and an add field (Cmd+N focuses the one of the list focus is
 * in), and New list for who may add lists.
 */
export function ContextTasks({ context, selectedId }: { context: Pick<Context, 'id' | 'display_name'>; selectedId: string | null }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [announcement, announce] = useAnnouncer();
    // a list renamed or deleted stays on this tab (a new one is the tab's own form)
    const listActions = useTaskListActions(announce, () => undefined);
    const lists = useQuery({ queryKey: taskListsKey(context.id), queryFn: () => fetchTaskLists(api, context.id) });
    // the tasks of every list in one request, grouped here by their list
    const tasks = useInfiniteQuery({
        queryKey: contextTasksKey(context.id),
        queryFn: async ({ pageParam }) => fetchContextTasks(api, context.id, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    const byList = tasksByList(tasks.data?.pages.flatMap((p) => p.items) ?? []);
    const shown = (lists.data?.items ?? []).filter((l) => l.id !== null || l.task_count > 0 || l.viewer?.can_add);
    const headingId = `context-${context.id}-tasks`;
    return (
        <section className="connections context-tasks" data-task-lists="" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Tasks')}
            </h3>
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            {lists.data?.can_add_lists ? <NewTaskList contextId={context.id} announce={announce} /> : null}
            {lists.isLoading || tasks.isLoading ? <SkeletonRows loading /> : null}
            {lists.isError ? <InlineError message={errorMessage(lists.error)} onRetry={() => void lists.refetch()} busy={lists.isFetching} /> : null}
            {tasks.isError ? <InlineError message={errorMessage(tasks.error)} onRetry={() => void tasks.refetch()} busy={tasks.isFetching} /> : null}
            <EmptyState shown={lists.isSuccess && !shown.length} icon="list-checks" title={t('No tasks in {{place}} yet', { place: context.display_name })} />
            {tasks.isLoading
                ? null
                : shown.map((l) => <ContextTaskList key={l.id ?? 'inbox'} contextId={context.id} list={l} tasks={byList.get(l.id) ?? []} selectedId={selectedId} announce={announce} listActions={listActions} />)}
            {tasks.hasNextPage ? <MoreTasks busy={tasks.isFetching} onClick={() => loadMoreTasks(queryClient, contextTasksKey(context.id), tasks)} /> : null}
            {listActions.dialog}
        </section>
    );
}
