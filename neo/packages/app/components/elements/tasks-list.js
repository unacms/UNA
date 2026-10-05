/**
 * Tasks home / context block: status sections of tasks, a tasklists sidebar,
 * saved + ad-hoc filters and an inline task page (URL-synced on web).
 *
 * Helpers and sub-panels live in `./tasks/`.
 */
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse-simple';
import { components } from 'app/components/registry';
import { Modal, NeoButton } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn, getLayoutName, getPageContentWidth, getPageData } from 'app/lib/util';
import { redirectTo, useRouter } from 'app/lib/hooks/router';
import emitter, { EVENTS } from 'app/context/emitter';
import { useIsDesktop } from 'app/context/measure';
import Confirm from 'app/ui/molecules/dialogs/confirm';
import { isFormResponseComplete } from 'app/lib/form/form-helpers';
import { iconForTaskStatus } from 'app/lib/tasks-meta';
import { Loading } from 'app/customization/loading';
import { NO_CONFIRM, MenuObjectActions, runTaskAction } from './tasks/actions';
import TasklistsPanel from './tasks/tasklists-panel';
import TasksFilterSelector from './tasks/filter-selector';
import {
    TASKS_HOME_PATH,
    TASKS_LIST_EVENT,
    apiUrl,
    buildContextBrowseUrl,
    buildTasklistBrowseUrl,
    buildTasksHomeUrl,
    emitTasksListRefresh,
    extractContextId,
    applyTasklistProgress,
    extractTasklists,
    fetchTasklistGroups,
    findTasklist,
    findTasklistGroup,
    findParentTasklistGroup,
    findTasklistGroupByLists,
    findContextTitleInRawLists,
    contextTitleFromPayload,
    resolveTasksOriginTitle,
    flattenListsWithTasks,
    getBrowserLocation,
    getFormNamesFromBlock,
    groupTasksByStatus,
    hasListId,
    isProfileTasksBrowse,
    isSameListId,
    isTasklistGroup,
    isTaskViewPath,
    isTasksHomePath,
    isTasksHomeUri,
    listIdOrNull,
    normalizeTasksListPayload,
    patchTaskInLists,
    pickBrowseContext,
    subscribeBrowserLocation,
    tasksHomeQueryFromBrowser,
    tasksListTaskFromHistoryState,
    taskViewHref,
    unwrapTasksListPayload,
    usableContextId,
} from './tasks/helpers';
import { loadTaskTimerSessions } from 'app/lib/task-timer-sync';

const isWeb = Platform.OS === 'web';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function filterDropdownItems(filters) {
    return (filters?.values || [])
        .map((item, index) => {
            if (item?.type === 'group_header') {
                return { id: `group-${item.value}-${index}`, type: 'group_header', title: item.value };
            }
            if (item?.key == null) return null;
            return { id: item.key, name: String(item.key), title: item.value };
        })
        .filter(Boolean);
}

/** Browse URL for what is on screen: a tasklist, a context, or the block's own list. */
function resolveListRequestUrl({ browseContext, contextPid, listId, listContextId, fallback }) {
    if (hasListId(listId)) {
        const url = buildTasklistBrowseUrl(browseContext, listId, listContextId ?? contextPid);
        if (url) return url;
    }
    if (contextPid) {
        const url = buildContextBrowseUrl(browseContext, contextPid, listId);
        if (url) return url;
    }
    return fallback;
}

function mergeListsData(prev, next, listId) {
    const merged = { ...(prev || {}), ...next };
    if (prev?.request_url) merged.request_url = prev.request_url;
    if (!hasListId(listId)) {
        delete merged.tasklist_id;
        delete merged.selected_tasklist_id;
    }
    return merged;
}

function navigateToPage(router, dest) {
    if (!dest) return;
    if (isWeb) {
        router.push(dest.startsWith('/') ? dest : `/${dest}`);
        return;
    }
    redirectTo(router, dest);
}

/* ------------------------------------------------------------------ */
/* Sub-views                                                           */
/* ------------------------------------------------------------------ */

