import { readFileSync } from 'node:fs';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { ASIDE_DEFAULT, setAsideWidth } from '../../lib/aside-width';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { feedRoute, parseRoute, type Route, RouteHistory, routeToPath, tasksPage } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from '../groups/group-view';
import { commandEntries, navigationEntries } from '../palette/commands';
import { type BudgetEntry, entryHoursText, entryText, hoursProblem, hoursText, parseHours, percentText, spentShare, spentText } from './budget';
import { boardParams, clockText, groupTasks, neighbours, parseDuration, timerText, toggleFilter } from './board';
import { dateOf, dueFromDate } from './task-actions';
import { ContextTasks, focusTaskAdd } from './task-list';
import { completedText, dueGroup, dueText, isOverdue, openCountText, type Task, type TaskList, taskAddShown, taskRowText, tasksByList, titleProblem, withDueHeadings } from './tasks';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric Novak', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Top contributor', color: null, icon: null }] };
const guild: Schema<'Profile'> = { id: '725', kind: 'group', module: 'bx_spaces', display_name: 'Makers Guild', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const council: Schema<'Profile'> = { id: '728', kind: 'group', module: 'bx_spaces', display_name: 'Guild Council', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const MODULES: Schema<'ModuleInfo'>[] = [{ module: 'bx_tasks', tag: 'tasks', title: 'Tasks', kind: 'task' }];

/** Noon, `days` from today, here. */
function dayAt(days: number, hour = 12): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
}

function task(id: string, title: string, over: Partial<Task> = {}): Task {
    return {
        id,
        module: 'bx_tasks',
        title,
        summary: '',
        body_html: null,
        context_id: '725',
        context: guild,
        list_id: null,
        list_title: 'Inbox',
        author: eric,
        assignees: [lily],
        due_at: null,
        completed: false,
        priority: null,
        state: { id: '2', title: 'Todo', done: false },
        type: null,
        estimate: null,
        labels: [],
        time_spent: 0,
        timer: null,
        audience: 'context',
        moderation: 'approved',
        stats: { comments: 0, reactions: 0, views: 1 },
        content_id: null,
        url: `https://community.example/view-task/${id}`,
        viewer: { can_edit: false, can_complete: true, can_track_time: true, can_delete: false, can_comment: false, can_react: false, reaction: null },
        created_at: '2026-11-01T10:00:00Z',
        updated_at: '2026-11-01T10:00:00Z',
        ...over,
    };
}

describe('what tasks say of when they are due', () => {
    const now = new Date('2026-11-07T10:00:00Z');
    const zone = 'Europe/London';
    it('groups by the due day in the viewer’s zone: Overdue, Today, This week, Later, No due date', () => {
        const at = (iso: string) => dueGroup({ due_at: iso }, now, zone);
        expect([at('2026-11-06T23:30:00Z'), at('2026-11-07T00:30:00Z'), at('2026-11-07T23:00:00Z'), at('2026-11-08T09:00:00Z'), at('2026-11-13T09:00:00Z'), at('2026-11-14T09:00:00Z')]).toEqual(['overdue', 'today', 'today', 'week', 'week', 'later']);
        expect(dueGroup({ due_at: null }, now, zone)).toBe('none');
        // the same moment is another day further east
        expect(dueGroup({ due_at: '2026-11-07T20:00:00Z' }, now, 'Pacific/Auckland')).toBe('week');
        expect(isOverdue({ due_at: '2026-11-06T09:00:00Z', completed: false }, now, zone)).toBe(true);
        expect(isOverdue({ due_at: '2026-11-06T09:00:00Z', completed: true }, now, zone)).toBe(false);
    });

    it('names the day short, with the time unless it is midnight, and the year when not this one', () => {
        const at = (iso: string) => dueText({ due_at: iso }, now, zone, 'en-GB');
        expect(at('2026-11-07T17:00:00Z')).toBe('Today, 17:00');
        expect(at('2026-11-08T00:00:00Z')).toBe('Tomorrow');
        expect(at('2026-11-06T12:00:00Z')).toBe('Yesterday, 12:00');
        expect(at('2026-11-11T09:30:00Z')).toBe('Wed, 09:30');
        expect(at('2026-12-12T00:00:00Z')).toBe('12 Dec');
        expect(at('2027-01-03T00:00:00Z')).toBe('3 Jan 2027');
        expect(dueText({ due_at: null }, now, zone)).toBe('');
    });

    it('puts a heading with its count before each group, rows saying it all to screen readers', () => {
        const rows = withDueHeadings([task('1', 'A', { due_at: '2026-11-05T09:00:00Z' }), task('2', 'B', { due_at: '2026-11-06T09:00:00Z' }), task('3', 'C', { due_at: '2026-11-07T15:00:00Z' }), task('4', 'D')], now, zone);
        expect(rows.map((r) => (r.kind === 'heading' ? `${r.label} ${r.count}` : r.task.title))).toEqual(['Overdue 2', 'A', 'B', 'Today 1', 'C', 'No due date 1', 'D']);
        const t = task('5', 'Print the posters', { due_at: '2026-11-06T17:00:00Z', assignees: [lily, eric], list_title: 'Open Day' });
        expect(taskRowText(t, { now, zone })).toBe(`, overdue, due ${dueText(t, now, zone)}, in Makers Guild, Open Day, assigned to Lily Carter and Eric Novak`);
        expect(dueText(t, now, zone)).toMatch(/^Yesterday, /);
        expect(taskRowText({ ...t, completed: true, due_at: null, assignees: [] }, { where: false, now, zone })).toBe(', completed');
        expect([completedText(t, true), completedText(t, false)]).toEqual(['Completed: Print the posters', 'Reopened: Print the posters']);
        expect([openCountText({ task_count: 0, open_count: 0 }), openCountText({ task_count: 3, open_count: 0 }), openCountText({ task_count: 3, open_count: 2 })]).toEqual(['No tasks', 'All done', '2 open']);
    });

    it('groups a context’s tasks by their list in the order they came, and checks titles as the site’s forms do', () => {
        const byList = tasksByList([task('1', 'A', { list_id: '4' }), task('2', 'B'), task('3', 'C', { list_id: '4' })]);
        expect([...byList.entries()].map(([k, v]) => [k, v.map((t) => t.id)])).toEqual([
            ['4', ['1', '3']],
            [null, ['2']],
        ]);
        expect([titleProblem('  ab '), titleProblem('Abc'), titleProblem('é'.repeat(160)), titleProblem('a'.repeat(161))]).toEqual([
            'A title needs at least 3 characters',
            null,
            null,
            'A title can have up to 160 characters',
        ]);
    });
});

describe('where tasks are', () => {
    it('has My tasks, a task beside it or a context page and in a window of its own, and a Tasks tab where the site lets tasks in', () => {
        const route: Route = { list: { section: 'tasks' }, detail: { kind: 'task', id: '12' } };
        expect(routeToPath(route)).toBe('/tasks/task/12');
        expect(parseRoute('/tasks/task/12')).toEqual(route);
        expect(parseRoute('/tasks?feed=completed')).toEqual({ list: { section: 'tasks', feed: 'completed' }, detail: null });
        expect(routeToPath({ list: feedRoute('tasks', 'open'), detail: null })).toBe('/tasks');
        expect(parseRoute('/spaces/task/12?space=725&tab=tasks')).toEqual({ list: { section: 'spaces', group: '725', groupTab: 'tasks' }, detail: { kind: 'task', id: '12' } });
        expect(parseRoute('/tasks/task/x')).toBeNull();
        expect(parseRoute('/tasks/task/12/comments')).toBeNull();
        expect(opensInWindow({ kind: 'task', id: '12' })).toBe(true);
        expect(contextTabs({ content_visible: true, content_kinds: ['tasks', 'events'] }, 'space')).toEqual(['posts', 'spaces', 'events', 'tasks', 'members', 'about']);
        expect(contextTabs({ content_visible: false, content_kinds: ['tasks'] }, 'group')).toEqual(['about']);
        const entries = navigationEntries(() => undefined, { tasks: true });
        expect(entries.find((e) => e.label === 'My tasks')?.action).toEqual({ kind: 'list', list: { section: 'tasks' } });
        expect(entries.find((e) => e.label === 'My tasks: Completed')?.action).toEqual({ kind: 'list', list: { section: 'tasks', feed: 'completed' } });
        expect(navigationEntries(() => undefined).some((e) => e.label === 'My tasks')).toBe(false);
    });
});

type Call = { method: string; path: string; query: string; body: string };

const STATES = [
    { id: '1', title: 'Backlog', done: false },
    { id: '2', title: 'Todo', done: false },
    { id: '3', title: 'In Progress', done: false },
    { id: '4', title: 'In Review', done: false },
    { id: '7', title: 'Done', done: true },
];
const CHOICES = {
    context_id: null,
    types: [
        { id: '1', title: 'Bug' },
        { id: '2', title: 'Feature' },
    ],
    priorities: [
        { id: '1', title: 'Urgent' },
        { id: '2', title: 'High' },
        { id: '3', title: 'Medium' },
    ],
    estimates: [
        { id: '2', title: '2 points', points: 2 },
        { id: '4', title: '4 points', points: 4 },
    ],
    states: STATES,
    labels: [
        { id: '1', title: 'Volunteers', color: '#30a46c' },
        { id: '2', title: 'Print', color: null },
    ],
};

/** The counts of these tasks by state, priority and label, as GET /tasks/facets answers. */
function facetsOf(tasks: Task[]) {
    const by = (key: (t: Task) => (string | null)[]) => {
        const m = new Map<string | null, { id: string | null; count: number; open: number }>();
        for (const t of tasks)
            for (const id of key(t)) {
                const b = m.get(id) ?? { id, count: 0, open: 0 };
                b.count++;
                if (!t.completed) b.open++;
                m.set(id, b);
            }
        return [...m.values()];
    };
    const open = tasks.filter((t) => !t.completed).length;
    return {
        total: tasks.length,
        open,
        completed: tasks.length - open,
        states: by((t) => [t.state?.id ?? null]),
        priorities: by((t) => [t.priority?.id ?? null]),
        types: by((t) => [t.type?.id ?? null]),
        estimates: by((t) => [t.estimate?.id ?? null]),
        labels: by((t) => (t.labels.length ? t.labels.map((l) => l.id) : [null])),
        lists: [],
        contexts: tasks.length ? [{ id: '725', count: tasks.length, open }] : [],
        assignees: by((t) => t.assignees.map((p) => p.id)),
    };
}

function site({ refuse = false, pages = false, holdList, hold = {}, emptyFacets = false }: { refuse?: boolean; pages?: boolean; holdList?: Promise<void>; hold?: Record<string, Promise<void>>; emptyFacets?: boolean } = {}) {
    const mine: Task[] = [
        task('1', 'Print the posters', { due_at: dayAt(-1), list_id: '4', list_title: 'Open Day', state: STATES[2]!, priority: { id: '2', title: 'High' }, labels: [CHOICES.labels[0]!], type: { id: '1', title: 'Bug' }, estimate: { id: '4', title: '4 points', points: 4 }, time_spent: 5400 }),
        task('2', 'Book the coffee cart', { due_at: dayAt(0, 23), priority: { id: '1', title: 'Urgent' } }),
        task('3', 'Thank-you notes', { content_id: '7405', stats: { comments: 2, reactions: 0, views: 1 }, timer: { state: 'running', seconds: 125, started_at: '2026-11-08T10:00:00Z' } }),
    ];
    const lists: TaskList[] = [
        { id: null, context_id: '725', title: 'Inbox', task_count: 1, open_count: 1, viewer: { can_add: true, can_edit: false, can_delete: false } },
        { id: '4', context_id: '725', title: 'Open Day', task_count: 1, open_count: 1, viewer: { can_add: true, can_edit: true, can_delete: true } },
    ];
    const calls: Call[] = [];
    // Makers Guild's budget: three entries, 7 hours 16 minutes logged on its tasks
    let nextEntry = 4;
    const entries: BudgetEntry[] = [
        { id: '3', context_id: '725', author: eric, hours: -12, note: 'Tool upkeep moved to the Woodshop budget', created_at: '2026-11-06T10:00:00Z', can_edit: true, can_delete: true },
        { id: '2', context_id: '725', author: lily, hours: 40, note: 'Open Day prep', created_at: '2026-10-28T10:00:00Z', can_edit: true, can_delete: true },
        { id: '1', context_id: '725', author: lily, hours: 120, note: 'Autumn season', created_at: '2026-09-21T10:00:00Z', can_edit: true, can_delete: true },
    ];
    const spent = 26160;
    const budgetAnswer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/task-contexts/728/budget' || c.path === '/task-contexts/728/budget/entries')
            return { status: 403, body: { type: 'urn:una:problem:forbidden', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'Only the context\'s administrators see its budget' } };
        if (c.path === '/task-contexts/725/budget') {
            const total = entries.reduce((n, e) => n + e.hours, 0) * 3600;
            return { status: 200, body: { context_id: '725', context: guild, total_seconds: total, spent_seconds: spent, remaining_seconds: total - spent, remaining_percent: total > 0 ? Math.round((10000 * (total - spent)) / total) / 100 : null, can_add: true } };
        }
        if (c.path === '/task-contexts/725/budget/entries' && c.method === 'GET') {
            const q = new URLSearchParams(c.query).get('q') ?? '';
            return { status: 200, body: { items: entries.filter((e) => !q || (e.note ?? '').toLowerCase().includes(q.toLowerCase())), next_cursor: null } };
        }
        if (c.path === '/task-contexts/725/budget/entries' && c.method === 'POST') {
            const b = JSON.parse(c.body) as { hours: number; note: string | null };
            const added: BudgetEntry = { id: String(nextEntry++), context_id: '725', author: lily, hours: b.hours, note: b.note, created_at: new Date().toISOString(), can_edit: true, can_delete: true };
            entries.unshift(added);
            return { status: 201, body: added };
        }
        const one = /^\/task-budget-entries\/(\d+)$/.exec(c.path);
        if (one?.[1]) {
            const at = entries.findIndex((e) => e.id === one[1]);
            if (at < 0) return { status: 404, body: { type: 'urn:una:problem:not_found', title: 'Not found', status: 404, code: 'not_found' } };
            if (c.method === 'DELETE') {
                entries.splice(at, 1);
                return { status: 204 };
            }
            entries[at] = { ...entries[at]!, ...(JSON.parse(c.body) as Partial<BudgetEntry>) };
            return { status: 200, body: entries[at] };
        }
        return null;
    };
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules: MODULES } };
        if (c.path === '/me/tasks') {
            // in pages of two: the first, then the rest
            if (!pages) return { status: 200, body: { items: mine, next_cursor: null } };
            return c.query.includes('cursor=') ? { status: 200, body: { items: mine.slice(2), next_cursor: null } } : { status: 200, body: { items: mine.slice(0, 2), next_cursor: 'c2' } };
        }
        if (c.path === '/task-lists' && c.method === 'GET') return { status: 200, body: { context_id: '725', items: lists, can_add_lists: true, priorities: [], states: [] } };
        if (c.path === '/tasks' && c.method === 'GET') return { status: 200, body: { items: [mine[0], mine[2]], next_cursor: null } };
        if (c.path === '/tasks' && c.method === 'POST') return { status: 201, body: task('9', (JSON.parse(c.body) as { title: string }).title) };
        const m = /^\/tasks\/(\d+)$/.exec(c.path);
        if (m?.[1]) {
            const found = mine.find((t) => t.id === m[1]);
            if (!found) return { status: 404, body: { type: 'urn:una:problem:not_found', title: 'Not found', status: 404, code: 'not_found' } };
            if (c.method === 'PATCH') {
                if (refuse) return { status: 403, body: { type: 'urn:una:problem:forbidden', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'The viewer may not manage this task' } };
                return { status: 200, body: { ...found, ...(JSON.parse(c.body) as Partial<Task>) } };
            }
            return { status: 200, body: { ...found, body_html: `<p>About ${found.title}</p>` } };
        }
        if (c.path === '/task-lists' && c.method === 'POST') {
            const made: TaskList = { id: '8', context_id: '725', title: (JSON.parse(c.body) as { title: string }).title, task_count: 0, open_count: 0, viewer: { can_add: true, can_edit: true, can_delete: true } };
            lists.push(made);
            return { status: 201, body: made };
        }
        const list = /^\/task-lists\/(\d+)$/.exec(c.path);
        if (list?.[1]) {
            const at = lists.findIndex((l) => l.id === list[1]);
            if (at < 0) return { status: 404, body: { type: 'urn:una:problem:not_found', title: 'Not found', status: 404, code: 'not_found' } };
            if (c.method === 'DELETE') {
                lists.splice(at, 1);
                return { status: 204 };
            }
            lists[at] = { ...lists[at]!, title: (JSON.parse(c.body) as { title: string }).title };
            return { status: 200, body: lists[at] };
        }
        if (c.path === '/activities/7405')
            return {
                status: 200,
                body: {
                    id: '7405',
                    verb: 'posted',
                    actor: eric,
                    owner_id: '725',
                    object: { id: '7405', kind: 'task', module: 'bx_tasks', author: eric, anonymous: false, audience: 'context', context_id: '725', card: null, media: [], links: [], stats: { comments: 2, reactions: 0, reposts: 0, views: 0 }, viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false }, created_at: '2026-11-04T16:35:32Z' },
                    created_at: '2026-11-04T16:35:32Z',
                },
            };
        if (c.path === '/content/7405/comments')
            return {
                status: 200,
                body: {
                    items: [
                        { id: '31', target_id: '7405', parent_id: null, depth: 0, author: null, automated: true, body: 'Eric Novak completed the task', body_html: '<a href="https://community.example/u/eric">Eric Novak</a> completed the task', replies: 0, pinned: false, created_at: '2026-11-05T09:00:00Z', viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false } },
                        { id: '32', target_id: '7405', parent_id: null, depth: 0, author: eric, automated: false, body: 'Posters are at the printer', body_html: '<p>Posters are at the printer</p>', replies: 0, pinned: false, created_at: '2026-11-05T10:00:00Z', viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false } },
                    ],
                    next_cursor: null,
                },
            };
        if (c.path === '/me/groups' || c.path === '/me/spaces') return { status: 200, body: [] };
        if (c.path === '/tasks/choices') return { status: 200, body: CHOICES };
        if (c.path === '/task-filters') return { status: 200, body: { context_id: null, items: [{ id: '5', title: 'Assigned to current user and uncompleted', kind: 'system' }] } };
        if (c.path === '/me/tasks/facets' || c.path === '/tasks/facets') return { status: 200, body: facetsOf(emptyFacets ? [] : mine) };
        if (c.path === '/me/task-contexts')
            return {
                status: 200,
                body: {
                    items: [
                        { context: guild, module: 'bx_spaces', module_title: 'Spaces', task_count: 3, open_count: 3, lists: [{ id: null, title: 'Inbox', task_count: 2, open_count: 2 }, { id: '4', title: 'Open Day', task_count: 1, open_count: 1 }], can_view_budget: true },
                        { context: council, module: 'bx_spaces', module_title: 'Spaces', task_count: 1, open_count: 1, lists: [{ id: null, title: 'Inbox', task_count: 1, open_count: 1 }], can_view_budget: false },
                    ],
                },
            };
        const budget = budgetAnswer(c);
        if (budget) return budget;
        if (c.path === '/me/timers') return { status: 200, body: { items: mine.filter((t) => t.timer), total_seconds: 0 } };
        if (c.path === '/spaces/725/members') return { status: 200, body: { items: [lily, eric].map((p) => ({ profile: p, role: 'member', status: 'active', since: '2026-01-01T00:00:00Z' })), next_cursor: null } };
        const timer = /^\/tasks\/(\d+)\/timer$/.exec(c.path);
        if (timer?.[1]) {
            const found = mine.find((t) => t.id === timer[1])!;
            const action = (JSON.parse(c.body) as { action: string }).action;
            return { status: 200, body: { ...found, timer: action === 'clear' || action === 'log' ? null : { state: action === 'pause' ? 'paused' : 'running', seconds: 60, started_at: action === 'pause' ? null : '2026-11-08T10:00:00Z' } } };
        }
        const time = /^\/tasks\/(\d+)\/time$/.exec(c.path);
        if (time?.[1] && c.method === 'POST') return { status: 201, body: { id: '70', task_id: time[1], author: lily, seconds: 5400, date: '2026-11-08', text: null, created_at: '2026-11-08T10:00:00Z' } };
        if (time?.[1]) return { status: 200, body: { items: [], total_seconds: 0, viewer_seconds: 0, all: false, can_add: true } };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text() };
            calls.push(c);
            // the board's rows answered only once `holdList` settles
            if (holdList && c.path === '/me/tasks') await holdList;
            if (hold[c.path]) await hold[c.path];
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls };
}

