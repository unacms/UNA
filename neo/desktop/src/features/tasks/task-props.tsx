import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { longTime } from '../../components/activity-card';
import { Avatar } from '../../components/avatar';
import { Icon, type IconName } from '../../components/icon';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t, tn } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { type MenuEntry, showMenu, useMenuExpanded } from '../../lib/native-menu';
import { useSettings } from '../../lib/settings';
import { isEditable } from '../../lib/shortcuts';
import { SideCard } from '../page-blocks/side-columns';
import { ProfileName } from '../profile/profile-link';
import { clockText, durationWords, estimateSeconds, labelColor, parseDuration, priorityIcon, stateIcon, taskTimeKey, type TaskTime, timerSeconds, timerText } from './board';
import { changeTask, dateOf, dueFromDate, logTime, type PropertyPick, PROPERTY_KEYS, PROPERTY_LABELS, propertyEntries, type PropertyKind } from './task-actions';
import { useContextMembers, useTaskChoices } from './task-board';
import { useNow, useTimerAction } from './task-timers';
import { dueText, fetchTaskLists, isOverdue, type Task, taskListsKey } from './tasks';

/** The id of a property's button (its key opens it from anywhere in the task). */
const propId = (task: Pick<Task, 'id'>, kind: PropertyKind | 'due') => `task-${task.id}-prop-${kind}`;

/** "S", the key that opens a property, as the button says it. */
function KeyHint({ k }: { k: string | undefined }) {
    return k ? (
        <kbd className="task-prop-key" aria-hidden="true">
            {k.toUpperCase()}
        </kbd>
    ) : null;
}

/** "Change state (S)": what a property's button says it does, with its key. */
function changeTitle(kind: PropertyKind, key: string): string {
    switch (kind) {
        case 'state':
            return t('Change state ({{key}})', { key });
        case 'priority':
            return t('Change priority ({{key}})', { key });
        case 'type':
            return t('Change type ({{key}})', { key });
        case 'estimate':
            return t('Change estimate ({{key}})', { key });
        case 'labels':
            return t('Change labels ({{key}})', { key });
        case 'assignees':
            return t('Change assignees ({{key}})', { key });
        case 'list':
            return t('Change list ({{key}})', { key });
    }
}

/**
 * A property as a button: its value (or what it is when it has none, quieter), and its menu of
 * values (the current one checked) for who may change it; its key in the tooltip and to screen
 * readers (aria-keyshortcuts). `said` is the value in words, for its name ("State: In
 * Progress"). As a `chip` (a task's properties under its title in a narrow pane) it is a
 * capsule, and an empty one says what it sets ("+ Priority"); one the viewer may not set is
 * left out there.
 */
function PropButton({
    task,
    kind,
    icon,
    value,
    said,
    empty,
    entries,
    look = 'row',
}: {
    task: Task;
    kind: PropertyKind;
    icon: IconName | null;
    value: ReactNode;
    said: string;
    empty: boolean;
    entries: () => ReturnType<typeof propertyEntries>;
    look?: 'row' | 'chip';
}) {
    const owner = propId(task, kind);
    const open = useMenuExpanded(owner);
    const can = !!task.viewer?.can_complete;
    const k = PROPERTY_KEYS[kind];
    const chip = look === 'chip';
    if (chip && empty && !can) return null;
    const content =
        chip && empty ? (
            <>
                <Icon name="plus" size={16} />
                <span className="task-prop-value">{PROPERTY_LABELS[kind]}</span>
            </>
        ) : (
            <>
                {icon ? (
                    <span className="task-prop-icon" aria-hidden="true">
                        <Icon name={icon} size={16} />
                    </span>
                ) : null}
                <span className={empty ? 'task-prop-value muted' : 'task-prop-value'}>{value}</span>
            </>
        );
    if (!can)
        return (
            <span className={chip ? 'task-prop-chip task-prop-chip-static' : 'task-prop-static'}>
                {chip ? <span className="sr-only">{`${PROPERTY_LABELS[kind]}: `}</span> : null}
                {content}
            </span>
        );
    return (
        <button
            type="button"
            id={owner}
            className={chip ? 'task-prop-chip' : 'task-prop-button'}
            data-empty={chip && empty ? '' : undefined}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-keyshortcuts={k}
            aria-label={`${PROPERTY_LABELS[kind]}: ${said}`}
            title={k ? changeTitle(kind, k.toUpperCase()) : undefined}
            onClick={(e) => void showMenu(entries(), { anchor: e.currentTarget }, { label: PROPERTY_LABELS[kind], owner })}
        >
            {content}
            {chip ? null : <KeyHint k={k} />}
        </button>
    );
}