function TaskBreadcrumb({ originTitle, taskTitle, onBack }) {
    const { t } = useTranslation();
    const sourceTitle = originTitle || t('My Tasks');

    return (
        <Row
            className="items-center flex-wrap min-w-0 gap-1.5 px-1"
            // `role`, not `accessibilityRole`: Android throws on roles outside its enum.
            role="navigation"
            accessibilityLabel={t('Breadcrumb')}
        >
            <Pressable
                onPress={onBack}
                className="min-w-0 max-w-[50%] rounded-md px-1 py-0.5 web:hover:bg-muted/50"
                accessibilityRole="link"
                accessibilityLabel={sourceTitle}
            >
                <Text numberOfLines={1} className="text-sm leading-5 text-muted-foreground web:hover:text-foreground">
                    {sourceTitle}
                </Text>
            </Pressable>
            <Icon icon="ChevronRight" size={14} className="shrink-0 text-muted-foreground" />
            <Text numberOfLines={1} className="min-w-0 flex-1 text-sm leading-5 font-medium text-foreground">
                {taskTitle}
            </Text>
        </Row>
    );
}

function TaskPageView({ pageData, url, breadcrumb, fill }) {
    const TaskLayout = components['layout']['task'] || components['layout']['post'];
    const { layoutBlocks } = getLayoutName(pageData, pageData?.uri || 'item');
    const blocks = layoutBlocks || appSetting('layouts', pageData?.uri)?.blocks;
    const pageClasses = {
        contentWidth: getPageContentWidth('task', pageData?.uri),
    };

    if (!TaskLayout) return null;
    return (
        <TaskLayout
            url={url}
            layoutName="task"
            data={pageData}
            blocks={blocks}
            pageClasses={pageClasses}
            embedded
            fill={fill}
            breadcrumb={breadcrumb}
        />
    );
}

function ActiveTaskView({ task, pageData, loading, onBack, originTitle, fill }) {
    const { t } = useTranslation();
    const NoContent = components['molecule']['no_content'];
    const breadcrumb = (
        <TaskBreadcrumb
            originTitle={originTitle}
            taskTitle={task.title || t('Task')}
            onBack={onBack}
        />
    );

    if (loading) {
        return (
            <View className={cn('w-full p-4', fill && 'flex h-full min-h-0 flex-1 flex-col')}>
                <View className="shrink-0 pb-3">{breadcrumb}</View>
                <View className="items-center justify-center py-12">
                    <Loading />
                </View>
            </View>
        );
    }

    if (!pageData) {
        return (
            <View className="w-full p-4">
                <View className="pb-3">{breadcrumb}</View>
                <NoContent endpoint={{ request_url: task.url, params: {} }} />
            </View>
        );
    }

    return <TaskPageView pageData={pageData} url={task.url} breadcrumb={breadcrumb} fill={fill} />;
}

function StatusSection({ list }) {
    const tasks = list.tasks || [];
    return (
        <View className="gap-1">
            <Row className={appSetting('tasks', 'section_title')}>
                <Icon icon={iconForTaskStatus(list.list_title)} size={16} className="text-foreground shrink-0" />
                <Text className="text-base font-semibold tracking-tight text-foreground">
                    {list.list_title}
                    {tasks.length ? ` · ${tasks.length}` : ''}
                </Text>
            </Row>
            {tasks.length ? (
                <BrowseSimple
                    data={{ data: tasks, unit: 'general-content-list', module: 'bx_tasks' }}
                    blockWrapperProps={{ block: { designbox_id: null } }}
                />
            ) : null}
        </View>
    );
}

function filterTriggerButtonProps(label) {
    return {
        style: 'glass',
        controlSize: 'small',
        borderShape: 'capsule',
        image: 'ListFilter',
        label,
        accessibilityLabel: label,
    };
}

