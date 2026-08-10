import { useMemo, useState, useCallback } from 'react';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import ProfilesList from 'app/ui/molecules/profile_list';
import { Card } from 'app/ui/molecules/card';
import { Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Menu from 'app/components/menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import emitter from 'app/context/emitter';
import { iconForTaskStatus } from 'app/lib/tasks-meta';

const TASKS_LIST_EVENT = 'tasks_list';

const META_FIELDS = [
    { key: 'type', icon: 'Tag' },
    { key: 'state', iconFor: iconForTaskStatus },
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
        <Row className="flex-wrap items-center gap-x-2.5 gap-y-1">
            {items.map((item) => (
                <Row key={item.key} className="items-center gap-1 shrink-0">
                    <Icon icon={item.icon} size={12} className="text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
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
        button_variant: 'default',
        button_size: 'xs',
        button_rounded: false,
        button_full_width: false,
        onclick: (event, item) => runTaskAction(item.action, setFormBlock),
    }), []);

    const titleClassName = cn(
        'text-sm font-semibold leading-tight web:hover:text-foreground',
        isCompleted
            ? 'text-muted-foreground line-through'
            : 'text-card-foreground'
    );

    return (
        <Card padding="p-3" className="web:hover:bg-muted/30 web:duration-300">
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

            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0 gap-1">
                    <Pressable onPress={() => emitTasksListOpen(data)}>
                        <Text numberOfLines={2} className={titleClassName}>
                            {data.title}
                        </Text>
                    </Pressable>
                    <TaskMeta data={data} />
                </View>

                {data?.members?.length ? (
                    <ProfilesList data={data.members} maxCount={3} displaySize="xs" />
                ) : null}

                {menuItems.length ? (
                    <Menu
                        object="bx_tasks"
                        items={menuItems}
                        displayType="button"
                        alignItems="start"
                        autoFilter={false}
                        params={menuParams}
                    />
                ) : null}
            </Row>
        </Card>
    );
}
