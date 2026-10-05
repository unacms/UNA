import { useState } from 'react';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import Menu from 'app/components/menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { appSetting, cn } from 'app/lib/util';
import { iconForTaskStatus, iconForTaskPriority, normalizeTaskLabel } from 'app/lib/tasks-meta';
import { UnitTitle } from 'app/components/units/helpers';
import { runTaskAction } from 'app/components/elements/tasks/actions';
import { emitTasksListOpen, emitTasksListRefresh } from 'app/components/elements/tasks/helpers';
import { TaskPropertySelect } from 'app/components/elements/tasks/property-select';
import { TaskAssigneeSelect } from 'app/components/elements/tasks/assignee-select';
import { Timer } from 'app/ui/atoms/timer';

const META_FIELDS = [
    { key: 'type', variant: 'button' },
];

const COMPLETED_STATES = /^(done|cancelled|duplicate)$/i;

const MENU_PARAMS = {
    className: 'gap-x-1',
    button_style: 'bordered',
    button_size: 'mini',
    button_border_shape: 'capsule',
    button_full_width: false,
};

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

function TaskPriorityIcon({ priority }) {
    const label = String(priority || '').trim();
    if (!label) return null;
    const urgent = normalizeTaskLabel(label) === 'urgent';
    return (
        <View className="shrink-0" accessibilityLabel={label}>
            <Icon
                icon={iconForTaskPriority(label)}
                size={16}
                className={urgent ? 'text-alert-warning' : 'text-muted-foreground'}
            />
        </View>
    );
}

function TaskStatusIcon({ state }) {
    if (!state) return null;
    const label = String(state);
    return (
        <View className="shrink-0" accessibilityLabel={label}>
            <Icon
                icon={iconForTaskStatus(label)}
                size={16}
                className="text-secondary-foreground transition-colors duration-200 hover:text-foreground group-hover:text-foreground active:opacity-50 group-active:opacity-50"
            />
        </View>
    );
}

function TaskMeta({ data, module }) {
    const items = META_FIELDS.flatMap((field) => {
        const value = data?.[field.key]
            ?? field.altKeys?.map((key) => data?.[key]).find(Boolean);
        if (!value) return [];
        const icon = field.iconFor ? field.iconFor(value) : field.icon;
        return [{ key: field.key, icon, variant: field.variant, value: String(value) }];
    });
    const timeRaw = data?.time ?? data?.estimate;

    if (!items.length && !timeRaw) return null;

    return (
        <Row className="items-center gap-x-2.5 shrink-0">
            {items.map((item) => (
                item.variant === 'button' ? (
                    <TaskPropertySelect
                        key={item.key}
                        taskId={data?.id}
                        module={module}
                        field={item.key}
                        label={item.value}
                        buttonProps={{
                            style: 'bordered',
                            controlSize: 'mini',
                            borderShape: 'capsule',
                            label: item.value,
                        }}
                    />
                ) : (
                    <Row key={item.key} className="items-center gap-1 shrink-0">
                        {item.icon ? (
                            <Icon icon={item.icon} size={12} className="text-muted-foreground" />
                        ) : null}
                        <Text className="text-xs text-muted-foreground whitespace-nowrap" numberOfLines={1}>
                            {item.value}
                        </Text>
                    </Row>
                )
            ))}
            <Timer
                taskId={data?.id}
                time={timeRaw}
                timer={data?.timer}
                controlSize="mini"
            />
        </Row>
    );
}

export default function Unit({ data, module }) {
    const tasksModule = module || 'bx_tasks';
    const [formBlock, setFormBlock] = useState(null);
    const isCompleted = data?.class === 'completed' || COMPLETED_STATES.test(String(data?.state || ''));
    const menuItems = actionsToMenuItems(data?.actions);

    const handleFormClose = () => {
        setFormBlock(null);
        emitTasksListRefresh();
    };

    const menuParams = {
        ...MENU_PARAMS,
        onclick: (event, item) => runTaskAction(item.action, { setFormBlock }),
    };

    // Named row group: TaskStatusIcon's plain `group-hover:` / `group-active:` belong to its
    // status trigger's `group`, and a plain row `group` would light up and dim it with the row.
    const titleClassName = cn(
        'min-w-0 truncate text-sm font-semibold leading-tight web:group-hover/task:text-foreground',
        isCompleted
            ? 'text-muted-foreground line-through'
            : 'text-card-foreground'
    );

    const openTask = (event) => {
        if (shouldIgnoreTaskRowPress(event)) return;
        emitTasksListOpen(data);
    };

    return (
        <Pressable
            onPress={openTask}
            accessibilityRole="button"
            accessibilityLabel={data.title}
            className={cn(appSetting('tasks', 'item_wrapper'), 'w-full group/task')}
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
                    <TaskPropertySelect
                        taskId={data.id}
                        module={tasksModule}
                        field="state"
                        label={data.state}
                    >
                        <TaskStatusIcon state={data.state} />
                    </TaskPropertySelect>
                    <Row className="min-w-0 flex-1 items-center gap-1.5">
                        <UnitTitle
                            title={data.title}
                            numberOfLines={1}
                            className={titleClassName}
                        />
                        <TaskPropertySelect
                            taskId={data.id}
                            module={tasksModule}
                            field="priority"
                            label={data.priority}
                        >
                            <TaskPriorityIcon priority={data.priority} />
                        </TaskPropertySelect>
                    </Row>
                    <TaskMeta data={data} module={tasksModule} />
                </Row>

                <TaskRowControl>
                    <TaskAssigneeSelect
                        taskId={data.id}
                        module={tasksModule}
                        members={data.members}
                        contextId={data.context_id}
                        taskUrl={data.url}
                    />
                </TaskRowControl>

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
