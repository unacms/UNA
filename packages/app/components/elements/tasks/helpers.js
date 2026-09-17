/**
 * Pure helpers for the Tasks module blocks: payload normalization,
 * tasklist trees, browse URL builders and the `/tasks-home` query.
 */
import { Platform } from 'react-native';
import { fetcher } from 'app/lib/fetcher';
import emitter from 'app/context/emitter';
import {
    canonicalTaskStatus,
    normalizeTaskLabel,
    prioritySortIndex,
    statusSortIndex,
} from 'app/lib/tasks-meta';

export const TASKS_LIST_EVENT = 'tasks_list';
export const TASKS_HOME_PATH = '/tasks-home';

const isWeb = Platform.OS === 'web';
const hasWindow = () => isWeb && typeof window !== 'undefined';

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

/** UNA sends both bare `r=` values and full `/api.php?r=` URLs. */
export function apiUrl(requestUrl) {
    return requestUrl.startsWith('/api.php') ? requestUrl : '/api.php?r=' + requestUrl;
}

export function emitTasksListRefresh() {
    emitter.emit(TASKS_LIST_EVENT, { action: 'reload' });
}

export function emitTasksListPatch({ id, field, value }) {
    if (id == null || !field) return;
    emitter.emit(TASKS_LIST_EVENT, { action: 'patch', id, field, value });
}

export function emitTasksListOpen(task) {
    if (!task?.url) return;
    emitter.emit(TASKS_LIST_EVENT, { action: 'open', url: task.url, title: task.title });
}

/* ------------------------------------------------------------------ */
/* Payload                                                             */
/* ------------------------------------------------------------------ */

function isTasksListPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (Array.isArray(payload.lists)) return true;
    if (Array.isArray(payload.tasklists) || Array.isArray(payload.task_lists)) return true;
    return !!(payload.request_url && Array.isArray(payload.actions));
}

/** Finds the tasks-list block inside a page/block response and merges it over `fallback`. */
export function normalizeTasksListPayload(response, fallback) {
    const root = response?.data;
    if (!root) return fallback;

    const candidates = [];
    const collect = (node) => {
        if (!node || typeof node !== 'object') return;
        candidates.push(node);
        if (node.data) candidates.push(node.data);
        if (Array.isArray(node.content)) node.content.forEach(collect);
    };
    (Array.isArray(root) ? root : [root]).forEach(collect);

    const found = candidates.find(isTasksListPayload);
    return found ? { ...fallback, ...found } : fallback;
}

export function unwrapTasksListPayload(response) {
    const normalized = normalizeTasksListPayload(response, null);
    if (normalized) return normalized;
    if (Array.isArray(response?.lists)) return response;
    if (Array.isArray(response?.data?.lists)) return response.data;
    return null;
}

/** `bx_tasks` or a fork module name, taken from the browse request URL. */
export function tasksModule(payload) {
    return String(payload?.request_url || 'bx_tasks').split('/')[0] || 'bx_tasks';
}

export function isProfileTasksBrowse(payload) {
    const requestUrl = String(payload?.request_url || '');
    if (requestUrl.includes('browse_tasks_by_profile')) return true;
    if (requestUrl.includes('browse_context')) return false;
    return payload?.context_id == null || Number(payload.context_id) === 0;
}

/** Context / URL template fields the browse URL builders read; later sources win. */
export function pickBrowseContext(...sources) {
    const context = {};
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const key of [
            'request_url',
            'request_url_browse_context',
            'request_url_tasklist',
            'tasklists_request_url',
            'context',
            'profile_id',
        ]) {
            if (source[key] != null) context[key] = source[key];
        }
        const contextId = usableContextId(source.context_id);
        if (contextId != null) context.context_id = contextId;
    }
    return context;
}

