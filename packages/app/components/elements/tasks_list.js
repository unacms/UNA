import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse_simple';
import { getComponent } from 'app/components/registry';
import { Button, Modal } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import CheckBox from 'app/ui/atoms/checkbox';
import { Icon } from 'app/ui/atoms/icon';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { appSetting, cn, getLayoutName, getPageData } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import emitter from 'app/context/emitter';
import Confirm from 'app/ui/molecules/confirm';
import { isFormResponseComplete } from 'app/lib/form-helpers';
import { Loading } from 'app/customization/loading';


const TASKS_LIST_EVENT = 'tasks_list';
const isWeb = Platform.OS === 'web';

const TASK_STATUS_ORDER = [
    'In Review',
    'In Progress',
    'Todo',
    'Duplicate',
    'Done',
    'Cancelled',
    'Backlog',
];

const TASK_PRIORITY_ORDER = [
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

function normalizeTaskLabel(value) {
    return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function iconForTaskStatus(state) {
    const key = normalizeTaskLabel(state);
    return STATUS_ICONS[key] || 'CircleDashed';
}

function canonicalTaskStatus(state) {
    const key = normalizeTaskLabel(state);
    const known = TASK_STATUS_ORDER.find((item) => normalizeTaskLabel(item) === key);
    return known || (state ? String(state) : 'Todo');
}

function statusSortIndex(state) {
    const key = normalizeTaskLabel(state);
    const index = TASK_STATUS_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_STATUS_ORDER.length + 1 : index;
}

function prioritySortIndex(priority) {
    const key = normalizeTaskLabel(priority);
    const index = TASK_PRIORITY_ORDER.findIndex((item) => normalizeTaskLabel(item) === key);
    return index === -1 ? TASK_PRIORITY_ORDER.length + 1 : index;
}

function normalizeBrowserPath(url) {
    if (!url) return '';
    const path = String(url).split('?')[0].split('#')[0];
    return '/' + path.replace(/^\/+/, '');
}

function getBrowserLocation() {
    if (!isWeb || typeof window === 'undefined') return '';
    return window.location.pathname + window.location.search;
}

function TaskPageView({ pageData, url }) {
    const PostLayout = getComponent('layout', 'post');
    const { layoutBlocks } = getLayoutName(pageData, 'item');
    const blocks = layoutBlocks || appSetting('layouts', pageData?.uri)?.blocks;

    if (!PostLayout) return null;

    return (
        <PostLayout
            url={url}
            layoutName="post"
            data={pageData}
            blocks={blocks}
        />
    );
}

function filterDropdownItems(filters) {
    return (filters?.values || [])
        .map((item, index) => {
            if (item?.type === 'group_header') {
                return {
                    id: `group-${item.value}-${index}`,
                    type: 'group_header',
                    title: item.value,
                };
            }

            if (item?.key == null) return null;

            return {
                id: item.key,
                name: String(item.key),
                title: item.value,
            };
        })
        .filter(Boolean);
}

function getSelectableFilterItems(items) {
    return items.filter((item) => item.type !== 'group_header');
}

function actionsToDropdownItems(actions = []) {
    return actions.map((action) => ({
        id: action.name,
        name: action.name,
        title: action.title || action.name,
        ...(action.icon ? { icon: action.icon } : {}),
        action,
    }));
}

function emitTasksListRefresh() {
    emitter.emit(TASKS_LIST_EVENT, { action: 'reload' });
}

function isTasksListPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (Array.isArray(payload.lists)) return true;
    if (Array.isArray(payload.tasklists) || Array.isArray(payload.task_lists)) return true;
    return !!(payload.request_url && Array.isArray(payload.actions));
}

function normalizeTasksListPayload(response, fallback) {
    const root = response?.data;
    if (!root) return fallback;

    const candidates = [];
    const collect = (node) => {
        if (!node || typeof node !== 'object') return;
        candidates.push(node);
        if (node.data) candidates.push(node.data);
        if (Array.isArray(node.content)) {
            for (const item of node.content) {
                collect(item);
            }
        }
    };

    if (Array.isArray(root)) {
        for (const item of root) collect(item);
    } else {
        collect(root);
    }

    for (const candidate of candidates) {
        if (isTasksListPayload(candidate)) {
            return { ...fallback, ...candidate };
        }
    }

    return fallback;
}

function getFormNamesFromBlock(block) {
    const content = Array.isArray(block?.content) ? block.content : [];
    return content
        .filter((item) => item?.type === 'form')
        .map((item) => item?.data?.params?.display || item?.name)
        .filter(Boolean);
}

function shouldRefreshAfterFormResponse(responseData) {
    return isFormResponseComplete(responseData);
}

function actionNeedsConfirm(action) {
    return action?.confirm == '1' || action?.confirm === 1 || action?.confirm === true;
}

function normalizeTasklistItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const id = item.id ?? item.list_id ?? item.key;
            if (id == null) return null;
            const title = item.title ?? item.list_title ?? item.name ?? item.value;
            const tasksLen = Array.isArray(item.tasks) ? item.tasks.length : null;
            const totalRaw = item.total ?? item.count ?? item.num ?? item.tasks_count ?? item.items_count ?? tasksLen;
            const total = totalRaw != null && totalRaw !== '' && !Number.isNaN(Number(totalRaw))
                ? Number(totalRaw)
                : null;
            const done = item.done ?? item.completed_count ?? item.closed;
            let progress = item.progress ?? item.progress_text;
            if (!progress && total != null && done != null && Number(total) > 0) {
                const pct = item.percent ?? item.percentage
                    ?? Math.round((Number(done) / Number(total)) * 100);
                progress = `${pct}% of ${total}`;
            }
            return {
                id,
                title: title != null ? String(title) : String(id),
                count: total,
                progress: progress != null ? String(progress) : null,
                completed: !!(item.completed || item.is_completed || item.closed || pctIsComplete(progress)),
                actions: item.actions,
            };
        })
        .filter(Boolean);
}

function pctIsComplete(progress) {
    if (typeof progress !== 'string') return false;
    return /^100\s*%/.test(progress.trim());
}

