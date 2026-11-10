import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Modal, NeoButton } from 'app/design/controls';
import { useResolvedNeoButton } from 'app/design/controls/neo-button/neo-button';
import { Icon } from 'app/ui/atoms/icon';
import Menu from 'app/components/menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import emitter, { EVENTS } from 'app/context/emitter';
import { useCurrentUser } from 'app/context/user';
import { fetcher } from 'app/lib/fetcher';
import { playCue } from 'app/lib/sound';
import { publishTimerSession, useTaskTimerSession, useTaskTimerSessionsLoaded } from 'app/lib/task-timer-sync';
import { appSetting, cn, decodeTextNode } from 'app/lib/util';
import { formatTaskClock, iconForTaskStatus, iconForTaskPriority, normalizeTaskLabel, parseTaskTime } from 'app/lib/tasks-meta';
import { UnitTitle } from 'app/components/units/helpers';
import { runTaskAction } from 'app/components/elements/tasks/actions';
import { apiUrl, emitTasksListOpen, emitTasksListRefresh } from 'app/components/elements/tasks/helpers';
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

/** Time logged on the task by all members, against the estimate. Doesn't tick: see TaskTimerControl. */
function TaskTotalBadge({ time }) {
    const { t } = useTranslation();
    const resolved = useResolvedNeoButton({
        controlSize: 'mini',
        borderShape: 'capsule',
        style: 'bordered',
    });
    const { loggedSeconds, estimateSeconds } = parseTaskTime(time);

    if (!loggedSeconds && !estimateSeconds) return null;

    const logged = loggedSeconds ? formatTaskClock(loggedSeconds) : '0';
    const label = estimateSeconds ? `${logged} / ${formatTaskClock(estimateSeconds)}` : logged;
    const over = !!estimateSeconds && loggedSeconds > estimateSeconds;

    return (
        <Row
            className={cn(
                'items-center shrink-0 bg-button',
                resolved.heightCls,
                resolved.rounded,
                resolved.paddingXCls,
                resolved.labelGapCls || 'gap-x-1'
            )}
            style={{
                height: resolved.height,
                ...(resolved.paddingXCls ? null : { paddingLeft: resolved.paddingX, paddingRight: resolved.paddingX }),
            }}
            accessibilityLabel={`${t('Total logged')}: ${label}`}
        >
            <Icon icon="Sigma" size={resolved.iconSize} className="shrink-0 text-muted-foreground" />
            <Text
                className={cn(
                    resolved.fontCls,
                    'font-medium tabular-nums whitespace-nowrap',
                    over ? 'text-destructive' : 'text-foreground'
                )}
            >
                {label}
            </Text>
        </Row>
    );
}

/**
 * The viewer's own timer, the same value as the timers page. The session store only holds
 * the viewer's timers, so `started` means theirs is running.
 */
function TaskTimerControl({ data, module, isCompleted }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const session = useTaskTimerSession(data?.id);
    // Until the viewer's timers are known, a running one would show Start and start it again.
    const isLoaded = useTaskTimerSessionsLoaded(currentUser?.id);
    const [busy, setBusy] = useState(false);
    const isActive = session?.state === 'started';

    if (!currentUser || data?.id == null || (isCompleted && !isActive)) return null;

    const toggle = async () => {
        // UNA's `start` continues a paused timer, so it covers both a new and a paused one.
        const action = isActive ? 'pause' : 'start';
        setBusy(true);
        try {
            const response = await fetcher(apiUrl(
                `${module}/process_timer/&params[]=${action}&params[]=${data.id}&params[]=${currentUser.id}`
            ));
            const timer = response?.data;
            // UNA answers `{ code, msg }` when the viewer may not manage this task.
            if (timer?.state == null) {
                playCue('error');
                return;
            }
            publishTimerSession({
                requestUrl: timer.request_url,
                timerId: timer.id,
                state: timer.state,
                time: timer.time,
                action,
            });
            emitter.emit(EVENTS.taskTimer, { id: timer.id, action });
        } catch {
            playCue('error');
        } finally {
            setBusy(false);
        }
    };

    const label = t(isActive ? 'Pause timer' : 'Start timer');

    return (
        <TaskRowControl>
            <Row className="items-center gap-x-1">
                {isActive ? (
                    <Timer taskId={data.id} controlSize="mini" />
                ) : null}
                <NeoButton
                    style="borderedProminent"
                    controlSize="mini"
                    borderShape="circle"
                    image={isActive ? 'Pause' : 'Play'}
                    accessibilityLabel={label}
                    tooltip={label}
                    loading={busy || !isLoaded}
                    disabled={!isLoaded}
                    expoUI={false}
                    onPress={toggle}
                />
            </Row>
        </TaskRowControl>
    );
}

function TaskMeta({ data, module, isCompleted }) {
    const items = META_FIELDS.flatMap((field) => {
        const value = data?.[field.key]
            ?? field.altKeys?.map((key) => data?.[key]).find(Boolean);
        if (!value) return [];
        const icon = field.iconFor ? field.iconFor(value) : field.icon;
        return [{ key: field.key, icon, variant: field.variant, value: String(value) }];
    });

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
            <TaskTotalBadge time={data?.time ?? data?.estimate} />
            <TaskTimerControl data={data} module={module} isCompleted={isCompleted} />
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
            accessibilityLabel={decodeTextNode(data.title)}
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
                    <TaskMeta data={data} module={tasksModule} isCompleted={isCompleted} />
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