/**
 * What a task's property buttons share, as rows or chips: the menu of each property (its
 * choices, the context's lists and members) and a picked value saved, said once it is.
 */
function useTaskPropertyMenus(task: Task, announce: (text: string) => void) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const choices = useTaskChoices(task.context_id ?? null);
    const lists = useQuery({ queryKey: taskListsKey(task.context_id ?? ''), queryFn: () => fetchTaskLists(api, task.context_id!), enabled: !!task.context_id });
    const members = useContextMembers(task.context, !!task.viewer?.can_complete);
    const pick = (p: PropertyPick) =>
        void changeTask(api, queryClient, task, p.changes, p.shown).then(
            () => announce(p.said),
            (e: unknown) => announce(t('Could not change it: {{reason}}', { reason: errorMessage(e) })),
        );
    const entries = (kind: PropertyKind) => () => propertyEntries(kind, task, { choices: choices.data, lists: lists.data?.items, members: members.data }, pick);
    return { pick, entries };
}

/** A due date picked: saved, and said. */
function pickDue(task: Task, pick: (p: PropertyPick) => void, next: string | null) {
    pick({ changes: { due_at: next }, shown: { due_at: next }, said: next ? t('Due {{when}}', { when: dueText({ due_at: next }) }) : t('No due date') });
}

/** The labels in words, for a name: "Bug, Print". */
const labelsSaid = (task: Task) => (task.labels.length ? task.labels.map((l) => l.title).join(', ') : t('No labels'));
/** The assignees in words, for a name. */
const assigneesSaid = (task: Task) => (task.assignees.length ? task.assignees.map((p) => p.display_name).join(', ') : t('Nobody'));

/** Log time: how long (1:30, 90m, 1.5h), on which day, a note; added to the task's time. */
function LogTimeForm({ task, onDone, announce }: { task: Task; onDone: () => void; announce: (text: string) => void }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [duration, setDuration] = useState('');
    const [date, setDate] = useState(() => dateOf(new Date().toISOString()));
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const errorId = useId();
    const hintId = useId();
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const minutes = parseDuration(duration);
        if (!minutes) {
            setError(t('Write how long, as 1:30, 90m or 1.5h'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await logTime(api, queryClient, task, minutes, date || null, note);
            announce(t('Logged {{duration}} on {{title}}', { duration: durationWords(minutes * 60), title: task.title }));
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <form className="task-log-form" onSubmit={(e) => void submit(e)} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), onDone())}>
            <label>
                <span>{t('Time spent')}</span>
                {/* it opens on the press of Log time, to type how long */}
                <input type="text" value={duration} autoFocus inputMode="text" placeholder="1:30" aria-describedby={error ? `${hintId} ${errorId}` : hintId} aria-invalid={error ? true : undefined} onChange={(e) => setDuration(e.target.value)} />
            </label>
            <span id={hintId} className="small muted">
                {t('As 1:30, 90m or 1.5h')}
            </span>
            <label>
                <span>{t('Day')}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
                <span>{t('Note')}</span>
                <input type="text" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="task-log-actions">
                <button type="submit" className="btn btn-primary" aria-disabled={busy || undefined} aria-busy={busy || undefined}>
                    {t('Log time')}
                </button>
                <button type="button" className="btn" onClick={onDone}>
                    {t('Cancel')}
                </button>
            </div>
            {error ? (
                <p id={errorId} className="error" role="alert">
                    {error}
                </p>
            ) : null}
        </form>
    );
}

