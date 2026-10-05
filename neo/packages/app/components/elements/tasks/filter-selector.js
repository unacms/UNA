/**
 * Ad-hoc filter chips (Linear-style) on top of the UNA "add filter" form.
 * The form is loaded once, its inputs become pickable fields, and every chip
 * change is debounced into a temporary `do_apply` submit (never save_me/save_all).
 */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import CheckBox from 'app/ui/atoms/checkbox';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import { isFormResponseComplete } from 'app/lib/form/form-helpers';
import { iconForTaskStatus, iconForTaskPriority } from 'app/lib/tasks-meta';
import { apiUrl } from './helpers';

const SYNC_DEBOUNCE_MS = 250;

/** Form controls that are never a filter and never submitted by us. */
const CONTROL_INPUTS = new Set(['save_me', 'save_all', 'title', 'controls']);
const CONTROL_TYPES = new Set(['submit', 'reset', 'input_set']);
/** Hidden inputs (csrf etc.) are submitted but not shown as fields. */
const HIDDEN_INPUTS = new Set(['csrf_token', 'csrf']);

const MULTI_TYPES = new Set(['checkbox_set', 'select_multiple', 'selector']);
/** Author / assignee always open as checkbox lists (Linear-style), even if UNA sends radio_set. */
const FORCE_MULTI_FIELDS = /(author|assignee|member|assign|owner)/i;
const STATE_FIELDS = /(state|status)/i;

const FIELD_ICONS = [
    { match: /(author|assignee|owner)/i, icon: 'User' },
    { match: /(member|assign)/i, icon: 'Users' },
    { match: STATE_FIELDS, icon: 'CircleDashed' },
    { match: /(type|label)/i, icon: 'Tag' },
    { match: /priority/i, icon: 'Flag' },
    { match: /(estimate|hour|time)/i, icon: 'Clock' },
    { match: /(start|begin)/i, icon: 'Calendar' },
    { match: /(end|due|deadline)/i, icon: 'CalendarDays' },
    { match: /title|name/i, icon: 'Type' },
];

/* ------------------------------------------------------------------ */
/* Form → fields                                                       */
/* ------------------------------------------------------------------ */

function iconForField(name, caption) {
    const haystack = `${name} ${caption}`;
    return FIELD_ICONS.find((entry) => entry.match.test(haystack))?.icon || 'ListFilter';
}

function isControlInput(name, input) {
    return !input || CONTROL_INPUTS.has(name) || CONTROL_TYPES.has(input.type);
}