function extractDedicatedTasklists(payload) {
    if (!payload || typeof payload !== 'object') return [];
    return normalizeTasklistItems(
        payload.tasklists
        || payload.task_lists
        || payload.lists_nav
        || payload.milestones
    );
}

function extractTasklists(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const dedicated = extractDedicatedTasklists(payload);
    if (dedicated.length) return dedicated;

    // Fallback: navigable lists when browse_context filtering is available
    if (
        payload.request_url_browse_context
        || payload.request_url_tasklist
        || payload.tasklists_request_url
        || extractContextId(payload) != null
    ) {
        return normalizeTasklistItems(payload.lists);
    }

    return [];
}

function extractContextId(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (payload.context_id != null) return payload.context_id;
    if (payload.context != null && (typeof payload.context === 'string' || typeof payload.context === 'number')) {
        return payload.context;
    }
    if (payload.profile_id != null) return payload.profile_id;

    const url = payload.request_url || payload.request_url_browse_context || '';
    if (!url) return null;

    const numericParams = [...String(url).matchAll(/params\[\]=(\d+)/g)].map((m) => m[1]);
    if (numericParams.length) return numericParams[0];

    try {
        const jsonMatch = String(url).match(/params\[\]=(\{[^&]+\})/);
        if (jsonMatch?.[1]) {
            const parsed = JSON.parse(decodeURIComponent(jsonMatch[1]));
            return parsed?.context_id ?? parsed?.context ?? parsed?.id ?? null;
        }
    } catch {
        // ignore malformed JSON in request_url
    }

    return null;
}

function encodeListBrowseParam(tasklistId) {
    const numeric = Number(tasklistId);
    const listValue = Number.isFinite(numeric) && String(numeric) === String(tasklistId).trim()
        ? numeric
        : String(tasklistId);
    const json = typeof listValue === 'number'
        ? `{"list":${listValue}}`
        : `{"list":${JSON.stringify(listValue)}}`;
    // Match browse-style encoding: params%5B%5D=%7B"list":29%7D
    return json.replaceAll('{', '%7B').replaceAll('}', '%7D');
}

function buildTasklistBrowseUrl(payload, tasklistId) {
    if (tasklistId == null) return null;

    const listParam = encodeListBrowseParam(tasklistId);

    const template = payload?.request_url_browse_context
        || payload?.request_url_tasklist
        || payload?.tasklists_request_url;
    if (template) {
        return template.includes('{id}')
            ? template.replace('{id}', listParam)
            : template + listParam;
    }

    const contextId = extractContextId(payload);
    if (contextId == null) return null;

    const module = String(payload?.request_url || 'bx_tasks').split('/')[0] || 'bx_tasks';
    return `${module}/browse_context&params[]=${contextId}&params[]=${listParam}`;
}

function groupTasksByStatus(lists = []) {
    const allTasks = lists.flatMap((list) => (
        Array.isArray(list?.tasks) ? list.tasks : []
    ));
    if (!allTasks.length) return [];

    const groups = new Map();
    for (const task of allTasks) {
        const title = canonicalTaskStatus(task?.state || task?.status);
        if (!groups.has(title)) groups.set(title, []);
        groups.get(title).push(task);
    }

    return [...groups.entries()]
        .map(([list_title, tasks]) => ({
            list_id: `status-${normalizeTaskLabel(list_title).replace(/\s+/g, '-')}`,
            list_title,
            tasks: tasks.toSorted((a, b) => {
                const byPriority = prioritySortIndex(a?.priority) - prioritySortIndex(b?.priority);
                if (byPriority !== 0) return byPriority;
                return String(a?.title || '').localeCompare(String(b?.title || ''));
            }),
        }))
        .toSorted((a, b) => statusSortIndex(a.list_title) - statusSortIndex(b.list_title));
}

async function runTaskAction(action, { setFormBlock, refreshLists, setShowConfirm }) {
    if (!action) return;

    if (action.type === 'modal') {
        const fetchedData = await fetcher('/api.php?r=' + action.callback);
        setFormBlock({
            content: fetchedData.data,
            designbox_id: 0,
            title: action.title,
        });
        return;
    }

    if (action.type === 'callback') {
        const execute = async () => {
            await fetcher('/api.php?r=' + action.callback);
            await refreshLists?.();
            emitTasksListRefresh();
        };

        if (actionNeedsConfirm(action)) {
            setShowConfirm?.({
                show: true,
                title: action.title || action.confirm_text || 'Are you sure?',
                cb: execute,
            });
            return;
        }

        await execute();
    }
}

function TaskActionsDropdown({ actions, setFormBlock, refreshLists, setShowConfirm }) {
    const items = useMemo(() => actionsToDropdownItems(actions), [actions]);

    if (!items.length) return null;

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => runTaskAction(item.action, { setFormBlock, refreshLists, setShowConfirm })}
        >
            <Button variant="text" size="sm" rounded startDecorator="Ellipsis" />
        </DropdownMenu>
    );
}

function MenuObjectActions({ actions, refreshLists, setShowConfirm }) {
    const menuItems = useMemo(
        () => (actions || []).flatMap((action) => (Array.isArray(action?.items) ? action.items : [])),
        [actions]
    );

    const onMenuItemPress = useCallback(async (item) => {
        const callbackUrl = item?.data?.request_url || item?.callback;
        if (!callbackUrl) return;

        const execute = async () => {
            await fetcher('/api.php?r=' + callbackUrl);
            if (item?.data?.on_callback === 'refresh' || item?.on_callback === 'refresh') {
                await refreshLists?.();
                emitTasksListRefresh();
            }
        };

        if (actionNeedsConfirm(item?.data || item)) {
            setShowConfirm?.({
                show: true,
                title: item?.title || item?.data?.confirm_text || 'Are you sure?',
                cb: execute,
            });
            return;
        }

        await execute();
    }, [refreshLists, setShowConfirm]);

    if (!menuItems.length) return null;

    return (
        <>
            {menuItems.map((item, index) => (
                <Button
                    key={item?.id || item?.name || `menu-item-${index}`}
                    size="sm"
                    title={item?.title || item?.name}
                    onPress={() => onMenuItemPress(item)}
                />
            ))}
        </>
    );
}

