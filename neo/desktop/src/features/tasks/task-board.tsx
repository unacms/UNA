import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type MouseEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import { problemMessage, type Schema } from 'una-api';

import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { Tooltip } from '../../components/tooltip';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { useListCommands } from '../../lib/list-commands';
import { isContextMenuKey, showMenu, type MenuEntry, useMenuExpanded } from '../../lib/native-menu';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { type ListRoute, tasksPage } from '../../lib/router';
import { readStoredJson, writeStoredJson } from '../../lib/storage';
import { Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { contextKind, fetchMembers } from '../groups/groups';
import { SideCard, SideColumns } from '../page-blocks/side-columns';
import {
    type BoardView,
    boardKey,
    choicesKey,
    clockText,
    durationWords,
    estimateSeconds,
    facetsKey,
    fetchBoard,
    fetchChoices,
    fetchFacets,
    fetchSavedFilters,
    FILTER_FIELDS,
    FILTER_LABELS,
    type FilterField,
    GROUP_BY,
    GROUP_LABELS,
    type GroupBy,
    groupHeadingText,
    groupTasks,
    hasFilters,
    labelColor,
    priorityIcon,
    savedFiltersKey,
    setTaskOrder,
    SORT_BY,
    SORT_LABELS,
    type SortBy,
    stateIcon,
    TASK_CONTEXTS_KEY,
    type TaskChoices,
    type TaskContext,
    type TaskFacets,
    type TaskFilters,
    type TaskGroup,
    type TaskScope,
    type TaskShow,
    toggleFilter,
} from './board';
import { changeTask } from './task-actions';
import { AddTask } from './task-list';
import { type ListRights, type TaskListActions, useTaskListActions } from './task-list-actions';
import { assigneesText, dueText, fetchTaskLists, isOverdue, type Task, type TaskList, taskKey, taskListsKey, titleProblem, TITLE_MAX } from './tasks';

const PAGE = 50;

/** The contexts one has tasks in, with their lists and counts (the sidebar's Tasks, a board's title). */
export function useTaskContexts() {
    const { api } = useApp();
    return useQuery({ queryKey: TASK_CONTEXTS_KEY, queryFn: async (): Promise<TaskContext[]> => (await api.GET('/me/task-contexts')).data?.items ?? [] });
}

/** The types, priorities, estimates, states and labels a task may have here (a context's own where it has them). */
export function useTaskChoices(contextId: string | null, enabled = true) {
    const { api } = useApp();
    return useQuery({ queryKey: choicesKey(contextId), queryFn: () => fetchChoices(api, contextId), staleTime: 5 * 60_000, enabled });
}

/** A context's members (the first 100): who a task may be assigned to there. */
export function useContextMembers(context: Pick<Schema<'Profile'>, 'id' | 'module'> | null | undefined, enabled = true) {
    const { api } = useApp();
    return useQuery({
        queryKey: ['task-members', context?.id ?? ''],
        queryFn: async () => (await fetchMembers(api, contextKind(context), context!.id, undefined, 100)).items.map((m) => m.profile),
        enabled: enabled && !!context,
        staleTime: 5 * 60_000,
    });
}

/*
 * Display options and filters: kept for the session (filters, per board) and on this computer (grouping, order)
 */

const DISPLAY_KEY = 'tasks-display';
type Display = { groupBy: GroupBy; sort: SortBy };

function savedDisplay(): Display {
    // nothing kept, or something else than a display, gives the defaults
    const d = (readStoredJson(DISPLAY_KEY) ?? {}) as Partial<Display>;
    return { groupBy: GROUP_BY.includes(d.groupBy as GroupBy) ? (d.groupBy as GroupBy) : 'state', sort: SORT_BY.includes(d.sort as SortBy) ? (d.sort as SortBy) : 'due' };
}

function saveDisplay(d: Display): void {
    writeStoredJson(DISPLAY_KEY, d);
}

/** Each board's filters for this run, per network (a context id of one network is another's too). */
const sessionFilters = new Map<string, TaskFilters>();
const scopeKey = (siteUrl: string, s: TaskScope) => `${siteUrl} ${s.kind === 'mine' ? `mine-${s.role}` : `context-${s.contextId}`}`;

/*
 * A row
 */

/** What a row says after the task's title: its state and priority, kind, labels, time, when it is due, where and who. */
export function taskLineText(task: Task, where: boolean): string {
    const spent = task.time_spent;
    const estimate = estimateSeconds(task);
    const parts = [
        task.completed ? t('completed') : null,
        task.state ? task.state.title : null,
        task.priority ? t('{{priority}} priority', { priority: task.priority.title }) : null,
        task.type ? task.type.title : null,
        task.labels.length ? t('labels {{labels}}', { labels: task.labels.map((l) => l.title).join(', ') }) : null,
        spent || estimate ? (estimate ? t('{{spent}} spent of {{estimate}}', { spent: durationWords(spent), estimate: durationWords(estimate) }) : t('{{spent}} spent', { spent: durationWords(spent) })) : null,
        task.timer ? (task.timer.state === 'running' ? t('your timer running') : t('your timer paused')) : null,
        isOverdue(task) ? t('overdue') : null,
        task.due_at ? t('due {{when}}', { when: dueText(task) }) : null,
        where && task.context ? (task.list_title ? t('in {{place}}, {{list}}', { place: task.context.display_name, list: task.list_title }) : t('in {{place}}', { place: task.context.display_name })) : null,
        task.assignees.length ? t('assigned to {{names}}', { names: assigneesText(task) }) : null,
    ];
    return `, ${parts.filter(Boolean).join(', ')}`;
}

/**
 * A task's state as a button: its icon, and a menu of the states (a done one completes it) with
 * Complete or Reopen, for who may manage it; the icon alone otherwise.
 */
export function StateButton({ task, choices, announce }: { task: Task; choices: TaskChoices | undefined; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const owner = `task-state-${task.id}`;
    const open = useMenuExpanded(owner);
    const icon = <Icon name={stateIcon(task.state, task.completed)} size={16} />;
    if (!task.viewer?.can_complete)
        return (
            <span className="task-state-icon" data-done={task.completed || undefined} aria-hidden="true">
                {icon}
            </span>
        );
    const run = (changes: Parameters<typeof changeTask>[3], shown: Partial<Task>, said: string) =>
        changeTask(api, queryClient, task, changes, shown).then(
            () => announce(said),
            (e: unknown) => announce(t('Could not change “{{title}}”: {{reason}}', { title: task.title, reason: errorMessage(e) })),
        );
    const entries = (): MenuEntry[] => [
        ...(choices?.states ?? []).map((s) => ({ text: s.title, checked: s.id === task.state?.id, run: () => void run({ state_id: s.id }, { state: s, completed: !!s.done }, `${task.title}: ${s.title}`) })),
        'separator' as const,
        task.completed ? { text: t('Reopen'), run: () => void run({ completed: false }, { completed: false }, t('Reopened: {{title}}', { title: task.title })) } : { text: t('Mark as Completed'), run: () => void run({ completed: true }, { completed: true }, t('Completed: {{title}}', { title: task.title })) },
    ];
    const title = task.title;
    const state = task.state?.title;
    const label = state
        ? task.completed
            ? t('State of “{{title}}”: {{state}}, completed', { title, state })
            : t('State of “{{title}}”: {{state}}', { title, state })
        : task.completed
          ? t('State of “{{title}}”: none, completed', { title })
          : t('State of “{{title}}”: none', { title });
    return (
        <button
            type="button"
            className="task-state-icon task-state-button"
            data-done={task.completed || undefined}
            aria-label={label}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={(e) => void showMenu(entries(), { anchor: e.currentTarget }, { label: t('State'), owner })}
        >
            {icon}
        </button>
    );
}

/** A label: a dot of its colour and its name. */
export function LabelChip({ label }: { label: Task['labels'][number] }) {
    return (
        <span className="task-chip">
            <span className="task-dot" style={{ background: labelColor(label) }} />
            <bdi>{label.title}</bdi>
        </span>
    );
}

/**
 * One task, dense: its priority, its state (a menu), its title (opens it beside the list;
 * Cmd+click, Cmd+Enter or a double-click: in a window of its own), its type and labels, its time
 * against its estimate, a running timer, when it is due, where (My tasks) and who does it.
 * Completed ones are struck through. Screen readers hear it all after the title.
 */
export function TaskLine({ task, selected, where, choices, announce }: { task: Task; selected: boolean; where: boolean; choices: TaskChoices | undefined; announce: (text: string) => void }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'task', id: task.id } as const;
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
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
    const estimate = estimateSeconds(task);
    const shown = task.assignees.slice(0, 3);
    return (
        <li className="task-line" data-selected={selected || undefined} data-completed={task.completed || undefined} onDoubleClick={onDoubleClick}>
            <span className="task-priority" data-priority={task.priority?.id ?? ''} aria-hidden="true" title={task.priority ? t('{{priority}} priority', { priority: task.priority.title }) : t('No priority')}>
                <Icon name={priorityIcon(task.priority)} size={16} />
            </span>
            <StateButton task={task} choices={choices} announce={announce} />
            <button
                type="button"
                className="task-line-title"
                data-open=""
                data-task-id={task.id}
                aria-current={selected ? 'true' : undefined}
                onClick={(m) => open(m)}
                onKeyDown={(k) => {
                    if (!openInWindow || !isWindowKey(k)) return;
                    k.preventDefault();
                    openInWindow(detail);
                }}
            >
                <bdi>{task.title}</bdi>
                <span className="sr-only">{taskLineText(task, where)}</span>
            </button>
            <span className="task-line-meta" aria-hidden="true">
                {task.type ? <span className="task-chip task-type">{task.type.title}</span> : null}
                {task.labels.map((l) => (
                    <LabelChip key={l.id} label={l} />
                ))}
                {task.time_spent || estimate ? (
                    <span className="task-chip task-time" title={t('Time spent / estimate')}>
                        <Icon name="clock" size={12} strong />
                        {clockText(task.time_spent)}
                        {estimate ? ` / ${clockText(estimate)}` : ''}
                    </span>
                ) : null}
                {task.timer?.state === 'running' ? (
                    <span className="task-timer-dot" title={t('Your timer is running')}>
                        <Icon name="timer" size={14} />
                    </span>
                ) : null}
                {where && task.context ? (
                    <span className="task-chip task-where">
                        <Avatar profile={task.context} size={14} />
                        <bdi className="truncate">{task.context.display_name}</bdi>
                    </span>
                ) : null}
                {due ? (
                    <span className={overdue ? 'task-line-due task-overdue' : 'task-line-due'}>
                        <time dateTime={task.due_at ?? undefined}>{due}</time>
                    </span>
                ) : null}
                <span className="task-assignees">
                    {shown.map((p) => (
                        <Avatar key={p.id} profile={p} size={20} />
                    ))}
                    {task.assignees.length > shown.length ? <span className="task-assignees-more">+{task.assignees.length - shown.length}</span> : null}
                </span>
            </span>
        </li>
    );
}

/*
 * Adding under a group
 */

/** The field a group's + opens: a title; Enter adds it with the group's state, priority or list, Esc closes. */
function QuickAdd({ contextId, listId, group, onDone, announce }: { contextId: string; listId: string | null; group: TaskGroup; onDone: () => void; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
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
            const list = group.preset.list_id !== undefined ? group.preset.list_id : listId === 'inbox' ? null : listId;
            const result = await api.POST('/tasks', { body: { context_id: contextId, list_id: list, title: text, state_id: group.preset.state_id, priority_id: group.preset.priority_id } });
            if (result.error !== undefined || !result.data) {
                setError(problemMessage(result.error, t('The task was not added')));
                return;
            }
            setTitle('');
            announce(t('Added “{{title}}” to {{group}}', { title: result.data.title, group: group.label }));
            await Promise.all([queryClient.invalidateQueries({ queryKey: ['tasks'] }), queryClient.invalidateQueries({ queryKey: ['task-facets'] }), queryClient.invalidateQueries({ queryKey: TASK_CONTEXTS_KEY }), queryClient.invalidateQueries({ queryKey: taskListsKey(contextId) })]);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <form className="task-add task-quick-add" onSubmit={(e) => void submit(e)}>
            <Icon name="plus" size={16} />
            <input
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                // it opens on the press of the group's +, to type the title
                autoFocus
                placeholder={t('Task title')}
                aria-label={t('New task in {{group}}', { group: group.label })}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        onDone();
                    }
                }}
            />
            <button type="submit" className="btn btn-primary" aria-disabled={busy || !title.trim() || undefined} aria-busy={busy || undefined}>
                {t('Add')}
            </button>
            <button type="button" className="btn" onClick={onDone}>
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