/** Time: spent against the estimate, the viewer's timer (start, pause, resume, log, clear), Log time and the time records. */
function TimeProperty({ task, readAt, announce }: { task: Task; readAt: number; announce: (text: string) => void }) {
    const { api } = useApp();
    const run = useTimerAction(announce);
    const [logging, setLogging] = useState(false);
    const logButton = useRef<HTMLButtonElement>(null);
    const timer = task.timer;
    const running = timer?.state === 'running';
    // the timer's count runs on from when the answer came (`readAt`)
    const now = useNow(running);
    // (a list's copy shown while the task loads has no such time: no more than it said)
    const seconds = timerSeconds(timer, readAt || now, Math.max(now, readAt));
    const estimate = estimateSeconds(task);
    const records = useQuery({ queryKey: taskTimeKey(task.id), queryFn: async (): Promise<TaskTime> => unwrap(await api.GET('/tasks/{id}/time', { params: { path: { id: task.id } } })), enabled: task.time_spent > 0 });
    const can = !!task.viewer?.can_track_time;
    return (
        <div className="task-time-prop">
            <p className="task-time-total">
                <Icon name="clock" size={16} />
                <span>
                    {clockText(task.time_spent)}
                    {estimate ? <span className="muted">{` / ${clockText(estimate)}`}</span> : null}
                </span>
                <span className="sr-only">{estimate ? t('{{spent}} spent of an estimate of {{estimate}}', { spent: durationWords(task.time_spent), estimate: durationWords(estimate) }) : t('{{spent}} spent', { spent: durationWords(task.time_spent) })}</span>
            </p>
            {can ? (
                <div className="task-timer">
                    {timer ? (
                        <span className="timer-count" data-running={running || undefined}>
                            <span aria-hidden="true">{timerText(seconds)}</span>
                            <span className="sr-only">{running ? t('Your timer, running') : t('Your timer, paused')}</span>
                        </span>
                    ) : null}
                    <button type="button" className="btn" onClick={() => void run(task, !timer ? 'start' : running ? 'pause' : 'resume')}>
                        <Icon name={running ? 'pause' : 'play'} size={16} />
                        <span>{!timer ? t('Start timer') : running ? t('Pause') : t('Resume')}</span>
                    </button>
                    {timer ? (
                        <>
                            <button type="button" className="btn" onClick={() => void run(task, 'log')} aria-label={t('Log what the timer counted')}>
                                {t('Log')}
                            </button>
                            <button type="button" className="btn" onClick={() => void run(task, 'clear')} aria-label={t('Clear the timer')}>
                                {t('Clear')}
                            </button>
                        </>
                    ) : null}
                </div>
            ) : null}
            {can && !logging ? (
                <button ref={logButton} type="button" className="link-button small" onClick={() => setLogging(true)}>
                    {t('Log time…')}
                </button>
            ) : null}
            {logging ? (
                <LogTimeForm
                    task={task}
                    announce={announce}
                    onDone={() => {
                        setLogging(false);
                        requestAnimationFrame(() => logButton.current?.focus());
                    }}
                />
            ) : null}
            {records.data?.items.length ? (
                <ul className="task-time-records" aria-label={records.data.all ? t('Time logged', { context: 'list' }) : t('Your time logged')}>
                    {records.data.items.slice(0, 8).map((r) => (
                        <li key={r.id}>
                            {r.author ? <Avatar profile={r.author} size={16} /> : null}
                            <span>{clockText(r.seconds)}</span>
                            <time className="muted" dateTime={r.date}>
                                {new Date(`${r.date}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
                            </time>
                            {r.text ? <bdi className="muted truncate">{r.text}</bdi> : null}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

/**
 * A task's properties beside its text, as Linear's: state, priority, type, estimate, labels,
 * assignees, list, due date, time (spent, the timer, Log time), created and updated. Each one
 * the viewer may change is a button with a menu; S, P, T, E, L, A and D open them from anywhere
 * in the task (not while typing; single keys follow Settings > Keyboard). A side card, painted
 * as a page's side blocks are (the site's default design box: the task's page has no block the
 * API maps for it).
 */
export function TaskProperties({ task, readAt, announce }: { task: Task; readAt: number; announce: (text: string) => void }) {
    const { pick, entries } = useTaskPropertyMenus(task, announce);
    const dueInput = useRef<HTMLInputElement>(null);
    const due = dueText(task);
    const can = !!task.viewer?.can_complete;
    const row = (kind: PropertyKind | 'due' | 'time' | 'created' | 'updated', label: string, value: ReactNode) => (
        <div className={`task-prop task-prop-${kind}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
    const said = (v: { title: string } | null | undefined, none: string) => v?.title ?? none;
    return (
        <SideCard as="aside" title={t('Properties')} level={3} className="task-props">
            <dl>
                {row('state', t('State'), <PropButton task={task} kind="state" icon={stateIcon(task.state, task.completed)} value={said(task.state, t('No state'))} said={said(task.state, t('No state'))} empty={!task.state} entries={entries('state')} />)}
                {row('priority', t('Priority'), <PropButton task={task} kind="priority" icon={priorityIcon(task.priority)} value={said(task.priority, t('No priority'))} said={said(task.priority, t('No priority'))} empty={!task.priority} entries={entries('priority')} />)}
                {row('type', t('Type'), <PropButton task={task} kind="type" icon="shapes" value={said(task.type, t('No type'))} said={said(task.type, t('No type'))} empty={!task.type} entries={entries('type')} />)}
                {row('estimate', t('Estimate'), <PropButton task={task} kind="estimate" icon="hash" value={said(task.estimate, t('No estimate'))} said={said(task.estimate, t('No estimate'))} empty={!task.estimate} entries={entries('estimate')} />)}
                {row(
                    'labels',
                    t('Labels'),
                    <PropButton
                        task={task}
                        kind="labels"
                        icon="tag"
                        empty={!task.labels.length}
                        said={labelsSaid(task)}
                        value={
                            task.labels.length ? (
                                <span className="task-prop-chips">
                                    {task.labels.map((l) => (
                                        <span key={l.id} className="task-chip">
                                            <span className="task-dot" style={{ background: labelColor(l) }} />
                                            <bdi>{l.title}</bdi>
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                t('No labels')
                            )
                        }
                        entries={entries('labels')}
                    />,
                )}
                {row(
                    'assignees',
                    t('Assignees'),
                    <>
                        <PropButton
                            task={task}
                            kind="assignees"
                            icon="users"
                            empty={!task.assignees.length}
                            value={task.assignees.length ? tn(task.assignees.length, '{{count}} assigned', '{{count}} assigned') : t('Nobody')}
                            said={task.assignees.length ? tn(task.assignees.length, '{{count}} assigned', '{{count}} assigned') : t('Nobody')}
                            entries={entries('assignees')}
                        />
                        {task.assignees.length ? (
                            <ul className="task-people">
                                {task.assignees.map((p) => (
                                    <li key={p.id}>
                                        <Avatar profile={p} size={20} />
                                        <ProfileName profile={p} />
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </>,
                )}
                {task.context ? row('list', t('List'), <PropButton task={task} kind="list" icon={task.list_id ? 'list' : 'inbox'} value={task.list_title ?? t('Inbox')} said={task.list_title ?? t('Inbox')} empty={false} entries={entries('list')} />) : null}
                {row(
                    'due',
                    t('Due date'),
                    can ? (
                        <span className="task-due-field">
                            <input
                                ref={dueInput}
                                id={propId(task, 'due')}
                                type="date"
                                value={dateOf(task.due_at)}
                                aria-label={isOverdue(task) ? t('Due date, overdue') : t('Due date')}
                                aria-keyshortcuts="d"
                                className={isOverdue(task) ? 'task-overdue' : undefined}
                                onChange={(e) => pickDue(task, pick, dueFromDate(e.target.value, task.due_at))}
                            />
                            <KeyHint k="d" />
                        </span>
                    ) : due ? (
                        <time dateTime={task.due_at ?? undefined} className={isOverdue(task) ? 'task-overdue' : undefined}>
                            {due}
                        </time>
                    ) : (
                        <span className="muted">{t('No due date')}</span>
                    ),
                )}
                {row('time', t('Time'), <TimeProperty task={task} readAt={readAt} announce={announce} />)}
                {row('created', t('Created'), <time dateTime={task.created_at}>{longTime(task.created_at)}</time>)}
                {row('updated', t('Updated'), <time dateTime={task.updated_at}>{longTime(task.updated_at)}</time>)}
            </dl>
        </SideCard>
    );
}

/** A date `days` from today at the time of day the due date had (5 pm for a new one), as the date field sets it. */
function dueIn(days: number, before: string | null): string | null {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return dueFromDate(dateOf(d.toISOString()), before);
}

/**
 * The due date as a chip: its menu has Today, Tomorrow, In a week, Choose a date… (the date
 * field in the chip's place, its picker open) and No due date, as Linear's does. D opens it.
 */
function DueChip({ task, pick }: { task: Task; pick: (p: PropertyPick) => void }) {
    const owner = propId(task, 'due');
    const open = useMenuExpanded(owner);
    const [choosing, setChoosing] = useState(false);
    const chipRef = useRef<HTMLButtonElement>(null);
    const fieldRef = useRef<HTMLInputElement>(null);
    // the field in the chip's place: focused, its picker open once
    useEffect(() => {
        const el = fieldRef.current;
        if (!choosing || !el) return;
        el.focus();
        try {
            el.showPicker?.();
        } catch {
            // a picker the web view does not open here: the field has focus
        }
    }, [choosing]);
    const due = dueText(task);
    const overdue = isOverdue(task);
    const can = !!task.viewer?.can_complete;
    const said = !due ? t('Due date: No due date') : overdue ? t('Due date: {{due}}, overdue', { due }) : t('Due date: {{due}}', { due });
    if (!can)
        return due ? (
            <span className="task-prop-chip task-prop-chip-static" data-overdue={overdue || undefined}>
                {rich(overdue ? t('<sr>Due date: </sr><due></due><sr>, overdue</sr>') : t('<sr>Due date: </sr><due></due>'), {
                    sr: (text) => <span className="sr-only">{text}</span>,
                    due: () => (
                        <>
                            <Icon name="calendar" size={16} />
                            <time dateTime={task.due_at ?? undefined}>{due}</time>
                        </>
                    ),
                })}
            </span>
        ) : null;
    const back = () => {
        setChoosing(false);
        requestAnimationFrame(() => chipRef.current?.focus());
    };
    if (choosing)
        return (
            <span className="task-prop-chip task-due-chip-field">
                <Icon name="calendar" size={16} />
                <input
                    ref={fieldRef}
                    type="date"
                    aria-label={t('Due date')}
                    value={dateOf(task.due_at)}
                    onChange={(e) => {
                        if (e.target.value) pickDue(task, pick, dueFromDate(e.target.value, task.due_at));
                    }}
                    // back to the chip when focus moves on (not while the date picker has it)
                    onBlur={(e) => {
                        if (e.relatedTarget) setChoosing(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            back();
                        }
                    }}
                />
            </span>
        );
    const entries = (): MenuEntry[] => [
        { text: t('Today'), run: () => pickDue(task, pick, dueIn(0, task.due_at)) },
        { text: t('Tomorrow'), run: () => pickDue(task, pick, dueIn(1, task.due_at)) },
        { text: t('In a week'), run: () => pickDue(task, pick, dueIn(7, task.due_at)) },
        { text: t('Choose a date…'), run: () => setChoosing(true) },
        ...(task.due_at ? ['separator' as const, { text: t('No due date'), run: () => pickDue(task, pick, null) }] : []),
    ];
    return (
        <button
            ref={chipRef}
            type="button"
            id={owner}
            className="task-prop-chip"
            data-empty={due ? undefined : ''}
            data-overdue={overdue || undefined}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-keyshortcuts="d"
            aria-label={said}
            title={t('Change due date ({{key}})', { key: 'D' })}
            onClick={(e) => void showMenu(entries(), { anchor: e.currentTarget }, { label: t('Due date'), owner })}
        >
            <Icon name={due ? 'calendar' : 'plus'} size={16} />
            <span className="task-prop-value">{due || t('Due date')}</span>
        </button>
    );
}

/**
 * Time as a chip: spent against the estimate, and the viewer's timer counting when it runs.
 * Its menu has the timer's actions (Start, Pause or Resume, Log, Clear) and Log time…, which
 * opens the form under the chips.
 */
function TimeChip({ task, readAt, announce, onLog }: { task: Task; readAt: number; announce: (text: string) => void; onLog: () => void }) {
    const run = useTimerAction(announce);
    const owner = `task-${task.id}-prop-time`;
    const open = useMenuExpanded(owner);
    const timer = task.timer;
    const running = timer?.state === 'running';
    const now = useNow(running);
    const seconds = timerSeconds(timer, readAt || now, Math.max(now, readAt));
    const estimate = estimateSeconds(task);
    const can = !!task.viewer?.can_track_time;
    if (!can && !task.time_spent && !estimate) return null;
    const spent = estimate ? t('{{spent}} spent of {{estimate}}', { spent: durationWords(task.time_spent), estimate: durationWords(estimate) }) : t('{{spent}} spent', { spent: durationWords(task.time_spent) });
    const said = t('Time: {{time}}', { time: timer ? `${spent}, ${running ? t('your timer running') : t('your timer paused')}` : spent });
    const content = (
        <>
            <Icon name="clock" size={16} />
            <span className="task-prop-value task-time">
                {clockText(task.time_spent)}
                {estimate ? <span className="muted">{` / ${clockText(estimate)}`}</span> : null}
            </span>
            {timer ? (
                <span className="timer-count" data-running={running || undefined}>
                    {timerText(seconds)}
                </span>
            ) : null}
        </>
    );
    if (!can)
        return (
            <span className="task-prop-chip task-prop-chip-static">
                <span className="sr-only">{said}</span>
                <span aria-hidden="true" className="task-prop-chip-inner">
                    {content}
                </span>
            </span>
        );
    const entries = (): MenuEntry[] => [
        { text: !timer ? t('Start Timer') : running ? t('Pause Timer') : t('Resume Timer'), run: () => void run(task, !timer ? 'start' : running ? 'pause' : 'resume') },
        ...(timer ? [{ text: t('Log What the Timer Counted'), run: () => void run(task, 'log') }, { text: t('Clear Timer'), run: () => void run(task, 'clear') }] : []),
        'separator',
        { text: t('Log Time…'), run: onLog },
    ];
    return (
        <button
            type="button"
            id={owner}
            className="task-prop-chip"
            data-running={running || undefined}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={said}
            onClick={(e) => void showMenu(entries(), { anchor: e.currentTarget }, { label: t('Time'), owner })}
        >
            {content}
        </button>
    );
}

/**
 * A task's properties as a wrap of chips under its title, where the pane has no room for the
 * properties beside the text (as Linear's issue on a narrow window): state, priority, type,
 * estimate, labels, assignees, list, due date and time, each a capsule that opens the menu its
 * row opens (and the same keys). An empty one says what it sets ("+ Labels") where the viewer
 * may set it, and is left out where not. Created and updated are in the line under the title.
 */
export function TaskPropertyChips({ task, readAt, announce }: { task: Task; readAt: number; announce: (text: string) => void }) {
    const { pick, entries } = useTaskPropertyMenus(task, announce);
    const [logging, setLogging] = useState(false);
    const said = (v: { title: string } | null | undefined, none: string) => v?.title ?? none;
    const labels = task.labels;
    const people = task.assignees;
    const first = people[0];
    return (
        <div className="task-prop-chip-row" role="group" aria-label={t('Properties')}>
            <PropButton look="chip" task={task} kind="state" icon={stateIcon(task.state, task.completed)} value={said(task.state, t('No state'))} said={said(task.state, t('No state'))} empty={!task.state} entries={entries('state')} />
            <PropButton look="chip" task={task} kind="priority" icon={priorityIcon(task.priority)} value={said(task.priority, t('No priority'))} said={said(task.priority, t('No priority'))} empty={!task.priority} entries={entries('priority')} />
            <PropButton look="chip" task={task} kind="type" icon="shapes" value={said(task.type, t('No type'))} said={said(task.type, t('No type'))} empty={!task.type} entries={entries('type')} />
            <PropButton look="chip" task={task} kind="estimate" icon="hash" value={said(task.estimate, t('No estimate'))} said={said(task.estimate, t('No estimate'))} empty={!task.estimate} entries={entries('estimate')} />
            <PropButton
                look="chip"
                task={task}
                kind="labels"
                icon={null}
                empty={!labels.length}
                said={labelsSaid(task)}
                value={
                    <>
                        <span className="task-chip-dots" aria-hidden="true">
                            {labels.slice(0, 4).map((l) => (
                                <span key={l.id} className="task-dot" style={{ background: labelColor(l) }} />
                            ))}
                        </span>
                        <bdi>{labels.length === 1 ? labels[0]!.title : tn(labels.length, '{{count}} label', '{{count}} labels')}</bdi>
                    </>
                }
                entries={entries('labels')}
            />
            <PropButton
                look="chip"
                task={task}
                kind="assignees"
                icon={null}
                empty={!people.length}
                said={assigneesSaid(task)}
                value={
                    <>
                        <span className="task-assignees" aria-hidden="true">
                            {people.slice(0, 3).map((p) => (
                                <Avatar key={p.id} profile={p} size={20} />
                            ))}
                        </span>
                        <bdi>{people.length === 1 && first ? first.display_name : tn(people.length, '{{count}} assignee', '{{count}} assignees')}</bdi>
                    </>
                }
                entries={entries('assignees')}
            />
            {task.context ? <PropButton look="chip" task={task} kind="list" icon={task.list_id ? 'list' : 'inbox'} value={task.list_title ?? t('Inbox')} said={task.list_title ?? t('Inbox')} empty={false} entries={entries('list')} /> : null}
            <DueChip task={task} pick={pick} />
            <TimeChip task={task} readAt={readAt} announce={announce} onLog={() => setLogging(true)} />
            {logging ? (
                <div className="task-prop-chip-form">
                    <LogTimeForm
                        task={task}
                        announce={announce}
                        onDone={() => {
                            setLogging(false);
                            requestAnimationFrame(() => document.getElementById(`task-${task.id}-prop-time`)?.focus());
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}

/**
 * The single keys of a task's detail, while focus is in it and not in a field: S state, P
 * priority, T type, E estimate, L labels, A assignees (each opens its menu), D the due date, J
 * and K the next and previous task of the list. Off with Settings > Keyboard's single keys.
 * Taken here (preventDefault), so the window's own single keys (p, l, e) do nothing in a task.
 */
export function useTaskKeys(task: Task | undefined, move: (step: 1 | -1) => void) {
    const { singleKeyShortcuts } = useSettings();
    return (e: KeyboardEvent<HTMLElement>) => {
        if (!task || !singleKeyShortcuts || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.defaultPrevented || isEditable(e.target)) return;
        const key = e.key.toLowerCase();
        if (key === 'j' || key === 'k') {
            e.preventDefault();
            move(key === 'j' ? 1 : -1);
            return;
        }
        const kind = (Object.entries(PROPERTY_KEYS) as [PropertyKind | 'due', string][]).find(([, k]) => k === key)?.[0];
        if (!kind) return;
        const el = document.getElementById(propId(task, kind));
        if (!el) return;
        e.preventDefault();
        if (kind === 'due' && el instanceof HTMLInputElement) {
            el.focus();
            try {
                el.showPicker?.();
            } catch {
                // a picker the web view does not show from a key: the field has focus
            }
            return;
        }
        el.click();
    };
}
