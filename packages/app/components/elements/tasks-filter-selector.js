'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import CheckBox from 'app/ui/atoms/checkbox';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import { isFormResponseComplete } from 'app/lib/form-helpers';
import { useTranslation } from 'react-i18next';

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

export default function TasksFilterSelector({
    requestUrlAdd,
    requestUrlApply,
    requestUrlSave,
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
                        return (
                            <FilterRow
                                key={option.value}
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
                        startDecorator={activeFilters.length ? 'Plus' : 'ListFilter'}
                        title={activeFilters.length ? undefined : t('Filter')}
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

            {activeFilters.length > 0 ? (
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
