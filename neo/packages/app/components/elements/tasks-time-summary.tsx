import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonGroup } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper';
import Link from 'app/ui/atoms/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'app/ui/atoms/accordion';
import Profile from 'app/ui/molecules/profile/profile';
import { fetcher } from 'app/lib/fetcher';
import { decodeTextNode } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { formatTaskMinutes } from 'app/lib/tasks-meta';

const REFRESH_ACTIONS = ['log', 'log-all'];

type Totals = {
    minutes: number;
    billable: number;
    non_billable: number;
};

type SummaryLog = {
    id: number;
    minutes: number;
    billable: number;
    date: number;
    text?: string;
};

type SummaryTask = Totals & {
    id: number;
    title: string;
    url: string;
};

type SummaryPerson = Totals & {
    profile?: { id?: number; display_name?: string; url_avatar?: string };
    /** A task's block lists the person's log entries, a project's block their tasks. */
    logs?: SummaryLog[];
    tasks?: SummaryTask[];
};

type SummaryPeriod = Totals & {
    name: string;
    title: string;
    people?: SummaryPerson[];
};

type Labels = { total?: string; billable?: string; non_billable?: string; empty?: string };

type SummaryData = {
    periods?: SummaryPeriod[];
    default_period?: string;
    labels?: Labels;
    request_url?: string;
};

type TasksTimeSummaryProps = {
    data?: SummaryData;
    blockWrapperProps?: any;
};

function Metric({ value, label }: { value: string; label?: string }) {
    return (
        <View className="gap-0.5">
            <Text className="text-xl font-semibold tabular-nums text-foreground">{value}</Text>
            <Text className="text-xs text-muted-foreground">{label}</Text>
        </View>
    );
}

/** Green is billable, amber non-billable; the whole bar's length is relative to `maxMinutes`. */
function SplitBar({ totals, maxMinutes }: { totals: Totals; maxMinutes: number }) {
    const share = (minutes: number) => (maxMinutes > 0 ? `${(minutes / maxMinutes) * 100}%` : '0%') as `${number}%`;

    return (
        <Row className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <View className="h-full bg-green" style={{ width: share(totals.billable) }} />
            <View className="h-full bg-alert-warning" style={{ width: share(totals.non_billable) }} />
        </Row>
    );
}

function SplitText({ totals, labels }: { totals: Totals; labels: Labels }) {
    return (
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {`${labels.billable} ${formatTaskMinutes(totals.billable)} · ${labels.non_billable} ${formatTaskMinutes(totals.non_billable)}`}
        </Text>
    );
}

function LogRow({ log, labels }: { log: SummaryLog; labels: Labels }) {
    const { i18n } = useTranslation();
    // `value_date` is a date picked in UTC, so it must not shift a day with the viewer's time zone.
    const date = log.date
        ? new Date(log.date * 1000).toLocaleDateString(i18n.language, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    return (
        <View className="gap-0.5">
            <Row className="items-center gap-2">
                <Text numberOfLines={1} className="flex-auto min-w-0 text-sm text-foreground">{date}</Text>
                {log.billable ? null : (
                    <Text className="flex-none text-xs text-alert-warning">{labels.non_billable}</Text>
                )}
                <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(log.minutes)}</Text>
            </Row>
            {log.text ? (
                <Text className="text-xs text-muted-foreground">{decodeTextNode(log.text)}</Text>
            ) : null}
        </View>
    );
}

function TaskRow({ task, labels, maxMinutes }: { task: SummaryTask; labels: Labels; maxMinutes: number }) {
    return (
        <View className="gap-1">
            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0">
                    <Link href={task.url}>
                        <Text numberOfLines={1} className="text-sm font-medium text-foreground">{decodeTextNode(task.title)}</Text>
                    </Link>
                </View>
                <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(task.minutes)}</Text>
            </Row>
            <SplitBar totals={task} maxMinutes={maxMinutes} />
            <SplitText totals={task} labels={labels} />
        </View>
    );
}