function TasklistsPanel({
    tasklists,
    selectedId,
    onSelect,
    setFormBlock,
    refreshLists,
    setShowConfirm,
    t,
}) {
    if (!tasklists.length) return null;

    return (
        <View className="w-full lg:w-72 shrink-0 gap-0.5">
            <Row className="items-center justify-between gap-2 px-2 py-1.5">
                <Text className="text-base font-semibold text-foreground shrink-0">
                    {t('Tasklists')}
                </Text>
            </Row>

            {tasklists.map((item) => {
                const selected = selectedId != null && String(selectedId) === String(item.id);
                return (
                    <Row
                        key={item.id}
                        className={cn(
                            'items-center gap-1 rounded-lg pr-1',
                            selected && 'bg-muted/60'
                        )}
                    >
                        <Pressable
                            onPress={() => onSelect(item)}
                            className="min-w-0 flex-1 flex-row items-center gap-2 px-2 py-2 web:hover:bg-muted/50 rounded-lg"
                        >
                            <Icon
                                icon="Circle"
                                size={10}
                                className={cn(
                                    'shrink-0',
                                    selected
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                )}
                                fill={selected ? 'currentColor' : 'none'}
                            />
                            <Text
                                className="min-w-0 flex-1 text-sm font-medium text-card-foreground"
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            {item.count != null ? (
                                <Text className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {item.count}
                                </Text>
                            ) : null}
                        </Pressable>

                        {item.actions?.length ? (
                            <TaskActionsDropdown
                                actions={item.actions}
                                setFormBlock={setFormBlock}
                                refreshLists={refreshLists}
                                setShowConfirm={setShowConfirm}
                            />
                        ) : null}
                    </Row>
                );
            })}
        </View>
    );
}


const SKIP_INPUTS = new Set(['save_me', 'save_all', 'title', 'controls', 'csrf_token', 'csrf']);
const MULTI_TYPES = new Set(['checkbox_set', 'select_multiple', 'selector']);
/** Author / assignee always open as checkbox lists (Linear-style), even if UNA sends radio_set. */
const FORCE_MULTI_FIELDS = /(author|assignee|member|assign|owner)/i;

const FIELD_ICONS = [
    { match: /(author|assignee|owner)/i, icon: 'User' },
    { match: /(member|assign)/i, icon: 'Users' },
    { match: /(state|status)/i, icon: 'CircleDashed' },
    { match: /(type|label)/i, icon: 'Tag' },
    { match: /priority/i, icon: 'Flag' },
    { match: /(estimate|hour|time)/i, icon: 'Clock' },
    { match: /(start|begin)/i, icon: 'Calendar' },
    { match: /(end|due|deadline)/i, icon: 'CalendarDays' },
    { match: /title|name/i, icon: 'Type' },
];

function iconForField(name = '', caption = '') {
    const haystack = `${name} ${caption}`;
    for (const entry of FIELD_ICONS) {
        if (entry.match.test(haystack)) return entry.icon;
    }
    return 'ListFilter';
}

function isMultiField(name, type, caption = '') {
    if (FORCE_MULTI_FIELDS.test(`${name} ${caption}`)) return true;
    return MULTI_TYPES.has(type);
}

function normalizeOptionValues(values) {
    if (values == null) return [];
    if (Array.isArray(values)) {
        return values
            .map((item) => {
                if (item == null) return null;
                if (typeof item === 'string' || typeof item === 'number') {
                    return { value: String(item), label: String(item) };
                }
                const value = item.key ?? item.value ?? item.id;
                const label = item.value ?? item.label ?? item.title ?? item.name;
                if (value == null || label == null) return null;
                return { value: String(value), label: String(label) };
            })
            .filter(Boolean);
    }
    return Object.entries(values).map(([value, label]) => ({
        value: String(value),
        label: String(label),
    }));
}

function extractFormFromResponse(response) {
    const root = response?.data;
    if (!root) return null;

    const formBlocks = [];
    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (node.type === 'form' && node.data?.inputs) {
            formBlocks.push(node);
        }
        if (node.data) walk(node.data);
        if (node.content) walk(node.content);
        if (node.inputs && (node.form_attrs || node.params)) {
            formBlocks.push({ type: 'form', data: node, ext: node.ext });
        }
    };
    walk(root);

    const block = formBlocks[0];
    if (!block?.data?.inputs) return null;

    return {
        form: block.data,
        requestUrl:
            block.ext?.request?.url
            || block.data?.ext?.request?.url
            || block.data?.params?.request?.url
            || null,
    };
}

function buildFilterableFields(inputs = {}) {
    return Object.entries(inputs)
        .filter(([name, input]) => {
            if (!input || SKIP_INPUTS.has(name)) return false;
            if (input.type === 'hidden' || input.type === 'submit' || input.type === 'reset') return false;
            if (input.type === 'input_set') return false;
            return true;
        })
        .map(([name, input]) => {
            const caption = String(input.caption || input.info || name).replace(/<[^>]+>/g, '');
            const options = normalizeOptionValues(input.values);
            return {
                id: name,
                name,
                caption,
                type: input.type || 'text',
                multi: isMultiField(name, input.type, caption),
                options,
                icon: iconForField(name, caption),
            };
        });
}

function appendFormValue(formData, key, value) {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
        const joined = value
            .filter((item) => item != null && item !== '')
            .map(String)
            .join(',');
        if (!joined) return;
        formData.append(key, joined);
        return;
    }
    formData.append(key, String(value));
}

function valuesFromFilter(filter) {
    if (!filter?.values?.length) return [];
    return filter.values.map((item) => String(item.value));
}

function FilterRow({ icon, label, selected, showArrow, onPress, trailing }) {
    return (
        <Pressable
            onPress={onPress}
            className={cn(
                'flex-row items-center gap-2 rounded-lg px-2 py-2 web:hover:bg-muted/50',
                selected && 'bg-muted/60'
            )}
        >
            {icon ? (
                <Icon icon={icon} size={16} className="text-muted-foreground shrink-0" />
            ) : null}
            <Text className="flex-1 text-sm font-medium text-card-foreground" numberOfLines={1}>
                {label}
            </Text>
            {trailing || null}
            {showArrow ? (
                <Icon icon="ArrowRight" size={16} className="text-muted-foreground shrink-0" />
            ) : null}
        </Pressable>
    );
}