/** Saved-filters dropdown + ad-hoc filter chips. */
function FiltersToolbar({ filters, filterSelectionNonce, onApplyFilter, onSaveFilter, onApplied }) {
    const { t } = useTranslation();
    const items = filterDropdownItems(filters);
    const selectable = items.filter((item) => item.type !== 'group_header');
    const selected = selectable.find((item) => item.id === filters?.value)
        || selectable.find((item) => item.id === 0)
        || selectable[0];
    const filterLabel = selected?.title || t('Filter');

    if (!filters.request_url_add) {
        if (!selectable.length) {
            return <NeoButton {...filterTriggerButtonProps(t('Filter'))} />;
        }
        return (
            <DropdownMenu
                items={items}
                onSelect={onApplyFilter}
                stacked
                buttonProps={filterTriggerButtonProps(filterLabel)}
            />
        );
    }

    return (
        <Row className="flex-wrap items-center gap-2 ">
            {selectable.length > 1 ? (
                <DropdownMenu
                    items={items}
                    onSelect={onApplyFilter}
                    stacked
                    buttonProps={filterTriggerButtonProps(selected?.title)}
                />
            ) : null}
            <TasksFilterSelector
                requestUrlAdd={filters.request_url_add}
                requestUrlApply={filters.request_url_apply}
                requestUrlSave={filters.request_url_save}
                savedFilterId={filters.value}
                filterSelectionNonce={filterSelectionNonce}
                onSave={onSaveFilter}
                onApplied={onApplied}
            />
        </Row>
    );
}

/* ------------------------------------------------------------------ */
/* Block                                                               */
/* ------------------------------------------------------------------ */

