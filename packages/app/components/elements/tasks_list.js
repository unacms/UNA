import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse_simple';
import { getComponent } from 'app/components/registry';
import { Button, Modal } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import emitter from 'app/context/emitter';
import Confirm from 'app/ui/molecules/confirm';
import { isFormResponseComplete } from 'app/lib/form-helpers';
import TasksFilterSelector from 'app/components/elements/tasks-filter-selector';


const TASKS_LIST_EVENT = 'tasks_list';

function filterDropdownItems(filters) {
    return (filters?.values || [])
        .map((item, index) => {
            if (item?.type === 'group_header') {
                return {
                    id: `group-${item.value}-${index}`,
                    type: 'group_header',
                    title: item.value,
                };
            }

            if (item?.key == null) return null;

            return {
                id: item.key,
                name: String(item.key),
                title: item.value,
            };
        })
        .filter(Boolean);
}

function getSelectableFilterItems(items) {
    return items.filter((item) => item.type !== 'group_header');
}

function actionsToDropdownItems(actions = []) {
    return actions.map((action) => ({
        id: action.name,
        name: action.name,
        title: action.title || action.name,
        ...(action.icon ? { icon: action.icon } : {}),
        action,
    }));
}

function emitTasksListRefresh() {
    emitter.emit(TASKS_LIST_EVENT, { action: 'reload' });
}

function isTasksListPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (Array.isArray(payload.lists)) return true;
    return !!(payload.request_url && Array.isArray(payload.actions));
}

function normalizeTasksListPayload(response, fallback) {
    const root = response?.data;
    if (!root) return fallback;

    const candidates = [];
    const collect = (node) => {
        if (!node || typeof node !== 'object') return;
        candidates.push(node);
        if (node.data) candidates.push(node.data);
        if (Array.isArray(node.content)) {
            for (const item of node.content) {
                collect(item);
            }
        }
    };

    if (Array.isArray(root)) {
        for (const item of root) collect(item);
    } else {
        collect(root);
    }

    for (const candidate of candidates) {
        if (isTasksListPayload(candidate)) {
            return { ...fallback, ...candidate };
        }
    }

    return fallback;
}

function getFormNamesFromBlock(block) {
    const content = Array.isArray(block?.content) ? block.content : [];
    return content
        .filter((item) => item?.type === 'form')
        .map((item) => item?.data?.params?.display || item?.name)
        .filter(Boolean);
}

function shouldRefreshAfterFormResponse(responseData) {
    return isFormResponseComplete(responseData);
}

function actionNeedsConfirm(action) {
    return action?.confirm == '1' || action?.confirm === 1 || action?.confirm === true;
}

async function runTaskAction(action, { setFormBlock, refreshLists, setShowConfirm }) {
    if (!action) return;

    if (action.type === 'modal') {
        const fetchedData = await fetcher('/api.php?r=' + action.callback);
        setFormBlock({
            content: fetchedData.data,
            designbox_id: 0,
            title: action.title,
        });
        return;
    }

    if (action.type === 'callback') {
        const execute = async () => {
            await fetcher('/api.php?r=' + action.callback);
            await refreshLists?.();
            emitTasksListRefresh();
        };

        if (actionNeedsConfirm(action)) {
            setShowConfirm?.({
                show: true,
                title: action.title || action.confirm_text || 'Are you sure?',
                cb: execute,
            });
            return;
        }

        await execute();
    }
}

function TaskActionsDropdown({ actions, setFormBlock, refreshLists, setShowConfirm }) {
    const items = useMemo(() => actionsToDropdownItems(actions), [actions]);

    if (!items.length) return null;

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => runTaskAction(item.action, { setFormBlock, refreshLists, setShowConfirm })}
        >
            <Button variant="text" size="sm" rounded startDecorator="Ellipsis" />
        </DropdownMenu>
    );
}