function ChipDivider() {
    return <View className="w-px self-stretch bg-border/70" />;
}

function ActiveFilterChip({ filter, onEdit, onToggleOperator, onRemove, t }) {
    const count = filter.values?.length || 0;
    const operator = filter.reverse
        ? (count > 1 ? t('is none of') : t('is not'))
        : (count > 1 ? t('is any of') : t('is'));
    const valueLabel = count === 1
        ? filter.values[0].label
        : `${count} ${filter.caption}`;

    return (
        <Row className="h-8 items-center rounded-full border border-border bg-background overflow-hidden shrink-0">
            <Pressable
                onPress={onEdit}
                className="flex-row items-center gap-1.5 px-2.5 h-full web:hover:bg-muted/40"
            >
                <Icon icon={filter.icon || 'ListFilter'} size={14} className="text-muted-foreground" />
                <Text className="text-xs font-medium text-foreground">{filter.caption}</Text>
            </Pressable>

            <ChipDivider />

            <Pressable onPress={onToggleOperator} className="px-2.5 h-full justify-center web:hover:bg-muted/40">
                <Text className="text-xs text-muted-foreground">{operator}</Text>
            </Pressable>

            <ChipDivider />

            <Pressable
                onPress={onEdit}
                className="flex-row items-center gap-1.5 px-2.5 h-full web:hover:bg-muted/40 max-w-[160px]"
            >
                <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
                    {valueLabel}
                </Text>
            </Pressable>

            <ChipDivider />

            <Pressable
                onPress={onRemove}
                accessibilityLabel={t('Remove')}
                className="h-full w-8 items-center justify-center web:hover:bg-muted/40"
            >
                <Icon icon="X" size={14} className="text-muted-foreground" />
            </Pressable>
        </Row>
    );
}

