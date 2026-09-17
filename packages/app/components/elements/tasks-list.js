/**
 * Tasks home / context block: status sections of tasks, a tasklists sidebar,
 * saved + ad-hoc filters and an inline task page (URL-synced on web).
 *
 * Helpers and sub-panels live in `./tasks/`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse-simple';
import { components } from 'app/components/registry';
import { Button, Modal } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Icon } from 'app/ui/atoms/icon';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn, getLayoutName, getPageData } from 'app/lib/util';
import { redirectTo, useRouter } from 'app/lib/hooks/router';
import emitter from 'app/context/emitter';
import { useIsDesktop } from 'app/context/measure';
import Confirm from 'app/ui/molecules/dialogs/confirm';
import { isFormResponseComplete } from 'app/lib/form/form-helpers';
import { iconForTaskStatus } from 'app/lib/tasks-meta';
import { Loading } from 'app/customization/loading';
import { NO_CONFIRM, MenuObjectActions, runTaskAction } from './tasks/actions';
import TasklistsPanel from './tasks/tasklists-panel';
import TasksFilterSelector from './tasks/filter-selector';
import {
    TASKS_LIST_EVENT,
    apiUrl,
    buildContextBrowseUrl,
    buildTasklistBrowseUrl,
    buildTasksHomeUrl,
    emitTasksListRefresh,
    extractContextId,
    extractTasklists,
    fetchTasklistGroups,
    findTasklist,
    flattenListsWithTasks,
    getBrowserLocation,
    getFormNamesFromBlock,
    groupTasksByStatus,
    hasListId,
    isProfileTasksBrowse,
    isTasklistGroup,
    isTasksHomePath,
    listIdOrNull,
    normalizeBrowserPath,
    normalizeTasksListPayload,
    pickBrowseContext,
    tasksHomeQueryFromBrowser,
    unwrapTasksListPayload,
    usableContextId,
} from './tasks/helpers';

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

function TaskPageView({ pageData, url }) {
    const PostLayout = components['layout']['post'];
    const { layoutBlocks } = getLayoutName(pageData, 'item');
    const blocks = layoutBlocks || appSetting('layouts', pageData?.uri)?.blocks;

    if (!PostLayout) return null;
    return <PostLayout url={url} layoutName="post" data={pageData} blocks={blocks} />;
}

function ActiveTaskView({ task, pageData, loading, onBack }) {
    const { t } = useTranslation();
    const NoContent = components['molecule']['no_content'];

    return (
        <>
            <Row className="items-center gap-2 px-1">
                <Button variant="text" size="sm" startDecorator="ArrowLeft" title={t('Back')} onPress={onBack} />
                {task.title ? (
                    <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
                        {task.title}
                    </Text>
                ) : null}
            </Row>

            {loading ? (
                <View className="items-center justify-center py-12">
                    <Loading />
                </View>
            ) : pageData ? (
                <TaskPageView pageData={pageData} url={task.url} />
            ) : (
                <NoContent endpoint={{ request_url: task.url, params: {} }} />
            )}
        </>
    );
}

function StatusSection({ list }) {
    const tasks = list.tasks || [];
    return (
        <View className="gap-2">
            <Row className="items-center gap-2 min-w-0 px-2">
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

/** Saved-filters dropdown + ad-hoc filter chips. */
function FiltersToolbar({ filters, filterSelectionNonce, onApplyFilter, onSaveFilter, onApplied }) {
    const { t } = useTranslation();
    const items = filterDropdownItems(filters);
    const selectable = items.filter((item) => item.type !== 'group_header');
    const selected = selectable.find((item) => item.id === filters?.value)
        || selectable.find((item) => item.id === 0)
        || selectable[0];

    if (!filters.request_url_add) {
        if (!selectable.length) {
            return <Button size="sm" startDecorator="ListFilter" title={t('Filter')} />;
        }
        return (
            <DropdownMenu items={items} onSelect={onApplyFilter}>
                <Button
                    size="sm"
                    startDecorator="ListFilter"
                    title={selected?.title || t('Filter')}
                    className="max-w-[280px]"
                    classTextName="max-w-[250px]"
                />
            </DropdownMenu>
        );
    }

    return (
        <Row className="flex-wrap items-center gap-2">
            {selectable.length > 1 ? (
                <DropdownMenu items={items} onSelect={onApplyFilter}>
                    <Button
                        size="sm"
                        startDecorator="ListFilter"
                        title={selected?.title}
                        className="max-w-[200px]"
                        classTextName="max-w-[170px]"
                    />
                </DropdownMenu>
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
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const router = useRouter();
    const NoContent = components['molecule']['no_content'];

    const [listsData, setListsData] = useState(data);
    const [tasklists, setTasklists] = useState(() => extractTasklists(data));
    const [selectedTasklistId, setSelectedTasklistId] = useState(
        () => data?.tasklist_id ?? data?.selected_tasklist_id ?? listIdOrNull(tasksHomeQueryFromBrowser().listId)
    );
    const [selectedContextPid, setSelectedContextPid] = useState(() => tasksHomeQueryFromBrowser().contextPid);
    const [activeTask, setActiveTask] = useState(null);
    const [taskPage, setTaskPage] = useState(null); // { url, data } for the last loaded task
    const [formBlock, setFormBlock] = useState(null);
    const [showConfirm, setShowConfirm] = useState(NO_CONFIRM);
    const [filterSelectionNonce, setFilterSelectionNonce] = useState(0);
    const taskRequestIdRef = useRef(0);
    const contextRequestIdRef = useRef(0);
    const previousBrowserUrlRef = useRef(null);

    // Fresh block data (page reload) replaces whatever was fetched since.
    const [seenData, setSeenData] = useState(data);
    if (seenData !== data) {
        setSeenData(data);
        setListsData(data);
        setTasklists(extractTasklists(data));
    }

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

    /* ---- inline task page ------------------------------------------ */

    const openTask = useCallback((task) => {
        if (!task?.url) return;

        if (isWeb) {
            const nextPath = normalizeBrowserPath(task.url);
            const current = getBrowserLocation();
            const isFirstOpen = !previousBrowserUrlRef.current;
            if (isFirstOpen) previousBrowserUrlRef.current = current;
            if (nextPath && current !== nextPath) {
                const method = isFirstOpen ? 'pushState' : 'replaceState';
                window.history[method]({ tasksListTask: true }, '', nextPath);
            }
        }

        setActiveTask({ url: task.url, title: task.title || task.name || '' });
    }, []);

    const closeTask = useCallback(({ restoreUrl = true, refresh = false } = {}) => {
        if (isWeb && restoreUrl && previousBrowserUrlRef.current) {
            window.history.replaceState(null, '', previousBrowserUrlRef.current);
        }
        previousBrowserUrlRef.current = null;
        taskRequestIdRef.current += 1;
        setActiveTask(null);
        setTaskPage(null);
        // Keep the existing list on screen, then refresh in the background.
        if (refresh) emitTasksListRefresh();
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
        if (next) setListsData((prev) => mergeListsData(prev, next, listId));
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
                    if (!cancelled) setTasklists(fetched);
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

    useEffect(() => {
        if (!isWeb) return;
        const handlePopState = () => {
            if (activeTask) {
                closeTask({ restoreUrl: false, refresh: true });
                return;
            }
            const { contextPid, listId } = tasksHomeQueryFromBrowser();
            applyContextQuery(contextPid, listId);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeTask, closeTask, applyContextQuery]);

    const selectTasklist = (item) => {
        if (item?.id == null) return;
        closeTask();
        const contextId = item.context_id
            ?? (isTasklistGroup(item) ? item.id : null)
            ?? extractContextId(browseContext);
        const listId = isTasklistGroup(item) ? 0 : item.id;
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
        window.history.pushState({ tasksHomeQuery: true }, '', dest);
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
        const subscription = emitter.addListener(TASKS_LIST_EVENT, (event) => {
            if (event.action === 'reload') refreshLists();
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
            emitter.addListener(`form_${formName}`, (event) => {
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

    return (
        <BlockWrapper {...blockWrapperProps}>
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

            <View className="w-full gap-4">
                {activeTask ? (
                    <ActiveTaskView
                        task={activeTask}
                        pageData={taskPageData}
                        loading={taskPageLoading}
                        onBack={() => closeTask({ refresh: true })}
                    />
                ) : (
                    <>
                        {filters || hasHeaderActions ? (
                            <Row className="flex-wrap items-center justify-between gap-3">
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
                                            <Button
                                                key={action.name}
                                                size="sm"
                                                title={action.title}
                                                onPress={() => runTaskAction(action, actionHandlers)}
                                            />
                                        ))}
                                        <MenuObjectActions actions={menuActions} setShowConfirm={setShowConfirm} />
                                    </Row>
                                ) : null}
                            </Row>
                        ) : null}

                        <View className={cn('w-full gap-4', showTasklists && 'flex flex-col lg:flex-row lg:items-start')}>
                            {showTasklists ? (
                                <View className="order-1 w-full shrink-0 lg:order-2 lg:w-auto">
                                    <TasklistsPanel
                                        tasklists={tasklists}
                                        selectedId={selectedTasklistId}
                                        selectedContextId={selectedContextPid}
                                        onSelect={selectTasklist}
                                        actionHandlers={actionHandlers}
                                        defaultCollapsed={!isDesktop}
                                    />
                                </View>
                            ) : null}

                            <View className={cn('min-w-0 gap-4', showTasklists && 'order-2 lg:order-1 flex-auto')}>
                                {statusLists.length === 0 ? (
                                    <NoContent endpoint={{ request_url: listsData?.request_url, params: {} }} />
                                ) : (
                                    statusLists.map((list) => <StatusSection key={list.list_id} list={list} />)
                                )}
                            </View>
                        </View>
                    </>
                )}
            </View>
        </BlockWrapper>
    );
}
