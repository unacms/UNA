import { useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonGroup } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper';
import Link from 'app/ui/atoms/link';
import Progress from 'app/ui/atoms/progress';

const PAGE_SIZE = 10;

type StatsTask = {
    id: number;
    title: string;
    url: string;
    minutes: number;
    context?: { display_name?: string };
};

type StatsPeriod = {
    name: string;
    title: string;
    minutes?: number;
    tasks?: StatsTask[];
};

type TasksTimersStatsProps = {
    data?: {
        periods?: StatsPeriod[];
        labels?: { total?: string; tasks?: string; show_more?: string; empty?: string };
    };
    blockWrapperProps?: any;
};

function formatMinutes(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}m`;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function Metric({ value, label }: { value: string | number; label?: string }) {
    return (
        <View className="gap-0.5">
            <Text className="text-xl font-semibold tabular-nums text-foreground">{value}</Text>
            <Text className="text-xs text-muted-foreground">{label}</Text>
        </View>
    );
}

function TaskRow({ task, maxMinutes }: { task: StatsTask; maxMinutes: number }) {
    const percent = maxMinutes > 0 ? Math.round((task.minutes / maxMinutes) * 100) : 0;

    return (
        <View className="gap-1.5">
            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0">
                    <Link href={task.url}>
                        <Text numberOfLines={1} className="text-sm font-medium text-foreground">{task.title}</Text>
                    </Link>
                    {task.context?.display_name ? (
                        <Text numberOfLines={1} className="text-xs text-muted-foreground">{task.context.display_name}</Text>
                    ) : null}
                </View>
                <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatMinutes(task.minutes)}</Text>
            </Row>
            <Progress value={percent} bgColor="bg-muted" progressColor="bg-green" />
        </View>
    );
}

/** Logged time per task for this and the previous month (`bx_tasks:get_block_timers_stats`). */
export default function TasksTimersStats({ data, blockWrapperProps }: TasksTimersStatsProps) {
    const periods = Array.isArray(data?.periods) ? data.periods : [];
    const labels = data?.labels || {};
    const [periodName, setPeriodName] = useState(periods[0]?.name);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const period = periods.find((item) => item.name === periodName) || periods[0];
    if (!period) return null;

    const tasks = Array.isArray(period.tasks) ? period.tasks : [];
    const maxMinutes = tasks[0]?.minutes || 0;

    const selectPeriod = (name: string) => {
        setPeriodName(name);
        setVisibleCount(PAGE_SIZE);
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                <Row className="flex-wrap items-center justify-between gap-3">
                    <Row className="items-center gap-6">
                        <Metric value={formatMinutes(period.minutes || 0)} label={labels.total} />
                        <Metric value={tasks.length} label={labels.tasks} />
                    </Row>
                    <NeoButtonGroup controlSize="small" accessibilityLabel={labels.total}>
                        {periods.map((item) => (
                            <NeoButton
                                key={item.name}
                                label={item.title}
                                selected={item.name === period.name}
                                onPress={() => selectPeriod(item.name)}
                            />
                        ))}
                    </NeoButtonGroup>
                </Row>

                {tasks.length === 0 ? (
                    <Text className="py-4 text-center text-sm text-muted-foreground">{labels.empty}</Text>
                ) : (
                    <View className="gap-4">
                        {tasks.slice(0, visibleCount).map((task) => (
                            <TaskRow key={task.id} task={task} maxMinutes={maxMinutes} />
                        ))}
                    </View>
                )}

                {tasks.length > visibleCount ? (
                    <View className="items-center">
                        <NeoButton
                            style="text"
                            controlSize="small"
                            label={labels.show_more}
                            onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        />
                    </View>
                ) : null}
            </View>
        </BlockWrapper>
    );
}