function TasksFilterSelector({
    requestUrlAdd,
    requestUrlApply,
    requestUrlSave,
    savedFilterId,
    filterSelectionNonce = 0,
    onApplied,
    onSave,
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formMeta, setFormMeta] = useState(null);
    const [fieldsCache, setFieldsCache] = useState([]);
    const [activeFieldId, setActiveFieldId] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);
    const syncTimerRef = useRef(null);
    const activeFiltersRef = useRef(activeFilters);
    activeFiltersRef.current = activeFilters;

    const isSavedFilterSelected = savedFilterId != null
        && savedFilterId !== ''
        && savedFilterId !== 0
        && savedFilterId !== '0';

    const fields = useMemo(() => {
        if (formMeta?.form?.inputs) {
            return buildFilterableFields(formMeta.form.inputs);
        }
        return fieldsCache;
    }, [formMeta?.form?.inputs, fieldsCache]);

    const activeField = fields.find((field) => field.id === activeFieldId);

    const visibleFields = useMemo(
        () => fields.filter(
            (field) => !activeFilters.some((filter) => filter.columnId === field.id)
                || field.id === activeFieldId
        ),
        [fields, activeFilters, activeFieldId]
    );

    const resetView = useCallback(() => {
        setActiveFieldId(null);
        setError(null);
    }, []);

    const prevSavedFilterIdRef = useRef(savedFilterId);
    // When a saved filter is chosen from the dropdown, drop ad-hoc chips.
    useEffect(() => {
        const prev = prevSavedFilterIdRef.current;
        prevSavedFilterIdRef.current = savedFilterId;
        if (prev === savedFilterId) return;
        if (!isSavedFilterSelected) return;
        setActiveFilters([]);
        setOpen(false);
        resetView();
    }, [savedFilterId, isSavedFilterSelected, resetView]);

    // Reselecting the same saved filter (or applying from dropdown) also clears chips.
    const prevSelectionNonceRef = useRef(filterSelectionNonce);
    useEffect(() => {
        if (filterSelectionNonce === prevSelectionNonceRef.current) return;
        prevSelectionNonceRef.current = filterSelectionNonce;
        if (!filterSelectionNonce) return;
        setActiveFilters([]);
        setOpen(false);
        resetView();
    }, [filterSelectionNonce, resetView]);

    const resolveSubmitUrl = useCallback((extractedUrl) => {
        if (extractedUrl) return extractedUrl;
        if (!requestUrlAdd) return null;
        return requestUrlAdd.startsWith('/api.php')
            ? requestUrlAdd
            : '/api.php?r=' + requestUrlAdd;
    }, [requestUrlAdd]);

    const loadForm = useCallback(async () => {
        if (!requestUrlAdd) return null;
        setLoading(true);
        setError(null);
        try {
            const url = requestUrlAdd.startsWith('/api.php')
                ? requestUrlAdd
                : '/api.php?r=' + requestUrlAdd;
            const response = await fetcher(url);
            const extracted = extractFormFromResponse(response);
            if (!extracted?.form) {
                setError(t('Unable to load filter fields'));
                setFormMeta(null);
                return null;
            }
            const nextFields = buildFilterableFields(extracted.form.inputs);
            setFieldsCache(nextFields);
            const meta = {
                form: extracted.form,
                submitUrl: resolveSubmitUrl(extracted.requestUrl),
            };
            setFormMeta(meta);
            return meta;
        } catch {
            setError(t('Unable to load filter fields'));
            setFormMeta(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [requestUrlAdd, resolveSubmitUrl, t]);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(resetView, 150);
            return () => clearTimeout(timer);
        }
        if (!formMeta) {
            loadForm();
        }
    }, [open, formMeta, loadForm, resetView]);

    useEffect(() => () => {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    }, []);

    const syncFiltersToServer = useCallback(async (nextFilters, meta) => {
        const formBundle = meta || formMeta;
        if (!formBundle?.submitUrl || !formBundle?.form) return false;

        // Temporary apply only — never send save_me / save_all.
        if (!nextFilters.length) {
            if (requestUrlApply) {
                await fetcher('/api.php?r=' + requestUrlApply + '0');
                await onApplied?.();
            }
            return true;
        }

        const formData = new FormData();
        const inputs = formBundle.form.inputs || {};
        const valuesByField = Object.fromEntries(
            nextFilters.map((filter) => [filter.columnId, valuesFromFilter(filter)])
        );

        Object.entries(inputs).forEach(([name, input]) => {
            if (!input || input.type === 'submit' || input.type === 'reset' || input.type === 'input_set') {
                return;
            }
            if (name === 'controls' || name === 'save_me' || name === 'save_all' || name === 'title') {
                return;
            }

            if (Object.prototype.hasOwnProperty.call(valuesByField, name)) {
                appendFormValue(formData, name, valuesByField[name]);
                return;
            }

            if (input.type === 'hidden' && input.value != null) {
                appendFormValue(formData, name, input.value);
            }
        });

        nextFilters.forEach((filter) => {
            if (filter.reverse) {
                formData.append(`${filter.columnId}_reverse`, '1');
            }
        });

        formData.append('do_apply', '1');

        const response = await fetcher([formBundle.submitUrl, '', formData]);
        if (response?.error || (typeof response?.data === 'string' && response.data.includes('Fatal error'))) {
            return false;
        }
        if (response?.data && !isFormResponseComplete(response.data) && Array.isArray(response.data)) {
            const hasMsg = response.data.some((item) => item?.type === 'msg');
            const hasForm = response.data.some((item) => item?.type === 'form');
            if (hasMsg && hasForm) return false;
        }

        await onApplied?.();
        return true;
    }, [formMeta, onApplied, requestUrlApply]);

    const scheduleSync = useCallback((nextFilters) => {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(async () => {
            let meta = formMeta;
            if (!meta) meta = await loadForm();
            await syncFiltersToServer(nextFilters, meta);
        }, 250);
    }, [formMeta, loadForm, syncFiltersToServer]);

    const setFieldValues = useCallback((field, selectedValues) => {
        const optionsByValue = new Map(field.options.map((option) => [option.value, option]));
        const values = selectedValues.map((value) => (
            optionsByValue.get(String(value)) || { value: String(value), label: String(value) }
        ));
        const existing = activeFiltersRef.current.find((filter) => filter.columnId === field.id);

        let nextFilters;
        if (!values.length) {
            nextFilters = activeFiltersRef.current.filter((filter) => filter.columnId !== field.id);
        } else {
            const nextFilter = {
                columnId: field.id,
                caption: field.caption,
                icon: field.icon,
                multi: true,
                reverse: !!existing?.reverse,
                values,
            };
            nextFilters = [
                ...activeFiltersRef.current.filter((filter) => filter.columnId !== field.id),
                nextFilter,
            ];
        }

        setActiveFilters(nextFilters);
        scheduleSync(nextFilters);
    }, [scheduleSync]);

    const toggleOperator = useCallback((columnId) => {
        const nextFilters = activeFiltersRef.current.map((filter) => (
            filter.columnId === columnId
                ? { ...filter, reverse: !filter.reverse }
                : filter
        ));
        setActiveFilters(nextFilters);
        scheduleSync(nextFilters);
    }, [scheduleSync]);

    const toggleOption = useCallback((field, optionValue) => {
        const existing = activeFiltersRef.current.find((filter) => filter.columnId === field.id);
        const current = existing ? valuesFromFilter(existing) : [];
        const value = String(optionValue);
        const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];
        setFieldValues(field, next);
    }, [setFieldValues]);

    const selectField = useCallback((field) => {
        setActiveFieldId(field.id);
    }, []);

    const removeFilter = useCallback((columnId) => {
        const nextFilters = activeFiltersRef.current.filter((filter) => filter.columnId !== columnId);
        setActiveFilters(nextFilters);
        scheduleSync(nextFilters);
    }, [scheduleSync]);

    const clearFilters = useCallback(() => {
        setActiveFilters([]);
        scheduleSync([]);
        setOpen(false);
        resetView();
    }, [resetView, scheduleSync]);

    const editFilter = useCallback((filter) => {
        setOpen(true);
        setActiveFieldId(filter.columnId);
        if (!formMeta) loadForm();
    }, [formMeta, loadForm]);

    if (!requestUrlAdd) return null;

    const content = (
        <View>
            {activeField ? (
                <Row className="items-center gap-2 border-b border-border/60 px-2 py-2">
                    <Pressable
                        onPress={() => setActiveFieldId(null)}
                        className="p-1 rounded-md web:hover:bg-muted/50"
                        accessibilityLabel={t('Back')}
                    >
                        <Icon icon="ArrowLeft" size={16} className="text-muted-foreground" />
                    </Pressable>
                    <Icon icon={activeField.icon} size={16} className="text-muted-foreground" />
                    <Text className="text-sm font-medium text-foreground">{activeField.caption}</Text>
                </Row>
            ) : null}

            <View className="p-1 gap-0.5 max-h-72">
                {loading ? (
                    <View className="items-center justify-center py-8">
                        <ActivityIndicator />
                    </View>
                ) : null}

                {!loading && error ? (
                    <Text className="px-2 py-3 text-sm text-destructive">{error}</Text>
                ) : null}

                {!loading && !error && !activeField && visibleFields.length === 0 ? (
                    <Text className="px-2 py-3 text-sm text-muted-foreground">
                        {t('No results')}
                    </Text>
                ) : null}

                {!loading && !error && !activeField
                    ? visibleFields.map((field) => (
                        <FilterRow
                            key={field.id}
                            icon={field.icon}
                            label={field.caption}
                            showArrow
                            onPress={() => selectField(field)}
                        />
                    ))
                    : null}

                {!loading && !error && activeField
                    ? activeField.options.map((option) => {
                        const existing = activeFilters.find((filter) => filter.columnId === activeField.id);
                        const checked = existing
                            ? valuesFromFilter(existing).includes(option.value)
                            : false;
                        const isStateField = /(state|status)/i.test(
                            `${activeField.id} ${activeField.caption}`
                        );
                        const optionIcon = isStateField
                            ? iconForTaskStatus(option.label || option.value)
                            : null;
                        return (
                            <FilterRow
                                key={option.value}
                                icon={optionIcon}
                                label={option.label}
                                selected={checked}
                                onPress={() => toggleOption(activeField, option.value)}
                                trailing={
                                    <View pointerEvents="none">
                                        <CheckBox
                                            compact
                                            status={checked ? 'checked' : 'unchecked'}
                                        />
                                    </View>
                                }
                            />
                        );
                    })
                    : null}
            </View>
        </View>
    );

    return (
        <Row className="flex-wrap items-center gap-2">
            <DropdownPopup
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) resetView();
                }}
                contentClassName="p-0 overflow-hidden"
                trigger={
                    <Button
                        size="sm"
                        rounded={false}
                        startDecorator={activeFilters.length ? 'Plus' : 'ListFilterPlus'}
                        title={activeFilters.length ? undefined : ''}
                    />
                }
            >
                {content}
            </DropdownPopup>

            {activeFilters.map((filter) => (
                <ActiveFilterChip
                    key={filter.columnId}
                    filter={filter}
                    t={t}
                    onEdit={() => editFilter(filter)}
                    onToggleOperator={() => toggleOperator(filter.columnId)}
                    onRemove={() => removeFilter(filter.columnId)}
                />
            ))}

            {activeFilters.length > 0 && !isSavedFilterSelected ? (
                <Row className="items-center gap-1">
                    <Button
                        size="sm"
                        variant="text"
                        title={t('Clear')}
                        onPress={clearFilters}
                    />
                    {requestUrlSave ? (
                        <Button
                            size="sm"
                            variant="text"
                            title={t('Save')}
                            onPress={onSave}
                        />
                    ) : null}
                </Row>
            ) : null}
        </Row>
    );
}

