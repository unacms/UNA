/** Shared task status / priority presentation for lists and filters. */

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

const STATUS_ICONS = {
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

export function normalizeTaskLabel(value) {
    return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

export function iconForTaskStatus(state) {
    const key = normalizeTaskLabel(state);
    return STATUS_ICONS[key] || 'CircleDashed';
}

export function iconForTaskPriority() {
    return 'Flag';
}

export function canonicalTaskStatus(state) {
    const key = normalizeTaskLabel(state);
    const known = TASK_STATUS_ORDER.find((item) => normalizeTaskLabel(item) === key);
    return known || (state ? String(state) : 'Todo');
}

export function statusSortIndex(state) {
    const key = normalizeTaskLabel(state);
    const index = TASK_STATUS_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_STATUS_ORDER.length + 1 : index;
}

export function prioritySortIndex(priority) {
    const key = normalizeTaskLabel(priority);
    const index = TASK_PRIORITY_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_PRIORITY_ORDER.length + 1 : index;
}
