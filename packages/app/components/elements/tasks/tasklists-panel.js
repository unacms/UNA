import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Card } from 'app/ui/molecules/page/card';
import { Icon } from 'app/ui/atoms/icon';
import { cn } from 'app/lib/util';
import { TaskActionsDropdown } from './actions';
import { isSameListId, isTasklistGroup, listIdOrNull } from './helpers';

function isRowSelected(item, selectedId, selectedContextId) {
    if (!isSameListId(selectedId, item?.id)) return false;
    if (item?.context_id == null || selectedContextId == null) return true;
    return String(item.context_id) === String(selectedContextId);
}

function Count({ value }) {
    if (value == null) return null;
    return <Text className="shrink-0 text-xs tabular-nums text-muted-foreground">{value}</Text>;
}

function Chevron({ expanded, size = 16 }) {
    return (
        <Icon
            icon={expanded ? 'ChevronDown' : 'ChevronRight'}
            size={size}
            className="text-muted-foreground shrink-0"
        />
    );
}

function TasklistRow({ item, selected, indented, onSelect, actionHandlers }) {
    return (
        <Row className={cn('items-center gap-1 rounded-lg pr-1', selected && 'bg-muted/50')}>
            <Pressable
                onPress={() => onSelect(item)}
                className={cn(
                    'min-w-0 flex-1 flex-row items-center gap-2 px-2 py-2 web:hover:bg-muted/50 rounded-lg',
                    indented && 'pl-7'
                )}
            >
                <Icon
                    icon="Circle"
                    size={10}
                    className={cn('shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
                    fill={selected ? 'currentColor' : 'none'}
                />
                <Text className="min-w-0 flex-1 text-sm font-medium text-card-foreground" numberOfLines={1}>
                    {item.title}
                </Text>
                <Count value={item.count} />
            </Pressable>
            {item.actions?.length ? (
                <TaskActionsDropdown actions={item.actions} {...actionHandlers} />
            ) : null}
        </Row>
    );
}

/** A context (space/profile) with its tasklists, collapsible. */
function TasklistGroup({ group, selectedId, selectedContextId, onSelect, actionHandlers }) {
    const [expanded, setExpanded] = useState(true);
    const groupSelected = selectedContextId != null
        && String(selectedContextId) === String(group.id)
        && listIdOrNull(selectedId) == null;

    return (
        <View className="gap-0.5">
            <Row className={cn('items-center gap-0.5 rounded-lg pr-1', groupSelected && 'bg-muted/50')}>
                <Pressable
                    onPress={() => setExpanded((prev) => !prev)}
                    className="items-center justify-center p-1.5 rounded-md web:hover:bg-muted/50"
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
                >
                    <Chevron expanded={expanded} size={14} />
                </Pressable>
                <Pressable
                    onPress={() => onSelect(group)}
                    className="min-w-0 flex-1 flex-row items-center gap-2 py-2 pr-2 web:hover:bg-muted/50 rounded-lg"
                >
                    <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                        {group.title}
                    </Text>
                    <Count value={group.count} />
                </Pressable>
            </Row>
            {expanded ? (group.children || []).map((item) => (
                <TasklistRow
                    key={item.id}
                    item={item}
                    selected={isRowSelected(item, selectedId, selectedContextId)}
                    indented
                    onSelect={onSelect}
                    actionHandlers={actionHandlers}
                />
            )) : null}
        </View>
    );
}

/**
 * Sidebar with tasklists. `tasklists` is either a flat list (inside a context)
 * or groups with `children` (profile home, one group per context).
 */
export default function TasklistsPanel({
    tasklists,
    selectedId,
    selectedContextId,
    onSelect,
    actionHandlers,
    defaultCollapsed = false,
}) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(!defaultCollapsed);

    if (!tasklists.length) return null;

    const itemProps = { selectedId, selectedContextId, onSelect, actionHandlers };

    return (
        <Card className="w-full lg:w-72 shrink-0 gap-2 p-4">
            <Pressable
                onPress={() => setExpanded((prev) => !prev)}
                className="flex-row items-center justify-between gap-2 px-2 py-0.5 rounded-lg web:hover:bg-muted/50"
                accessibilityRole="button"
                accessibilityLabel={expanded ? t('Collapse tasklists') : t('Expand tasklists')}
            >
                <Text className="text-base font-semibold text-foreground shrink-0">{t('Tasklists')}</Text>
                <Chevron expanded={expanded} />
            </Pressable>

            {expanded ? tasklists.map((item) => (
                isTasklistGroup(item) ? (
                    <TasklistGroup key={item.id} group={item} {...itemProps} />
                ) : (
                    <TasklistRow
                        key={item.id}
                        item={item}
                        selected={isRowSelected(item, selectedId, selectedContextId)}
                        onSelect={onSelect}
                        actionHandlers={actionHandlers}
                    />
                )
            )) : null}
        </Card>
    );
}