export default function ElementTasksList({ data, blockWrapperProps }) {
    const pageTitle = blockWrapperProps?.extraProps?.pageTitle;
    const pageContext = blockWrapperProps?.extraProps?.pageContext;
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const router = useRouter();
    const NoContent = components['molecule']['no_content'];

    const [listsData, setListsData] = useState(data);
    const [rawTasklists, setRawTasklists] = useState(() => extractTasklists(data));
    // Progress (done / total) comes from whichever browse lists are loaded; derive
    // it instead of syncing state so sidebar and list never disagree.
    const tasklists = useMemo(
        () => applyTasklistProgress(rawTasklists, listsData?.lists),
        [rawTasklists, listsData?.lists]
    );
    const [selectedTasklistId, setSelectedTasklistId] = useState(
        () => data?.tasklist_id ?? data?.selected_tasklist_id ?? listIdOrNull(tasksHomeQueryFromBrowser().listId)
    );
    const [selectedContextPid, setSelectedContextPid] = useState(() => tasksHomeQueryFromBrowser().contextPid);
    const [rememberedContextTitle, setRememberedContextTitle] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [taskPage, setTaskPage] = useState(null); // { url, data } for the last loaded task
    const [formBlock, setFormBlock] = useState(null);
    const [showConfirm, setShowConfirm] = useState(NO_CONFIRM);
    const [filterSelectionNonce, setFilterSelectionNonce] = useState(0);
    const taskRequestIdRef = useRef(0);
    const contextRequestIdRef = useRef(0);
    const listUrlRef = useRef(getBrowserLocation());
    // Read by `applyContextQuery` (stable across tasklist changes on purpose —
    // it is a dep of the load effect and must not refetch when groups arrive).
    const tasklistsRef = useRef(tasklists);
    // Set while this component itself calls pushState/replaceState so the
    // location subscription ignores its own writes (otherwise every tasklist
    // click fetched twice: once from the handler, once from the caller).
    const ownHistoryRef = useRef(false);

    useEffect(() => {
        tasklistsRef.current = tasklists;
    }, [tasklists]);

    // Fresh block data (page reload) replaces whatever was fetched since.
    const [seenData, setSeenData] = useState(data);
    if (seenData !== data) {
        setSeenData(data);
        setListsData(data);
        setRawTasklists(extractTasklists(data));
    }

    const writeOwnHistory = useCallback((method, state, url) => {
        ownHistoryRef.current = true;
        try {
            window.history[method](state, '', url);
        } finally {
            ownHistoryRef.current = false;
        }
    }, []);

    const browseContext = pickBrowseContext(data, listsData);
    const requestUrl = resolveListRequestUrl({
        browseContext,
        contextPid: selectedContextPid,
        listId: selectedTasklistId,
        listContextId: findTasklist(tasklists, selectedTasklistId)?.context_id,
        fallback: listsData?.request_url ?? data?.request_url,
    });

    const taskPageData = activeTask && taskPage?.url === activeTask.url ? taskPage.data : null;
    const taskPageLoading = !!activeTask && taskPage?.url !== activeTask.url;
    const originContextPid = usableContextId(selectedContextPid)
        ?? usableContextId(isWeb ? tasksHomeQueryFromBrowser().contextPid : null)
        ?? (isProfileTasksBrowse(listsData || data) ? null : extractContextId(listsData || data));
    const originTitle = resolveTasksOriginTitle({
        tasklists,
        rawLists: data?.lists,
        browseLists: originContextPid ? listsData?.lists : null,
        contextPid: originContextPid,
        listId: selectedTasklistId,
        contextTitle: originContextPid ? rememberedContextTitle : null,
        pageTitle,
        pageContext,
        fallback: t('My Tasks'),
    });

    /* ---- inline task page ------------------------------------------ */

    const openTask = useCallback((task, { skipHistory = false } = {}) => {
        if (!task?.url) return;
        const next = { url: task.url, title: task.title || task.name || '' };

        // Put the task's own URL in the bar so it can be copied / shared.
        // Origin list is kept in history state; Back and conductor tabs restore it.
        if (isWeb && !skipHistory) {
            const loc = getBrowserLocation();
            if (!isTaskViewPath(loc)) listUrlRef.current = loc;
            const dest = taskViewHref(next.url) || loc;
            const state = {
                ...(window.history.state || {}),
                tasksListTask: next,
                tasksListOrigin: listUrlRef.current || loc,
            };
            writeOwnHistory(window.history.state?.tasksListTask ? 'replaceState' : 'pushState', state, dest);
        }

        setActiveTask(next);
    }, [writeOwnHistory]);

    const closeTask = useCallback(({ restoreUrl = true, refresh = false } = {}) => {
        const shouldBack = restoreUrl && isWeb && !!window.history.state?.tasksListTask;
        taskRequestIdRef.current += 1;
        setActiveTask(null);
        setTaskPage(null);
        if (refresh) emitTasksListRefresh();
        if (shouldBack) window.history.back();
    }, []);

    useEffect(() => {
        const url = activeTask?.url;
        if (!url) return;
        const requestId = ++taskRequestIdRef.current;
        getPageData(url, false)
            .then((response) => ({ url, data: response?.data || null }))
            .catch(() => ({ url, data: null }))
            .then((page) => {
                if (requestId === taskRequestIdRef.current) setTaskPage(page);
            });
    }, [activeTask?.url]);

    /* ---- context / tasklist selection ------------------------------ */

    const applyContextQuery = useCallback(async (contextPid, listId) => {
        const requestId = ++contextRequestIdRef.current;
        setSelectedContextPid(contextPid || null);
        setSelectedTasklistId(listIdOrNull(listId));
        if (!contextPid) {
            setRememberedContextTitle(null);
        } else {
            const known = findTasklistGroup(tasklistsRef.current, contextPid);
            if (known?.title) setRememberedContextTitle(known.title);
        }

        const alreadyLoaded = !contextPid || (
            String(usableContextId(data?.context_id)) === String(contextPid)
            && !isProfileTasksBrowse(data)
            && !hasListId(listId)
        );
        if (alreadyLoaded) {
            setListsData(data);
            return;
        }

        const url = buildContextBrowseUrl(pickBrowseContext(data), contextPid, listId);
        if (!url) return;
        const response = await fetcher(apiUrl(url));
        if (requestId !== contextRequestIdRef.current) return;
        const next = unwrapTasksListPayload(response);
        if (next) {
            const title = findTasklistGroup(tasklistsRef.current, contextPid)?.title
                || findTasklistGroupByLists(tasklistsRef.current, next.lists)?.title
                || contextTitleFromPayload(next, response?.data)
                || findContextTitleInRawLists(data?.lists, contextPid);
            if (title) setRememberedContextTitle(title);
            setListsData((prev) => mergeListsData(prev, next, listId));
        }
    }, [data]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (isProfileTasksBrowse(data)) {
                const groups = extractTasklists(data);
                const needsChildren = !groups.length
                    || groups.some((group) => isTasklistGroup(group) && !group.children.length);
                if (needsChildren) {
                    const fetched = await fetchTasklistGroups(data);
                    if (!cancelled) setRawTasklists(fetched);
                }
            }
            if (cancelled) return;
            const { contextPid, listId } = tasksHomeQueryFromBrowser();
            if (contextPid || hasListId(listId)) await applyContextQuery(contextPid, listId);
        };
        load();
        return () => {
            cancelled = true;
            contextRequestIdRef.current += 1;
        };
    }, [data, applyContextQuery]);

    // No effect syncing `rememberedContextTitle` from `tasklists`: resolveTasksOriginTitle
    // already prefers the live group title; the remembered one is only the fallback
    // set at selection / fetch time for groups the sidebar does not list.

    // Effect event: always sees the latest activeTask / selection without
    // re-subscribing, and without writing refs during render.
    const onBrowserLocation = useEffectEvent((event) => {
        if (ownHistoryRef.current) return;

        const url = event.url || getBrowserLocation();
        const state = event.state ?? window.history.state;
        const queuedTask = tasksListTaskFromHistoryState(state);

        if (queuedTask) {
            if (activeTask?.url !== queuedTask.url) {
                openTask(queuedTask, { skipHistory: true });
            }
            return;
        }

        if (isTaskViewPath(url)) return;

        // Next.js replaceState on the same list URL is not a user navigation.
        // Conductor tab clicks use pushState, including My Tasks while a task is open.
        if (activeTask && url === listUrlRef.current && event.method === 'replaceState') {
            return;
        }

        if (activeTask) {
            closeTask({ restoreUrl: false, refresh: true });
        }

        if (!isTasksHomeUri(url) && !isTasksHomePath()) return;

        const { contextPid, listId } = tasksHomeQueryFromBrowser();
        const nextListId = listIdOrNull(listId);
        const sameContext = String(selectedContextPid || '') === String(contextPid || '');
        const sameList = (
            (!hasListId(selectedTasklistId) && !hasListId(nextListId))
            || isSameListId(selectedTasklistId, nextListId)
        );
        if (!sameContext || !sameList) applyContextQuery(contextPid, listId);
    });

    useEffect(() => {
        if (!isWeb) return;
        return subscribeBrowserLocation((event) => onBrowserLocation(event));
    }, []);

    const selectTasklist = (item) => {
        if (item?.id == null) return;
        closeTask({ restoreUrl: false });
        const parentGroup = isTasklistGroup(item)
            ? item
            : (findParentTasklistGroup(tasklists, item.id) || findTasklistGroup(tasklists, item.context_id));
        if (parentGroup?.title) setRememberedContextTitle(parentGroup.title);
        const contextId = item.context_id
            ?? parentGroup?.context_id
            ?? parentGroup?.id
            ?? (isTasklistGroup(item) ? item.id : null)
            ?? extractContextId(browseContext);
        const listId = isTasklistGroup(item) ? null : item.id;
        const alreadySelectedList = !isTasklistGroup(item)
            && isSameListId(selectedTasklistId, listId)
            && (item.context_id == null || selectedContextPid == null
                || String(item.context_id) === String(selectedContextPid));
        const alreadySelectedGroup = isTasklistGroup(item)
            && String(item.id) === String(selectedContextPid)
            && !hasListId(selectedTasklistId);

        if (alreadySelectedGroup) {
            if (!isTasksHomePath()) {
                navigateToPage(router, TASKS_HOME_PATH);
                return;
            }
            if (getBrowserLocation() !== TASKS_HOME_PATH) {
                writeOwnHistory('pushState', { tasksHomeQuery: true }, TASKS_HOME_PATH);
            }
            applyContextQuery(null, null);
            return;
        }

        if (alreadySelectedList) {
            const dest = buildTasksHomeUrl(contextId, null);
            if (!dest) return;
            if (!isTasksHomePath()) {
                navigateToPage(router, dest);
                return;
            }
            if (getBrowserLocation() !== dest) {
                writeOwnHistory('pushState', { tasksHomeQuery: true }, dest);
            }
            applyContextQuery(contextId, null);
            return;
        }

        const dest = buildTasksHomeUrl(contextId, listId);
        if (!dest) return;

        if (!isTasksHomePath()) {
            navigateToPage(router, dest);
            return;
        }
        if (getBrowserLocation() === dest) {
            setSelectedContextPid(contextId || null);
            setSelectedTasklistId(listIdOrNull(listId));
            return;
        }
        writeOwnHistory('pushState', { tasksHomeQuery: true }, dest);
        applyContextQuery(contextId, listId);
    };

    /* ---- refresh + events ------------------------------------------ */

    const refreshLists = useCallback(async () => {
        if (!requestUrl) return;
        const response = await fetcher(apiUrl(requestUrl));
        setListsData((prev) => {
            const next = normalizeTasksListPayload(response, prev);
            if (prev?.request_url && selectedTasklistId != null) next.request_url = prev.request_url;
            return next;
        });
    }, [requestUrl, selectedTasklistId]);

    useEffect(() => {
        loadTaskTimerSessions();
    }, []);

    useEffect(() => {
        const subscription = emitter.addListener(TASKS_LIST_EVENT, (event) => {
            if (event.action === 'reload') refreshLists();
            if (event.action === 'patch') {
                setListsData((prev) => {
                    if (!prev?.lists) return prev;
                    const lists = patchTaskInLists(prev.lists, event);
                    return lists === prev.lists ? prev : { ...prev, lists };
                });
            }
            if (event.action === 'open' && event.url) openTask({ url: event.url, title: event.title });
            if (event.action === 'close') closeTask();
        });
        return () => subscription.remove();
    }, [refreshLists, openTask, closeTask]);

    /* ---- modal forms (task add / edit, save filter) ---------------- */

    const isSaveFilterForm = !!formBlock?._isSaveFilter;
    const finishFormBlock = useCallback(() => {
        setFormBlock(null);
        if (isSaveFilterForm) setFilterSelectionNonce((nonce) => nonce + 1);
        emitTasksListRefresh();
    }, [isSaveFilterForm]);

    useEffect(() => {
        const formNames = getFormNamesFromBlock(formBlock);
        if (!formNames.length) return;
        const subscriptions = formNames.map((formName) =>
            emitter.addListener(EVENTS.form(formName), (event) => {
                if (event.action === 'received' && isFormResponseComplete(event.data)) finishFormBlock();
            })
        );
        return () => subscriptions.forEach((subscription) => subscription.remove());
    }, [formBlock, finishFormBlock]);

    /* ---- filters ---------------------------------------------------- */

    const filters = listsData?.filters;

    const applySavedFilter = async (item) => {
        if (!filters?.request_url_apply) return;
        await fetcher(apiUrl(filters.request_url_apply + item.id));
        setFilterSelectionNonce((nonce) => nonce + 1);
        await refreshLists();
    };

    const openSaveFilter = async () => {
        if (!filters?.request_url_save) return;
        const response = await fetcher(apiUrl(filters.request_url_save));
        setFormBlock({ content: response.data, designbox_id: 0, title: t('Save'), _isSaveFilter: true });
    };

    /* ---- render ----------------------------------------------------- */

    const statusLists = groupTasksByStatus(flattenListsWithTasks(listsData?.lists || []));
    const topActions = listsData?.actions || [];
    const modalActions = topActions.filter((action) => action.type === 'modal');
    const menuActions = topActions.filter((action) => action.type === 'menu');
    const hasHeaderActions = modalActions.length > 0 || menuActions.length > 0;
    const actionHandlers = { setFormBlock, setShowConfirm };
    const showTasklists = tasklists.length > 0;
    const fillViewport = Boolean(blockWrapperProps?.fill) || (isWeb && isTasksHomePath());
    const hasToolbar = !!(filters || hasHeaderActions);

    const confirmAndForm = (
        <>
            <Confirm
                onVisible={showConfirm.show}
                title={showConfirm.title || t('Are you sure?')}
                handleCancel={() => setShowConfirm(NO_CONFIRM)}
                handleOk={async () => {
                    const cb = showConfirm.cb;
                    setShowConfirm(NO_CONFIRM);
                    if (cb) await cb();
                }}
            />

            {formBlock ? (
                <Modal
                    title={formBlock.title || ' '}
                    onVisible={!!formBlock}
                    onClose={() => setFormBlock(null)}
                    scrollable
                    transparent
                >
                    <View className="px-4">
                        <BlockByData block={formBlock} onFormEmpty={finishFormBlock} />
                    </View>
                </Modal>
            ) : null}
        </>
    );

    if (activeTask) {
        return (
            <BlockWrapper
                {...blockWrapperProps}
                fill={fillViewport || blockWrapperProps?.fill}
                showPadding={!fillViewport}
                clip={fillViewport}
            >
                {confirmAndForm}
                <ActiveTaskView
                    task={activeTask}
                    pageData={taskPageData}
                    loading={taskPageLoading}
                    originTitle={originTitle}
                    fill={fillViewport}
                    onBack={() => closeTask({ refresh: true })}
                />
            </BlockWrapper>
        );
    }

    return (
        <BlockWrapper
            {...blockWrapperProps}
            fill={fillViewport || blockWrapperProps?.fill}
            showPadding={!fillViewport}
            clip={!fillViewport}
        >
            {confirmAndForm}

            {/* Spacing between toolbar / tasklists / sections: tasks-home pads
                each part itself (p-4, px-4 pb-4); the embedded block uses gaps. */}
            <View className={cn('w-full', fillViewport ? 'h-full min-h-0 flex-1' : 'gap-4')}>
                {hasToolbar ? (
                    <Row className={cn(
                        'flex-wrap items-center justify-between gap-3',
                        fillViewport && 'shrink-0 p-4',
                    )}>
                        {filters ? (
                            <FiltersToolbar
                                filters={filters}
                                filterSelectionNonce={filterSelectionNonce}
                                onApplyFilter={applySavedFilter}
                                onSaveFilter={openSaveFilter}
                                onApplied={emitTasksListRefresh}
                            />
                        ) : (
                            <View />
                        )}

                        {hasHeaderActions ? (
                            <Row className="flex-wrap items-center gap-2">
                                {modalActions.map((action) => (
                                    <NeoButton
                                        key={action.name}
                                        style="glass"
                                        controlSize="small"
                                        label={action.title}
                                        onPress={() => runTaskAction(action, actionHandlers)}
                                    />
                                ))}
                                <MenuObjectActions actions={menuActions} setShowConfirm={setShowConfirm} />
                            </Row>
                        ) : null}
                    </Row>
                ) : null}

                <View className={cn(
                    'w-full ',
                    showTasklists && 'flex flex-col lg:flex-row',
                    showTasklists && (fillViewport ? 'lg:items-stretch' : 'lg:items-start gap-4'),
                    fillViewport && 'min-h-0 flex-1',
                )}>
                    {showTasklists ? (
                        <View className={cn(
                            'order-1 w-full shrink-0 lg:order-2 lg:w-auto',
                            fillViewport && 'lg:h-full lg:min-h-0 px-4 pb-4 lg:pl-0 lg:pr-4',
                        )}>
                            <TasklistsPanel
                                tasklists={tasklists}
                                selectedId={selectedTasklistId}
                                selectedContextId={selectedContextPid}
                                onSelect={selectTasklist}
                                actionHandlers={actionHandlers}
                                defaultCollapsed={!isDesktop}
                                fill={fillViewport}
                            />
                        </View>
                    ) : null}

                    <View className={cn(
                        'min-w-0 gap-1',
                        showTasklists && 'order-2 lg:order-1 flex-auto',
                        fillViewport && 'min-h-0 flex-1 web:overflow-y-auto px-4 pb-4',
                        fillViewport && !hasToolbar && 'pt-4',
                    )}>
                        {statusLists.length === 0 ? (
                            <NoContent endpoint={{ request_url: listsData?.request_url, params: {} }} />
                        ) : (
                            statusLists.map((list) => <StatusSection key={list.list_id} list={list} />)
                        )}
                    </View>
                </View>
            </View>
        </BlockWrapper>
    );
}
