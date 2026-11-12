import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type KeyboardEvent, type MouseEvent, useState } from 'react';

import { Avatar } from '../../components/avatar';
import { Icon } from '../../components/icon';
import { VisuallyHidden } from '../../components/visually-hidden';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import { isContextMenuKey, type MenuAt, showMenu } from '../../lib/native-menu';
import { useNavigation, useRoute } from '../../lib/navigation';
import { tasksPage } from '../../lib/router';
import { readStored, writeStored } from '../../lib/storage';
import { TIMERS_KEY, type TaskTimers } from './board';
import { useTaskContexts } from './task-board';
import { useTaskListActions } from './task-list-actions';
import { fetchTaskLists, taskListsKey } from './tasks';

const COLLAPSED_KEY = 'sidebar-tasks-collapsed';
/** The contexts unfolded, per network (`<key>:<site>`; the key alone: before networks had their own). */
const OPEN_CONTEXTS_KEY = 'sidebar-task-contexts-open';
const openContextsKey = (siteUrl: string) => `${OPEN_CONTEXTS_KEY}:${siteUrl}`;

/** The viewer's timers (My timers' query): the sidebar marks a running one. */
export function useMyTimers() {
    const { api } = useApp();
    return useQuery({ queryKey: TIMERS_KEY, queryFn: async (): Promise<TaskTimers> => unwrap(await api.GET('/me/timers')), staleTime: 60_000 });
}

/**
 * The sidebar's Tasks (the site's Tasks menu): My tasks, My timers (marked while one runs), and
 * the contexts one has tasks in, each with how many are open and, unfolded, its lists (the Inbox
 * first) with theirs. Each row shows its tasks in the content pane. The section folds away, and
 * each context's lists too (both remembered on this computer). A context's or a list's menu
 * (right-click, Shift+F10) adds, renames or deletes lists where the viewer may. `onPicked`: a row
 * was chosen.
 */