export function getFormNamesFromBlock(block) {
    const content = Array.isArray(block?.content) ? block.content : [];
    return content
        .filter((item) => item?.type === 'form')
        .map((item) => item?.data?.params?.display || item?.name)
        .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

export function listIdOrNull(listId) {
    return listId == null || String(listId) === '' ? null : listId;
}

/** `list=0` means "inbox" (no tasklist filter). */
export function hasListId(listId) {
    return listIdOrNull(listId) != null && String(listId) !== '0';
}

export function isSameListId(a, b) {
    if (listIdOrNull(a) == null || listIdOrNull(b) == null) return false;
    return String(a) === String(b);
}

/** Context id, or `null` for empty / `0` (profile-wide browse). */
export function usableContextId(value) {
    if (value == null || value === '') return null;
    return Number(value) === 0 ? null : value;
}

export function extractContextId(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const fromPayload = usableContextId(payload.context_id) ?? usableContextId(payload.context);
    if (fromPayload != null) return fromPayload;

    const url = String(payload.request_url || payload.request_url_browse_context || '');
    if (!url || url.includes('browse_tasks_by_profile')) return null;

    const numeric = url.match(/params\[\]=(\d+)/);
    if (numeric) return usableContextId(numeric[1]);

    try {
        const json = url.match(/params\[\]=(\{[^&]+\})/);
        if (json?.[1]) {
            const parsed = JSON.parse(decodeURIComponent(json[1]));
            return usableContextId(parsed?.context_id ?? parsed?.context ?? parsed?.id ?? null);
        }
    } catch {
        // ignore malformed JSON in request_url
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* Tasklists                                                           */
/* ------------------------------------------------------------------ */

export function isTasklistGroup(item) {
    return Array.isArray(item?.children);
}

function isCompleteProgress(progress) {
    return typeof progress === 'string' && /^100\s*%/.test(progress.trim());
}

function toCount(value) {
    if (value == null || value === '' || Number.isNaN(Number(value))) return null;
    return Number(value);
}

function normalizeTasklistItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const id = item.id ?? item.list_id ?? item.key;
            if (id == null) return null;

            const title = item.title ?? item.list_title ?? item.name ?? item.value;
            const total = toCount(
                item.total ?? item.count ?? item.num ?? item.tasks_count ?? item.items_count
                ?? (Array.isArray(item.tasks) ? item.tasks.length : null)
            );
            const done = item.done ?? item.completed_count ?? item.closed;

            let progress = item.progress ?? item.progress_text;
            if (!progress && total > 0 && done != null) {
                const pct = item.percent ?? item.percentage ?? Math.round((Number(done) / total) * 100);
                progress = `${pct}% of ${total}`;
            }

            return {
                id,
                title: String(title ?? id),
                count: total,
                progress: progress != null ? String(progress) : null,
                completed: !!(item.completed || item.is_completed || item.closed || isCompleteProgress(progress)),
                actions: item.actions,
                context_id: item.context_id ?? item.context?.id ?? null,
            };
        })
        .filter(Boolean);
}

function nestedListNodes(item) {
    if (!item || typeof item !== 'object') return [];
    return [item.lists, item.tasklists, item.task_lists]
        .filter((value) => Array.isArray(value) && value.length);
}

function buildTasklistGroup(ctx, children) {
    const contextId = ctx?.context_id ?? ctx?.id;
    if (contextId == null) return null;
    return {
        id: contextId,
        title: String(ctx.title ?? ctx.list_title ?? ctx.name ?? contextId),
        count: ctx.count ?? (children.length || null),
        context_id: contextId,
        children: normalizeTasklistItems(children.map((child) => ({
            ...child,
            context_id: child.context_id ?? contextId,
        }))),
    };
}

/** Sidebar items: flat tasklists for a context, or `{ children }` groups per context on the profile home. */
export function extractTasklists(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const lists = payload.lists || [];
    if (!isProfileTasksBrowse(payload)) return normalizeTasklistItems(lists);
    return lists
        .map((ctx) => buildTasklistGroup(ctx, nestedListNodes(ctx).flat()))
        .filter(Boolean);
}

/** Profile home may list contexts without their tasklists — fetch the missing ones. */
export async function fetchTasklistGroups(payload) {
    const groups = await Promise.all((payload?.lists || []).map(async (ctx) => {
        const contextId = ctx?.context_id ?? ctx?.id;
        if (contextId == null) return null;
        let children = nestedListNodes(ctx).flat();
        if (!children.length && usableContextId(contextId) != null) {
            const response = await fetcher(apiUrl(`${tasksModule(payload)}/browse_context&params[]=${contextId}`));
            children = unwrapTasksListPayload(response)?.lists || [];
        }
        return buildTasklistGroup(ctx, children);
    }));
    return groups.filter(Boolean);
}

export function findTasklist(items, id) {
    if (id == null || !Array.isArray(items)) return null;
    for (const item of items) {
        if (String(item.id) === String(id)) return item;
        const nested = findTasklist(item.children, id);
        if (nested) return nested;
    }
    return null;
}

const NESTED_LIST_KEYS = ['lists', 'tasklists', 'task_lists', 'children'];

