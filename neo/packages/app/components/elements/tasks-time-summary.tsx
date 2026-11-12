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
import { cn, decodeTextNode } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { formatTaskMinutes } from 'app/lib/tasks-meta';

const REFRESH_ACTIONS = ['log', 'log-all'];

/** Only the time the viewer may see comes: Logged (`minutes`, `original`), Billed (`billed`) or both. */
type Totals = {
    minutes?: number;
    /** The part of `minutes` logged from timers; the rest was entered by hand. */
    timer?: number;
    billed?: number;
};

type SummaryLog = Totals & {
    id: number;
    /** The time first logged, when the Logged time was changed later. */
    original?: number | null;
    /** Logged from a timer, or entered by hand. */
    by_timer?: boolean;
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

type Labels = { total?: string; logged?: string; billed?: string; original?: string; by_timer?: string; by_hand?: string; empty?: string };

type Columns = { logged?: boolean; billed?: boolean };

type SummaryData = {
    periods?: SummaryPeriod[];
    default_period?: string;
    columns?: Columns;
    labels?: Labels;
    request_url?: string;
};

type TasksTimeSummaryProps = {
    data?: SummaryData;
    blockWrapperProps?: any;
};

/** Rows show Logged time; those who see Billed time only (clients) get that instead. */
function mainMinutes(totals: Totals, columns: Columns) {
    return (columns.logged ? totals.minutes : totals.billed) || 0;
}

function Metric({ value, label }: { value: string; label?: string }) {
    return (
        <View className="gap-0.5">
            <Text className="text-xl font-semibold tabular-nums text-foreground">{value}</Text>
            <Text className="text-xs text-muted-foreground">{label}</Text>
        </View>
    );
}

/**
 * The bar's length is relative to `maxMinutes`. Logged time is split: solid for timers, lighter for time added by hand
 * (time taken away by hand shortens the solid part).
 */
function TimeBar({ totals, columns, maxMinutes }: { totals: Totals; columns: Columns; maxMinutes: number }) {
    const share = (value: number) => (maxMinutes > 0 ? `${Math.min(100, (value / maxMinutes) * 100)}%` : '0%') as `${number}%`;
    const minutes = mainMinutes(totals, columns);
    const timer = columns.logged && totals.timer != null ? Math.min(totals.timer, minutes) : minutes;

    return (
        <Row className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <View className="h-full bg-green" style={{ width: share(timer) }} />
            <View className="h-full bg-green/40" style={{ width: share(minutes - timer) }} />
        </Row>
    );
}

/**
 * Under the Logged time: its timer part, the manual part when there is one (it stands out),
 * and, for those who see both, the Billed time (it stands out when it differs from the Logged one).
 */
function SplitText({ totals, columns, labels }: { totals: Totals; columns: Columns; labels: Labels }) {
    if (!columns.logged) return null;

    const minutes = totals.minutes || 0;
    // Manual is what hands added to or took from the timers' time: entries and changes, + or -.
    const manual = minutes - (totals.timer || 0);
    const billed = totals.billed || 0;

    // A part that is zero (or the same as Logged) says nothing.
    const parts = [
        totals.timer ? { key: 'timer', text: `${labels.by_timer} ${formatTaskMinutes(totals.timer)}`, className: '' } : null,
        totals.timer != null && manual !== 0
            ? { key: 'manual', text: `${labels.by_hand} ${manual < 0 ? '−' : '+'}${formatTaskMinutes(Math.abs(manual))}`, className: 'font-medium text-foreground' }
            : null,
        // Billed always shows for those who see both; it stands out when it differs from the Logged time.
        columns.billed
            ? { key: 'billed', text: `${labels.billed} ${formatTaskMinutes(billed)}`, className: billed !== minutes ? 'font-medium text-primary' : '' }
            : null,
    ].filter(Boolean) as { key: string; text: string; className: string }[];
    if (!parts.length) return null;

    return (
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {parts.map((part, index) => (
                <Text key={part.key} className={cn('text-xs', part.className || 'text-muted-foreground')}>
                    {index ? ' · ' : ''}{part.text}
                </Text>
            ))}
        </Text>
    );
}

function LogRow({ log, columns, labels }: { log: SummaryLog; columns: Columns; labels: Labels }) {
    const { i18n } = useTranslation();
    // `value_date` is a date picked in UTC, so it must not shift a day with the viewer's time zone.
    const date = log.date
        ? new Date(log.date * 1000).toLocaleDateString(i18n.language, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    // The same Timer · Manual ± split as the person and task rows: a timer's entry is its first logged time plus the changes.
    const totals: Totals = {
        minutes: log.minutes,
        timer: log.by_timer == null ? undefined : (log.by_timer ? (log.original ?? log.minutes ?? 0) : 0),
        billed: log.billed,
    };

    return (
        <View className="gap-0.5">
            <Row className="items-center gap-2">
                <Text numberOfLines={1} className="flex-auto min-w-0 text-sm text-foreground">{date}</Text>
                <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(mainMinutes(log, columns))}</Text>
            </Row>
            <SplitText totals={totals} columns={columns} labels={labels} />
            {log.text ? (
                <Text className="text-xs text-muted-foreground">{decodeTextNode(log.text)}</Text>
            ) : null}
        </View>
    );
}

function TaskRow({ task, columns, labels, maxMinutes }: { task: SummaryTask; columns: Columns; labels: Labels; maxMinutes: number }) {
    const minutes = mainMinutes(task, columns);

    return (
        <View className="gap-1">
            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0">
                    <Link href={task.url}>
                        <Text numberOfLines={1} className="text-sm font-medium text-foreground">{decodeTextNode(task.title)}</Text>
                    </Link>
                </View>
                <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(minutes)}</Text>
            </Row>
            <TimeBar totals={task} columns={columns} maxMinutes={maxMinutes} />
            <SplitText totals={task} columns={columns} labels={labels} />
        </View>
    );
}

