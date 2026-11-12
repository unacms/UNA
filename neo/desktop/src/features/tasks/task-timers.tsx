import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { useNavigation, useRoute } from '../../lib/navigation';
import { Pane } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { durationWords, TIMERS_KEY, type TaskTimers, timerSeconds, timerText } from './board';
import { timerAction, type TimerAction } from './task-actions';
import { type Task, taskKey } from './tasks';

/** The time now, once a second while `running` (a running timer's count); still otherwise. */
export function useNow(running: boolean): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!running) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, [running]);
    return now;
}

/** What a timer button does and says. */
export const TIMER_WORDS: Record<TimerAction, { label: string; said: string }> = {
    start: { label: t('Start timer'), said: t('Timer started') },
    pause: { label: t('Pause timer'), said: t('Timer paused') },
    resume: { label: t('Resume timer'), said: t('Timer resumed') },
    clear: { label: t('Clear timer'), said: t('Timer cleared') },
    log: { label: t('Log timer'), said: t('Time logged') },
};

/** "Timer paused: Thank-you notes": what a timer action says once it is done. */
function doneText(action: TimerAction, title: string): string {
    switch (action) {
        case 'start':
            return t('Timer started: {{title}}', { title });
        case 'pause':
            return t('Timer paused: {{title}}', { title });
        case 'resume':
            return t('Timer resumed: {{title}}', { title });
        case 'clear':
            return t('Timer cleared: {{title}}', { title });
        case 'log':
            return t('Time logged: {{title}}', { title });
    }
}

/** "Could not pause timer: …": what a timer action the site refuses says. */
function refusedText(action: TimerAction, error: string): string {
    switch (action) {
        case 'start':
            return t('Could not start timer: {{reason}}', { reason: error });
        case 'pause':
            return t('Could not pause timer: {{reason}}', { reason: error });
        case 'resume':
            return t('Could not resume timer: {{reason}}', { reason: error });
        case 'clear':
            return t('Could not clear timer: {{reason}}', { reason: error });
        case 'log':
            return t('Could not log timer: {{reason}}', { reason: error });
    }
}

/** Runs a timer action: the result or the refusal said; clearing asks first (its time is lost). */
export function useTimerAction(announce: (text: string) => void) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    return async (task: Pick<Task, 'id' | 'title'>, action: TimerAction) => {
        if (action === 'clear' && !(await confirmAction({ title: t('Clear this timer?'), message: t('The time it counted is not logged and is lost.'), okLabel: t('Clear') }))) return;
        try {
            await timerAction(api, queryClient, task, action);
            announce(doneText(action, task.title));
        } catch (e) {
            announce(refusedText(action, errorMessage(e)));
        }
    };
}

/**
 * My timers (the site's My Timers): the tasks one has a timer on, the running one first, each
 * with its count (ticking while it runs; said once, not every second), Pause or Resume, Log (adds
 * what it counted as time on the task) and Clear. Starting one pauses the others, as on the site.
 */
export function MyTimers() {
    const { api } = useApp();
    const route = useRoute();
    const queryClient = useQueryClient();
    const { openDetail } = useNavigation();
    const [announcement, announce] = useAnnouncer();
    const run = useTimerAction(announce);
    const timers = useQuery({ queryKey: TIMERS_KEY, queryFn: async (): Promise<TaskTimers> => unwrap(await api.GET('/me/timers')) });
    const items = timers.data?.items ?? [];
    const running = items.some((task) => task.timer?.state === 'running');
    const now = useNow(running);
    const at = timers.dataUpdatedAt;
    const selectedId = route.detail?.kind === 'task' ? route.detail.id : null;
    const total = items.reduce((s, task) => s + timerSeconds(task.timer, at, now), 0);
    return (
        <Pane pane="list" title={t('My timers')} subtitle={items.length ? t('{{time}} in all', { time: timerText(total) }) : undefined} ready={!timers.isLoading} busy={timers.isLoading}>
            <div className="column">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                <SkeletonRows loading={timers.isLoading} />
                {timers.isError ? <InlineError message={errorMessage(timers.error)} onRetry={() => void timers.refetch()} busy={timers.isFetching} /> : null}
                <EmptyState shown={timers.isSuccess && !items.length} icon="timer" title={t('No timers')} hint={t('Start a timer on a task you work on: its time goes on the task when you log it.')} />
                {items.length ? (
                    <ul className="list rows timer-list" aria-label={t('Your timers, the running one first')}>
                        {items.map((task) => {
                            const seconds = timerSeconds(task.timer, at, now);
                            const isRunning = task.timer?.state === 'running';
                            return (
                                <li key={task.id} className="list-row timer-row" data-selected={selectedId === task.id || undefined} data-running={isRunning || undefined}>
                                    <span className="timer-icon" aria-hidden="true">
                                        <Icon name={isRunning ? 'timer' : 'pause'} size={18} />
                                    </span>
                                    <div className="list-main">
                                        <button
                                            type="button"
                                            className="profile-link strong task-title"
                                            aria-current={selectedId === task.id ? 'true' : undefined}
                                            onClick={() => {
                                                if (!queryClient.getQueryData(taskKey(task.id))) queryClient.setQueryData(taskKey(task.id), task, { updatedAt: 0 });
                                                openDetail({ kind: 'task', id: task.id });
                                            }}
                                        >
                                            <bdi>{task.title}</bdi>
                                            <span className="sr-only">{`, ${isRunning ? t('running') : t('paused')}, ${durationWords(seconds)}${task.context ? `, ${t('in {{place}}', { place: task.context.display_name })}` : ''}`}</span>
                                        </button>
                                        {task.context ? (
                                            <span className="row-sub" aria-hidden="true">
                                                <bdi className="truncate">
                                                    {task.context.display_name}
                                                    {task.list_title ? ` · ${task.list_title}` : ''}
                                                </bdi>
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="timer-controls">
                                        <span className="timer-count" aria-hidden="true">
                                            {timerText(seconds)}
                                        </span>
                                        <button type="button" className="btn" onClick={() => void run(task, isRunning ? 'pause' : 'resume')} aria-label={isRunning ? t('Pause timer: {{title}}', { title: task.title }) : t('Resume timer: {{title}}', { title: task.title })}>
                                            <Icon name={isRunning ? 'pause' : 'play'} size={16} />
                                            <span>{isRunning ? t('Pause') : t('Resume')}</span>
                                        </button>
                                        <button type="button" className="btn" onClick={() => void run(task, 'log')} aria-label={t('Log timer: {{title}}', { title: task.title })}>
                                            {t('Log')}
                                        </button>
                                        <button type="button" className="btn" onClick={() => void run(task, 'clear')} aria-label={t('Clear timer: {{title}}', { title: task.title })}>
                                            {t('Clear')}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </div>
        </Pane>
    );
}
