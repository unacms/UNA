/**
 * Inline task property menus for the browse row.
 * Persists via the same UNA GET as entity_info: `module/set_property/&params[]={id}&params[]={field}`.
 */
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { NeoButton } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn } from 'app/lib/util';
import { iconForTaskPriority, iconForTaskStatus, normalizeTaskLabel } from 'app/lib/tasks-meta';
import { apiUrl, emitTasksListPatch, emitTasksListRefresh } from './helpers';

const SELECT_FIELDS = ['type', 'priority', 'state'];
const menuSettings = appSetting('theme', 'dropdown_menu');

let optionsCache = null;
let optionsInflight = null;

function collectFormInputs(node, acc = []) {
    if (!node || typeof node !== 'object') return acc;
    if (node.inputs && typeof node.inputs === 'object' && !Array.isArray(node.inputs)) {
        acc.push(node.inputs);
    }
    if (Array.isArray(node)) {
        node.forEach((item) => collectFormInputs(item, acc));
        return acc;
    }
    Object.values(node).forEach((value) => collectFormInputs(value, acc));
    return acc;
}

function normalizeOptions(values) {
    if (values == null) return [];
    if (!Array.isArray(values)) {
        return Object.entries(values).map(([value, label]) => ({
            value: String(value),
            label: String(label),
        }));
    }
    return values
        .map((item) => {
            if (item == null) return null;
            if (typeof item === 'string' || typeof item === 'number') {
                return { value: String(item), label: String(item) };
            }
            const value = item.key ?? item.value ?? item.id;
            const label = item.value ?? item.label ?? item.title ?? item.name;
            if (value == null || label == null) return null;
            return { value: String(value), label: String(label) };
        })
        .filter((item) => item && item.value !== '');
}

export function taskPropertyRequestUrl(id, module = 'bx_tasks') {
    if (id == null || id === '') return '';
    return `${module}/set_property/&params[]=${id}&params[]=`;
}

export async function setTaskProperty({ id, field, value, module = 'bx_tasks' }) {
    const requestUrl = taskPropertyRequestUrl(id, module);
    if (!requestUrl || !field) return false;
    try {
        const response = await fetcher(`/api.php?r=${requestUrl}${field}&params[]=${value}`);
        if (response?.error) return false;
        const status = response?.status ?? response?.code;
        if (status != null && Number(status) >= 400) return false;
        return true;
    } catch {
        return false;
    }
}

export function loadTaskPropertyOptions(module = 'bx_tasks') {
    if (optionsCache) return Promise.resolve(optionsCache);
    if (optionsInflight) return optionsInflight;

    optionsInflight = fetcher(apiUrl(`${module}/create_filter&params[]=0`))
        .then((response) => {
            const inputs = collectFormInputs(response?.data)[0] || {};
            const next = {};
            SELECT_FIELDS.forEach((name) => {
                next[name] = normalizeOptions(inputs[name]?.values);
            });
            optionsCache = next;
            return next;
        })
        .catch(() => ({ type: [], priority: [], state: [] }))
        .finally(() => {
            optionsInflight = null;
        });

    return optionsInflight;
}

function iconForOption(field, label) {
    if (field === 'priority') return iconForTaskPriority(label);
    if (field === 'state') return iconForTaskStatus(label);
    return null;
}

function StopRowOpen({ children }) {
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

export function TaskPropertySelect({
    taskId,
    module = 'bx_tasks',
    field,
    label,
    accessibilityLabel,
    buttonProps,
    children,
}) {
    const current = String(label || '').trim();
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const canEdit = current && taskId != null && taskId !== '';
    const triggerLabel = accessibilityLabel || current;
    const resolvedButtonProps = buttonProps
        ? {
            ...buttonProps,
            label: buttonProps.label ?? current,
            accessibilityLabel: buttonProps.accessibilityLabel || triggerLabel,
        }
        : undefined;

    if (!current) return null;
    if (!canEdit) {
        if (resolvedButtonProps) {
            return <NeoButton {...resolvedButtonProps} disabled />;
        }
        return children ?? null;
    }

    const handleOpenChange = (next) => {
        setOpen(next);
        if (!next || options.length) return;
        setLoading(true);
        loadTaskPropertyOptions(module)
            .then((all) => setOptions(all[field] || []))
            .finally(() => setLoading(false));
    };

    const handleSelect = async (option) => {
        setOpen(false);
        if (normalizeTaskLabel(option.label) === normalizeTaskLabel(current)) return;
        emitTasksListPatch({ id: taskId, field, value: option.label });
        const ok = await setTaskProperty({
            id: taskId,
            field,
            value: option.value,
            module,
        });
        if (!ok) {
            emitTasksListPatch({ id: taskId, field, value: current });
            return;
        }
        emitTasksListRefresh();
    };

    return (
        <StopRowOpen>
            <DropdownPopup
                open={open}
                onOpenChange={handleOpenChange}
                buttonProps={resolvedButtonProps}
                trigger={resolvedButtonProps ? undefined : children}
                triggerAccessibilityLabel={triggerLabel}
                triggerClassName={field === 'state' ? 'group' : undefined}
                minPopupWidth={200}
            >
                <View className={menuSettings.content_ver}>
                    {loading && !options.length ? (
                        <View className="items-center justify-center py-3">
                            <ActivityIndicator />
                        </View>
                    ) : null}
                    {options.map((option) => {
                        const selected = normalizeTaskLabel(option.label) === normalizeTaskLabel(current);
                        const icon = iconForOption(field, option.label);
                        const urgent = field === 'priority' && normalizeTaskLabel(option.label) === 'urgent';
                        return (
                            <Pressable
                                key={option.value}
                                onPress={() => handleSelect(option)}
                                className={cn(menuSettings.item_ver, selected && 'bg-muted/50')}
                            >
                                {icon ? (
                                    <Icon
                                        icon={icon}
                                        size={16}
                                        className={cn(
                                            'shrink-0',
                                            urgent ? 'text-alert-warning' : 'text-muted-foreground'
                                        )}
                                    />
                                ) : null}
                                <Text
                                    className={cn(
                                        menuSettings.item_text,
                                        selected && 'text-foreground'
                                    )}
                                >
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </DropdownPopup>
        </StopRowOpen>
    );
}