/** One group: its heading (folds it; its count; + adds a task to it) and its tasks. */
function GroupSection({
    group,
    collapsed,
    onToggle,
    canAdd,
    contextId,
    listId,
    selectedId,
    where,
    choices,
    announce,
}: {
    group: TaskGroup;
    collapsed: boolean;
    onToggle: () => void;
    canAdd: boolean;
    contextId: string | null;
    listId: string | null;
    selectedId: string | null;
    where: boolean;
    choices: TaskChoices | undefined;
    announce: (text: string) => void;
}) {
    const [adding, setAdding] = useState(false);
    const plus = useRef<HTMLButtonElement>(null);
    const id = useId();
    const headingId = `${id}-heading`;
    const listDomId = `${id}-tasks`;
    return (
        <section className="task-group-section" aria-labelledby={headingId}>
            <h2 className="task-group-head" id={headingId}>
                <button type="button" className="task-group-toggle" aria-expanded={!collapsed} aria-controls={listDomId} onClick={onToggle}>
                    <span className="disclosure-chevron">
                        <Icon name="chevron-right" size={12} strong />
                    </span>
                    {group.icon ? (
                        <span className="task-group-icon" aria-hidden="true">
                            <Icon name={group.icon} size={16} />
                        </span>
                    ) : null}
                    <span className="sr-only">{groupHeadingText(group)}</span>
                    <span aria-hidden="true">
                        <bdi>{group.label}</bdi>
                        <span className="task-group-count">{group.count}</span>
                    </span>
                </button>
                {canAdd && contextId ? (
                    <Tooltip text={t('New task in {{group}}', { group: group.label })}>
                        <button ref={plus} type="button" className="tb-btn task-group-add" aria-label={t('New task in {{group}}', { group: group.label })} onClick={() => setAdding(true)}>
                            <Icon name="plus" size={16} />
                        </button>
                    </Tooltip>
                ) : null}
            </h2>
            {adding && contextId ? (
                <QuickAdd
                    contextId={contextId}
                    listId={listId}
                    group={group}
                    announce={announce}
                    onDone={() => {
                        setAdding(false);
                        requestAnimationFrame(() => plus.current?.focus());
                    }}
                />
            ) : null}
            {!collapsed ? (
                <ul className="task-lines" id={listDomId}>
                    {group.tasks.map((task) => (
                        <TaskLine key={task.id} task={task} selected={selectedId === task.id} where={where} choices={choices} announce={announce} />
                    ))}
                </ul>
            ) : null}
        </section>
    );
}