const nav: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'tasks', label: 'Tasks', icon: 'list-checks' },
];

function Harness({ history, api, commands, children, siteUrl = 'https://community.example' }: { history: RouteHistory; api: UnaApi; commands?: { current: CommandHandler | null }; children?: ReactNode; siteUrl?: string }) {
    const own = useRef<CommandHandler | null>(null);
    const ctx: AppContextValue = { api, siteUrl, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>{children ?? <Shell siteUrl="https://community.example" items={nav} profile={lily} commands={commands ?? own} />}</RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, { children, commands, siteUrl }: { children?: ReactNode; commands?: { current: CommandHandler | null }; siteUrl?: string } = {}) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} commands={commands} siteUrl={siteUrl}>
                {children}
            </Harness>
        </QueryClientProvider>,
    );
    return { history, client };
}

const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 1200 : 800;
                return 0;
            },
        });
    }
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    setSiteModules(null);
});

describe('My tasks', () => {
    it('groups one’s open tasks by state with their counts, dense rows saying it all, and completes one from its state menu', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: { section: 'tasks' }, detail: null }, api);
        const progress = await screen.findByRole('heading', { level: 2, name: 'In Progress, 1 task' });
        expect(screen.getByRole('heading', { level: 2, name: 'Todo, 2 tasks' })).toBeTruthy();
        // In Progress before Todo, as the site's board has them
        const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
        expect(headings.findIndex((h) => h?.includes('In Progress'))).toBeLessThan(headings.findIndex((h) => h?.includes('Todo')));
        const row = within(progress.closest('section')!).getByRole('button', { name: /^Print the posters, In Progress, High priority, Bug, labels Volunteers, 1 hour 30 minutes spent of 4 hours, overdue/ });
        expect(row.closest('li')?.querySelector('.task-time')?.textContent?.trim()).toBe('1:30 / 4:00');
        expect(screen.getByRole('button', { name: /^Thank-you notes, .*your timer running/ })).toBeTruthy();
        // My tasks asks for one's own, open, and its counts
        expect(calls.find((c) => c.path === '/me/tasks')?.query).toContain('state=open');
        expect(calls.some((c) => c.path === '/me/tasks/facets')).toBe(true);

        fireEvent.click(screen.getByRole('button', { name: 'State of “Book the coffee cart”: Todo' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Mark as Completed' }));
        await waitFor(() => expect(screen.getByText('Completed: Book the coffee cart')).toBeTruthy());
        expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({ path: '/tasks/2', body: '{"completed":true}' });
        // it stays where it is, struck through, until the list loads again
        expect(screen.getByRole('button', { name: /^Book the coffee cart, completed/ }).closest('li')?.hasAttribute('data-completed')).toBe(true);
    });

    it('asks for the rows first, and for their counts, choices and filters only once the rows have answered', async () => {
        setSiteModules(MODULES);
        let release = () => {};
        const holdList = new Promise<void>((r) => (release = r));
        const { api, calls } = site({ holdList });
        renderApp({ list: { section: 'tasks' }, detail: null }, api);
        await waitFor(() => expect(calls.some((c) => c.path === '/me/tasks')).toBe(true));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        const dressing = ['/me/tasks/facets', '/tasks/choices', '/task-filters'];
        expect(calls.filter((c) => dressing.includes(c.path))).toEqual([]);
        release();
        await screen.findByRole('heading', { level: 2, name: 'Todo, 2 tasks' });
        await waitFor(() => expect(dressing.every((p) => calls.some((c) => c.path === p))).toBe(true));
    });

    it('puts a state back and says why when the site refuses', async () => {
        setSiteModules(MODULES);
        const { api } = site({ refuse: true });
        renderApp({ list: { section: 'tasks' }, detail: null }, api);
        fireEvent.click(await screen.findByRole('button', { name: 'State of “Thank-you notes”: Todo' }));
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'In Review' }));
        await waitFor(() => expect(screen.getByText(/Could not change “Thank-you notes”/)).toBeTruthy());
        expect(screen.getByRole('button', { name: 'State of “Thank-you notes”: Todo' })).toBeTruthy();
    });

    it('filters as the site’s Tasks page does, shows the filter as a chip that takes it off, groups by priority and folds a group', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: { section: 'tasks' }, detail: null }, api);
        await screen.findByRole('heading', { level: 2, name: 'Todo, 2 tasks' });

        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Priority…' }));
        fireEvent.click(await screen.findByRole('menuitemradio', { name: /^High/ }));
        await waitFor(() => expect(calls.some((c) => c.path === '/me/tasks' && new URLSearchParams(c.query).get('priority_id') === '2')).toBe(true));
        expect(calls.some((c) => c.path === '/me/tasks/facets' && new URLSearchParams(c.query).get('priority_id') === '2')).toBe(true);
        const chips = screen.getByRole('group', { name: 'Filters on' });
        fireEvent.click(within(chips).getByRole('button', { name: 'Remove filter Priority: High' }));
        await waitFor(() => expect(screen.queryByRole('group', { name: 'Filters on' })).toBeNull());

        // a saved filter of the site
        fireEvent.click(screen.getByRole('button', { name: 'Saved filters' }));
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Assigned to current user and uncompleted' }));
        await waitFor(() => expect(calls.some((c) => c.path === '/me/tasks' && new URLSearchParams(c.query).get('filter_id') === '5')).toBe(true));
        expect(within(screen.getByRole('group', { name: 'Filters on' })).getByText('Assigned to current user and uncompleted')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Display options' }));
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Group by: Priority' }));
        const urgent = await screen.findByRole('heading', { level: 2, name: 'Urgent, 1 task' });
        const toggle = within(urgent).getByRole('button', { name: 'Urgent, 1 task' });
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        fireEvent.click(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(screen.queryByRole('button', { name: /^Book the coffee cart,/ })).toBeNull();
        // the choice is kept on this computer
        expect(JSON.parse(localStorage.getItem('tasks-display') ?? '{}')).toMatchObject({ groupBy: 'priority' });
    });

    it('opens a task with its properties: keys open their menus, J goes to the next task, and its timer starts', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        const { history } = renderApp({ list: { section: 'tasks' }, detail: null }, api);
        fireEvent.click(await screen.findByRole('button', { name: /^Print the posters,/ }));
        expect(routeToPath(history.current)).toBe('/tasks/task/1');
        const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
        await waitFor(() => expect(within(detail).getByText('About Print the posters')).toBeTruthy());
        const props = within(detail).getByRole('complementary', { name: 'Properties' });
        expect(within(props).getByRole('button', { name: 'State: In Progress' }).getAttribute('aria-keyshortcuts')).toBe('s');
        expect(within(props).getByRole('button', { name: 'Priority: High' })).toBeTruthy();
        expect(within(props).getByText('1 hour 30 minutes spent of an estimate of 4 hours')).toBeTruthy();
        // where it is in the list beside it
        expect(within(detail).getByLabelText('Task 1 of 3')).toBeTruthy();

        // S opens its state's menu; a state is saved
        fireEvent.keyDown(within(detail).getByText('About Print the posters'), { key: 's' });
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'In Review' }));
        await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({ path: '/tasks/1', body: '{"state_id":"4"}' }));
        // L its labels: one more
        fireEvent.keyDown(within(detail).getByText('About Print the posters'), { key: 'l' });
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Print' }));
        await waitFor(() => expect(calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toContain('{"label_ids":["1","2"]}'));

        // its timer
        fireEvent.click(within(props).getByRole('button', { name: 'Start timer' }));
        await waitFor(() => expect(calls.find((c) => c.path === '/tasks/1/timer')?.body).toBe('{"action":"start"}'));
        await waitFor(() => expect(within(props).getByText('Your timer, running')).toBeTruthy());

        // J: the next task of the list
        fireEvent.keyDown(within(detail).getByText('About Print the posters'), { key: 'j' });
        await waitFor(() => expect(routeToPath(history.current)).not.toBe('/tasks/task/1'));
    });

    it('shows a task opened while the window is in the background at once, every property there, with no fade held at its first frame', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
        try {
            renderApp({ list: { section: 'tasks' }, detail: null }, api);
            fireEvent.click(await screen.findByRole('button', { name: /^Print the posters,/ }));
            const slot = document.querySelector<HTMLElement>('.pane-slot-detail')!;
            expect(slot.hidden).toBe(false);
            expect(slot.hasAttribute('data-enter')).toBe(false);
            const props = await within(slot).findByRole('complementary', { name: 'Properties' });
            const rows = Array.from(props.querySelectorAll('dt')).map((d) => d.textContent);
            expect(rows).toEqual(['State', 'Priority', 'Type', 'Estimate', 'Labels', 'Assignees', 'List', 'Due date', 'Time', 'Created', 'Updated']);
        } finally {
            focus.mockRestore();
        }
        // in a focused window it fades in, as other details do
        cleanup();
        vi.spyOn(document, 'hasFocus').mockReturnValue(true);
        renderApp({ list: { section: 'tasks' }, detail: null }, site().api);
        fireEvent.click(await screen.findByRole('button', { name: /^Print the posters,/ }));
        expect(document.querySelector('.pane-slot-detail')!.hasAttribute('data-enter')).toBe(true);
        vi.restoreAllMocks();
    });

    it('logs time typed as 1:30 on a day', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '1' } }, api);
        const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
        fireEvent.click(await within(detail).findByRole('button', { name: 'Log time…' }));
        const field = within(detail).getByRole('textbox', { name: 'Time spent' });
        expect(document.activeElement).toBe(field);
        fireEvent.change(field, { target: { value: 'soon' } });
        fireEvent.submit(field.closest('form')!);
        expect(within(detail).getByRole('alert').textContent).toBe('Write how long, as 1:30, 90m or 1.5h');
        fireEvent.change(field, { target: { value: '1:30' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        await waitFor(() => expect(screen.getByText('Logged 1 hour 30 minutes on Print the posters')).toBeTruthy());
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/tasks/1/time')!.body)).toMatchObject({ minutes: 90, text: null });
    });

    it('has a Tasks section in the sidebar: My tasks, My timers and the contexts with their lists and counts', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        const { history } = renderApp({ list: { section: 'tasks' }, detail: null }, api);
        const tasks = await screen.findByRole('list', { name: 'Tasks' });
        expect(within(tasks).getByRole('button', { name: 'My tasks' }).getAttribute('aria-current')).toBe('page');
        await waitFor(() => expect(within(tasks).getByRole('button', { name: 'My timers, 1 timer, one running' })).toBeTruthy());
        const guildRow = await within(tasks).findByRole('button', { name: 'Makers Guild, 3 open' });
        const fold = within(tasks).getByRole('button', { name: 'Lists of Makers Guild' });
        expect(fold.getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(fold);
        fireEvent.click(within(screen.getByRole('list', { name: 'Lists of Makers Guild' })).getByRole('button', { name: 'Open Day, 1 open' }));
        expect(routeToPath(history.current)).toBe('/tasks?context=725&list=4');
        // a context's board: its lists' tasks, and a + on each group that adds one in it
        await waitFor(() => expect(calls.some((c) => c.method === 'GET' && c.path === '/tasks' && new URLSearchParams(c.query).get('list_id') === '4')).toBe(true));
        fireEvent.click(guildRow);
        expect(routeToPath(history.current)).toBe('/tasks?context=725');
        const add = await screen.findByRole('button', { name: 'New task in In Progress' });
        fireEvent.click(add);
        const field = screen.getByRole('textbox', { name: 'New task in In Progress' });
        fireEvent.change(field, { target: { value: 'Hang the bunting' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/tasks')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/tasks')!.body)).toEqual({ context_id: '725', list_id: null, title: 'Hang the bunting', state_id: '3' });
    });

    it('lists one’s timers, the running one first, and pauses one', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: { section: 'tasks', taskView: 'timers' }, detail: null }, api);
        const list = await screen.findByRole('list', { name: 'Your timers, the running one first' });
        expect(within(list).getByRole('button', { name: /^Thank-you notes, running, 2 minutes/ })).toBeTruthy();
        fireEvent.click(within(list).getByRole('button', { name: 'Pause timer: Thank-you notes' }));
        await waitFor(() => expect(calls.find((c) => c.path === '/tasks/3/timer')?.body).toBe('{"action":"pause"}'));
        await waitFor(() => expect(screen.getByText('Timer paused: Thank-you notes')).toBeTruthy());
    });
});