function MenuObjectActions({ actions, refreshLists, setShowConfirm }) {
    const menuItems = useMemo(
        () => (actions || []).flatMap((action) => (Array.isArray(action?.items) ? action.items : [])),
        [actions]
    );

    const onMenuItemPress = useCallback(async (item) => {
        const callbackUrl = item?.data?.request_url || item?.callback;
        if (!callbackUrl) return;

        const execute = async () => {
            await fetcher('/api.php?r=' + callbackUrl);
            if (item?.data?.on_callback === 'refresh' || item?.on_callback === 'refresh') {
                await refreshLists?.();
                emitTasksListRefresh();
            }
        };

        if (actionNeedsConfirm(item?.data || item)) {
            setShowConfirm?.({
                show: true,
                title: item?.title || item?.data?.confirm_text || 'Are you sure?',
                cb: execute,
            });
            return;
        }

        await execute();
    }, [refreshLists, setShowConfirm]);

    if (!menuItems.length) return null;

    return (
        <>
            {menuItems.map((item, index) => (
                <Button
                    key={item?.id || item?.name || `menu-item-${index}`}
                    size="sm"
                    title={item?.title || item?.name}
                    onPress={() => onMenuItemPress(item)}
                />
            ))}
        </>
    );
}


export default function ElementTasksList({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const NoContent = getComponent('molecule', 'no_content');
    const [formBlock, setFormBlock] = useState(null);
    const [listsData, setListsData] = useState(data);
    const [showConfirm, setShowConfirm] = useState({ show: false, title: '', cb: null });
    const requestUrlRef = useRef(data?.request_url);
    const dataRef = useRef(data);

    useEffect(() => {
        if (data !== dataRef.current) {
            dataRef.current = data;
            setListsData(data);
        }
    }, [data]);

    useEffect(() => {
        requestUrlRef.current = listsData?.request_url ?? data?.request_url;
    }, [listsData?.request_url, data?.request_url]);

    const refreshLists = useCallback(async () => {
        const requestUrl = requestUrlRef.current;
        if (!requestUrl) return;

        const response = await fetcher('/api.php?r=' + requestUrl);
        setListsData((prev) => normalizeTasksListPayload(response, prev));
    }, []);

    useEffect(() => {
        const subscription = emitter.addListener(TASKS_LIST_EVENT, (event) => {
            if (event.action === 'reload') {
                refreshLists();
            }
        });

        return () => subscription.remove();
    }, [refreshLists]);

    const handleFormClose = useCallback(() => {
        setFormBlock(null);
        refreshLists();
        emitTasksListRefresh();
    }, [refreshLists]);

    useEffect(() => {
        if (!formBlock) return;

        const formNames = getFormNamesFromBlock(formBlock);
        if (!formNames.length) return;

        const subscriptions = formNames.map((formName) =>
            emitter.addListener(`form_${formName}`, (event) => {
                if (event.action !== 'received') return;
                if (!shouldRefreshAfterFormResponse(event.data)) return;

                setFormBlock(null);
                refreshLists();
                emitTasksListRefresh();
            })
        );

        return () => subscriptions.forEach((subscription) => subscription.remove());
    }, [formBlock, refreshLists]);

    const lists = listsData?.lists || [];
    const filters = listsData?.filters;
    const topActions = listsData?.actions || [];

    const filterItems = useMemo(() => filterDropdownItems(filters), [filters]);
    const selectableFilterItems = useMemo(
        () => getSelectableFilterItems(filterItems),
        [filterItems]
    );
    const selectedFilter = selectableFilterItems.find((item) => item.id === filters?.value)
        || selectableFilterItems.find((item) => item.id === 0)
        || selectableFilterItems[0];

    const applyFilter = useCallback(async (item) => {
        if (!filters?.request_url_apply) return;
        await fetcher('/api.php?r=' + filters.request_url_apply + item.id);
        await refreshLists();
    }, [filters?.request_url_apply, refreshLists]);

    const openSaveFilter = useCallback(async () => {
        if (!filters?.request_url_save) return;
        const url = filters.request_url_save.startsWith('/api.php')
            ? filters.request_url_save
            : '/api.php?r=' + filters.request_url_save;
        const fetchedData = await fetcher(url);
        setFormBlock({
            content: fetchedData.data,
            designbox_id: 0,
            title: t('Save'),
        });
    }, [filters?.request_url_save, t]);

    const modalActions = topActions.filter((action) => action.type === 'modal');
    const menuActions = topActions.filter((action) => action.type === 'menu');
    const actionHandlers = { setFormBlock, refreshLists, setShowConfirm };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Confirm
                onVisible={showConfirm.show}
                title={showConfirm.title || t('Are you sure?')}
                handleCancel={() => setShowConfirm({ show: false, title: '', cb: null })}
                handleOk={async () => {
                    const cb = showConfirm.cb;
                    setShowConfirm({ show: false, title: '', cb: null });
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
                        <BlockByData block={formBlock} onFormEmpty={handleFormClose} />
                    </View>
                </Modal>
            ) : null}

            <View className="w-full gap-4">
                <Row className="flex-wrap items-center justify-between gap-3">
                    {filters ? (
                        <Row className="flex-wrap items-center gap-2">
                            {filters.request_url_add ? (
                                <TasksFilterSelector
                                    requestUrlAdd={filters.request_url_add}
                                    requestUrlApply={filters.request_url_apply}
                                    requestUrlSave={filters.request_url_save}
                                    onSave={openSaveFilter}
                                    onApplied={async () => {
                                        await refreshLists();
                                        emitTasksListRefresh();
                                    }}
                                />
                            ) : selectableFilterItems.length > 0 ? (
                                <DropdownMenu items={filterItems} onSelect={applyFilter}>
                                    <Button
                                        size="sm"
                                        startDecorator="ListFilter"
                                        title={selectedFilter?.title || t('Filter')}
                                        className="max-w-[280px]"
                                        classTextName="max-w-[250px]"
                                    />
                                </DropdownMenu>
                            ) : (
                                <Button
                                    size="sm"
                                    startDecorator="ListFilter"
                                    title={t('Filter')}
                                />
                            )}
                            {filters.request_url_add && selectableFilterItems.length > 1 ? (
                                <DropdownMenu items={filterItems} onSelect={applyFilter}>
                                    <Button
                                        size="sm"
                                        variant="text"
                                        startDecorator="FolderOpen"
                                        title={selectedFilter?.title}
                                        className="max-w-[200px]"
                                        classTextName="max-w-[170px]"
                                    />
                                </DropdownMenu>
                            ) : null}
                        </Row>
                    ) : (
                        <View />
                    )}

                    <Row className="flex-wrap items-center gap-2">
                        {modalActions.map((action) => (
                            <Button
                                key={action.name}
                                size="sm"
                                title={action?.title}
                                onPress={() => runTaskAction(action, actionHandlers)}
                            />
                        ))}
                        <MenuObjectActions
                            actions={menuActions}
                            refreshLists={refreshLists}
                            setShowConfirm={setShowConfirm}
                        />
                    </Row>
                </Row>

                {lists.length === 0 ? (
                    <NoContent endpoint={{ request_url: listsData?.request_url, params: {} }} />
                ) : (
                    lists.map((list) => {
                        const tasks = list?.tasks || [];

                        return (
                            <View key={list.list_id || list.list_title} className="gap-2">
                                <Row className="items-center justify-between gap-2 px-2">
                                    {list.list_title ? (
                                        <Text className="text-base font-semibold tracking-tight text-muted-foreground">
                                            {list.list_title}
                                        </Text>
                                    ) : (
                                        <View />
                                    )}

                                    <TaskActionsDropdown
                                        actions={list.actions}
                                        {...actionHandlers}
                                    />
                                </Row>

                                {tasks.length > 0 ? (
                                    <BrowseSimple
                                        data={{
                                            data: tasks,
                                            unit: 'general-content-list',
                                            module: 'bx_tasks',
                                        }}
                                        blockWrapperProps={{ block: { designbox_id: null } }}
                                    />
                                ) : null}
                            </View>
                        );
                    })
                )}
            </View>
        </BlockWrapper>
    );
}