/*
 * Filters
 */

type FilterValue = { id: string; title: string; count?: number };

/** The values a filter offers, with how many tasks have each (the facets). */
function filterValues(field: FilterField, choices: TaskChoices | undefined, facets: TaskFacets | undefined, members: readonly Schema<'Profile'>[] | undefined, tasks: readonly Task[]): FilterValue[] {
    const count = (buckets: readonly Schema<'TaskFacetBucket'>[] | undefined, id: string) => buckets?.find((b) => b.id === id)?.count;
    switch (field) {
        case 'type':
            return (choices?.types ?? []).map((c) => ({ id: c.id, title: c.title, count: count(facets?.types, c.id) }));
        case 'priority':
            return (choices?.priorities ?? []).map((c) => ({ id: c.id, title: c.title, count: count(facets?.priorities, c.id) }));
        case 'estimate':
            return (choices?.estimates ?? []).map((c) => ({ id: c.id, title: c.title, count: count(facets?.estimates, c.id) }));
        case 'state':
            return (choices?.states ?? []).map((c) => ({ id: c.id, title: c.title, count: count(facets?.states, c.id) }));
        case 'label':
            return (choices?.labels ?? []).map((c) => ({ id: c.id, title: c.title, count: count(facets?.labels, c.id) }));
        case 'assignee': {
            const names = new Map<string, string>();
            for (const m of members ?? []) names.set(m.id, m.display_name);
            for (const task of tasks) for (const p of task.assignees) names.set(p.id, p.display_name);
            const ids = new Set([...(facets?.assignees ?? []).map((b) => b.id ?? ''), ...names.keys()].filter(Boolean));
            return [...ids].map((id) => ({ id, title: names.get(id) ?? t('Profile {{id}}', { id }), count: count(facets?.assignees, id) })).sort((a, b) => a.title.localeCompare(b.title));
        }
    }
}