/** Apply a field change to one task wherever it sits in the browse tree. */
export function patchTaskInLists(lists, { id, field, value }) {
    if (!Array.isArray(lists) || id == null || !field) return lists;

    const patchTasks = (tasks) => {
        if (!Array.isArray(tasks)) return tasks;
        let changed = false;
        const next = tasks.map((task) => {
            if (task?.id == null || String(task.id) !== String(id)) return task;
            if (task[field] === value) return task;
            changed = true;
            return { ...task, [field]: value };
        });
        return changed ? next : tasks;
    };

    const walk = (nodes) => {
        if (!Array.isArray(nodes)) return nodes;
        let changed = false;
        const next = nodes.map((item) => {
            if (!item || typeof item !== 'object') return item;
            let nextItem = item;
            const tasks = patchTasks(item.tasks);
            if (tasks !== item.tasks) {
                nextItem = { ...nextItem, tasks };
                changed = true;
            }
            for (const key of NESTED_LIST_KEYS) {
                if (!Array.isArray(item[key])) continue;
                const nested = walk(item[key]);
                if (nested === item[key]) continue;
                nextItem = nextItem === item ? { ...item, [key]: nested } : { ...nextItem, [key]: nested };
                changed = true;
            }
            return nextItem;
        });
        return changed ? next : nodes;
    };

    return walk(lists);
}

/** Lists that carry tasks, from any nesting depth. */
export function flattenListsWithTasks(lists = []) {
    const out = [];
    const walk = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const item of nodes) {
            if (!item || typeof item !== 'object') continue;
            nestedListNodes(item).forEach(walk);
            if (Array.isArray(item.tasks) && item.tasks.length) out.push(item);
        }
    };
    walk(lists);
    return out;
}

/** Regroups all tasks by status (Linear-style sections), sorted by priority then title. */
export function groupTasksByStatus(lists = []) {
    const groups = new Map();
    for (const list of lists) {
        for (const task of (Array.isArray(list?.tasks) ? list.tasks : [])) {
            const title = canonicalTaskStatus(task?.state || task?.status);
            if (!groups.has(title)) groups.set(title, []);
            groups.get(title).push(task);
        }
    }

    const byPriorityThenTitle = (a, b) =>
        (prioritySortIndex(a?.priority) - prioritySortIndex(b?.priority))
        || String(a?.title || '').localeCompare(String(b?.title || ''));

    return [...groups.entries()]
        .map(([list_title, tasks]) => ({
            list_id: `status-${normalizeTaskLabel(list_title).replace(/\s+/g, '-')}`,
            list_title,
            tasks: tasks.sort(byPriorityThenTitle),
        }))
        .sort((a, b) => statusSortIndex(a.list_title) - statusSortIndex(b.list_title));
}

/* ------------------------------------------------------------------ */
/* Browse URLs                                                         */
/* ------------------------------------------------------------------ */

function encodeListBrowseParam(tasklistId) {
    const numeric = Number(tasklistId);
    const listValue = Number.isFinite(numeric) && String(numeric) === String(tasklistId).trim()
        ? numeric
        : String(tasklistId);
    // Match browse-style encoding: params%5B%5D=%7B"list":29%7D
    return JSON.stringify({ list: listValue }).replaceAll('{', '%7B').replaceAll('}', '%7D');
}

export function buildTasklistBrowseUrl(payload, tasklistId, itemContextId) {
    if (tasklistId == null) return null;
    const listParam = encodeListBrowseParam(tasklistId);

    const template = payload?.request_url_browse_context
        || payload?.request_url_tasklist
        || payload?.tasklists_request_url;
    if (template) {
        return template.includes('{id}') ? template.replace('{id}', listParam) : template + listParam;
    }

    const contextId = usableContextId(itemContextId) ?? extractContextId(payload);
    if (contextId == null) return null;
    return `${tasksModule(payload)}/browse_context&params[]=${contextId}&params[]=${listParam}`;
}

export function buildContextBrowseUrl(payload, contextPid, listId) {
    if (hasListId(listId)) {
        return buildTasklistBrowseUrl({ ...payload, context_id: contextPid }, listId, contextPid);
    }
    if (contextPid == null || contextPid === '') return null;
    return `${tasksModule(payload)}/browse_context&params[]=${contextPid}`;
}

/* ------------------------------------------------------------------ */
/* /tasks-home query + browser location                                */
/* ------------------------------------------------------------------ */

export function buildTasksHomeUrl(contextPid, listId = 0) {
    if (contextPid == null || contextPid === '') return null;
    const list = hasListId(listId) ? listId : 0;
    return `${TASKS_HOME_PATH}?context_pid=${encodeURIComponent(contextPid)}&list=${encodeURIComponent(list)}`;
}

export function isTasksHomePath() {
    return hasWindow() && window.location.pathname.replace(/\/+$/, '') === TASKS_HOME_PATH;
}

export function tasksHomeQueryFromBrowser() {
    if (!hasWindow()) return { contextPid: null, listId: null };
    const params = new URLSearchParams(window.location.search);
    return { contextPid: params.get('context_pid'), listId: params.get('list') };
}

export function getBrowserLocation() {
    return hasWindow() ? window.location.pathname + window.location.search : '';
}

export function normalizeBrowserPath(url) {
    if (!url) return '';
    const path = String(url).split('?')[0].split('#')[0];
    return '/' + path.replace(/^\/+/, '');
}