/** Runs with every pane's body `width` px wide, measured (a ResizeObserver that never calls back). */
async function atPaneWidth(width: number, run: () => Promise<void>) {
    const before = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const hadObserver = 'ResizeObserver' in globalThis;
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get(this: HTMLElement) {
            return this.classList.contains('pane-body') ? width : 0;
        },
    });
    if (!hadObserver)
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    try {
        await run();
    } finally {
        if (before) Object.defineProperty(HTMLElement.prototype, 'clientWidth', before);
        if (!hadObserver) delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    }
}

describe('a task’s properties and the board’s panel, as a page’s side column', () => {
    afterEach(() => setAsideWidth(ASIDE_DEFAULT));

    it('are side cards as a page’s side blocks are, each beside its page with the divider that resizes every side column', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        await atPaneWidth(1200, async () => {
            renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '1' } }, api);
            const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
            const list = document.querySelector<HTMLElement>('[data-pane="list"]')!;
            const props = await within(detail).findByRole('complementary', { name: 'Properties' });
            // the default design box: the content's background in an outline, the block's padding, its title
            expect(props.classList.contains('page-block')).toBe(true);
            expect(props.hasAttribute('data-bg') && props.hasAttribute('data-padding')).toBe(true);
            expect(within(props).getByRole('heading', { level: 3, name: 'Properties' }).classList.contains('page-block-title')).toBe(true);
            expect(props.closest('.page-side')?.parentElement?.getAttribute('data-columns')).toBe('side');
            const panel = await within(list).findByRole('complementary', { name: 'Lists and counts' });
            expect(panel.classList.contains('page-block') && panel.hasAttribute('data-bg')).toBe(true);
            expect(panel.closest('.task-board')?.getAttribute('data-columns')).toBe('side');
            // no chips where the properties are beside the text
            expect(within(detail).queryByRole('group', { name: 'Properties' })).toBeNull();

            // one width for every side column: the task's divider moves the board's too
            const divider = within(detail).getByRole('separator', { name: 'Resize side column' });
            const boardDivider = within(list).getByRole('separator', { name: 'Resize side column' });
            expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT));
            fireEvent.keyDown(divider, { key: 'ArrowLeft' });
            expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT + 8));
            expect(boardDivider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT + 8));
            expect((divider.closest('.task-detail-grid') as HTMLElement).style.getPropertyValue('--aside-width')).toBe(`${ASIDE_DEFAULT + 8}px`);
        });
    });

    it('keeps the docked comment box in the main column, never under the properties', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        await atPaneWidth(1200, async () => {
            renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '3' } }, api);
            const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
            await within(detail).findByText('Posters are at the printer');
            const composer = await waitFor(() => {
                const el = detail.querySelector('.comment-composer.docked');
                expect(el).toBeTruthy();
                return el!;
            });
            expect(composer.closest('.task-detail-main')).toBeTruthy();
            expect(composer.closest('.page-side')).toBeNull();
        });
    });

    it('in a narrow pane are chips under the title that open the rows’ menus, with no Properties card', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        await atPaneWidth(600, async () => {
            renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '1' } }, api);
            const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
            await within(detail).findByText('About Print the posters');
            // the choices the menus list
            await waitFor(() => expect(calls.some((c) => c.path === '/tasks/choices')).toBe(true));
            await act(async () => {
                await new Promise((r) => setTimeout(r, 20));
            });
            const chips = within(detail).getByRole('group', { name: 'Properties' });
            expect(within(detail).queryByRole('complementary', { name: 'Properties' })).toBeNull();
            expect(within(detail).queryByRole('separator', { name: 'Resize side column' })).toBeNull();
            // the board has no panel beside it either
            expect(document.querySelector('[data-pane="list"] .task-aside')).toBeNull();
            // under the title, before the line of where it is
            expect(chips.previousElementSibling?.classList.contains('task-head')).toBe(true);
            const names = within(chips)
                .getAllByRole('button')
                .map((b) => b.getAttribute('aria-label')!.split(':')[0]);
            expect(names).toEqual(['State', 'Priority', 'Type', 'Estimate', 'Labels', 'Assignees', 'List', 'Due date', 'Time']);
            expect(within(chips).getByRole('button', { name: 'Assignees: Lily Carter' }).textContent).toContain('Lily Carter');
            expect(within(chips).getByRole('button', { name: 'Time: 1 hour 30 minutes spent of 4 hours' })).toBeTruthy();
            for (const b of within(chips).getAllByRole('button')) expect(b.getAttribute('aria-haspopup')).toBe('menu');

            // a chip opens its row's menu, and its key too
            const state = within(chips).getByRole('button', { name: 'State: In Progress' });
            expect(state.getAttribute('aria-keyshortcuts')).toBe('s');
            fireEvent.click(state);
            fireEvent.click(await screen.findByRole('menuitemradio', { name: 'In Review' }));
            await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({ path: '/tasks/1', body: '{"state_id":"4"}' }));
            fireEvent.keyDown(within(detail).getByText('About Print the posters'), { key: 'd' });
            fireEvent.click(await screen.findByRole('menuitem', { name: 'Tomorrow' }));
            await waitFor(() => expect(calls.filter((c) => c.method === 'PATCH').some((c) => c.body.includes('"due_at"'))).toBe(true));
            // time: the timer's actions and Log time…
            fireEvent.click(within(chips).getByRole('button', { name: /^Time: / }));
            fireEvent.click(await screen.findByRole('menuitem', { name: 'Start Timer' }));
            await waitFor(() => expect(calls.find((c) => c.path === '/tasks/1/timer')?.body).toBe('{"action":"start"}'));
            fireEvent.click(within(chips).getByRole('button', { name: /^Time: / }));
            fireEvent.click(await screen.findByRole('menuitem', { name: 'Log Time…' }));
            expect(within(chips).getByRole('textbox', { name: 'Time spent' })).toBeTruthy();
        });
    });

    it('in a narrow pane says what an empty chip sets, where the viewer may set it', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        await atPaneWidth(600, async () => {
            renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '2' } }, api);
            const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
            const chips = await within(detail).findByRole('group', { name: 'Properties' });
            const type = within(chips).getByRole('button', { name: 'Type: No type' });
            expect(type.hasAttribute('data-empty')).toBe(true);
            expect(type.textContent?.trim()).toBe('Type');
            expect(within(chips).getByRole('button', { name: 'Labels: No labels' }).textContent?.trim()).toBe('Labels');
        });
    });
});