export default function ElementTasksList({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const NoContent = getComponent('molecule', 'no_content');
    const [formBlock, setFormBlock] = useState(null);
    const [listsData, setListsData] = useState(data);
    const [tasklists, setTasklists] = useState(() => extractTasklists(data));
    const [selectedTasklistId, setSelectedTasklistId] = useState(
        () => data?.tasklist_id ?? data?.selected_tasklist_id ?? null
    );
    const [activeTask, setActiveTask] = useState(null);
    const [taskPageData, setTaskPageData] = useState(null);
    const [taskPageLoading, setTaskPageLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState({ show: false, title: '', cb: null });
    const [filterSelectionNonce, setFilterSelectionNonce] = useState(0);
    const requestUrlRef = useRef(data?.request_url);
    const taskRequestIdRef = useRef(0);
    const previousBrowserUrlRef = useRef(null);
    const browseContextRef = useRef({
        request_url: data?.request_url,
        request_url_browse_context: data?.request_url_browse_context,
        request_url_tasklist: data?.request_url_tasklist,
        tasklists_request_url: data?.tasklists_request_url,
        context_id: data?.context_id,
        context: data?.context,
        profile_id: data?.profile_id,
    });
    const dataRef = useRef(data);

    const openTask = useCallback((task) => {
        if (!task?.url) return;

        if (isWeb) {
            const nextPath = normalizeBrowserPath(task.url);
            const current = getBrowserLocation();
            if (!previousBrowserUrlRef.current) {
                previousBrowserUrlRef.current = current;
                if (nextPath && current !== nextPath) {
                    window.history.pushState({ tasksListTask: true }, '', nextPath);
                }
            } else if (nextPath && current !== nextPath) {
                window.history.replaceState({ tasksListTask: true }, '', nextPath);
            }
        }

        setActiveTask({
            url: task.url,
            title: task.title || task.name || '',
        });
    }, []);

    const closeTask = useCallback((options) => {
        const restoreUrl = options?.restoreUrl !== false;

        if (isWeb && restoreUrl && previousBrowserUrlRef.current) {
            window.history.replaceState(null, '', previousBrowserUrlRef.current);
        }
        previousBrowserUrlRef.current = null;

        taskRequestIdRef.current += 1;
        setActiveTask(null);
        setTaskPageData(null);
        setTaskPageLoading(false);
    }, []);

    useEffect(() => {
        if (!isWeb || !activeTask?.url) return;

        const handlePopState = () => {
            closeTask({ restoreUrl: false });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeTask?.url, closeTask]);

    useEffect(() => {
        if (!activeTask?.url) {
            setTaskPageData(null);
            setTaskPageLoading(false);
            return;
        }

        const requestId = ++taskRequestIdRef.current;
        setTaskPageLoading(true);
        setTaskPageData(null);

        getPageData(activeTask.url, false)
            .then((response) => {
                if (requestId !== taskRequestIdRef.current) return;
                setTaskPageData(response?.data || null);
            })
            .catch(() => {
                if (requestId !== taskRequestIdRef.current) return;
                setTaskPageData(null);
            })
            .finally(() => {
                if (requestId !== taskRequestIdRef.current) return;
                setTaskPageLoading(false);
            });
    }, [activeTask?.url]);

    useEffect(() => {
        if (data !== dataRef.current) {
            dataRef.current = data;
            setListsData(data);
            const nextTasklists = extractTasklists(data);
            if (nextTasklists.length) setTasklists(nextTasklists);
            if (data?.tasklist_id != null || data?.selected_tasklist_id != null) {
                setSelectedTasklistId(data.tasklist_id ?? data.selected_tasklist_id);
            }
            browseContextRef.current = {
                ...browseContextRef.current,
                request_url: data?.request_url ?? browseContextRef.current.request_url,
                request_url_browse_context: data?.request_url_browse_context ?? browseContextRef.current.request_url_browse_context,
                request_url_tasklist: data?.request_url_tasklist ?? browseContextRef.current.request_url_tasklist,
                tasklists_request_url: data?.tasklists_request_url ?? browseContextRef.current.tasklists_request_url,
                context_id: data?.context_id ?? browseContextRef.current.context_id,
                context: data?.context ?? browseContextRef.current.context,
                profile_id: data?.profile_id ?? browseContextRef.current.profile_id,
            };
        }
    }, [data]);

    useEffect(() => {
        if (selectedTasklistId != null) {
            const filteredUrl = buildTasklistBrowseUrl(browseContextRef.current, selectedTasklistId);
            if (filteredUrl) {
                requestUrlRef.current = filteredUrl;
            }
        } else {
            requestUrlRef.current = listsData?.request_url ?? data?.request_url;
        }
        if (!listsData) return;
        browseContextRef.current = {
            ...browseContextRef.current,
            request_url: listsData.request_url ?? browseContextRef.current.request_url,
            request_url_browse_context: listsData.request_url_browse_context ?? browseContextRef.current.request_url_browse_context,
            request_url_tasklist: listsData.request_url_tasklist ?? browseContextRef.current.request_url_tasklist,
            tasklists_request_url: listsData.tasklists_request_url ?? browseContextRef.current.tasklists_request_url,
            context_id: listsData.context_id ?? browseContextRef.current.context_id,
            context: listsData.context ?? browseContextRef.current.context,
            profile_id: listsData.profile_id ?? browseContextRef.current.profile_id,
        };
    }, [listsData, data?.request_url, selectedTasklistId]);

    useEffect(() => {
        // Only refresh sidebar from dedicated tasklists field — not from status lists after filter
        const dedicated = extractDedicatedTasklists(listsData);
        if (dedicated.length) setTasklists(dedicated);
        if (listsData?.tasklist_id != null || listsData?.selected_tasklist_id != null) {
            setSelectedTasklistId(listsData.tasklist_id ?? listsData.selected_tasklist_id);
        }
    }, [listsData]);

    const applyTasklistFilter = useCallback(async (item) => {
        if (item?.id == null) return;

        closeTask();

        const isSame = selectedTasklistId != null
            && String(selectedTasklistId) === String(item.id);

        if (isSame) {
            setSelectedTasklistId(null);
            const baseUrl = browseContextRef.current.request_url
                ?? listsData?.request_url
                ?? data?.request_url;
            if (!baseUrl) return;
            requestUrlRef.current = baseUrl;
            const response = await fetcher('/api.php?r=' + baseUrl);
            setListsData((prev) => {
                const next = normalizeTasksListPayload(response, prev);
                if (prev?.request_url) next.request_url = prev.request_url;
                delete next.tasklist_id;
                delete next.selected_tasklist_id;
                return next;
            });
            return;
        }

        const url = buildTasklistBrowseUrl(browseContextRef.current, item.id);
        if (!url) return;

        setSelectedTasklistId(item.id);
        requestUrlRef.current = url;
        const response = await fetcher('/api.php?r=' + url);
        setListsData((prev) => {
            const next = normalizeTasksListPayload(response, {
                ...prev,
                tasklist_id: item.id,
                selected_tasklist_id: item.id,
            });
            // Keep the block base URL — filtered browse must not replace it.
            if (prev?.request_url) next.request_url = prev.request_url;
            return next;
        });
        // Do not emitTasksListRefresh — a second reload without list params would clear the filter.
    }, [selectedTasklistId, listsData?.request_url, data?.request_url, closeTask]);

    const refreshLists = useCallback(async () => {
        const selectedId = selectedTasklistId;
        let requestUrl = requestUrlRef.current;
        if (selectedId != null) {
            const filteredUrl = buildTasklistBrowseUrl(browseContextRef.current, selectedId);
            if (filteredUrl) requestUrl = filteredUrl;
        }
        if (!requestUrl) return;

        const response = await fetcher('/api.php?r=' + requestUrl);
        setListsData((prev) => {
            const next = normalizeTasksListPayload(response, prev);
            if (prev?.request_url && selectedId != null) {
                next.request_url = prev.request_url;
            }
            return next;
        });
    }, [selectedTasklistId]);

    useEffect(() => {
        const subscription = emitter.addListener(TASKS_LIST_EVENT, (event) => {
            if (event.action === 'reload') {
                refreshLists();
            }
            if (event.action === 'open' && event.url) {
                openTask({ url: event.url, title: event.title });
            }
            if (event.action === 'close') {
                closeTask();
            }
        });

        return () => subscription.remove();
    }, [refreshLists, openTask, closeTask]);

    const handleFormClose = useCallback(() => {
        const wasSaveFilter = formBlock?._isSaveFilter;
        setFormBlock(null);
        if (wasSaveFilter) {
            setFilterSelectionNonce((nonce) => nonce + 1);
        }
        refreshLists();
        emitTasksListRefresh();
    }, [formBlock?._isSaveFilter, refreshLists]);

    useEffect(() => {
        if (!formBlock) return;

        const formNames = getFormNamesFromBlock(formBlock);
        if (!formNames.length) return;
        const wasSaveFilter = !!formBlock._isSaveFilter;

        const subscriptions = formNames.map((formName) =>
            emitter.addListener(`form_${formName}`, (event) => {
                if (event.action !== 'received') return;
                if (!shouldRefreshAfterFormResponse(event.data)) return;

                setFormBlock(null);
                if (wasSaveFilter) {
                    setFilterSelectionNonce((nonce) => nonce + 1);
                }
                refreshLists();
                emitTasksListRefresh();
            })
        );

        return () => subscriptions.forEach((subscription) => subscription.remove());
    }, [formBlock, refreshLists]);

    const lists = listsData?.lists || [];
    const statusLists = useMemo(() => groupTasksByStatus(lists), [lists]);
    const filters = listsData?.filters;
    const topActions = listsData?.actions || [];

    const filterItems = useMemo(() => filterDropdownItems(filters), [filters]);
    const selectableFilterItems = useMemo(
        () => getSelectableFilterItems(filterItems),
        [filterItems]
    );
    const selectedFilter = selectableFilterItems.find((item) => item.id === filters?.value)
        || selectableFilterItems.find((item) => item.id === 0)
        || selectableFilterItems[0];

    const applyFilter = useCallback(async (item) => {
        if (!filters?.request_url_apply) return;
        await fetcher('/api.php?r=' + filters.request_url_apply + item.id);
        setFilterSelectionNonce((nonce) => nonce + 1);
        await refreshLists();
    }, [filters?.request_url_apply, refreshLists]);

    const openSaveFilter = useCallback(async () => {
        if (!filters?.request_url_save) return;
        const url = filters.request_url_save.startsWith('/api.php')
            ? filters.request_url_save
            : '/api.php?r=' + filters.request_url_save;
        const fetchedData = await fetcher(url);
        setFormBlock({
            content: fetchedData.data,
            designbox_id: 0,
            title: t('Save'),
            _isSaveFilter: true,
        });
    }, [filters?.request_url_save, t]);

    const modalActions = topActions.filter((action) => action.type === 'modal');
    const menuActions = topActions.filter((action) => action.type === 'menu');
    const actionHandlers = { setFormBlock, refreshLists, setShowConfirm };
    const showTasklists = tasklists.length > 0;

    const headerActionButtons = (
        <>
            {modalActions.map((action) => (
                <Button
                    key={action.name}
                    size="sm"
                    title={action?.title}
                    onPress={() => runTaskAction(action, actionHandlers)}
                />
            ))}
            <MenuObjectActions
                actions={menuActions}
                refreshLists={refreshLists}
                setShowConfirm={setShowConfirm}
            />
        </>
    );
    const hasHeaderActions = modalActions.length > 0 || menuActions.length > 0;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Confirm
                onVisible={showConfirm.show}
                title={showConfirm.title || t('Are you sure?')}
                handleCancel={() => setShowConfirm({ show: false, title: '', cb: null })}
                handleOk={async () => {
                    const cb = showConfirm.cb;
                    setShowConfirm({ show: false, title: '', cb: null });
                    if (cb) await cb();
                }}
            />

            {formBlock ? (
                <Modal
                    title={formBlock.title || ' '}
                    onVisible={!!formBlock}
                    onClose={() => setFormBlock(null)}
                    scrollable
                    transparent
                >
                    <View className="px-4">
                        <BlockByData block={formBlock} onFormEmpty={handleFormClose} />
                    </View>
                </Modal>
            ) : null}

            <View className="w-full gap-4">
                {activeTask ? (
                    <>
                        <Row className="items-center gap-2 px-1">
                            <Button
                                variant="text"
                                size="sm"
                                startDecorator="ArrowLeft"
                                title={t('Back')}
                                onPress={closeTask}
                            />
                            {activeTask.title ? (
                                <Text
                                    className="min-w-0 flex-1 text-base font-semibold text-foreground"
                                    numberOfLines={1}
                                >
                                    {activeTask.title}
                                </Text>
                            ) : null}
                        </Row>

                        {taskPageLoading ? (
                            <View className="items-center justify-center py-12">
                                <Loading />
                            </View>
                        ) : taskPageData ? (
                            <TaskPageView pageData={taskPageData} url={activeTask.url} />
                        ) : (
                            <NoContent endpoint={{ request_url: activeTask.url, params: {} }} />
                        )}
                    </>
                ) : (
                    <>
                        {filters || hasHeaderActions ? (
                            <Row className="flex-wrap items-center justify-between gap-3">
                                {filters ? (
                                    <Row className="flex-wrap items-center gap-2">
                                        {filters.request_url_add && selectableFilterItems.length > 1 ? (
                                            <DropdownMenu items={filterItems} onSelect={applyFilter}>
                                                <Button
                                                    size="sm"
                                                    startDecorator="ListFilter"
                                                    title={selectedFilter?.title}
                                                    className="max-w-[200px]"
                                                    classTextName="max-w-[170px]"
                                                />
                                            </DropdownMenu>
                                        ) : null}
                                        {filters.request_url_add ? (
                                            <TasksFilterSelector
                                                requestUrlAdd={filters.request_url_add}
                                                requestUrlApply={filters.request_url_apply}
                                                requestUrlSave={filters.request_url_save}
                                                savedFilterId={filters?.value}
                                                filterSelectionNonce={filterSelectionNonce}
                                                onSave={openSaveFilter}
                                                onApplied={async () => {
                                                    await refreshLists();
                                                    emitTasksListRefresh();
                                                }}
                                            />
                                        ) : selectableFilterItems.length > 0 ? (
                                            <DropdownMenu items={filterItems} onSelect={applyFilter}>
                                                <Button
                                                    size="sm"
                                                    startDecorator="ListFilter"
                                                    title={selectedFilter?.title || t('Filter')}
                                                    className="max-w-[280px]"
                                                    classTextName="max-w-[250px]"
                                                />
                                            </DropdownMenu>
                                        ) : (
                                            <Button
                                                size="sm"
                                                startDecorator="ListFilter"
                                                title={t('Filter')}
                                            />
                                        )}
                                    </Row>
                                ) : (
                                    <View />
                                )}

                                {hasHeaderActions ? (
                                    <Row className="flex-wrap items-center gap-2">
                                        {headerActionButtons}
                                    </Row>
                                ) : null}
                            </Row>
                        ) : null}

                        <View className={cn('w-full gap-4', showTasklists && 'lg:flex-row lg:items-start')}>
                            <View className={cn('min-w-0 gap-4', showTasklists && 'lg:flex-1')}>
                                {statusLists.length === 0 ? (
                                    <NoContent endpoint={{ request_url: listsData?.request_url, params: {} }} />
                                ) : (
                                    statusLists.map((list) => {
                                        const tasks = list?.tasks || [];

                                        return (
                                            <View key={list.list_id || list.list_title} className="gap-2">
                                                <Row className="items-center justify-between gap-2 px-2">
                                                    {list.list_title ? (
                                                        <Row className="items-center gap-2 min-w-0">
                                                            <Icon
                                                                icon={iconForTaskStatus(list.list_title)}
                                                                size={16}
                                                                className="text-foreground shrink-0"
                                                            />
                                                            <Text className="text-base font-semibold tracking-tight text-foreground">
                                                                {list.list_title}
                                                                {tasks.length ? ` · ${tasks.length}` : ''}
                                                            </Text>
                                                        </Row>
                                                    ) : (
                                                        <View />
                                                    )}
                                                </Row>

                                                {tasks.length > 0 ? (
                                                    <BrowseSimple
                                                        data={{
                                                            data: tasks,
                                                            unit: 'general-content-list',
                                                            module: 'bx_tasks',
                                                        }}
                                                        blockWrapperProps={{ block: { designbox_id: null } }}
                                                    />
                                                ) : null}
                                            </View>
                                        );
                                    })
                                )}
                            </View>

                            {showTasklists ? (
                                <TasklistsPanel
                                    tasklists={tasklists}
                                    selectedId={selectedTasklistId}
                                    onSelect={applyTasklistFilter}
                                    setFormBlock={setFormBlock}
                                    refreshLists={refreshLists}
                                    setShowConfirm={setShowConfirm}
                                    t={t}
                                />
                            ) : null}
                        </View>
                    </>
                )}
            </View>
        </BlockWrapper>
    );
}