function PersonItem({ person, labels, maxMinutes }: { person: SummaryPerson; labels: Labels; maxMinutes: number }) {
    const profile = person.profile || {};
    const tasks = person.tasks || [];
    const logs = person.logs || [];

    return (
        <AccordionItem value={String(profile.id)}>
            <AccordionTrigger className="gap-3 py-3">
                <View className="flex-1 min-w-0 gap-1.5">
                    <Row className="items-center gap-2">
                        <Profile
                            url_avatar={profile.url_avatar}
                            display_name={profile.display_name}
                            displayType="unit_wo_info"
                            displaySize="xs"
                        />
                        <Text numberOfLines={1} className="flex-auto min-w-0 text-sm font-medium text-foreground">{profile.display_name}</Text>
                        <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(person.minutes)}</Text>
                    </Row>
                    <SplitBar totals={person} maxMinutes={maxMinutes} />
                    <SplitText totals={person} labels={labels} />
                </View>
            </AccordionTrigger>
            <AccordionContent innerClassName="gap-3 pb-3 pt-1">
                {tasks.map((task) => (
                    <TaskRow key={task.id} task={task} labels={labels} maxMinutes={tasks[0]?.minutes || 0} />
                ))}
                {logs.map((log) => (
                    <LogRow key={log.id} log={log} labels={labels} />
                ))}
            </AccordionContent>
        </AccordionItem>
    );
}

/** Logged time by person, billable and non-billable, on a task or a project (`bx_tasks:get_block_time_summary*`). */
export default function TasksTimeSummary({ data, blockWrapperProps }: TasksTimeSummaryProps) {
    const [summary, setSummary] = useState(data);

    // Fresh block data (page reload) replaces the refreshed copy.
    const [seenData, setSeenData] = useState(data);
    if (seenData !== data) {
        setSeenData(data);
        setSummary(data);
    }

    const requestUrl = summary?.request_url;

    useEffect(() => {
        if (!requestUrl) return undefined;

        let latestRequest = 0;
        // Logged time reaches this block without a page reload.
        const subscription = emitter.addListener(EVENTS.taskTimer, async (event: { action?: string }) => {
            if (!REFRESH_ACTIONS.includes(String(event.action))) return;

            const request = ++latestRequest;
            const response = await fetcher('/api.php?r=' + requestUrl);
            const next = response?.data?.[0]?.data;
            if (request === latestRequest && next?.periods) setSummary(next);
        });
        return () => subscription.remove();
    }, [requestUrl]);

    const periods = Array.isArray(summary?.periods) ? summary.periods : [];
    const labels = summary?.labels || {};
    const [periodName, setPeriodName] = useState(summary?.default_period);

    const period = periods.find((item) => item.name === periodName) || periods[0];
    if (!period) return null;

    const people = Array.isArray(period.people) ? period.people : [];

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                <Row className="flex-wrap items-center justify-between gap-3">
                    <Row className="flex-wrap items-center gap-x-6 gap-y-2">
                        <Metric value={formatTaskMinutes(period.minutes)} label={labels.total} />
                        <Metric value={formatTaskMinutes(period.billable)} label={labels.billable} />
                        <Metric value={formatTaskMinutes(period.non_billable)} label={labels.non_billable} />
                    </Row>
                    {periods.length > 1 ? (
                        <NeoButtonGroup controlSize="small" accessibilityLabel={labels.total}>
                            {periods.map((item) => (
                                <NeoButton
                                    key={item.name}
                                    label={item.title}
                                    selected={item.name === period.name}
                                    onPress={() => setPeriodName(item.name)}
                                />
                            ))}
                        </NeoButtonGroup>
                    ) : null}
                </Row>

                {people.length === 0 ? (
                    <Text className="py-4 text-center text-sm text-muted-foreground">{labels.empty}</Text>
                ) : (
                    <Accordion type="multiple">
                        {people.map((person) => (
                            <PersonItem
                                key={person.profile?.id}
                                person={person}
                                labels={labels}
                                maxMinutes={people[0]?.minutes || 0}
                            />
                        ))}
                    </Accordion>
                )}
            </View>
        </BlockWrapper>
    );
}