function valueText(v: FilterValue): string {
    return v.count !== undefined ? `${v.title}  ${v.count}` : v.title;
}

/** "Priority: High, Urgent": an active filter's chip, with × to take it off. */
function FilterChips({ filters, values, savedTitle, onRemove, onClear }: { filters: TaskFilters; values: (f: FilterField) => FilterValue[]; savedTitle: string | null; onRemove: (f: FilterField | 'saved') => void; onClear: () => void }) {
    const chips: { key: FilterField | 'saved'; text: string }[] = [];
    if (filters.saved && savedTitle) chips.push({ key: 'saved', text: savedTitle });
    for (const f of FILTER_FIELDS) {
        const on = filters[f];
        if (!on?.length) continue;
        const all = values(f);
        chips.push({ key: f, text: `${FILTER_LABELS[f]}: ${on.map((id) => all.find((v) => v.id === id)?.title ?? id).join(', ')}` });
    }
    if (!chips.length) return null;
    return (
        <div className="task-filter-chips" role="group" aria-label={t('Filters on')}>
            {chips.map((c) => (
                <span key={c.key} className="task-filter-chip">
                    <bdi>{c.text}</bdi>
                    <button type="button" className="task-filter-remove" aria-label={t('Remove filter {{filter}}', { filter: c.text })} onClick={() => onRemove(c.key)}>
                        <Icon name="x" size={12} strong />
                    </button>
                </span>
            ))}
            <button type="button" className="link-button small" onClick={onClear}>
                {t('Clear filters')}
            </button>
        </div>
    );
}

/*
 * The side panel: lists (or contexts) and facets with counts, as UNA's Tasklists and Linear's
 * panel. A side card of the page's side column, painted as a page's side blocks are (the site's
 * default design box: the board is the app's own, no block of a site page).
 */

type AsideTab = 'lists' | 'labels' | 'priority' | 'assignees';