function PersonItem({ person, columns, labels, maxMinutes }: { person: SummaryPerson; columns: Columns; labels: Labels; maxMinutes: number }) {
    const profile = person.profile || {};
    const tasks = person.tasks || [];
    const logs = person.logs || [];
    const minutes = mainMinutes(person, columns);
    const firstTask = tasks[0];

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
                        <Text className="flex-none text-sm font-medium tabular-nums text-foreground">{formatTaskMinutes(minutes)}</Text>
                    </Row>
                    <TimeBar totals={person} columns={columns} maxMinutes={maxMinutes} />
                    <SplitText totals={person} columns={columns} labels={labels} />
                </View>
            </AccordionTrigger>
            {/* Indented under the person: in from the avatar on the left, ending with the person's bar (before the chevron) on the right. */}
            <AccordionContent innerClassName="gap-3 pb-3 pt-1 pl-8 pr-9">
                {tasks.map((task) => (
                    <TaskRow key={task.id} task={task} columns={columns} labels={labels} maxMinutes={firstTask ? mainMinutes(firstTask, columns) : 0} />
                ))}
                {logs.map((log) => (
                    <LogRow key={log.id} log={log} columns={columns} labels={labels} />
                ))}
            </AccordionContent>
        </AccordionItem>
    );
}

/** Logged and Billed time by person, on a task or a project, as the viewer's role allows (`bx_tasks:get_block_time_summary*`). */
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
    // Older servers send no columns: their time is Logged time.
    const columns: Columns = summary?.columns || { logged: true };
    const [periodName, setPeriodName] = useState(summary?.default_period);

    const period = periods.find((item) => item.name === periodName) || periods[0];
    if (!period) return null;

    const people = Array.isArray(period.people) ? period.people : [];
    const firstPerson = people[0];

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                <Row className="flex-wrap items-center justify-between gap-3">
                    <Row className="flex-wrap items-center gap-x-6 gap-y-2">
                        {columns.logged ? (
                            <Metric value={formatTaskMinutes(period.minutes || 0)} label={labels.logged || labels.total} />
                        ) : null}
                        {columns.billed ? (
                            <Metric value={formatTaskMinutes(period.billed || 0)} label={labels.billed} />
                        ) : null}
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
                                columns={columns}
                                labels={labels}
                                maxMinutes={firstPerson ? mainMinutes(firstPerson, columns) : 0}
                            />
                        ))}
                    </Accordion>
                )}
            </View>
        </BlockWrapper>
    );
}
