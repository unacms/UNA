import { useEffect, useState } from 'react';
import emitter, { EVENTS } from 'app/context/emitter';
import { fetcher } from 'app/lib/fetcher';
import { clockToSeconds } from 'app/lib/tasks-meta';

export const TASK_TIMER_SYNC_EVENT = EVENTS.taskTimerSync;

const sessions = new Map();

/** `bx_tasks/process_timer/&params[]=reload&params[]={taskId}&params[]={context}` */
export function parseTimerContentId(requestUrl: string | null | undefined) {
    const values = [...String(requestUrl || '').matchAll(/params\[\]=([^&]*)/g)]
        .map((match) => decodeURIComponent(match[1] || ''));
    const taskId = values[1];
    if (taskId == null || taskId === '' || taskId === 'reload') return null;
    return taskId;
}

export function getTaskTimerSession(taskId: number | string | null | undefined) {
    if (taskId == null || taskId === '') return null;
    return sessions.get(String(taskId)) || null;
}

function emitSession(session: any) {
    emitter.emit(TASK_TIMER_SYNC_EVENT, session);
}

export function setTaskTimerSession(partial: any) {
    const taskId = partial.taskId != null && partial.taskId !== ''
        ? String(partial.taskId)
        : parseTimerContentId(partial.requestUrl);
    if (!taskId) return null;

    const prev = sessions.get(taskId) || {};
    const next = {
        ...prev,
        ...partial,
        taskId,
        state: partial.state ?? prev.state ?? null,
        seconds: partial.seconds ?? prev.seconds ?? 0,
    };
    sessions.set(taskId, next);
    if (next.timerId != null) sessions.set(`timer:${next.timerId}`, next);
    emitSession(next);
    return next;
}

export function publishTimerSession({
    requestUrl,
    timerId,
    state,
    time,
    action,
    taskId,
}: { requestUrl?: string; timerId?: any; state?: any; time?: any; action?: any; taskId?: any } = {}) {
    const contentId = taskId ?? parseTimerContentId(requestUrl);
    if (contentId == null) return null;

    const actionKey = String(action || '').toLowerCase();
    const nextState = state
        || (actionKey === 'start' || actionKey === 'resume' ? 'started' : null)
        || (['pause', 'stop', 'log', 'clear'].includes(actionKey) ? 'paused' : null);

    if (nextState === 'started') {
        for (const [key, session] of sessions) {
            if (key.startsWith('timer:')) continue;
            if (String(session.taskId) === String(contentId)) continue;
            if (session.state !== 'started') continue;
            const paused = { ...session, state: 'paused' };
            sessions.set(String(session.taskId), paused);
            emitSession(paused);
        }
    }

    return setTaskTimerSession({
        taskId: contentId,
        requestUrl,
        timerId,
        state: nextState,
        seconds: actionKey === 'log' || actionKey === 'clear'
            ? 0
            : (clockToSeconds(time) ?? 0),
    });
}

export function ingestTimersFromPage(payload: any) {
    const seen = new Set();
    const walk = (node: any) => {
        if (!node || typeof node !== 'object' || seen.has(node)) return;
        seen.add(node);
        if (Array.isArray(node.timers)) {
            for (const item of node.timers) {
                if (!item?.timer) continue;
                publishTimerSession({
                    requestUrl: item.timer.request_url,
                    timerId: item.timer.id,
                    state: item.timer.state,
                    time: item.timer.time,
                    taskId: parseTimerContentId(item.timer.request_url),
                });
            }
        }
        const values = Array.isArray(node) ? node : Object.values(node);
        for (const value of values) walk(value);
    };
    walk(payload?.data || payload);
}

let loadPromise: Promise<any> | null = null;

export async function loadTaskTimerSessions() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        try {
            const response = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=tasks-timers');
            ingestTimersFromPage(response);
        } catch {
            // Browse rows still render from the time string; live state stays unknown.
        } finally {
            loadPromise = null;
        }
    })();
    return loadPromise;
}

export function useTaskTimerSession(taskId: number | string | null | undefined) {
    const [session, setSession] = useState(() => getTaskTimerSession(taskId));

    useEffect(() => {
        const apply = (next: any) => {
            if (next == null || String(next.taskId) !== String(taskId)) return;
            setSession(next);
        };
        apply(getTaskTimerSession(taskId));
        const subscription = emitter.addListener(TASK_TIMER_SYNC_EVENT, apply);
        return () => subscription.remove();
    }, [taskId]);

    return taskId == null ? null : session;
}