function BoardAside({
    scope,
    show,
    lists,
    contexts,
    facets,
    choices,
    filters,
    onFilter,
    assigneeName,
    listsLoading,
    facetsLoading,
    canAddLists,
    listActions,
}: {
    canAddLists: boolean;
    listActions: TaskListActions;
    listsLoading: boolean;
    facetsLoading: boolean;
    scope: TaskScope;
    show: TaskShow;
    lists: readonly TaskList[] | undefined;
    contexts: readonly TaskContext[] | undefined;
    facets: TaskFacets | undefined;
    choices: TaskChoices | undefined;
    filters: TaskFilters;
    onFilter: (f: FilterField, id: string) => void;
    assigneeName: (id: string) => string;
}) {
    const { history } = useNavigation();
    const route = useRoute();
    const tabs: AsideTab[] = scope.kind === 'context' ? ['lists', 'labels', 'priority', 'assignees'] : ['lists', 'labels', 'priority'];
    const [tab, setTab] = useState<AsideTab>('lists');
    const labels: Record<AsideTab, string> = { lists: scope.kind === 'context' ? t('Lists') : t('Contexts'), labels: t('Labels'), priority: t('Priority'), assignees: t('Assignees') };
    const n = (b: { count: number; open: number }) => (show === 'open' ? b.open : b.count - b.open);
    const panelId = `task-aside-${scope.kind}`;
    let rows: { key: string; text: string; count: number; color?: string; current: boolean; onClick: () => void; menu?: MenuEntry[] }[] = [];
    if (tab === 'lists' && scope.kind === 'context')
        rows = (lists ?? []).map((l) => ({
            key: l.id ?? 'inbox',
            text: l.title,
            count: show === 'open' ? l.open_count : l.task_count - l.open_count,
            current: (route.list.taskList ?? null) === (l.id ?? 'inbox'),
            onClick: () => history.push({ list: tasksPage({ context: scope.contextId, list: (route.list.taskList ?? null) === (l.id ?? 'inbox') ? null : (l.id ?? 'inbox'), completed: show === 'completed' }), detail: null }),
            // right-click (or Shift+F10): rename or delete it, where the viewer may
            menu: l.id ? listActions.entries(scope.contextId, { canAddLists: false, list: l }) : undefined,
        }));
    else if (tab === 'lists')
        rows = (facets?.contexts ?? []).map((b) => {
            const c = contexts?.find((x) => x.context.id === b.id);
            return { key: b.id ?? '', text: c?.context.display_name ?? t('Context {{id}}', { id: String(b.id) }), count: n(b), current: false, onClick: () => history.push({ list: tasksPage({ context: b.id ?? undefined }), detail: null }) };
        });
    else if (tab === 'labels')
        rows = (facets?.labels ?? [])
            .filter((b) => b.id)
            .map((b) => {
                const l = choices?.labels.find((x) => x.id === b.id);
                return { key: b.id!, text: l?.title ?? b.id!, color: l ? labelColor(l) : undefined, count: n(b), current: !!filters.label?.includes(b.id!), onClick: () => onFilter('label', b.id!) };
            });
    else if (tab === 'priority')
        rows = (facets?.priorities ?? [])
            .filter((b) => b.id)
            .map((b) => ({ key: b.id!, text: choices?.priorities.find((x) => x.id === b.id)?.title ?? b.id!, count: n(b), current: !!filters.priority?.includes(b.id!), onClick: () => onFilter('priority', b.id!) }));
    else rows = (facets?.assignees ?? []).filter((b) => b.id).map((b) => ({ key: b.id!, text: assigneeName(b.id!), count: n(b), current: !!filters.assignee?.includes(b.id!), onClick: () => onFilter('assignee', b.id!) }));
    const navigates = tab === 'lists';
    // the counts still on their way: rows of the same size, said once as loading
    const loading = tab === 'lists' && scope.kind === 'context' ? listsLoading : facetsLoading;
    return (
        <SideCard as="aside" title={t('Lists and counts')} titleShown={false} className="task-aside">
            <SegmentedTabs label={t('Show counts by')} values={tabs} labels={labels} current={tab} onChange={setTab} panelId={panelId} tabId={(value) => `${panelId}-${value}`} look="pills" fit />
            <ul className="task-aside-list" id={panelId} role="tabpanel" aria-labelledby={`${panelId}-${tab}`}>
                {loading
                    ? [0, 1, 2].map((i) => (
                          <li key={`wait-${i}`} className="task-aside-wait" aria-hidden="true">
                              <span className="skeleton-bar" style={{ width: `${70 - i * 15}%` }} />
                          </li>
                      ))
                    : null}
                {loading ? <li className="sr-only">{t('Loading the counts')}</li> : null}
                {loading ? null : rows.map((r) => (
                    <li key={r.key}>
                        <button
                            type="button"
                            className="task-aside-row"
                            aria-current={navigates && r.current ? 'true' : undefined}
                            aria-pressed={!navigates ? r.current : undefined}
                            onClick={r.onClick}
                            onContextMenu={(e) => {
                                if (!r.menu?.length) return;
                                e.preventDefault();
                                void showMenu(r.menu, { x: e.clientX, y: e.clientY, returnFocus: e.currentTarget }, { label: t('Actions for the list {{list}}', { list: r.text }) });
                            }}
                            onKeyDown={(e) => {
                                if (!r.menu?.length || !isContextMenuKey(e)) return;
                                e.preventDefault();
                                const b = e.currentTarget.getBoundingClientRect();
                                void showMenu(r.menu, { x: b.left, y: b.bottom + 4, returnFocus: e.currentTarget }, { label: t('Actions for the list {{list}}', { list: r.text }) });
                            }}
                        >
                            {r.color ? <span className="task-dot" style={{ background: r.color }} aria-hidden="true" /> : null}
                            <bdi className="truncate">{r.text}</bdi>
                            <span className="task-aside-count">{r.count}</span>
                        </button>
                    </li>
                ))}
                {!loading && !rows.length ? <li className="muted small task-aside-empty">{t('Nothing to count')}</li> : null}
            </ul>
            {tab === 'lists' && scope.kind === 'context' && canAddLists && !loading ? (
                <button type="button" className="task-aside-row task-aside-new" aria-haspopup="dialog" onClick={() => listActions.newList(scope.contextId)}>
                    <Icon name="plus" size={16} />
                    <span>{t('New list')}</span>
                </button>
            ) : null}
        </SideCard>
    );
}

/*
 * The board
 */

const SHOWS: readonly TaskShow[] = ['open', 'completed'];
const SHOW_LABELS: Record<TaskShow, string> = { open: t('Open', { context: 'state' }), completed: t('Completed') };
const ROLES = ['assigned', 'created'] as const;
const ROLE_LABELS = { assigned: t('Assigned'), created: t('Created', { context: 'mine' }) } as const;