function normalizeOptionValues(values) {
    if (values == null) return [];
    if (!Array.isArray(values)) {
        return Object.entries(values).map(([value, label]) => ({ value: String(value), label: String(label) }));
    }
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

function buildFilterableFields(inputs = {}) {
    return Object.entries(inputs)
        .filter(([name, input]) => !isControlInput(name, input)
            && !HIDDEN_INPUTS.has(name)
            && input.type !== 'hidden')
        .map(([name, input]) => {
            const caption = String(input.caption || input.info || name).replace(/<[^>]+>/g, '');
            return {
                id: name,
                caption,
                type: input.type || 'text',
                multi: FORCE_MULTI_FIELDS.test(`${name} ${caption}`) || MULTI_TYPES.has(input.type),
                options: normalizeOptionValues(input.values),
                icon: iconForField(name, caption),
            };
        });
}

/** First form block in a page/block response, plus its submit URL. */
function extractFormFromResponse(response) {
    const root = response?.data;
    if (!root) return null;

    let block = null;
    const walk = (node) => {
        if (block || !node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (node.type === 'form' && node.data?.inputs) {
            block = node;
            return;
        }
        if (node.data) walk(node.data);
        if (node.content) walk(node.content);
        if (!block && node.inputs && (node.form_attrs || node.params)) {
            block = { type: 'form', data: node, ext: node.ext };
        }
    };
    walk(root);

    if (!block?.data?.inputs) return null;
    return {
        form: block.data,
        requestUrl: block.ext?.request?.url
            || block.data?.ext?.request?.url
            || block.data?.params?.request?.url
            || null,
    };
}

/* ------------------------------------------------------------------ */
/* Filters → form data                                                 */
/* ------------------------------------------------------------------ */

function filterValues(filter) {
    return (filter?.values || []).map((item) => String(item.value));
}

function appendFormValue(formData, key, value) {
    const text = Array.isArray(value)
        ? value.filter((item) => item != null && item !== '').map(String).join(',')
        : value;
    if (text == null || text === '') return;
    formData.append(key, String(text));
}

function buildFilterFormData(inputs, filters) {
    const formData = new FormData();
    const valuesByField = new Map(filters.map((filter) => [filter.columnId, filterValues(filter)]));

    for (const [name, input] of Object.entries(inputs || {})) {
        if (isControlInput(name, input)) continue;
        if (valuesByField.has(name)) {
            appendFormValue(formData, name, valuesByField.get(name));
        } else if (input.type === 'hidden' && input.value != null) {
            appendFormValue(formData, name, input.value);
        }
    }
    for (const filter of filters) {
        if (filter.reverse) formData.append(`${filter.columnId}_reverse`, '1');
    }
    formData.append('do_apply', '1');
    return formData;
}

/** UNA re-renders the form with a message on validation errors instead of applying. */
function isFilterSubmitRejected(response) {
    if (response?.error) return true;
    const data = response?.data;
    if (typeof data === 'string' && data.includes('Fatal error')) return true;
    if (Array.isArray(data) && !isFormResponseComplete(data)) {
        return data.some((item) => item?.type === 'msg') && data.some((item) => item?.type === 'form');
    }
    return false;
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

function FilterRow({ icon, label, selected, showArrow, onPress, trailing }) {
    return (
        <Pressable
            onPress={onPress}
            className={cn(
                'flex-row items-center gap-2 rounded-lg px-2 py-2 web:hover:bg-muted/50',
                selected && 'bg-muted/50'
            )}
        >
            {icon ? <Icon icon={icon} size={16} className="text-muted-foreground shrink-0" /> : null}
            <Text className="flex-1 text-sm font-medium text-card-foreground" numberOfLines={1}>
                {label}
            </Text>
            {trailing || null}
            {showArrow ? <Icon icon="ArrowRight" size={16} className="text-muted-foreground shrink-0" /> : null}
        </Pressable>
    );
}

function ChipDivider() {
    return <View className="w-px self-stretch bg-border/70" />;
}

function ActiveFilterChip({ filter, onEdit, onToggleOperator, onRemove }) {
    const { t } = useTranslation();
    const count = filter.values?.length || 0;
    const operator = filter.reverse
        ? (count > 1 ? t('is none of') : t('is not'))
        : (count > 1 ? t('is any of') : t('is'));
    const valueLabel = count === 1 ? filter.values[0].label : `${count} ${filter.caption}`;
    const segment = 'flex-row items-center gap-1.5 px-2.5 h-full web:hover:bg-muted/40';

    return (
        <Row className="h-8 items-center rounded-full border border-border bg-background overflow-hidden shrink-0">
            <Pressable onPress={onEdit} className={segment}>
                <Icon icon={filter.icon || 'ListFilter'} size={14} className="text-muted-foreground" />
                <Text className="text-xs font-medium text-foreground">{filter.caption}</Text>
            </Pressable>
            <ChipDivider />
            <Pressable onPress={onToggleOperator} className={cn(segment, 'justify-center')}>
                <Text className="text-xs text-muted-foreground">{operator}</Text>
            </Pressable>
            <ChipDivider />
            <Pressable onPress={onEdit} className={cn(segment, 'max-w-[160px]')}>
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

function FieldOptions({ field, activeFilter, onToggle }) {
    const checkedValues = filterValues(activeFilter);
    const fieldLabel = `${field.id} ${field.caption}`;
    const isStateField = STATE_FIELDS.test(fieldLabel);
    const isPriorityField = /priority/i.test(fieldLabel);

    return field.options.map((option) => {
        const checked = checkedValues.includes(option.value);
        const optionLabel = option.label || option.value;
        const icon = isStateField
            ? iconForTaskStatus(optionLabel)
            : (isPriorityField ? iconForTaskPriority(optionLabel) : null);
        return (
            <FilterRow
                key={option.value}
                icon={icon}
                label={option.label}
                selected={checked}
                onPress={() => onToggle(field, option.value)}
                trailing={
                    <View pointerEvents="none">
                        <CheckBox compact status={checked ? 'checked' : 'unchecked'} />
                    </View>
                }
            />
        );
    });
}

/**
 * @param {string} requestUrlAdd     "add filter" form endpoint (required)
 * @param {string} [requestUrlApply] saved-filter apply endpoint (`+ id`); `0` clears
 * @param {string} [requestUrlSave]  shows the Save button when present
 * @param {*} savedFilterId          currently applied saved filter (from `filters.value`)
 * @param {number} filterSelectionNonce bumped by the parent when a saved filter is (re)applied
 */
export default function TasksFilterSelector({
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
    const [fields, setFields] = useState([]);
    const [activeFieldId, setActiveFieldId] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);
    const syncTimerRef = useRef(null);

    const isSavedFilterSelected = savedFilterId != null
        && savedFilterId !== ''
        && String(savedFilterId) !== '0';

    // Choosing a saved filter (dropdown or the save form) replaces ad-hoc chips.
    const [seen, setSeen] = useState({ savedFilterId, nonce: filterSelectionNonce });
    if (seen.savedFilterId !== savedFilterId || seen.nonce !== filterSelectionNonce) {
        const shouldClear = seen.nonce !== filterSelectionNonce
            || (seen.savedFilterId !== savedFilterId && isSavedFilterSelected);
        setSeen({ savedFilterId, nonce: filterSelectionNonce });
        if (shouldClear) {
            setActiveFilters([]);
            setOpen(false);
            setActiveFieldId(null);
            setError(null);
        }
    }

    useEffect(() => () => clearTimeout(syncTimerRef.current), []);

    const activeField = fields.find((field) => field.id === activeFieldId);
    const activeFilter = activeField && activeFilters.find((filter) => filter.columnId === activeField.id);
    const visibleFields = fields.filter((field) => (
        field.id === activeFieldId || !activeFilters.some((filter) => filter.columnId === field.id)
    ));

    const resetView = () => {
        setActiveFieldId(null);
        setError(null);
    };

    const loadForm = async () => {
        if (!requestUrlAdd) return null;
        setLoading(true);
        setError(null);
        // Keep the try block minimal (no finally, no `?.`/ternaries inside):
        // React Compiler 1.x cannot lower those and would skip the component.
        let response = null;
        try {
            response = await fetcher(apiUrl(requestUrlAdd));
        } catch {
            response = null;
        }
        const extracted = response ? extractFormFromResponse(response) : null;
        let meta = null;
        if (extracted) {
            setFields(buildFilterableFields(extracted.form.inputs));
            meta = {
                form: extracted.form,
                submitUrl: extracted.requestUrl || apiUrl(requestUrlAdd),
            };
        } else {
            setError(t('Unable to load filter fields'));
        }
        setFormMeta(meta);
        setLoading(false);
        return meta;
    };

    const ensureForm = () => (formMeta ? Promise.resolve(formMeta) : loadForm());

    const syncFiltersToServer = async (nextFilters) => {
        const meta = await ensureForm();
        if (!meta?.submitUrl || !meta?.form) return;

        if (!nextFilters.length) {
            if (!requestUrlApply) return;
            await fetcher(apiUrl(requestUrlApply + '0'));
        } else {
            const formData = buildFilterFormData(meta.form.inputs, nextFilters);
            const response = await fetcher([meta.submitUrl, '', formData]);
            if (isFilterSubmitRejected(response)) return;
        }
        await onApplied?.();
    };

    const commitFilters = (nextFilters) => {
        setActiveFilters(nextFilters);
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => syncFiltersToServer(nextFilters), SYNC_DEBOUNCE_MS);
    };

    const setFieldValues = (field, selectedValues) => {
        const others = activeFilters.filter((filter) => filter.columnId !== field.id);
        if (!selectedValues.length) {
            commitFilters(others);
            return;
        }
        const optionsByValue = new Map(field.options.map((option) => [option.value, option]));
        const existing = activeFilters.find((filter) => filter.columnId === field.id);
        commitFilters([...others, {
            columnId: field.id,
            caption: field.caption,
            icon: field.icon,
            multi: true,
            reverse: !!existing?.reverse,
            values: selectedValues.map((value) => (
                optionsByValue.get(String(value)) || { value: String(value), label: String(value) }
            )),
        }]);
    };

    const toggleOption = (field, optionValue) => {
        const current = filterValues(activeFilters.find((filter) => filter.columnId === field.id));
        const value = String(optionValue);
        setFieldValues(field, current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]);
    };

    const toggleOperator = (columnId) => {
        commitFilters(activeFilters.map((filter) => (
            filter.columnId === columnId ? { ...filter, reverse: !filter.reverse } : filter
        )));
    };

    const removeFilter = (columnId) => {
        commitFilters(activeFilters.filter((filter) => filter.columnId !== columnId));
    };

    const clearFilters = () => {
        commitFilters([]);
        setOpen(false);
        resetView();
    };

    const handleOpenChange = (next) => {
        setOpen(next);
        if (next) {
            ensureForm();
        } else {
            resetView();
        }
    };

    const editFilter = (filter) => {
        setOpen(true);
        setActiveFieldId(filter.columnId);
        ensureForm();
    };

    if (!requestUrlAdd) return null;

    const renderBody = () => {
        if (loading) {
            return (
                <View className="items-center justify-center py-8">
                    <ActivityIndicator />
                </View>
            );
        }
        if (error) {
            return <Text className="px-2 py-3 text-sm text-destructive">{error}</Text>;
        }
        if (activeField) {
            return <FieldOptions field={activeField} activeFilter={activeFilter} onToggle={toggleOption} />;
        }
        if (!visibleFields.length) {
            return <Text className="px-2 py-3 text-sm text-muted-foreground">{t('No results')}</Text>;
        }
        return visibleFields.map((field) => (
            <FilterRow
                key={field.id}
                icon={field.icon}
                label={field.caption}
                showArrow
                onPress={() => setActiveFieldId(field.id)}
            />
        ));
    };

    return (
        <Row className="flex-wrap items-center gap-2">
            <DropdownPopup
                open={open}
                onOpenChange={handleOpenChange}
                contentClassName="p-0 overflow-hidden"
                buttonProps={{
                    style: 'glass',
                    controlSize: 'small',
                    borderShape: 'circle',
                    image: activeFilters.length ? 'Plus' : 'ListFilterPlus',
                    accessibilityLabel: activeFilters.length ? t('Add filter') : t('Filter'),
                }}
            >
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
                    <View className="p-1 gap-0.5 max-h-72">{renderBody()}</View>
                </View>
            </DropdownPopup>

            {activeFilters.map((filter) => (
                <ActiveFilterChip
                    key={filter.columnId}
                    filter={filter}
                    onEdit={() => editFilter(filter)}
                    onToggleOperator={() => toggleOperator(filter.columnId)}
                    onRemove={() => removeFilter(filter.columnId)}
                />
            ))}

            {activeFilters.length > 0 && !isSavedFilterSelected ? (
                <Row className="items-center gap-1">
                    <Button size="sm" variant="text" title={t('Clear')} onPress={clearFilters} />
                    {requestUrlSave ? (
                        <Button size="sm" variant="text" title={t('Save')} onPress={onSave} />
                    ) : null}
                </Row>
            ) : null}
        </Row>
    );
}
