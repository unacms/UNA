import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import {
    ButtonMenuGroupItem,
    ButtonsGroupMenu,
    Modal,
} from 'app/design/controls';
import Form from 'app/components/form';
import Profile from 'app/ui/molecules/profile';
import { getComponent } from 'app/components/registry';
import { Platform } from 'react-native';

const getApiRequest = (action, params) =>
    `/api.php?r=system/${action}/TemplReportServices&params[]=${JSON.stringify(params)}`;

const resolvePerformedBy = (payload) => {
    if (Array.isArray(payload?.performed_by)) {
        return payload.performed_by;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
};

const getSelectDefaultValue = (input) => {
    const first = input?.values?.[0];
    if (!first) {
        return '';
    }

    return first.key ?? first.value ?? '';
};

const withDefaultSelectValues = (formItem) => {
    const typeInput = formItem?.data?.inputs?.type;
    if (!typeInput || typeInput.value) {
        return formItem;
    }

    const defaultType = getSelectDefaultValue(typeInput);
    if (!defaultType) {
        return formItem;
    }

    return {
        ...formItem,
        data: {
            ...formItem.data,
            inputs: {
                ...formItem.data.inputs,
                type: {
                    ...typeInput,
                    value: defaultType,
                },
            },
        },
    };
};

const getInputSetChildNames = (field) => {
    const fromChildren = Object.keys(field)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => field[key]?.name)
        .filter(Boolean);

    if (fromChildren.length) {
        return fromChildren;
    }

    if (typeof field.values === 'string' && field.values) {
        return field.values.split(',').map((name) => name.trim()).filter(Boolean);
    }

    return [];
};

const appendSubmitValue = (params, name, value) => {
    if (value !== undefined && value !== null && value !== '') {
        params[name] = value;
    }
};

const buildSubmitParams = (reportForm, values, system, objectId) => {
    const params = { s: system, o: objectId };
    const inputs = reportForm?.data?.inputs ?? {};

    Object.entries(inputs).forEach(([name, field]) => {
        if (!field || name === 'csrf_token') {
            return;
        }

        if (field.type === 'input_set') {
            getInputSetChildNames(field).forEach((childName) => {
                appendSubmitValue(params, childName, values?.[childName]);
            });
            return;
        }

        let value = values?.[name];
        if (field.type === 'select' && !value) {
            value = getSelectDefaultValue(field);
        }

        appendSubmitValue(params, name, value);
    });

    return params;
};

const resolveActionPayload = (response) => {
    const data = response?.data ?? response;
    if (!data) {
        return null;
    }

    if (Array.isArray(data)) {
        const actionItem = data.find((item) => item?.is_reported !== undefined || item?.title);
        return actionItem?.data ?? actionItem ?? null;
    }

    if (data?.is_reported !== undefined || data?.title) {
        return data;
    }

    if (data?.action) {
        return data.action;
    }

    return data?.data ?? data;
};

