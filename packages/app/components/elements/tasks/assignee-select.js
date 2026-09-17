/**
 * Inline assignee editor for the browse row.
 * Same modal as entity_info `initial_members`, persisted via set_property.
 */
import { useState } from 'react';
import { View, Row, Pressable } from 'app/design/view';
import { Modal, NeoButton } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import ProfilesList from 'app/ui/molecules/profile/profile-list';
import { SelectUsers, User } from 'app/components/form-fields/initial-members';
import { fetcher } from 'app/lib/fetcher';
import { setTaskProperty } from './property-select';
import { emitTasksListPatch, emitTasksListRefresh } from './helpers';

function dedupeProfiles(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((item, index, arr) => (
        item?.id != null && arr.findIndex((other) => String(other?.id) === String(item.id)) === index
    ));
}

function suggestionsRequestUrl(module, contextId) {
    if (contextId == null || contextId === '') return '';
    return `/api.php?r=${module}/get_initial_members&params[]=${contextId}&params[]=`;
}

function suggestionsRequestUrlFromField(ajaxGetSuggestions) {
    if (!ajaxGetSuggestions) return '';
    return `/api.php?r=${ajaxGetSuggestions}${ajaxGetSuggestions.includes('params[]') ? '' : '&params='}`;
}

function extractAssigneeField(payload) {
    const seen = new Set();
    let found = null;
    const walk = (node) => {
        if (!node || typeof node !== 'object' || found || seen.has(node)) return;
        seen.add(node);
        const field = node.inputs?.initial_members;
        if (field?.type === 'initial_members' || field?.name === 'initial_members') {
            found = {
                caption: field.caption || 'Assign to',
                suggestUrl: suggestionsRequestUrlFromField(field.ajax_get_suggestions),
                requestUrl: node.params?.request_url || '',
            };
            return;
        }
        const values = Array.isArray(node) ? node : Object.values(node);
        for (const value of values) walk(value);
    };
    walk(payload?.data || payload);
    return found;
}

async function loadAssigneeFieldFromTaskPage(url) {
    const path = String(url || '').replace(/^\//, '');
    if (!path) return null;
    try {
        const response = await fetcher(`/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${encodeURIComponent(path)}`);
        return extractAssigneeField(response);
    } catch {
        return null;
    }
}

function StopRowOpen({ children }) {
    return (
        <View
            className="shrink-0"
            onStartShouldSetResponder={() => true}
            onClick={(event) => event?.stopPropagation?.()}
        >
            {children}
        </View>
    );
}

export function TaskAssigneeSelect({
    taskId,
    module = 'bx_tasks',
    members,
    contextId,
    taskUrl,
}) {
    const [open, setOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const [profiles, setProfiles] = useState(() => dedupeProfiles(members));
    const [suggestUrl, setSuggestUrl] = useState(() => suggestionsRequestUrl(module, contextId));
    const canEdit = taskId != null && taskId !== '';

    const ensureSuggestUrl = async () => {
        if (suggestUrl) return suggestUrl;
        const fromContext = suggestionsRequestUrl(module, contextId);
        if (fromContext) {
            setSuggestUrl(fromContext);
            return fromContext;
        }
        const field = await loadAssigneeFieldFromTaskPage(taskUrl);
        if (field?.suggestUrl) setSuggestUrl(field.suggestUrl);
        return field?.suggestUrl || '';
    };

    const saveProfiles = async (nextProfiles) => {
        const deduped = dedupeProfiles(nextProfiles);
        const prevProfiles = profiles;
        setProfiles(deduped);
        setSelectOpen(false);
        emitTasksListPatch({ id: taskId, field: 'members', value: deduped });
        const ok = await setTaskProperty({
            id: taskId,
            field: 'initial_members',
            value: encodeURIComponent(deduped.map((item) => item.id).join(',')),
            module,
        });
        if (!ok) {
            setProfiles(prevProfiles);
            emitTasksListPatch({ id: taskId, field: 'members', value: prevProfiles });
            return;
        }
        emitTasksListRefresh();
    };

    const handleOpen = () => {
        if (!canEdit) return;
        setProfiles(dedupeProfiles(members));
        setOpen(true);
        ensureSuggestUrl();
    };

    const handleClose = () => {
        setOpen(false);
        setSelectOpen(false);
    };

    const trigger = members?.length ? (
        <ProfilesList data={members} maxCount={3} displaySize="xs" showLinks={false} />
    ) : (
        <View
            className="h-6 w-6 items-center justify-center rounded-full"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Icon icon="CircleUserRound" size={24} className="text-muted" />
        </View>
    );

    if (!canEdit) return trigger;

    return (
        <StopRowOpen>
            <Pressable
                onPress={handleOpen}
                accessibilityRole="button"
                accessibilityLabel="Assign to"
            >
                {trigger}
            </Pressable>
            {open ? (
                <Modal
                    title="Assign to"
                    onVisible={open}
                    onClose={handleClose}
                >
                    {suggestUrl && selectOpen ? (
                        <Modal
                            title="Choose users"
                            onVisible={selectOpen}
                            onClose={() => setSelectOpen(false)}
                        >
                            <SelectUsers
                                onSave={(data, isAdd = false) => {
                                    saveProfiles(isAdd ? [...profiles, ...data] : data);
                                }}
                                requestUrl={suggestUrl}
                                initedData={[]}
                            />
                        </Modal>
                    ) : null}
                    <Row className="w-full px-1.5 py-1 items-center justify-between flex-wrap shadow-input-outline dark:shadow-input-outline-deep rounded-lg bg-input/60">
                        <Row className="gap-2 items-center flex-wrap my-auto flex-1">
                            {profiles.map((item, index) => (
                                <User
                                    type="multi"
                                    key={item.id ?? `assigned-${index}`}
                                    data={item}
                                    onSelect={(profile) => saveProfiles(
                                        profiles.filter((member) => String(member.id) !== String(profile.id))
                                    )}
                                />
                            ))}
                        </Row>
                        <NeoButton
                            image="Plus"
                            style="borderless"
                            controlSize="small"
                            accessibilityLabel="Add"
                            onPress={() => setSelectOpen(true)}
                            disabled={!suggestUrl}
                        />
                    </Row>
                </Modal>
            ) : null}
        </StopRowOpen>
    );
}