describe('a board while it loads', () => {
    it('keeps the side panel’s rows while its counts load, and says there is nothing to count only when the answer is empty', async () => {
        setSiteModules(MODULES);
        let release = () => {};
        const facets = new Promise<void>((r) => (release = r));
        renderApp({ list: { section: 'tasks' }, detail: null }, site({ hold: { '/me/tasks/facets': facets }, emptyFacets: true }).api);
        await screen.findByRole('heading', { level: 2, name: 'Todo, 2 tasks' });
        const aside = screen.getByRole('complementary', { name: 'Lists and counts' });
        expect(within(aside).getByText('Loading the counts')).toBeTruthy();
        expect(aside.querySelectorAll('.task-aside-wait').length).toBe(3);
        expect(within(aside).queryByText('Nothing to count')).toBeNull();
        release();
        await waitFor(() => expect(within(aside).getByText('Nothing to count')).toBeTruthy());
        expect(aside.querySelectorAll('.task-aside-wait').length).toBe(0);
    });

    it('has a context’s add field from the start, disabled until its lists have answered', async () => {
        setSiteModules(MODULES);
        let release = () => {};
        const lists = new Promise<void>((r) => (release = r));
        renderApp({ list: tasksPage({ context: '725' }), detail: null }, site({ hold: { '/task-lists': lists } }).api);
        const field = (await screen.findByRole('textbox', { name: 'Add a task to Inbox' })) as HTMLInputElement;
        // there before the rows, so they come under it and nothing moves
        expect(field.disabled).toBe(true);
        await screen.findByRole('heading', { level: 2, name: /^In Progress/ });
        expect(screen.getByRole('textbox', { name: 'Add a task to Inbox' })).toBe(field);
        release();
        await waitFor(() => expect(field.disabled).toBe(false));
        expect(screen.getByRole('textbox', { name: 'Add a task to Inbox' })).toBe(field);
    });

    it('puts a pane title’s fact beside it, its focus ring clear of it (My timers’ total, My tasks’ count)', () => {
        const css = readFileSync('src/styles.css', 'utf8');
        expect(css).toMatch(/\.pane-title:focus-visible \{[^}]*outline-offset: 0;/);
        // the fact is on the title's line, the space between them wider than the ring
        expect(css).toMatch(/\.pane-titles \{[^}]*display: flex; align-items: baseline; column-gap: var\(--space-2\);/);
    });
});

