/** Shared task status / priority presentation for lists and filters. */

import { appSetting } from 'app/lib/util';

export const TASK_STATUS_ORDER = [
    'In Review',
    'In Progress',
    'Todo',
    'Duplicate',
    'Done',
    'Cancelled',
    'Backlog',
];

export const TASK_PRIORITY_ORDER = [
    'urgent',
    'highest',
    'high',
    'medium',
    'normal',
    'low',
    'lowest',
];

const STATUS_ICONS: Record<string, string> = {
    backlog: 'CircleDashed',
    todo: 'Circle',
    'in progress': 'CircleDot',
    'in review': 'Eye',
    cancelled: 'CircleSlash',
    canceled: 'CircleSlash',
    duplicate: 'Copy',
    done: 'CircleCheck',
    completed: 'CircleCheck',
};

export function normalizeTaskLabel(value: any) {
    return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

export function iconForTaskStatus(state: any) {
    const key = normalizeTaskLabel(state);
    return STATUS_ICONS[key] || 'CircleDashed';
}

export function iconForTaskPriority(priority: any) {
    const key = normalizeTaskLabel(priority);
    const mapped = key ? appSetting('tasks', 'priority_icons', key) : '';
    return mapped || appSetting('tasks', 'priority_icon_fallback') || 'Flag';
}

/** UNA browse marks completion with `completed` / `class`; status can stay stale. */
export function isTaskCompleted(task: any) {
    if (!task || typeof task !== 'object') return false;
    if (task.completed === 1 || task.completed === true) return true;
    const className = String(task.class || '').toLowerCase();
    if (className === 'completed') return true;
    const status = normalizeTaskLabel(task.state || task.status);
    if (status === 'done' || status === 'completed') return true;
    return false;
}


export function canonicalTaskStatus(state: any) {
    const key = normalizeTaskLabel(state);
    const known = TASK_STATUS_ORDER.find((item) => normalizeTaskLabel(item) === key);
    return known || (state ? String(state) : 'Todo');
}

export function statusSortIndex(state: any) {
    const key = normalizeTaskLabel(state);
    const index = TASK_STATUS_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_STATUS_ORDER.length + 1 : index;
}

export function prioritySortIndex(priority: any) {
    const key = normalizeTaskLabel(priority);
    const index = TASK_PRIORITY_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_PRIORITY_ORDER.length + 1 : index;
}

/** UNA estimate is story points. One point is one hour. */
export const TASK_ESTIMATE_SECONDS_PER_POINT = 3600;

const CLOCK_RE = /(\d{1,}:\d{2}(?::\d{2})?)/;

type ClockParts = { hours: number; minutes: number; seconds: number };

/** "H:MM[:SS]", "MM", or { hours, minutes, seconds } → parts; null when empty/invalid. */
function clockParts(value: any): ClockParts | null {
    if (value == null || value === '') return null;
    if (typeof value === 'object' && !Array.isArray(value)) {
        const hours = Number(value.hours) || 0;
        const minutes = Number(value.minutes) || 0;
        const seconds = Number(value.seconds) || 0;
        if (!hours && !minutes && !seconds && value.hours == null && value.minutes == null) {
            return null;
        }
        return { hours, minutes, seconds };
    }
    const parts = String(value).split(':').map(Number);
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length >= 3) return { hours: parts[0]!, minutes: parts[1]!, seconds: parts[2]! };
    if (parts.length === 2) return { hours: parts[0]!, minutes: parts[1]!, seconds: 0 };
    return { hours: 0, minutes: parts[0]!, seconds: 0 };
}

export function clockToSeconds(value: any) {
    const parts = clockParts(value);
    if (!parts) return null;
    return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
}

function secondsPerPoint() {
    const configured = Number(appSetting('tasks', 'estimate_seconds_per_point'));
    return Number.isFinite(configured) && configured > 0
        ? configured
        : TASK_ESTIMATE_SECONDS_PER_POINT;
}

/**
 * Estimate clocks are points, not logged time.
 * `4` / `00:04` → 4 points → 4 hours. `04:00` is already 4 hours.
 */
export function estimateToSeconds(value: any) {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value * secondsPerPoint();
    }
    const text = String(value).trim();
    if (/^\d+(?:\.\d+)?$/.test(text)) {
        return Number(text) * secondsPerPoint();
    }
    const parts = clockParts(text);
    if (!parts) return null;
    if (parts.hours === 0 && parts.seconds === 0 && parts.minutes > 0) {
        return parts.minutes * secondsPerPoint();
    }
    return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
}

function clockToMinutes(value: any) {
    const seconds = clockToSeconds(value);
    return seconds == null ? null : seconds / 60;
}

export function formatTaskClock(totalSeconds: number, { showSeconds = false }: { showSeconds?: boolean } = {}) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    const hm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return showSeconds ? `${hm}:${String(seconds).padStart(2, '0')}` : hm;
}

/**
 * UNA browse API sends one preformatted `time` string:
 * `Total: 06:24 (06:25) Estimate: 04:00`
 *
 * Brackets are not a running flag — paused tasks often differ by a minute.
 * Live start/pause comes from the timer session store, not this string.
 * Estimate is points (1 point = 1 hour), sometimes encoded as `00:04`.
 */
/** UNA task `time`: "logged / estimate" string, a clock string, or a { hours, minutes, seconds } object. */
export function parseTaskTime(raw: any) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw.hours != null || raw.minutes != null || raw.seconds != null)) {
        const loggedSeconds = clockToSeconds(raw) ?? 0;
        return {
            logged: formatTaskClock(loggedSeconds, { showSeconds: true }),
            estimate: null,
            running: null,
            loggedMinutes: loggedSeconds / 60,
            estimateMinutes: null,
            loggedSeconds,
            runningSeconds: null,
            estimateSeconds: null,
            currentSeconds: loggedSeconds,
            isRunning: false,
        };
    }

    const text = String(raw || '').trim();
    if (!text) {
        return {
            logged: null,
            estimate: null,
            running: null,
            loggedMinutes: null,
            estimateMinutes: null,
            loggedSeconds: null,
            runningSeconds: null,
            estimateSeconds: null,
            currentSeconds: 0,
            isRunning: false,
        };
    }

    const totalMatch = text.match(/Total:\s*(\d{1,}:\d{2}(?::\d{2})?)/i);
    const estimateMatch = text.match(/Estimate:\s*(\d{1,}:\d{2}(?::\d{2})?|\d+)/i);
    const runningMatch = text.match(/\((\d{1,}:\d{2}(?::\d{2})?)\)/);
    const unlabeled = text.replace(/\(\d{1,}:\d{2}(?::\d{2})?\)/g, '').match(CLOCK_RE);

    const logged = totalMatch?.[1] ?? null;
    const running = runningMatch?.[1] ?? null;
    const estimate = estimateMatch?.[1] ?? (!totalMatch && !running ? unlabeled?.[1] : null) ?? null;

    const loggedSeconds = clockToSeconds(logged);
    const runningSeconds = clockToSeconds(running);
    const estimateSeconds = estimateToSeconds(estimate);
    const currentSeconds = loggedSeconds ?? 0;

    return {
        logged,
        estimate,
        running,
        loggedMinutes: loggedSeconds == null ? null : loggedSeconds / 60,
        estimateMinutes: estimateSeconds == null ? null : estimateSeconds / 60,
        loggedSeconds,
        runningSeconds,
        estimateSeconds,
        currentSeconds,
        isRunning: false,
    };
}
