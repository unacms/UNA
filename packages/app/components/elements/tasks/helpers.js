/**
 * Pure helpers for the Tasks module blocks: payload normalization,
 * tasklist trees, browse URL builders and the `/tasks-home` query.
 */
import { Platform } from 'react-native';
import { fetcher } from 'app/lib/fetcher';
import emitter, { EVENTS } from 'app/context/emitter';
import { decodeText } from 'app/lib/util/html-text';
import {
    canonicalTaskStatus,
    isTaskCompleted,
    normalizeTaskLabel,
    prioritySortIndex,
    statusSortIndex,
} from 'app/lib/tasks-meta';

export const TASKS_LIST_EVENT = EVENTS.tasksList;
export const TASKS_HOME_PATH = '/tasks-home';

const isWeb = Platform.OS === 'web';
const hasWindow = () => isWeb && typeof window !== 'undefined';
/** Next SSR pass — module state is shared across requests there. */
const isServerRender = () => isWeb && typeof window === 'undefined';

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

/** Concrete tasklist id, including Inbox (`0`). Missing id = all lists in the context. */
export function hasListId(listId) {
    return listIdOrNull(listId) != null;
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
    if (value == null || value === '' || typeof value === 'boolean' || Number.isNaN(Number(value))) return null;
    return Number(value);
}

function clampPercent(value) {
    const percent = Number(value);
    if (!Number.isFinite(percent)) return 0;
    return Math.min(100, Math.max(0, percent));
}

function parseProgressText(progress) {
    if (typeof progress !== 'string') return null;
    const match = progress.trim().match(/^(\d+(?:\.\d+)?)\s*%(?:\s+of\s+(\d+))?/i);
    if (!match) return null;
    const percent = clampPercent(match[1]);
    const total = match[2] != null ? toCount(match[2]) : null;
    return {
        percent,
        total,
        done: total != null ? Math.round((percent / 100) * total) : null,
    };
}

export function countTaskProgress(tasks) {
    if (!Array.isArray(tasks)) return { total: 0, done: 0, percent: 0 };
    const total = tasks.length;
    const done = tasks.filter(isTaskCompleted).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function tasklistProgress(item) {
    const total = toCount(item?.count ?? item?.total) ?? 0;
    const done = toCount(item?.done) ?? 0;
    const percent = item?.percent != null
        ? clampPercent(item.percent)
        : (total > 0 ? Math.round((done / total) * 100) : 0);
    return { total, done, percent };
}

function tasklistProgressKey(item) {
    const id = item?.list_id ?? item?.id;
    if (id == null) return null;
    const contextId = item?.context_id ?? item?.context?.id ?? '';
    return `${contextId}:${id}`;
}

/** Copy completed/total from browse lists (which carry `tasks`) onto sidebar rows. */
export function applyTasklistProgress(tasklists, lists) {
    if (!Array.isArray(tasklists) || !tasklists.length || !Array.isArray(lists)) return tasklists;

    const byKey = new Map();
    const walk = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const node of nodes) {
            if (!node || typeof node !== 'object') continue;
            if (Array.isArray(node.tasks)) {
                const key = tasklistProgressKey(node);
                if (key) byKey.set(key, countTaskProgress(node.tasks));
            }
            for (const nested of NESTED_LIST_KEYS) walk(node[nested]);
        }
    };
    walk(lists);
    if (!byKey.size) return tasklists;

    let changed = false;
    const mapItems = (items) => {
        if (!Array.isArray(items)) return items;
        let itemsChanged = false;
        const next = items.map((item) => {
            if (isTasklistGroup(item)) {
                const children = mapItems(item.children);
                if (children === item.children) return item;
                itemsChanged = true;
                return { ...item, children };
            }
            const progress = byKey.get(tasklistProgressKey(item));
            if (!progress) return item;
            if (item.count === progress.total && item.done === progress.done && item.percent === progress.percent) {
                return item;
            }
            itemsChanged = true;
            return { ...item, count: progress.total, done: progress.done, percent: progress.percent };
        });
        if (itemsChanged) changed = true;
        return itemsChanged ? next : items;
    };

    const next = mapItems(tasklists);
    return changed ? next : tasklists;
}

function normalizeTasklistItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const id = item.id ?? item.list_id ?? item.key;
            if (id == null) return null;

            const title = item.title ?? item.list_title ?? item.name ?? item.value;
            const fromTasks = Array.isArray(item.tasks) ? countTaskProgress(item.tasks) : null;
            const parsed = parseProgressText(item.progress ?? item.progress_text);
            const total = toCount(
                item.total ?? item.count ?? item.num ?? item.tasks_count ?? item.items_count
                ?? fromTasks?.total ?? parsed?.total
            );
            const done = toCount(
                item.done ?? item.completed_count ?? item.completed_tasks
                ?? fromTasks?.done ?? parsed?.done
            );
            const percent = item.percent ?? item.percentage ?? (
                total > 0 && done != null
                    ? Math.round((Number(done) / total) * 100)
                    : (fromTasks?.percent ?? parsed?.percent ?? 0)
            );

            let progress = item.progress ?? item.progress_text;
            if (!progress && total > 0 && done != null) {
                progress = `${Math.round(percent)}% of ${total}`;
            }

            return {
                id,
                title: String(title ?? id),
                count: total,
                done,
                percent: clampPercent(percent),
                progress: progress != null ? String(progress) : null,
                completed: !!(item.completed || item.is_completed || item.closed
                    || isCompleteProgress(progress)
                    || (total > 0 && done === total)),
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

function isGenericTasksTitle(title) {
    const normalized = String(title || '').trim().toLowerCase();
    return !normalized
        || normalized === 'my tasks'
        || normalized === 'tasks'
        || normalized === 'task'
        || normalized === 'inbox';
}

function contextIdsOf(item) {
    if (!item || typeof item !== 'object') return [];
    return [
        item.id,
        item.context_id,
        item.context?.id,
        item.profile_id,
        item.context_pid,
        item.author_id,
        item.author?.id,
    ].filter((value) => value != null).map(String);
}

/** Profile-home rows are titled "Academy (Groups)" — crumb uses the name only. */
function cleanContextModuleSuffix(title) {
    return String(title || '').replace(/\s+\((Groups|Spaces|Events|Projects|Organizations)\)\s*$/i, '').trim();
}

function firstContextTitle(...values) {
    for (const value of values) {
        if (value == null || value === '') continue;
        const title = cleanContextModuleSuffix(decodeText(String(value)));
        if (title && !isGenericTasksTitle(title)) return title;
    }
    return null;
}

/** Profile-home `lists` item that represents a context, not a tasklist. */
function isProfileContextRow(item) {
    const contextId = usableContextId(item?.context_id ?? item?.context?.id);
    if (contextId == null || item?.list_id == null) return false;
    return String(item.list_id) === String(contextId);
}

const contextTitlesById = new Map();

/**
 * Remember context names from profile-home lists so a later context browse can use them.
 * Browser-only: on the Next server this module is shared across requests, so a
 * cache filled during SSR would leak one user's group names into another's render.
 */
export function rememberContextTitlesFromLists(lists) {
    if (isServerRender() || !Array.isArray(lists)) return;
    for (const item of lists) {
        if (!item || typeof item !== 'object') continue;
        const contextId = usableContextId(item.context_id ?? item.context?.id ?? item.id);
        if (contextId != null && (isProfileContextRow(item) || isTasklistGroup(item) || nestedListNodes(item).length)) {
            const title = firstContextTitle(
                item.title,
                item.list_title,
                item.name,
                item.display_name,
                item.context?.title,
                item.context?.display_name,
                item.context?.name,
            );
            if (title) contextTitlesById.set(String(contextId), title);
        }
        rememberContextTitlesFromLists(item.lists || item.tasklists || item.task_lists || item.children);
    }
}

export function cachedContextTitle(contextId) {
    if (contextId == null) return null;
    return contextTitlesById.get(String(contextId)) || null;
}

function buildTasklistGroup(ctx, children) {
    const contextId = usableContextId(ctx?.context_id)
        ?? usableContextId(ctx?.context?.id)
        ?? ctx?.id;
    if (contextId == null) return null;
    return {
        id: contextId,
        title: String(firstContextTitle(
            ctx.title,
            ctx.list_title,
            ctx.name,
            ctx.display_name,
            ctx.context?.title,
            ctx.context?.display_name,
            ctx.context?.name,
        ) ?? contextId),
        count: ctx.count ?? (children.length || null),
        context_id: contextId,
        profile_id: ctx.profile_id ?? ctx.context?.profile_id ?? ctx.context_pid ?? null,
        children: normalizeTasklistItems(children.map((child) => ({
            ...child,
            context_id: child.context_id ?? child.context?.id ?? contextId,
        }))),
    };
}

/** Sidebar items: flat tasklists for a context, or `{ children }` groups per context on the profile home. */
export function extractTasklists(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const lists = payload.lists || [];
    if (isProfileTasksBrowse(payload)) rememberContextTitlesFromLists(lists);
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

export function findTasklistGroup(items, contextId) {
    if (contextId == null || !Array.isArray(items)) return null;
    const wanted = String(contextId);
    for (const item of items) {
        if (isTasklistGroup(item) && contextIdsOf(item).includes(wanted)) return item;
        const nested = findTasklistGroup(item.children, contextId);
        if (nested) return nested;
    }
    return null;
}

/** Group that contains this tasklist, used when the URL only has a list id. */
export function findParentTasklistGroup(items, childId) {
    if (childId == null || !Array.isArray(items)) return null;
    const wanted = String(childId);
    for (const item of items) {
        if (!isTasklistGroup(item)) continue;
        if ((item.children || []).some((child) => String(child.id) === wanted)) return item;
        const nested = findParentTasklistGroup(item.children, childId);
        if (nested) return nested;
    }
    return null;
}

/** Profile `lists` nodes that are contexts, not leaf tasklists like Inbox. */
export function findContextTitleInRawLists(lists, contextId) {
    if (!Array.isArray(lists) || contextId == null) return null;
    const wanted = String(contextId);
    for (const item of lists) {
        if (!item || typeof item !== 'object') continue;
        const isGroup = isTasklistGroup(item)
            || nestedListNodes(item).length > 0
            || isProfileContextRow(item);
        if (isGroup && contextIdsOf(item).includes(wanted)) {
            const title = firstContextTitle(
                item.title,
                item.list_title,
                item.name,
                item.display_name,
                item.context?.title,
                item.context?.display_name,
                item.context?.name,
            );
            if (title) return title;
        }
        const nested = findContextTitleInRawLists(
            item.lists || item.tasklists || item.task_lists || item.children,
            contextId
        );
        if (nested) return nested;
    }
    return null;
}

/** Group whose tasklists overlap the currently loaded browse lists. */
export function findTasklistGroupByLists(tasklists, lists) {
    if (!Array.isArray(tasklists) || !Array.isArray(lists) || !lists.length) return null;
    const wanted = new Set(
        lists.map((item) => String(item?.id ?? item?.list_id ?? '')).filter(Boolean)
    );
    if (!wanted.size) return null;
    let best = null;
    let bestScore = 0;
    const visit = (items) => {
        if (!Array.isArray(items)) return;
        for (const item of items) {
            if (!isTasklistGroup(item)) continue;
            const score = (item.children || []).filter((child) => wanted.has(String(child.id))).length;
            if (score > bestScore) {
                bestScore = score;
                best = item;
            }
            visit(item.children);
        }
    };
    visit(tasklists);
    return bestScore > 0 ? best : null;
}

/** Context / group name from a browse payload — never a tasklist or the open task. */
export function contextTitleFromPayload(...sources) {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        const title = firstContextTitle(
            source.context_title,
            source.context_name,
            source.context?.title,
            source.context?.name,
            source.context?.display_name,
            source.context?.current?.title,
            source.context?.current?.name,
            source.context?.current?.display_name,
        );
        if (title) return title;
    }
    return null;
}

/**
 * First crumb is the list you opened from:
 * no context pid → My Tasks; context pid → that group's name.
 * Do not use the task's own context (that inverts My Tasks vs group).
 */
export function resolveTasksOriginTitle({
    tasklists = [],
    rawLists,
    browseLists,
    contextPid,
    listId,
    contextTitle,
    pageTitle,
    pageContext,
    fallback,
}) {
    const contextId = usableContextId(contextPid);
    if (contextId == null) return fallback;
    const fromGroup = findTasklistGroup(tasklists, contextId)
        || findParentTasklistGroup(tasklists, listId)
        || findTasklistGroupByLists(tasklists, browseLists);
    return firstContextTitle(
        fromGroup?.title,
        contextTitle,
        pageTitle,
        cachedContextTitle(contextId),
        findContextTitleInRawLists(rawLists, contextId),
        contextTitleFromPayload(pageContext, { context: pageContext }),
    ) || fallback;
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
            const contextId = task?.context_id ?? list?.context_id;
            groups.get(title).push(
                contextId != null && task?.context_id == null
                    ? { ...task, context_id: contextId }
                    : task
            );
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

export function buildTasksHomeUrl(contextPid, listId = null) {
    if (contextPid == null || contextPid === '') return null;
    const params = new URLSearchParams({ context_pid: String(contextPid) });
    if (hasListId(listId)) params.set('list', String(listId));
    return `${TASKS_HOME_PATH}?${params.toString()}`;
}

export function isTasksHomeUri(uri) {
    if (!uri) return false;
    const path = String(uri).split('?')[0].replace(/\/+$/, '');
    return path === TASKS_HOME_PATH || path === TASKS_HOME_PATH.slice(1);
}

export function isTasksHomePath() {
    return hasWindow() && isTasksHomeUri(window.location.pathname);
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

export function isTaskViewPath(url) {
    const path = normalizeBrowserPath(url);
    return path === '/view-task' || path.startsWith('/view-task/');
}

/** Address-bar href for a task (`/view-task/...`) so the open task is shareable. */
export function taskViewHref(url) {
    if (!url) return null;
    const raw = String(url).trim();
    if (!raw) return null;
    let path = raw;
    if (/^https?:\/\//i.test(raw)) {
        try {
            const parsed = new URL(raw);
            path = parsed.pathname + parsed.search;
        } catch {
            // fall through and treat it as a path
        }
    }
    // UNA links may carry the `page/` router prefix; the Next route does not.
    path = path.replace(/^\/?page\//, '');
    if (!path || path === '/') return null;
    return path.startsWith('/') ? path : `/${path}`;
}

const BROWSER_LOCATION_EVENT = EVENTS.tasksBrowserLocation;
let historyPatched = false;

function patchHistoryLocationEvents() {
    if (!hasWindow() || historyPatched) return;
    historyPatched = true;
    for (const method of ['pushState', 'replaceState']) {
        const orig = window.history[method];
        window.history[method] = function patchedHistory(...args) {
            const result = orig.apply(this, args);
            emitter.emit(BROWSER_LOCATION_EVENT, {
                method,
                url: getBrowserLocation(),
                state: window.history.state,
            });
            return result;
        };
    }
}

/** pushState / replaceState / popstate — conductor tab clicks never fire popstate. */
export function subscribeBrowserLocation(handler) {
    if (!hasWindow()) return () => {};
    patchHistoryLocationEvents();
    const onPop = () => handler({
        method: 'popstate',
        url: getBrowserLocation(),
        state: window.history.state,
    });
    const sub = emitter.addListener(BROWSER_LOCATION_EVENT, handler);
    window.addEventListener('popstate', onPop);
    return () => {
        sub.remove();
        window.removeEventListener('popstate', onPop);
    };
}

export function tasksListTaskFromHistoryState(state) {
    const task = state?.tasksListTask;
    if (!task) return null;
    if (typeof task === 'object' && task.url) return task;
    return null;
}