export function SidebarTasks({ onPicked }: { onPicked?: () => void }) {
    const route = useRoute();
    const { history } = useNavigation();
    const { api, siteUrl } = useApp();
    const queryClient = useQueryClient();
    const contexts = useTaskContexts();
    const [announcement, setAnnouncement] = useState('');
    const listActions = useTaskListActions(setAnnouncement, (list) => {
        history.push({ list: tasksPage({ context: list.context_id, list: list.id }), detail: null });
        onPicked?.();
    });
    // what the viewer may do there comes with the context's lists (asked once the menu is wanted)
    const openListMenu = async (contextId: string, contextName: string, listId: string | null, at: MenuAt) => {
        let rights;
        try {
            rights = await queryClient.fetchQuery({ queryKey: taskListsKey(contextId), queryFn: () => fetchTaskLists(api, contextId), staleTime: 60_000 });
        } catch {
            return;
        }
        const list = listId ? rights.items.find((l) => l.id === listId) : null;
        const entries = listActions.entries(contextId, { canAddLists: rights.can_add_lists, list });
        void showMenu(entries, at, { label: list ? t('Actions for the list {{list}}', { list: list.title }) : t('Lists of {{place}}', { place: contextName }) });
    };
    const menuProps = (contextId: string, contextName: string, listId: string | null) => ({
        onContextMenu: (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            void openListMenu(contextId, contextName, listId, { x: e.clientX, y: e.clientY, returnFocus: e.currentTarget });
        },
        onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
            if (!isContextMenuKey(e)) return;
            e.preventDefault();
            const b = e.currentTarget.getBoundingClientRect();
            void openListMenu(contextId, contextName, listId, { x: b.left, y: b.bottom + 4, returnFocus: e.currentTarget });
        },
    });
    const timers = useMyTimers();
    const [collapsed, setCollapsed] = useState(() => readStored(COLLAPSED_KEY) === '1');
    const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set((readStored(openContextsKey(siteUrl)) ?? readStored(OPEN_CONTEXTS_KEY) ?? '').split(',').filter(Boolean)));
    const inTasks = route.list.section === 'tasks';
    const current = inTasks ? route.list : null;
    const running = (timers.data?.items ?? []).some((task) => task.timer?.state === 'running');
    const timerCount = timers.data?.items.length ?? 0;
    const go = (list: Parameters<typeof history.push>[0]['list']) => {
        history.push({ list, detail: null });
        onPicked?.();
    };
    const toggleContext = (id: string) => {
        const next = new Set(open);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setOpen(next);
        writeStored(openContextsKey(siteUrl), [...next].join(',') || null);
    };
    return (
        <div className="sidebar-groups sidebar-tasks">
            <h2 className="sidebar-heading">
                <button
                    type="button"
                    className="sidebar-disclosure"
                    aria-expanded={!collapsed}
                    aria-controls="sidebar-tasks-list"
                    onClick={() => {
                        setCollapsed(!collapsed);
                        writeStored(COLLAPSED_KEY, collapsed ? null : '1');
                    }}
                >
                    <span className="truncate">{t('Tasks')}</span>
                    <span className="disclosure-chevron">
                        <Icon name="chevron-right" size={12} strong />
                    </span>
                </button>
            </h2>
            {!collapsed ? (
                <ul id="sidebar-tasks-list" className="nav-list" aria-label={t('Tasks')}>
                    <li>
                        <button type="button" className="nav-item" aria-current={current && !current.taskContext && !current.taskView ? 'page' : undefined} onClick={() => go(tasksPage())}>
                            <span className="nav-icon">
                                <Icon name="list-checks" size={20} />
                            </span>
                            <span className="nav-label truncate">{t('My tasks')}</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className="nav-item" aria-current={current?.taskView === 'timers' ? 'page' : undefined} onClick={() => go(tasksPage({ view: 'timers' }))}>
                            <span className="nav-icon" data-running={running || undefined}>
                                <Icon name="timer" size={20} />
                            </span>
                            <span className="nav-label truncate">{t('My timers')}</span>
                            {timerCount ? (
                                <>
                                    <span className="nav-badge" aria-hidden="true">
                                        {timerCount}
                                    </span>
                                    <VisuallyHidden>{`, ${running ? tn(timerCount, '{{count}} timer, one running', '{{count}} timers, one running') : tn(timerCount, '{{count}} timer', '{{count}} timers')}`}</VisuallyHidden>
                                </>
                            ) : null}
                        </button>
                    </li>
                    {contexts.isError ? (
                        <li className="sidebar-note">
                            <span className="error small">{t('Could not load your task contexts.')}</span>{' '}
                            <button type="button" className="link-button small" onClick={() => void contexts.refetch()} aria-busy={contexts.isFetching}>
                                {t('Try again')}
                            </button>
                        </li>
                    ) : null}
                    {(contexts.data ?? []).map((c) => {
                        const id = c.context.id;
                        const here = current?.taskContext === id;
                        const expanded = open.has(id);
                        const listsId = `sidebar-task-lists-${id}`;
                        return (
                            <li key={id} className="nav-task-context">
                                <div className="nav-row">
                                    <button
                                        type="button"
                                        className="nav-item nav-group"
                                        aria-current={here && !current?.taskList && !current?.taskView ? 'page' : undefined}
                                        onClick={() => go(tasksPage({ context: id }))}
                                        {...menuProps(id, c.context.display_name, null)}
                                    >
                                        <span className="nav-icon">
                                            <Avatar profile={c.context} size={20} />
                                        </span>
                                        <span className="nav-label truncate" dir="auto">
                                            {c.context.display_name}
                                        </span>
                                        {c.open_count ? (
                                            <>
                                                <span className="nav-badge" aria-hidden="true">
                                                    {c.open_count}
                                                </span>
                                                <VisuallyHidden>{`, ${tn(c.open_count, '{{count}} open', '{{count}} open')}`}</VisuallyHidden>
                                            </>
                                        ) : null}
                                    </button>
                                    <button type="button" className="nav-fold" aria-expanded={expanded} aria-controls={listsId} aria-label={t('Lists of {{place}}', { place: c.context.display_name })} onClick={() => toggleContext(id)}>
                                        <span className="disclosure-chevron">
                                            <Icon name="chevron-right" size={12} strong />
                                        </span>
                                    </button>
                                </div>
                                {expanded ? (
                                    <ul id={listsId} className="nav-list nav-sublist" aria-label={t('Lists of {{place}}', { place: c.context.display_name })}>
                                        {c.lists.map((l) => {
                                            const listKey = l.id ?? 'inbox';
                                            return (
                                                <li key={listKey}>
                                                    <button
                                                        type="button"
                                                        className="nav-item nav-subitem"
                                                        aria-current={here && !current?.taskView && current?.taskList === listKey ? 'page' : undefined}
                                                        onClick={() => go(tasksPage({ context: id, list: listKey }))}
                                                        {...menuProps(id, c.context.display_name, l.id)}
                                                    >
                                                        <span className="nav-icon">
                                                            <Icon name={l.id ? 'list' : 'inbox'} size={16} />
                                                        </span>
                                                        <span className="nav-label truncate" dir="auto">
                                                            {l.title}
                                                        </span>
                                                        {l.open_count ? (
                                                            <>
                                                                <span className="nav-badge" aria-hidden="true">
                                                                    {l.open_count}
                                                                </span>
                                                                <VisuallyHidden>{`, ${tn(l.open_count, '{{count}} open', '{{count}} open')}`}</VisuallyHidden>
                                                            </>
                                                        ) : null}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        {c.can_view_budget ? (
                                            // the context's budget (its administrators'), after its lists: not a list
                                            <li>
                                                <button
                                                    type="button"
                                                    className="nav-item nav-subitem nav-budget"
                                                    aria-current={here && current?.taskView === 'budget' ? 'page' : undefined}
                                                    onClick={() => go(tasksPage({ context: id, view: 'budget' }))}
                                                >
                                                    <span className="nav-icon">
                                                        <Icon name="wallet" size={16} />
                                                    </span>
                                                    <span className="nav-label truncate">{t('Budget')}</span>
                                                    <VisuallyHidden>{`, ${t('hours of {{place}}', { place: c.context.display_name })}`}</VisuallyHidden>
                                                </button>
                                            </li>
                                        ) : null}
                                    </ul>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}
            <p className="sr-only" role="status" aria-live="polite">
                {announcement}
            </p>
            {listActions.dialog}
        </div>
    );
}