const ElementReports = (props) => {
    const { t } = useTranslation();
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');

    const initialAction = props?.action ?? {};
    const initialCounter = props?.counter ?? {};
    const system = props?.system;
    const objectId = props?.object_id;
    const isTextMode = props?.mode === 'text';
    const oSettings = appSetting('social_actions', 'report') || {};
    const oParams = { ...oSettings, ...(props?.params || {}) };

    const [actionState, setActionState] = useState({
        is_undo: initialAction?.is_undo === true,
        is_reported: initialAction?.is_reported === true,
        is_disabled: initialAction?.is_disabled === true,
        title: initialAction?.title ?? '',
    });
    const [counterState, setCounterState] = useState({
        count: Number(initialCounter?.count ?? 0),
    });
    const [reportForm, setReportForm] = useState(null);
    const [reportFormVisible, setReportFormVisible] = useState(false);
    const [performedByVisible, setPerformedByVisible] = useState(false);
    const [performedBy, setPerformedBy] = useState([]);
    const [loading, setLoading] = useState(false);

    const iconName = isTextMode
        ? ''
        : (oSettings?.[system]?.icon !== undefined ? oSettings[system].icon : 'AlertCircle');
    const showCounter = counterState.count > 0;
    const oButtonProps = {
        variant: props?.primary ? 'primary' : (isTextMode ? 'custom' : oParams?.button_variant),
        size: isTextMode ? (Platform.OS === 'web' ? 'sm' : 'base') : oParams?.button_size,
        classTextName: Platform.OS === 'web' ? '' : ' font-medium text-muted-foreground ',
        rounded: oParams?.button_rounded,
        fullWidth: oParams?.button_full_width,
        showTitleFromSize: oParams?.button_show_title_from_size,
        ring: oParams?.button_ring,
    };

    const applyActionResponse = useCallback((payload) => {
        if (!payload) {
            return;
        }

        setActionState((prev) => ({
            ...prev,
            is_reported: payload?.is_reported ?? prev.is_reported,
            is_disabled: payload?.is_disabled ?? prev.is_disabled,
            title: payload?.title ?? prev.title,
        }));

        if (payload?.counter?.count !== undefined) {
            setCounterState({ count: Number(payload.counter.count || 0) });
        }

        if (typeof props?.onChangeTitle === 'function' && payload?.title) {
            props.onChangeTitle(payload.title);
        }
    }, [props]);

    const closeReportForm = useCallback(() => {
        setReportFormVisible(false);
        setReportForm(null);
    }, []);

    const fetchReportForm = useCallback(async () => {
        if (!system || !objectId || loading || actionState.is_disabled) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetcher(getApiRequest('do', { s: system, o: objectId }));
            const formItem = response?.data;

            if (formItem?.type === 'form' && formItem?.data) {
                setReportForm(withDefaultSelectValues(formItem));
                setReportFormVisible(true);
            }
        } finally {
            setLoading(false);
        }
    }, [system, objectId, loading, actionState.is_disabled]);

    const onReportFormSubmit = useCallback(async (_formData, values) => {
        if (!system || !objectId || !reportForm || loading) {
            return;
        }

        try {
            setLoading(true);
            const params = buildSubmitParams(reportForm, values, system, objectId);
            const response = await fetcher(getApiRequest('do', params));
            applyActionResponse(resolveActionPayload(response));
            closeReportForm();
        } finally {
            setLoading(false);
        }
    }, [system, objectId, reportForm, loading, applyActionResponse, closeReportForm]);

    const undoReport = useCallback(async () => {
        if (!system || !objectId || loading) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetcher(getApiRequest('do', { s: system, o: objectId }));
            applyActionResponse(resolveActionPayload(response));
        } finally {
            setLoading(false);
        }
    }, [system, objectId, loading, applyActionResponse]);

    const getPerformedBy = useCallback(async () => {
        if (!system || !objectId || loading || counterState.count <= 0) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetcher(getApiRequest('get_performed_by', { s: system, o: objectId }));
            const payload = response?.data ?? response;
            setPerformedBy(resolvePerformedBy(payload));
            setPerformedByVisible(true);
        } finally {
            setLoading(false);
        }
    }, [system, objectId, loading, counterState.count]);

    const handleActionPress = actionState.is_undo && actionState.is_reported
        ? undoReport
        : fetchReportForm;

    const reportFormModal = reportForm ? (
        <Modal title={t('Report')} onVisible={reportFormVisible} onClose={closeReportForm}>
            <View className="p-4 sm:p-0">
                <Form
                    key={reportForm.name}
                    {...reportForm}
                    resetOnSubmit={true}
                    onFormSubmit={onReportFormSubmit}
                />
            </View>
        </Modal>
    ) : null;

    const performedByModal = (
        <Modal title={t('Reports')} onVisible={performedByVisible} onClose={() => setPerformedByVisible(false)}>
            <View className="p-2 gap-y-4 overflow-y-auto text-muted-foreground">
                {performedBy.map((user, index) => (
                    <View key={user.id ?? `${user.name ?? 'user'}-${index}`}>
                        <Profile {...user} />
                    </View>
                ))}
                {performedBy.length === 0 ? <Text>{t('No reports yet')}</Text> : null}
            </View>
        </Modal>
    );

    if (props.mode === 'dropdown-menu') {
        return (
            <>
                <DropdownMenuItem
                    disabled={actionState.is_disabled || loading}
                    counter={showCounter ? counterState.count : ''}
                    handleCounter={getPerformedBy}
                    item={{ title: actionState.title, icon: iconName }}
                    icon={iconName}
                    handleSelect={handleActionPress}
                />
                {reportFormModal}
                {performedByModal}
            </>
        );
    }

    const groupButtons = [
        <ButtonMenuGroupItem
            key="report-action"
            startDecorator={iconName}
            title={actionState.title}
            onPress={handleActionPress}
            disabled={actionState.is_disabled || loading}
        />,
    ];

    if (showCounter) {
        groupButtons.push(
            <ButtonMenuGroupItem
                key="report-counter"
                title={String(counterState.count)}
                onPress={getPerformedBy}
                disabled={loading}
            />
        );
    }

    return (
        <View className={(actionState.is_undo && actionState.is_reported ? ' undo' : ' do')}>
            <ButtonsGroupMenu {...oButtonProps}>{groupButtons}</ButtonsGroupMenu>
            {reportFormModal}
            {performedByModal}
        </View>
    );
};

export default ElementReports;
