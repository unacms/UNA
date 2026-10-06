import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Card } from 'app/ui/molecules/page/card';
import { Icon } from 'app/ui/atoms/icon';
import { useIconClassColor } from 'app/ui/atoms/icon-class-color';
import { cn } from 'app/lib/util';
import { TaskActionsDropdown } from './actions';
import { isSameListId, isTasklistGroup, listIdOrNull, tasklistProgress } from './helpers';

const PROGRESS_SIZE = 14;
const PROGRESS_VIEW = 16;
const PROGRESS_STROKE = 2.2;
const PROGRESS_CX = PROGRESS_VIEW / 2;
const PROGRESS_RADIUS = (PROGRESS_VIEW - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

function ProgressArc({ className, dasharray, cap = false, opacity = 1 }) {
    const color = useIconClassColor(className) || 'currentColor';
    return (
        <View className={cn('absolute inset-0 items-center justify-center', className)}>
            <Svg width={PROGRESS_SIZE} height={PROGRESS_SIZE} viewBox={`0 0 ${PROGRESS_VIEW} ${PROGRESS_VIEW}`}>
                <Circle
                    cx={PROGRESS_CX}
                    cy={PROGRESS_CX}
                    r={PROGRESS_RADIUS}
                    stroke={color}
                    strokeWidth={PROGRESS_STROKE}
                    strokeOpacity={opacity}
                    fill="none"
                    strokeLinecap={cap ? 'round' : 'butt'}
                    strokeDasharray={dasharray}
                    strokeDashoffset={dasharray ? PROGRESS_CIRCUMFERENCE * 0.25 : undefined}
                />
            </Svg>
        </View>
    );
}

function TasklistProgress({ percent = 0 }) {
    const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
    const dash = (clamped / 100) * PROGRESS_CIRCUMFERENCE;

    return (
        <View
            className="relative shrink-0"
            style={{ width: PROGRESS_SIZE, height: PROGRESS_SIZE }}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
        >
            <ProgressArc className="text-muted-foreground" opacity={0.35} />
            {clamped > 0 ? (
                <ProgressArc
                    className="text-primary"
                    dasharray={clamped >= 100 ? undefined : `${dash} ${PROGRESS_CIRCUMFERENCE}`}
                    cap={clamped < 100}
                />
            ) : null}
        </View>
    );
}

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

function TasklistRow({ item, selected, onSelect, actionHandlers }) {
    const { percent, total } = tasklistProgress(item);
    return (
        <Row className={cn('items-center gap-1 rounded-lg pr-1', selected && 'bg-muted/50')}>
            <Pressable
                onPress={() => onSelect(item)}
                className={cn(
                    'min-w-0 flex-1 flex-row items-center gap-2 px-2 py-2 web:hover:bg-muted/50 rounded-lg'
                )}
                accessibilityLabel={total
                    ? `${item.title}, ${Math.round(percent)}% of ${total}`
                    : item.title}
            >
                <TasklistProgress percent={percent} />
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
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(true);
    const groupSelected = selectedContextId != null
        && String(selectedContextId) === String(group.id)
        && listIdOrNull(selectedId) == null;

    return (
        <View className="gap-1">
            <Row className={cn(
                'items-center rounded-lg',
                groupSelected && 'bg-muted/50',
            )}>
                <Pressable
                    onPress={() => onSelect(group)}
                    className="min-w-0 flex-1 flex-row items-center gap-2 py-2 px-2 web:hover:bg-muted/50 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel={group.title}
                >
                    <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                        {group.title}
                    </Text>
                    <Count value={group.count} />
                </Pressable>
                <Pressable
                    onPress={() => setExpanded((prev) => !prev)}
                    className="shrink-0 p-2 web:hover:bg-muted/50 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? t('Collapse') : t('Expand')}
                >
                    <Chevron expanded={expanded} size={14} />
                </Pressable>
            </Row>
            {expanded ? (group.children || []).map((item) => (
                <TasklistRow
                    key={item.id}
                    item={item}
                    selected={isRowSelected(item, selectedId, selectedContextId)}
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
    fill = false,
}) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(!defaultCollapsed);

    if (!tasklists.length) return null;

    const itemProps = { selectedId, selectedContextId, onSelect, actionHandlers };

    return (
        <Card
            padding="p-0"
            className={cn(
                'w-full lg:w-72 shrink-0 rounded-xl overflow-visible',
                fill && 'lg:h-full lg:max-h-full lg:min-h-0',
            )}
        >
            <Pressable
                onPress={() => setExpanded((prev) => !prev)}
                className="flex-row items-center justify-start gap-2 mx-4 my-2.5 shrink-0 self-start"
                accessibilityRole="button"
                accessibilityLabel={expanded ? t('Collapse tasklists') : t('Expand tasklists')}
            >
                <Text className="text-base font-semibold text-foreground shrink-0">{t('Tasklists')}</Text>
                <Chevron expanded={expanded} />
            </Pressable>

            {expanded ? (
                <View className={cn(
                    'p-2 gap-1',
                    fill && 'lg:min-h-0 lg:flex-1 lg:overflow-y-auto',
                )}>
                    {tasklists.map((item) => (
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
                    ))}
                </View>
            ) : null}
        </Card>
    );
}
