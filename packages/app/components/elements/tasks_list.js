import { useCallback, useEffect, useMemo, useState } from 'react';
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

async function runTaskAction(action, setFormBlock) {
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
        await fetcher('/api.php?r=' + action.callback);
        if (action.on_callback === 'refresh' || action.on_callback === 'hide_row') {
            emitter.emit('page', { action: 'reload' });
        }
    }
}

function TaskActionsDropdown({ actions, setFormBlock, variant = 'text' }) {
    const items = useMemo(() => actionsToDropdownItems(actions), [actions]);

    if (!items.length) return null;

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => runTaskAction(item.action, setFormBlock)}
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

    const handleFormClose = useCallback(() => {
        setFormBlock(null);
        emitter.emit('page', { action: 'reload' });
    }, []);

    const lists = data?.lists || [];
    const filters = data?.filters;
    const topActions = data?.actions || [];
    const hasTasks = lists.some((list) => list?.tasks?.length > 0);

    const filterItems = useMemo(() => filterDropdownItems(filters), [filters]);
    const selectedFilter = filterItems.find((item) => item.id === filters?.value)
        || filterItems[0];

    const applyFilter = useCallback(async (item) => {
        if (!filters?.request_url_apply) return;
        await fetcher('/api.php?r=' + filters.request_url_apply + item.id);
        emitter.emit('page', { action: 'reload' });
    }, [filters?.request_url_apply]);

    const modalActions = topActions.filter((action) => action.type === 'modal');
    const menuActions = topActions.filter((action) => action.type === 'menu');

    return (
        <BlockWrapper {...blockWrapperProps}>
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
                                onPress={() => runTaskAction(action, setFormBlock)}
                            />
                        ))}
                        {menuActions.map((action) => (
                            <ObjectMenuAction key={action.name} action={action} />
                        ))}
                    </Row>
                </Row>

                {!hasTasks ? (
                    <NoContent endpoint={{ request_url: data?.request_url, params: {} }} />
                ) : (
                    lists.map((list) => {
                        const tasks = list?.tasks || [];
                        if (!tasks.length) return null;

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
                                        setFormBlock={setFormBlock}
                                    />
                                </Row>

                                <BrowseSimple
                                    data={{
                                        data: tasks,
                                        unit: 'general-content-list',
                                        module: 'bx_tasks',
                                    }}
                                    blockWrapperProps={{ block: { designbox_id: null } }}
                                />
                            </View>
                        );
                    })
                )}
            </View>
        </BlockWrapper>
    );
}