/** The board's padding and the gap between it and its side column (styles.css .task-board): 12 + 12 + 24. */
const BOARD_CHROME = 48;
/** The pane's width from which the board has its side column of lists and counts. */
const BOARD_WIDE_FROM = 860;

/** The scope a Tasks route shows. */
export function routeScope(list: ListRoute): TaskScope {
    return list.taskContext ? { kind: 'context', contextId: list.taskContext, ...(list.taskList ? { listId: list.taskList } : {}) } : { kind: 'mine', role: list.taskRole === 'created' ? 'created' : 'assigned' };
}

/**
 * A list of tasks as Linear lists issues: My tasks (Assigned or Created) or a context's (one of
 * its lists), open or completed; grouped (state, priority, list, none; groups fold, their counts
 * are all their tasks), ordered, filtered as the site's Tasks page filters (its saved filters
 * too, as removable chips); a + on a group adds a task to it (in a context). Beside it, when the
 * pane is wide, the lists (or contexts) and the counts by label, priority and assignee.
 */
export function TaskBoard({ list }: { list: ListRoute }) {
    const { api, siteUrl } = useApp();
    const route = useRoute();
    const { history } = useNavigation();
    const [announcement, announce] = useAnnouncer();
    const scope = routeScope(list);
    const show: TaskShow = list.feed === 'completed' ? 'completed' : 'open';
    const contextId = scope.kind === 'context' ? scope.contextId : null;
    const key = scopeKey(siteUrl, scope);
    const [filters, setFiltersState] = useState<TaskFilters>(() => sessionFilters.get(key) ?? {});
    const setFilters = (f: TaskFilters) => {
        sessionFilters.set(key, f);
        setFiltersState(f);
    };
    const [display, setDisplayState] = useState<Display>(savedDisplay);
    const setDisplay = (d: Display) => {
        saveDisplay(d);
        setDisplayState(d);
    };
    const groupBy = display.groupBy;
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

    const view: BoardView = { scope, show, filters, sort: display.sort };
    const tasks = useInfiniteQuery({
        queryKey: boardKey(view),
        queryFn: async ({ pageParam }) => fetchBoard(api, view, pageParam as string | undefined, PAGE),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(tasks);
    // the rows first: what dresses them (counts, choices, filters, lists, members) is asked once
    // their own request has answered, so it does not compete with it on the site
    const rowsAnswered = tasks.isFetched || tasks.isError;
    const facets = useQuery({ queryKey: facetsKey({ scope, filters }), queryFn: () => fetchFacets(api, { scope, filters }), enabled: rowsAnswered });
    const choices = useTaskChoices(contextId, rowsAnswered);
    const saved = useQuery({ queryKey: savedFiltersKey(contextId), queryFn: () => fetchSavedFilters(api, contextId), staleTime: 5 * 60_000, enabled: rowsAnswered });
    const lists = useQuery({ queryKey: taskListsKey(contextId ?? ''), queryFn: () => fetchTaskLists(api, contextId!), enabled: !!contextId && rowsAnswered });
    const contexts = useTaskContexts();
    const items = useMemo(() => tasks.data?.pages.flatMap((p) => p.items) ?? [], [tasks.data]);
    const context = contexts.data?.find((c) => c.context.id === contextId)?.context ?? items.find((task) => task.context_id === contextId)?.context ?? null;
    const members = useContextMembers(context, scope.kind === 'context' && rowsAnswered);
    const groups = useMemo(() => groupTasks(items, groupBy, show, facets.data), [items, groupBy, show, facets.data]);
    const selectedId = route.detail?.kind === 'task' ? route.detail.id : null;

    // the order shown, for the detail's Previous and Next
    const visible = groups.filter((g) => !collapsed.has(g.key)).flatMap((g) => g.tasks.map((task) => task.id));
    const visibleKey = visible.join(',');
    useEffect(() => setTaskOrder(visibleKey ? visibleKey.split(',') : []), [visibleKey]);

    // j and k go from task to task, o opens the one with focus
    useListCommands((c) => {
        const rows = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pane="list"] .task-line-title'));
        const at = rows.indexOf(document.activeElement as HTMLButtonElement);
        if (c === 'next-item' || c === 'previous-item') {
            const next = rows[c === 'next-item' ? Math.min(at + 1, rows.length - 1) : Math.max(at - 1, 0)];
            next?.focus();
            return !!next;
        }
        if (c === 'open-item' && at >= 0) {
            rows[at]!.click();
            return true;
        }
        return false;
    });

    const listInfo = contextId ? (lists.data?.items ?? []).find((l) => (l.id ?? 'inbox') === (scope.kind === 'context' ? (scope.listId ?? null) : null)) : undefined;
    const title = scope.kind === 'mine' ? t('My tasks') : `${context?.display_name ?? t('Tasks')}${listInfo ? ` · ${listInfo.title}` : ''}`;
    const values = (f: FilterField) => filterValues(f, choices.data, facets.data, members.data, items);
    const fields = FILTER_FIELDS.filter((f) => f !== 'assignee' || scope.kind === 'context');
    const savedTitle = saved.data?.find((s) => s.id === filters.saved)?.title ?? null;
    const canAdd = !!contextId && !!(lists.data?.items ?? []).find((l) => l.id === null)?.viewer?.can_add;
    // where the add field adds: the list shown, else the Inbox (a stand-in while the lists load)
    const addList: TaskList = listInfo ??
        (lists.data?.items ?? []).find((l) => l.id === null) ?? {
            id: scope.kind === 'context' && scope.listId && scope.listId !== 'inbox' ? scope.listId : null,
            context_id: contextId ?? '',
            title: scope.kind === 'context' && scope.listId && scope.listId !== 'inbox' ? t('this list') : t('Inbox'),
            task_count: 0,
            open_count: 0,
            viewer: null,
        };

    const listActions = useTaskListActions(announce);
    const listRights: ListRights = { canAddLists: !!lists.data?.can_add_lists, list: listInfo };
    const listEntries = contextId ? listActions.entries(contextId, listRights) : [];
    const listsOwner = 'task-list-actions';
    const listsOpen = useMenuExpanded(listsOwner);

    const filterOwner = 'task-filter';
    const filterOpen = useMenuExpanded(filterOwner);
    const displayOwner = 'task-display';
    const displayOpen = useMenuExpanded(displayOwner);
    const savedOwner = 'task-saved';
    const savedOpen = useMenuExpanded(savedOwner);

    const openValues = (f: FilterField, anchor: HTMLElement) => {
        const on = new Set(filters[f] ?? []);
        void showMenu(
            values(f).map((v) => ({
                text: valueText(v),
                checked: on.has(v.id),
                run: () => {
                    setFilters(toggleFilter(filters, f, v.id));
                    announce(on.has(v.id) ? t('Removed filter {{filter}}: {{value}}', { filter: FILTER_LABELS[f], value: v.title }) : t('Added filter {{filter}}: {{value}}', { filter: FILTER_LABELS[f], value: v.title }));
                },
            })),
            { anchor },
            { label: FILTER_LABELS[f], owner: filterOwner },
        );
    };
    const openFilter = (anchor: HTMLElement) =>
        void showMenu(
            fields.map((f) => ({ text: `${FILTER_LABELS[f]}${filters[f]?.length ? ` (${filters[f]!.length})` : ''}…`, run: () => requestAnimationFrame(() => openValues(f, anchor)) })),
            { anchor },
            { label: t('Filter'), owner: filterOwner },
        );
    const openDisplay = (anchor: HTMLElement) =>
        void showMenu(
            [
                ...GROUP_BY.map((g) => ({ text: t('Group by: {{by}}', { by: GROUP_LABELS[g] }), checked: groupBy === g, run: () => setDisplay({ ...display, groupBy: g }) })),
                'separator' as const,
                ...SORT_BY.map((s) => ({ text: t('Order by: {{by}}', { by: SORT_LABELS[s] }), checked: display.sort === s, run: () => setDisplay({ ...display, sort: s }) })),
            ],
            { anchor },
            { label: t('Display options'), owner: displayOwner },
        );
    const openSaved = (anchor: HTMLElement) =>
        void showMenu(
            [
                { text: t('No saved filter'), checked: !filters.saved, run: () => setFilters({ ...filters, saved: undefined }) },
                'separator' as const,
                ...(saved.data ?? []).map((s) => ({ text: s.kind === 'context' ? t('{{title}} (this context)', { title: s.title }) : s.kind === 'mine' ? t('{{title}} (yours)', { title: s.title }) : s.title, checked: filters.saved === s.id, run: () => setFilters({ ...filters, saved: s.id }) })),
            ],
            { anchor },
            { label: t('Saved filters'), owner: savedOwner },
        );

    const empty = emptyListText(tasks, items.length, hasFilters(filters) ? t('No tasks match these filters') : show === 'open' ? t('Nothing to do') : t('Nothing completed yet'));
    const panelId = 'task-board-panel';
    const scopeTabs = (
        <div className="task-scopes">
            {scope.kind === 'mine' ? (
                <SegmentedTabs
                    label={t('Whose tasks')}
                    values={ROLES}
                    labels={ROLE_LABELS}
                    current={scope.role}
                    onChange={(r) => history.push({ list: tasksPage({ role: r, completed: show === 'completed' }), detail: null })}
                    panelId={panelId}
                    tabId={(r) => `task-role-${r}`}
                    fit={false}
                />
            ) : null}
            <SegmentedTabs
                label={t('Open or completed')}
                values={SHOWS}
                labels={SHOW_LABELS}
                current={show}
                onChange={(s) => history.push({ list: { ...list, feed: s === 'completed' ? 'completed' : undefined }, detail: null })}
                panelId={panelId}
                tabId={(s) => `task-show-${s}`}
                    fit={false}
            />
        </div>
    );
    const actions = (
        <>
            {listEntries.length ? (
                <Tooltip text={t('List actions')}>
                    <button
                        type="button"
                        className="tb-btn"
                        aria-label={listInfo?.id ? t('Actions for the list {{list}}', { list: listInfo.title }) : t('List actions')}
                        aria-haspopup="menu"
                        aria-expanded={listsOpen}
                        onClick={(e) => void showMenu(listEntries, { anchor: e.currentTarget }, { label: t('List actions'), owner: listsOwner })}
                    >
                        <Icon name="ellipsis" />
                    </button>
                </Tooltip>
            ) : null}
            <Tooltip text={t('Saved filters')}>
                <button type="button" className="tb-btn" aria-label={t('Saved filters')} aria-haspopup="menu" aria-expanded={savedOpen} aria-pressed={!!filters.saved} onClick={(e) => openSaved(e.currentTarget)}>
                    <Icon name="list-checks" />
                </button>
            </Tooltip>
            <Tooltip text={t('Filter')}>
                <button type="button" className="tb-btn" aria-label={t('Filter')} aria-haspopup="menu" aria-expanded={filterOpen} aria-pressed={hasFilters({ ...filters, saved: undefined })} onClick={(e) => openFilter(e.currentTarget)}>
                    <Icon name="list-filter" />
                </button>
            </Tooltip>
            <Tooltip text={t('Display options')}>
                <button type="button" className="tb-btn" aria-label={t('Display options')} aria-haspopup="menu" aria-expanded={displayOpen} onClick={(e) => openDisplay(e.currentTarget)}>
                    <Icon name="sliders-horizontal" />
                </button>
            </Tooltip>
        </>
    );
    const total = facets.data ? (show === 'open' ? facets.data.open : facets.data.completed) : null;

    return (
        <Pane pane="list" title={title} subtitle={total !== null ? (show === 'open' ? tn(total, '{{count}} open', '{{count}} open') : tn(total, '{{count}} completed', '{{count}} completed')) : undefined} ready={!tasks.isLoading} busy={tasks.isLoading} scope={scopeTabs} actions={actions}>
            <SideColumns
                className="task-board"
                data-task-lists=""
                chrome={BOARD_CHROME}
                wideFrom={BOARD_WIDE_FROM}
                sideClassName="task-aside-side"
                side={
                    <BoardAside
                        scope={scope}
                        show={show}
                        lists={lists.data?.items}
                        contexts={contexts.data}
                        facets={facets.data}
                        choices={choices.data}
                        filters={filters}
                        onFilter={(f, id) => setFilters(toggleFilter(filters, f, id))}
                        assigneeName={(id) => values('assignee').find((v) => v.id === id)?.title ?? t('Profile {{id}}', { id })}
                        listsLoading={!lists.data && !lists.isError}
                        canAddLists={!!lists.data?.can_add_lists}
                        listActions={listActions}
                        facetsLoading={!facets.data && !facets.isError}
                    />
                }
            >
                {() => (
                    <div className="task-board-main" id={panelId} role="tabpanel" aria-labelledby={scope.kind === 'mine' ? `task-role-${scope.role}` : `task-show-${show}`}>
                        <p className="sr-only" role="status" aria-live="polite">
                            {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                        </p>
                        <FilterChips
                            filters={filters}
                            values={values}
                            savedTitle={savedTitle}
                            onRemove={(f) => setFilters(f === 'saved' ? { ...filters, saved: undefined } : Object.fromEntries(Object.entries(filters).filter(([k]) => k !== f)))}
                            onClear={() => setFilters({})}
                        />
                        {scope.kind === 'context' && show === 'open' ? (
                            // its place is kept from the start: disabled until the lists say where it adds, a
                            // line of the same height where the viewer may not add
                            <div data-task-list="" className="task-add-slot">
                                {lists.data && !canAdd ? (
                                    <p className="task-add task-add-note muted">{t('Only who may post here adds tasks')}</p>
                                ) : (
                                    <AddTask contextId={contextId!} list={addList} disabled={!lists.data} announce={announce} />
                                )}
                            </div>
                        ) : null}
                        <SkeletonRows loading={tasks.isLoading} />
                        {tasks.isError ? <InlineError message={errorMessage(tasks.error)} onRetry={() => void tasks.refetch()} busy={tasks.isFetching} /> : null}
                        <EmptyState shown={!!empty} icon="list-checks" title={empty || t('Nothing to do')} hint={empty && !hasFilters(filters) && scope.kind === 'mine' ? t('Tasks assigned to you in groups and spaces show up here.') : undefined} />
                        {groups.map((g) => (
                            <GroupSection
                                key={g.key}
                                group={g}
                                collapsed={collapsed.has(g.key)}
                                onToggle={() => {
                                    const next = new Set(collapsed);
                                    if (next.has(g.key)) next.delete(g.key);
                                    else next.add(g.key);
                                    setCollapsed(next);
                                }}
                                canAdd={canAdd && show === 'open'}
                                contextId={contextId}
                                listId={scope.kind === 'context' ? (scope.listId ?? null) : null}
                                selectedId={selectedId}
                                where={scope.kind === 'mine'}
                                choices={choices.data}
                                announce={announce}
                            />
                        ))}
                        {tasks.hasNextPage ? (
                            <button type="button" className="btn btn-wide" onClick={() => void tasks.fetchNextPage()} aria-disabled={tasks.isFetching || undefined} aria-busy={tasks.isFetching}>
                                {t('More tasks')}
                            </button>
                        ) : null}
                    </div>
                )}
            </SideColumns>
            {listActions.dialog}
        </Pane>
    );
}
