import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { View, Row } from 'app/design/view';

import { Text } from 'app/design/typography';

import { BlockWrapper } from 'app/components/block-wrapper';

import BrowseSimple from 'app/components/elements/browse_simple';

import { getComponent } from 'app/components/registry';

import { Button } from 'app/design/controls';

import DropdownMenu from 'app/ui/atoms/dropdown-menu';

import Menu from 'app/components/menu';

import { Modal } from 'app/design/controls';

import { BlockByDataInt as BlockByData } from 'app/components/block';

import { fetcher } from 'app/lib/fetcher';

import { getDataForMenu } from 'app/lib/util';

import { useTranslation } from 'react-i18next';

import emitter from 'app/context/emitter';

import Confirm from 'app/ui/molecules/confirm';



const TASKS_LIST_EVENT = 'tasks_list';



const ACTION_ICONS = {

    add_list: 'Plus',

    add_task: 'Plus',

    edit_list: 'Pencil',

    delete_list: 'Trash',

    manage_settings: 'Settings2',

    set_completed: 'CircleCheck',

};



const ACTION_TITLES = {

    add_list: 'Add list',

    add_task: 'Add task',

    edit_list: 'Edit list',

    delete_list: 'Delete list',

    manage_settings: 'Settings',

    set_completed: 'Complete',

};



function filterDropdownItems(filters) {

    return (filters?.values || [])

        .filter((item) => item.key != null && !item.type)

        .map((item) => ({

            id: item.key,

            name: String(item.key),

            title: item.value,

        }));

}



function actionsToDropdownItems(actions = []) {

    return (actions || []).map((action) => ({

        id: action.name,

        name: action.name,

        title: ACTION_TITLES[action.name] || action.title || action.name,

        action,

    }));

}



function emitTasksListRefresh() {

    emitter.emit(TASKS_LIST_EVENT, { action: 'reload' });

}



function isTasksListPayload(payload) {

    return payload && typeof payload === 'object' && Array.isArray(payload.lists);

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

    if (!Array.isArray(responseData) || responseData.length === 0) return true;

    if (responseData.some((item) => item?.reload)) return true;

    return !responseData.some((item) => item?.type === 'form');

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

            title: ACTION_TITLES[action.name] || action.title,

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



function TaskActionsDropdown({ actions, setFormBlock, refreshLists, setShowConfirm, variant = 'text' }) {

    const items = useMemo(() => actionsToDropdownItems(actions), [actions]);



    if (!items.length) return null;



    return (

        <DropdownMenu

            items={items}

            onSelect={(item) => runTaskAction(item.action, { setFormBlock, refreshLists, setShowConfirm })}

        >

            <Button

                variant={variant}

                size="sm"

                rounded

                startDecorator="Ellipsis"

            />

        </DropdownMenu>

    );

}



function ObjectMenuAction({ action }) {

    const [menu, setMenu] = useState(null);



    useEffect(() => {

        if (!action?.object) return;

        getDataForMenu({ object: action.object, params: null }, setMenu);

    }, [action?.object]);



    if (!menu?.items?.length) {

        return (

            <Button

                size="sm"

                startDecorator={ACTION_ICONS[action.name]}

                title={ACTION_TITLES[action.name] || action.name}

                onPress={() => getDataForMenu({ object: action.object, params: null }, setMenu)}

            />

        );

    }



    return (

        <Menu

            {...menu}

            autoSize

            autoFilter={false}

            params={{

                button_variant: 'default',

                button_size: 'sm',

                button_rounded: true,

            }}

        />

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

    const selectedFilter = filterItems.find((item) => item.id === filters?.value)

        || filterItems[0];



    const applyFilter = useCallback(async (item) => {

        if (!filters?.request_url_apply) return;

        await fetcher('/api.php?r=' + filters.request_url_apply + item.id);

        await refreshLists();

    }, [filters?.request_url_apply, refreshLists]);



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

                >

                    <View className="px-4">

                        <BlockByData block={formBlock} onFormEmpty={handleFormClose} />

                    </View>

                </Modal>

            ) : null}



            <View className="w-full gap-4">

                <Row className="flex-wrap items-center justify-between gap-3">

                    {filterItems.length > 0 ? (

                        <DropdownMenu items={filterItems} onSelect={applyFilter}>

                            <Button

                                size="sm"

                                startDecorator="ListFilter"

                                title={selectedFilter?.title || t('Filter')}

                            />

                        </DropdownMenu>

                    ) : (

                        <View />

                    )}



                    <Row className="flex-wrap items-center gap-2">

                        {modalActions.map((action) => (

                            <Button

                                key={action.name}

                                size="sm"

                                startDecorator={ACTION_ICONS[action.name]}

                                title={ACTION_TITLES[action.name] || action.name}

                                onPress={() => runTaskAction(action, actionHandlers)}

                            />

                        ))}

                        {menuActions.map((action) => (

                            <ObjectMenuAction key={action.name} action={action} />

                        ))}

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


