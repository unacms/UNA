import { useMemo, useState, useCallback } from 'react';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import ProfilesList from 'app/ui/molecules/profile/profile-list';
import { Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Menu from 'app/components/menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn } from 'app/lib/util';
import emitter from 'app/context/emitter';
import { iconForTaskStatus } from 'app/lib/tasks-meta';
import { UnitTitle } from 'app/components/units/helpers';
import Tooltip from 'app/ui/atoms/tooltip';

const TASKS_LIST_EVENT = 'tasks_list';

const META_FIELDS = [
    { key: 'type', icon: 'Tag' },
    { key: 'priority', icon: 'Flag' },
    { key: 'time', icon: 'Clock', altKeys: ['estimate'] },
];

function emitTasksListRefresh() {
    emitter.emit(TASKS_LIST_EVENT, { action: 'reload' });
}

function emitTasksListOpen(task) {
    if (!task?.url) return;
    emitter.emit(TASKS_LIST_EVENT, {
        action: 'open',
        url: task.url,
        title: task.title,
    });
}

function actionsToMenuItems(actions = []) {
    return actions.map((action) => ({
        id: action.name,
        name: action.name,
        title: action.title || action.name,
        icon: action.icon || '',
        display_type: 'button',
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
            title: action.title,
        });
        return;
    }

    if (action.type === 'callback') {
        await fetcher('/api.php?r=' + action.callback);
        emitTasksListRefresh();
    }
}

function shouldIgnoreTaskRowPress(event) {
    const target = event?.nativeEvent?.target ?? event?.target;
    if (!target || typeof target.closest !== 'function') return false;
    const nested = target.closest('a, button, [role="button"], [role="menuitem"], input, select, textarea');
    return Boolean(nested && nested !== event.currentTarget);
}

function TaskRowControl({ children }) {
    return (
        <View
            className="shrink-0"
            onStartShouldSetResponder={() => true}
            onClick={(event) => event?.stopPropagation?.()}
        >
            {children}
        </View>
    );
}

function TaskStatusIcon({ state, completed }) {
    if (!state) return null;
    const label = String(state);
    return (
        <Tooltip content={label}>
            <View
                className="shrink-0"
                accessibilityLabel={label}
            >
                <Icon
                    icon={iconForTaskStatus(label)}
                    size={16}
                    className={completed ? 'text-muted-foreground' : 'text-foreground'}
                />
            </View>
        </Tooltip>
    );
}

function TaskMeta({ data }) {
    const items = META_FIELDS.flatMap((field) => {
        const value = data?.[field.key]
            ?? field.altKeys?.map((key) => data?.[key]).find(Boolean);
        if (!value) return [];
        const icon = field.iconFor ? field.iconFor(value) : field.icon;
        return [{ key: field.key, icon, value: String(value) }];
    });

    if (!items.length) return null;

    return (
        <Row className="items-center gap-x-2.5 shrink-0">
            {items.map((item) => (
                <Row key={item.key} className="items-center gap-1 shrink-0">
                    <Icon icon={item.icon} size={12} className="text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground whitespace-nowrap" numberOfLines={1}>
                        {item.value}
                    </Text>
                </Row>
            ))}
        </Row>
    );
}

export default function Unit({ data }) {
    const [formBlock, setFormBlock] = useState(null);
    const isCompleted = data?.class === 'completed'
        || /^(done|cancelled|duplicate)$/i.test(String(data?.state || ''));

    const handleFormClose = useCallback(() => {
        setFormBlock(null);
        emitTasksListRefresh();
    }, []);

    const menuItems = useMemo(
        () => actionsToMenuItems(data?.actions),
        [data?.actions]
    );

    const menuParams = useMemo(() => ({
        className: 'gap-x-1',
        button_style: 'bordered',
        button_size: 'mini',
        button_border_shape: 'capsule',
        button_full_width: false,
        onclick: (event, item) => runTaskAction(item.action, setFormBlock),
    }), []);

    const titleClassName = cn(
        'min-w-0 truncate text-sm font-semibold leading-tight web:group-hover:text-foreground',
        isCompleted
            ? 'text-muted-foreground line-through'
            : 'text-card-foreground'
    );

    const openTask = useCallback((event) => {
        if (shouldIgnoreTaskRowPress(event)) return;
        emitTasksListOpen(data);
    }, [data]);

    return (
        <Pressable
            onPress={openTask}
            accessibilityRole="button"
            accessibilityLabel={data.title}
            className={cn(appSetting('tasks', 'item_wrapper'), 'w-full web:group')}
        >
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

            <Row className="items-center gap-3 min-w-0">
                <Row className="flex-auto min-w-0 items-center gap-2">
                    <TaskStatusIcon state={data.state} completed={isCompleted} />
                    <View className="min-w-0 flex-1">
                        <UnitTitle
                            title={data.title}
                            numberOfLines={1}
                            className={titleClassName}
                        />
                    </View>
                    <TaskMeta data={data} />
                </Row>

                {data?.members?.length ? (
                    <TaskRowControl>
                        <ProfilesList data={data.members} maxCount={3} displaySize="xs" />
                    </TaskRowControl>
                ) : null}

                {menuItems.length ? (
                    <TaskRowControl>
                        <Menu
                            object="bx_tasks"
                            items={menuItems}
                            displayType="button"
                            alignItems="start"
                            autoFilter={false}
                            params={menuParams}
                        />
                    </TaskRowControl>
                ) : null}
            </Row>
        </Pressable>
    );
}