describe('two networks', () => {
    it('keep their own board filters and unfolded contexts, back and forth', async () => {
        setSiteModules(MODULES);
        const A = 'https://community.example';
        const B = 'http://network2.localhost:8092';
        const open = async (siteUrl: string) => {
            renderApp({ list: tasksPage({ context: '725' }), detail: null }, site().api, { siteUrl });
            await screen.findByRole('heading', { level: 2, name: /^In Progress/ });
        };
        await open(A);
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Priority…' }));
        fireEvent.click(await screen.findByRole('menuitemradio', { name: /^High/ }));
        await screen.findByRole('group', { name: 'Filters on' });
        fireEvent.click(screen.getByRole('button', { name: 'Lists of Makers Guild' }));
        expect(screen.getByRole('list', { name: 'Lists of Makers Guild' })).toBeTruthy();
        cleanup();

        // the other network's context 725 is another context: none of that carries over
        await open(B);
        expect(screen.queryByRole('group', { name: 'Filters on' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Lists of Makers Guild' }).getAttribute('aria-expanded')).toBe('false');
        cleanup();

        // and back: the first network's are as they were
        await open(A);
        expect(within(screen.getByRole('group', { name: 'Filters on' })).getByText('Priority: High')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Lists of Makers Guild' }).getAttribute('aria-expanded')).toBe('true');
    });
});

describe('the board’s toolbar', () => {
    it('puts its two tab lists on the tab row under the title, as pills', async () => {
        // jsdom lays nothing out: the rule itself, then the tabs in the pane's tab row
        const css = readFileSync('src/styles.css', 'utf8');
        expect(css).toMatch(/\.pane-head \{[^}]*grid-template-areas: 'lead title actions' 'scope scope scope'/);
        setSiteModules(MODULES);
        renderApp({ list: { section: 'tasks' }, detail: null }, site().api);
        const head = (await screen.findByRole('heading', { level: 1, name: 'My tasks' })).closest('.pane-head')!;
        expect(head.querySelector('.pane-scope .task-scopes')?.querySelectorAll('.tab-pills [role="tablist"]').length).toBe(2);
    });
});

describe('the Tasks section’s routes and pure parts', () => {
    it('writes and reads its paths in one form', () => {
        for (const [list, path] of [
            [tasksPage(), '/tasks'],
            [tasksPage({ role: 'created' }), '/tasks?role=created'],
            [tasksPage({ completed: true }), '/tasks?feed=completed'],
            [tasksPage({ view: 'timers' }), '/tasks?view=timers'],
            [tasksPage({ context: '725' }), '/tasks?context=725'],
            [tasksPage({ context: '725', list: 'inbox', completed: true }), '/tasks?context=725&list=inbox&feed=completed'],
            [tasksPage({ context: '725', view: 'budget' }), '/tasks?context=725&view=budget'],
        ] as const) {
            expect(routeToPath({ list, detail: null })).toBe(path);
            expect(parseRoute(path)).toEqual({ list, detail: null });
        }
        expect(parseRoute('/tasks?list=4')).toBeNull();
        // a budget is a context's, in one form
        expect(parseRoute('/tasks?view=budget')).toBeNull();
        expect(parseRoute('/tasks?view=budget&context=725')).toBeNull();
        expect(parseRoute('/tasks?context=725&view=budget&list=4')).toBeNull();
        expect(parseRoute('/tasks?context=725&view=budget&feed=completed')).toBeNull();
        expect(tasksPage({ view: 'budget' })).toEqual({ section: 'tasks' });
        expect(parseRoute('/tasks?feed=completed&context=725')).toBeNull();
        expect(parseRoute('/tasks?context=725&list=4/task/9')).toBeNull();
        expect(parseRoute('/tasks/task/9?context=725&list=4')).toEqual({ list: tasksPage({ context: '725', list: '4' }), detail: { kind: 'task', id: '9' } });
    });

    it('groups by state in the site’s board order, by priority with none last, and reads durations and filters', () => {
        const ts = [task('1', 'A', { state: STATES[0]! }), task('2', 'B', { state: STATES[3]! }), task('3', 'C', { state: STATES[4]!, completed: true }), task('4', 'D', { state: null })];
        expect(groupTasks(ts, 'state', 'open').map((g) => g.label)).toEqual(['In Review', 'Backlog', 'No state', 'Done']);
        const ps = [task('1', 'A'), task('2', 'B', { priority: { id: '3', title: 'Medium' } }), task('3', 'C', { priority: { id: '1', title: 'Urgent' } })];
        expect(groupTasks(ps, 'priority', 'open').map((g) => [g.label, g.preset.priority_id])).toEqual([
            ['Urgent', '1'],
            ['Medium', '3'],
            ['No priority', undefined],
        ]);
        expect(groupTasks(ps, 'state', 'open', { states: [{ id: '2', count: 30, open: 26 }], priorities: [], lists: [] })[0]?.count).toBe(26);
        expect(['1:30', '90', '90m', '1h 30m', '1.5h', '2 hours', 'soon', ''].map(parseDuration)).toEqual([90, 90, 90, 90, 90, 120, null, null]);
        expect([clockText(5400), clockText(59), timerText(3725)]).toEqual(['1:30', '0:00', '1:02:05']);
        expect(boardParams({ scope: { kind: 'context', contextId: '725', listId: 'inbox' }, show: 'open', filters: { priority: ['1', '2'], label: ['3'], saved: '5' }, sort: 'priority' })).toEqual({ context_id: '725', list_id: 'inbox', state: 'open', priority_id: '1,2', label_id: '3', filter_id: '5', sort: 'priority' });
        expect(boardParams({ scope: { kind: 'mine', role: 'created' }, show: 'completed', filters: { assignee: ['6'] }, sort: 'due' })).toEqual({ role: 'created', state: 'completed' });
        expect(toggleFilter(toggleFilter({}, 'type', '1'), 'type', '1')).toEqual({});
        expect(neighbours(['1', '2', '3'], '2')).toEqual({ index: 1, total: 3, previous: '1', next: '3' });
        expect(dueFromDate('', null)).toBeNull();
        expect(dateOf(dueFromDate('2026-12-03', null))).toBe('2026-12-03');
    });
});

describe('My tasks, its comments', () => {
    it('shows what the site logged as plain lines of activity, with no author, Reply or Delete', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        renderApp({ list: { section: 'tasks' }, detail: { kind: 'task', id: '3' } }, api);
        const detail = document.querySelector<HTMLElement>('[data-pane="detail"]')!;
        const line = (await within(detail).findByText('completed the task', { exact: false })).closest('article')!;
        expect(line.classList.contains('comment-activity')).toBe(true);
        expect(within(line).queryByRole('button')).toBeNull();
        expect(line.querySelector('.avatar')).toBeNull();
        // a person's comment is a thread: a card with its reply row; the line stands apart
        const said = within(detail).getByText('Posters are at the printer').closest('.comment-thread') as HTMLElement;
        expect(within(said).getByRole('button', { name: 'Leave a reply to Eric Novak' })).toBeTruthy();
        expect(line.closest('.comment-thread')).toBeNull();
    });
});

describe('a context’s Tasks tab', () => {
    it('shows its lists with their tasks, adds a task with Enter, and Cmd+N goes to the focused list’s field', async () => {
        const { api, calls } = site();
        const commands: { current: CommandHandler | null } = { current: null };
        renderApp(
            { list: { section: 'spaces', group: '725', groupTab: 'tasks' }, detail: null },
            api,
            { children: <ContextTasks context={{ id: '725', display_name: 'Makers Guild' }} selectedId={null} />, commands },
        );
        const day = await screen.findByRole('region', { name: /Open Day/ });
        expect(await within(day).findByRole('checkbox', { name: 'Done: Print the posters' })).toBeTruthy();
        // each list's heading is under the tab's (Tasks, h3)
        expect(within(day).getByRole('heading', { level: 4, name: /^Open Day,\s*1 open$/ })).toBeTruthy();
        const inbox = screen.getByRole('region', { name: /Inbox/ });
        expect(within(inbox).getByRole('checkbox', { name: 'Done: Thank-you notes' })).toBeTruthy();
        // one request for every list's tasks
        expect(calls.filter((c) => c.method === 'GET' && c.path === '/tasks').map((c) => new URLSearchParams(c.query).toString())).toEqual(['context_id=725&state=all&limit=50']);
        // Cmd+N adds a task here, and says so
        expect(taskAddShown()).toBe(true);
        expect(commandEntries(() => undefined, [], undefined, { newTask: true }).find((e) => e.key === 'cmd:new-post')?.label).toBe('New Task');
        expect(commandEntries(() => undefined).find((e) => e.key === 'cmd:new-post')?.label).toBe('New Post');

        // Cmd+N: the add field of the list focus is in, else the first one
        expect(focusTaskAdd()).toBe(true);
        expect(document.activeElement).toBe(within(inbox).getByRole('textbox', { name: 'Add a task to Inbox' }));
        within(day).getByRole('checkbox', { name: 'Done: Print the posters' }).focus();
        expect(focusTaskAdd()).toBe(true);
        const field = within(day).getByRole('textbox', { name: 'Add a task to Open Day' }) as HTMLInputElement;
        expect(document.activeElement).toBe(field);

        fireEvent.change(field, { target: { value: 'Hang the bunting' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        await waitFor(() => expect(screen.getByText('Added “Hang the bunting” to Open Day')).toBeTruthy());
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/tasks')!.body)).toEqual({ context_id: '725', list_id: '4', title: 'Hang the bunting' });
        expect(field.value).toBe('');
        expect(document.activeElement).toBe(field);

        // a title the site's form would refuse is not sent
        const posts = calls.filter((c) => c.method === 'POST').length;
        fireEvent.change(field, { target: { value: 'Go' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        expect(within(day).getByRole('alert').textContent).toBe('A title needs at least 3 characters');
        expect(calls.filter((c) => c.method === 'POST').length).toBe(posts);
        expect(field.maxLength).toBe(160);
    });

    it('gives focus back to New list when its form is closed with Escape or Cancel', async () => {
        const { api } = site();
        renderApp({ list: { section: 'spaces', group: '725', groupTab: 'tasks' }, detail: null }, api, { children: <ContextTasks context={{ id: '725', display_name: 'Makers Guild' }} selectedId={null} /> });
        fireEvent.click(await screen.findByRole('button', { name: 'New list' }));
        const name = screen.getByRole('textbox', { name: 'Name of the new list' });
        expect(document.activeElement).toBe(name);
        fireEvent.keyDown(name, { key: 'Escape' });
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New list' })));
        fireEvent.click(screen.getByRole('button', { name: 'New list' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New list' })));
    });

    it('has no task field to go to where no task list is shown', () => {
        render(<p>Nothing here</p>);
        expect(focusTaskAdd()).toBe(false);
        expect(taskAddShown()).toBe(false);
    });
});

describe('a context’s task lists', () => {
    it('are renamed and deleted from the board’s List actions, and a new one is made from its Lists column and shown', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        const { history } = renderApp({ list: tasksPage({ context: '725', list: '4' }), detail: null }, api);
        fireEvent.click(await screen.findByRole('button', { name: 'Actions for the list Open Day' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename “Open Day”…' }));
        const dialog = await screen.findByRole('dialog', { name: 'Rename list' });
        const name = within(dialog).getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
        expect(name.value).toBe('Open Day');
        fireEvent.change(name, { target: { value: 'Open House' } });
        await act(async () => {
            fireEvent.submit(name.closest('form')!);
        });
        await waitFor(() => expect(calls.find((c) => c.method === 'PATCH' && c.path === '/task-lists/4')).toBeTruthy());
        expect(JSON.parse(calls.find((c) => c.method === 'PATCH')!.body)).toEqual({ title: 'Open House' });
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await waitFor(() => expect(screen.getByText('Renamed the list to “Open House”')).toBeTruthy());

        // Delete asks first, and the board then shows the context
        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(await screen.findByRole('button', { name: 'Actions for the list Open House' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete “Open House”…' }));
        await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
        expect(ask.mock.calls[0]![0]).toContain('Its task is deleted with it');
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
        ask.mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'Actions for the list Open House' }));
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete “Open House”…' }));
        await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.path).toBe('/task-lists/4'));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/tasks?context=725'));
        ask.mockRestore();

        // New list, checked as the site's form checks it, then shown
        fireEvent.click(await screen.findByRole('button', { name: 'New list' }));
        const added = await screen.findByRole('dialog', { name: 'New list' });
        const field = within(added).getByRole('textbox', { name: 'Name' });
        fireEvent.change(field, { target: { value: 'ab' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        expect(within(added).getByRole('alert').textContent).toBe('A list’s name needs at least 3 characters');
        expect(calls.some((c) => c.method === 'POST' && c.path === '/task-lists')).toBe(false);
        fireEvent.change(field, { target: { value: 'Volunteers' } });
        await act(async () => {
            fireEvent.submit(field.closest('form')!);
        });
        await waitFor(() => expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/task-lists')?.body ?? '{}')).toEqual({ context_id: '725', title: 'Volunteers' }));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/tasks?context=725&list=8'));
    });

    it('have a menu in the sidebar (right-click): New list on a context, Rename and Delete on a list it may change', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        renderApp({ list: { section: 'tasks' }, detail: null }, api);
        const tasks = await screen.findByRole('list', { name: 'Tasks' });
        fireEvent.contextMenu(await within(tasks).findByRole('button', { name: 'Makers Guild, 3 open' }));
        expect(await screen.findByRole('menuitem', { name: 'New list…' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: /^Rename/ })).toBeNull();
        fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
        fireEvent.click(within(tasks).getByRole('button', { name: 'Lists of Makers Guild' }));
        fireEvent.contextMenu(within(screen.getByRole('list', { name: 'Lists of Makers Guild' })).getByRole('button', { name: 'Open Day, 1 open' }));
        expect(await screen.findByRole('menuitem', { name: 'Rename “Open Day”…' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Delete “Open Day”…' })).toBeTruthy();
    });

    it('on a context’s Tasks tab: a list it may change has a menu button, the Inbox none', async () => {
        const { api } = site();
        renderApp({ list: { section: 'spaces', group: '725', groupTab: 'tasks' }, detail: null }, api, { children: <ContextTasks context={{ id: '725', display_name: 'Makers Guild' }} selectedId={null} /> });
        // (the menu itself is the Shell's, as the board's test opens it)
        expect((await screen.findByRole('button', { name: 'Actions for the list Open Day' })).getAttribute('aria-haspopup')).toBe('menu');
        expect(screen.queryByRole('button', { name: 'Actions for the list Inbox' })).toBeNull();
    });
});

describe('a context’s budget', () => {
    it('words hours, signs, shares and the bar as the viewer’s locale writes them', () => {
        expect([hoursText(532800, 'en-US'), hoursText(26160, 'en-US'), hoursText(3600, 'en-US'), hoursText(0, 'en-US')]).toEqual(['148 hours', '7.3 hours', '1 hour', '0 hours']);
        expect([entryHoursText(120, 'en-US'), entryHoursText(-12, 'en-US')]).toEqual(['+120 hours', '-12 hours']);
        expect(percentText(95.09, 'en-US')).toBe('95.1%');
        expect(hoursText(5400, 'de-DE')).toBe('1,5 Stunden');
        const b = { context_id: '725', context: guild, total_seconds: 36000, spent_seconds: 9000, remaining_seconds: 27000, remaining_percent: 75, can_add: true };
        expect(spentShare(b)).toBe(25);
        expect(spentText(b, 'en-US')).toBe('2.5 hours spent of 10 hours, 7.5 hours remaining');
        expect(spentText({ ...b, spent_seconds: 39600, remaining_seconds: -3600 }, 'en-US')).toBe('11 hours spent of 10 hours, 1 hour over budget');
        expect(spentShare({ total_seconds: 36000, spent_seconds: 39600 })).toBe(100);
        expect(spentText({ ...b, total_seconds: 0, spent_seconds: 3600 }, 'en-US')).toBe('1 hour spent, no budget set');
        expect([hoursProblem(''), hoursProblem('1.5'), hoursProblem('0'), hoursProblem('100001'), hoursProblem(' -4 '), hoursProblem('8')]).toEqual([
            'Write how many hours',
            'Write whole hours, as 8 or -2',
            'Write a number of hours other than 0',
            'Up to 100,000 hours',
            null,
            null,
        ]);
        expect([parseHours('−4'), parseHours('+8'), parseHours('x')]).toEqual([-4, 8, null]);
        expect(entryText({ hours: 40, note: 'A note that runs on well past the forty characters a name keeps' }, 'en-US')).toBe('+40 hours, A note that runs on well past the forty…');
    });

    it('has a Budget row with a wallet after a context’s lists, where its viewer may see the budget, and opens it', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        const { history } = renderApp({ list: { section: 'tasks' }, detail: null }, api);
        const tasks = await screen.findByRole('list', { name: 'Tasks' });
        fireEvent.click(await within(tasks).findByRole('button', { name: 'Lists of Makers Guild' }));
        const lists = screen.getByRole('list', { name: 'Lists of Makers Guild' });
        const rows = within(lists).getAllByRole('button');
        expect(rows.map((r) => r.textContent!.replace(/\s+/g, ' ').trim())).toEqual(['Inbox2, 2 open', 'Open Day1, 1 open', 'Budget, hours of Makers Guild']);
        // the wallet, not a list's icon
        expect(rows[2]!.querySelector('.nav-icon')!.innerHTML).not.toBe(rows[1]!.querySelector('.nav-icon')!.innerHTML);
        fireEvent.click(within(tasks).getByRole('button', { name: 'Lists of Guild Council' }));
        expect(within(screen.getByRole('list', { name: 'Lists of Guild Council' })).queryByRole('button', { name: /^Budget/ })).toBeNull();
        fireEvent.click(rows[2]!);
        expect(routeToPath(history.current)).toBe('/tasks?context=725&view=budget');
        expect(rows[2]!.getAttribute('aria-current')).toBe('page');
        expect(within(tasks).getByRole('button', { name: 'Makers Guild, 3 open' }).getAttribute('aria-current')).toBeNull();
        expect(await screen.findByRole('heading', { level: 1, name: 'Budget' })).toBeTruthy();
    });

    it('shows the summary with a bar said in words, and the entries the newest first', async () => {
        setSiteModules(MODULES);
        const { api } = site();
        renderApp({ list: tasksPage({ context: '725', view: 'budget' }), detail: null }, api);
        const bar = await screen.findByRole('progressbar', { name: 'Budget spent' });
        expect(bar.getAttribute('aria-valuenow')).toBe('5');
        expect(bar.getAttribute('aria-valuetext')).toBe(`${hoursText(26160)} spent of ${hoursText(532800)}, ${hoursText(532800 - 26160)} remaining`);
        const summary = screen.getByRole('region', { name: 'Summary' });
        expect(within(summary).getByText('Remaining')).toBeTruthy();
        expect(within(summary).getByText(hoursText(532800))).toBeTruthy();
        expect(within(summary).getByText(percentText(95.09))).toBeTruthy();
        expect(document.querySelector('.pane-subtitle')?.textContent).toBe('Makers Guild');
        const list = await screen.findByRole('list', { name: 'Entries, the newest first' });
        const items = within(list).getAllByRole('listitem');
        expect(items.map((li) => within(li).getByText(/hours$/).textContent)).toEqual([entryHoursText(-12), entryHoursText(40), entryHoursText(120)]);
        expect(within(items[0]!).getByText('Eric Novak')).toBeTruthy();
        expect(within(items[0]!).getByText('Tool upkeep moved to the Woodshop budget')).toBeTruthy();
        expect(items[0]!.querySelector('time')?.getAttribute('dateTime')).toBe('2026-11-06T10:00:00Z');
        expect(within(items[2]!).getByRole('button', { name: `Edit entry: ${entryHoursText(120)}, Autumn season` })).toBeTruthy();
    });

    it('adds an entry from the toolbar in a dialog, checking its hours first, and the total follows', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: tasksPage({ context: '725', view: 'budget' }), detail: null }, api);
        await screen.findByRole('list', { name: 'Entries, the newest first' });
        const add = screen.getByRole('button', { name: 'Add budget entry' });
        fireEvent.click(add);
        const dialog = await screen.findByRole('dialog', { name: 'Add entry' });
        const hours = within(dialog).getByRole('textbox', { name: 'Hours' });
        fireEvent.change(hours, { target: { value: '1.5' } });
        await act(async () => {
            fireEvent.submit(hours.closest('form')!);
        });
        expect(within(dialog).getByRole('alert').textContent).toBe('Write whole hours, as 8 or -2');
        expect(hours.getAttribute('aria-invalid')).toBe('true');
        expect(calls.some((c) => c.method === 'POST')).toBe(false);
        fireEvent.change(hours, { target: { value: '8' } });
        fireEvent.change(within(dialog).getByRole('textbox', { name: 'Note' }), { target: { value: '  Kiln firing  ' } });
        await act(async () => {
            fireEvent.submit(hours.closest('form')!);
        });
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/task-contexts/725/budget/entries')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST')!.body)).toEqual({ hours: 8, note: 'Kiln firing' });
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await waitFor(() => expect(screen.getByText(`Added to the budget: ${entryHoursText(8)}, Kiln firing`)).toBeTruthy());
        await waitFor(() => expect(within(screen.getByRole('region', { name: 'Summary' })).getByText(hoursText(156 * 3600))).toBeTruthy());
        expect(within(screen.getByRole('list', { name: 'Entries, the newest first' })).getAllByRole('listitem')[0]!.textContent).toContain('Kiln firing');
    });

    it('edits an entry in the same dialog, and deletes one only once that is confirmed', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: tasksPage({ context: '725', view: 'budget' }), detail: null }, api);
        const list = await screen.findByRole('list', { name: 'Entries, the newest first' });
        fireEvent.click(within(list).getByRole('button', { name: `Edit entry: ${entryHoursText(40)}, Open Day prep` }));
        const dialog = await screen.findByRole('dialog', { name: 'Edit entry' });
        const hours = within(dialog).getByRole('textbox', { name: 'Hours' }) as HTMLInputElement;
        expect([hours.value, (within(dialog).getByRole('textbox', { name: 'Note' }) as HTMLTextAreaElement).value]).toEqual(['40', 'Open Day prep']);
        fireEvent.change(hours, { target: { value: '30' } });
        await act(async () => {
            fireEvent.submit(hours.closest('form')!);
        });
        await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')?.path).toBe('/task-budget-entries/2'));
        expect(JSON.parse(calls.find((c) => c.method === 'PATCH')!.body)).toEqual({ hours: 30, note: 'Open Day prep' });
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await waitFor(() => expect(within(screen.getByRole('region', { name: 'Summary' })).getByText(hoursText(138 * 3600))).toBeTruthy());

        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(within(screen.getByRole('list', { name: 'Entries, the newest first' })).getByRole('button', { name: `Delete entry: ${entryHoursText(-12)}, Tool upkeep moved to the Woodshop budget` }));
        await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
        expect(ask.mock.calls[0]![0]).toContain('Delete this entry?');
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
        ask.mockReturnValue(true);
        fireEvent.click(within(screen.getByRole('list', { name: 'Entries, the newest first' })).getByRole('button', { name: `Delete entry: ${entryHoursText(-12)}, Tool upkeep moved to the Woodshop budget` }));
        await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.path).toBe('/task-budget-entries/3'));
        await waitFor(() => expect(within(screen.getByRole('list', { name: 'Entries, the newest first' })).getAllByRole('listitem')).toHaveLength(2));
        await waitFor(() => expect(screen.getByText(`Deleted the entry: ${entryHoursText(-12)}, Tool upkeep moved to the Woodshop budget`)).toBeTruthy());
        ask.mockRestore();
    });

    it('searches the notes, says when nothing matches, and Esc clears the search', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: tasksPage({ context: '725', view: 'budget' }), detail: null }, api);
        await screen.findByRole('list', { name: 'Entries, the newest first' });
        const field = screen.getByRole('searchbox', { name: 'Search the notes of the entries' });
        fireEvent.change(field, { target: { value: 'open day' } });
        await waitFor(() => expect(within(screen.getByRole('list', { name: 'Entries whose note matches, the newest first' })).getAllByRole('listitem')).toHaveLength(1));
        expect(calls.some((c) => c.path === '/task-contexts/725/budget/entries' && new URLSearchParams(c.query).get('q') === 'open day')).toBe(true);
        fireEvent.change(field, { target: { value: 'zeppelin' } });
        expect(await screen.findByText('No entries match')).toBeTruthy();
        fireEvent.keyDown(field, { key: 'Escape' });
        expect((field as HTMLInputElement).value).toBe('');
        expect(await screen.findByRole('list', { name: 'Entries, the newest first' })).toBeTruthy();
    });

    it('tells a viewer who may not see the budget so, without the entries or Add', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site();
        renderApp({ list: tasksPage({ context: '728', view: 'budget' }), detail: null }, api);
        expect(await screen.findByText('Only the administrators of this context see its budget')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Add budget entry' })).toBeNull();
        expect(screen.queryByRole('searchbox', { name: 'Search the notes of the entries' })).toBeNull();
        expect(calls.some((c) => c.path === '/task-contexts/728/budget/entries')).toBe(false);
    });
});
