
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getComponent } from 'app/components/registry';
import { Button } from "app/design/controls/buttons";
import { NeoButton } from "app/design/controls/neo-button";
import emitter from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { useFormInstanceId } from 'app/context/form-instance';
import { fetcher } from 'app/lib/fetcher';

/**
 * Optimistic inline field update via UNA request_url + field name.
 * Used by entity_info / entity_text editable fields.
 */
export function useEditableRequest({ initialValue, requestUrl, fieldName, toParam = (v) => v }) {
    const [value, setValue] = useState(initialValue)
    const valueRef = useRef(value)
    valueRef.current = value

    const commit = useCallback(async (nextValue) => {
        const prevValue = valueRef.current
        // Skip no-op saves (e.g. blur/outside click without edits, or double-fire).
        if (String(nextValue ?? '') === String(prevValue ?? '')) return true
        setValue(nextValue)
        valueRef.current = nextValue
        if (!requestUrl) return false
        try {
            const param = toParam(nextValue)
            await fetcher(`/api.php?r=${requestUrl}${fieldName}&params[]=${param}`)
            return true
        } catch {
            setValue(prevValue)
            valueRef.current = prevValue
            return false
        }
    }, [fieldName, requestUrl, toParam])

    return { value, setValue, commit }
}

/** Ignores injected field props (e.g. use_caption_as_placeholder) — do not use DOM Text. */
function UnsupportedFormField() {
    return null;
}

const isWeb = Platform.OS === 'web';
const dirtyFormInstances = new Set();

/** Pending file uploads per form instance — Set of hashes so 2 starts / 1 end stays disabled. */
const pendingUploadsByForm = new Map();

function uploadFormKey(formName, formInstanceId) {
    return `${formName || ''}:${formInstanceId ?? ''}`;
}

export function formHasPendingUploads(formName, formInstanceId) {
    const set = pendingUploadsByForm.get(uploadFormKey(formName, formInstanceId));
    return !!(set && set.size > 0);
}

export function trackFormUploadStart(formName, formInstanceId, hash) {
    if (!formName || hash == null || hash === '') return;
    const key = uploadFormKey(formName, formInstanceId);
    if (!pendingUploadsByForm.has(key)) pendingUploadsByForm.set(key, new Set());
    pendingUploadsByForm.get(key).add(hash);
    emitter.emit(`form_${formName}`, {
        action: 'upload_start',
        formInstanceId,
        hash,
    });
}

export function trackFormUploadEnd(formName, formInstanceId, hash) {
    if (!formName || hash == null || hash === '') return;
    const key = uploadFormKey(formName, formInstanceId);
    const set = pendingUploadsByForm.get(key);
    if (set) {
        set.delete(hash);
        if (set.size === 0) pendingUploadsByForm.delete(key);
    }
    emitter.emit(`form_${formName}`, {
        action: 'upload_end',
        formInstanceId,
        hash,
    });
}

/** True while this form instance has in-flight file uploads. */
export function useFormUploading(formName) {
    const formInstanceId = useFormInstanceId();
    const [uploading, setUploading] = useState(() =>
        formHasPendingUploads(formName, formInstanceId)
    );

    useEffect(() => {
        if (!formName) {
            setUploading(false);
            return;
        }
        setUploading(formHasPendingUploads(formName, formInstanceId));
        const subscription = emitter.addListener(`form_${formName}`, (data) => {
            if (formInstanceId != null && data.formInstanceId !== formInstanceId) return;
            if (data.action !== 'upload_start' && data.action !== 'upload_end') return;
            setUploading(formHasPendingUploads(formName, formInstanceId));
        });
        return () => subscription.remove();
    }, [formName, formInstanceId]);

    return uploading;
}

/** Track dirty state per mounted form instance (used by Modal close guard on web). */
export function updateFormDirtyState(formInstanceId, isDirty) {
    if (!formInstanceId) return;
    if (isDirty) {
        dirtyFormInstances.add(formInstanceId);
    } else {
        dirtyFormInstances.delete(formInstanceId);
    }
}

export function isAnyFormDirty() {
    return dirtyFormInstances.size > 0;
}

/** True when this form name should not block modal close / navigation on web. */
export function isFormUnsavedCloseGuardSkipped(formName) {
    if (!formName) return false;
    const skipped = appSetting('forms', 'skip_unsaved_close_guard');
    return Array.isArray(skipped) && skipped.includes(formName);
}

export const UNSAVED_FORM_CONFIRM_REQUEST = 'unsaved_form_confirm_request';

const DEFAULT_DISCARD_MESSAGE = 'You have unsaved changes. Close without saving?';

let pendingConfirmPromise = null;

/** Returns true when close should proceed. On web, shows Confirm if any form is dirty. */
export function requestDiscardUnsavedFormChanges(message) {
    if (!isWeb || !isAnyFormDirty()) return Promise.resolve(true);
    if (pendingConfirmPromise) return pendingConfirmPromise;

    pendingConfirmPromise = new Promise((resolve) => {
        emitter.emit(UNSAVED_FORM_CONFIRM_REQUEST, {
            message: message ?? DEFAULT_DISCARD_MESSAGE,
            settle: (proceed) => {
                pendingConfirmPromise = null;
                resolve(proceed);
            },
        });
    });

    return pendingConfirmPromise;
}

/** @deprecated Use requestDiscardUnsavedFormChanges (async). */
export const confirmDiscardUnsavedFormChanges = requestDiscardUnsavedFormChanges;

export function normalizeFormResponseData(data) {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    return [data];
}

/** Item types that still need client handling (keep form open / set formBundle.extra). */
const FORM_RESPONSE_ACTIONABLE_TYPES = new Set(['form', 'redirect', 'msg']);

/** True when the server response means the form flow is finished (close modal, refresh parent). */
export function isFormResponseComplete(responseData) {
    if (responseData == null) return true;

    if (Array.isArray(responseData)) {
        if (responseData.length === 0) return true;
        if (responseData.some((item) => item?.reload)) return true;
        return !responseData.some((item) => FORM_RESPONSE_ACTIONABLE_TYPES.has(item?.type));
    }

    if (typeof responseData === 'object') {
        if (responseData.reload) return true;
        if (FORM_RESPONSE_ACTIONABLE_TYPES.has(responseData.type)) return false;
        return true;
    }

    return true;
}

export function getFormFieldByData(inputData, handleSubmit, format, externalProps, uniqueKey) {

    if (!inputData)
        return null;
    // Prefer the inputs-map key: UNA reuses names like `block_end_field` for multiple fields.
    // Keep key AFTER {...inputData} — UNA field objects often include a non-unique `key`
    // that would otherwise overwrite the stable list key and warn in FormAds / maps.
    const fallbackKey = uniqueKey || inputData.key || inputData.name || `${inputData.type}_${inputData.caption || 'field'}`;
    const InputType = getComponent('form-field', String(inputData.type));
    if (!InputType){
        return <UnsupportedFormField key={fallbackKey} />;
    }
    return <InputType {...inputData} format={format} handleSubmit={handleSubmit} {...externalProps} key={fallbackKey} />;

}

export function getHiddenFields(inputs, handleSubmit) {
    return Object.keys(inputs)
        .map((key) => {
            if (inputs[key].type === "hidden") {
                return getFormFieldByData(inputs[key], handleSubmit, 'nofield', undefined, key);
            }
            return null;
        })
        .filter((element) => element !== null);
}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}

export function PollButton({ field_name, size = 'sm', variant = 'secondary', icon = "ChartBarBig", rounded = true }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            variant={variant}
            rounded
            tooltip="Add Polls"
            onPress={() => emitter.emit(`fld_polls_${field_name}`, { action: 'add' })}
        />
    );
}

export function LabelButton({ field_name, size = 'sm', variant = 'secondary', icon = "Hash", title, rounded = true }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            title={title}
            tooltip="Add Labels"
            variant={variant}
            rounded={rounded}
            onPress={() => emitter.emit(`fld_labels_${field_name}`, { action: 'add' })}
        />
    );
}

const LEGACY_SIZE_TO_CONTROL = {
    xs: 'mini',
    sm: 'small',
    base: 'regular',
    md: 'regular',
    lg: 'large',
};

const LEGACY_VARIANT_TO_STYLE = {
    text: 'borderless',
    link: 'borderless',
    secondary: 'bordered',
    outline: 'bordered',
    default: 'bordered',
};

export function FileButton({
    field_name,
    size = 'sm',
    variant,
    style: neoStyle,
    controlSize,
    icon = "Image",
    rounded = true,
    tooltip = "Add Files",
    source = 'library',
    ...rest
}) {
    const resolvedStyle =
        neoStyle ?? (variant ? LEGACY_VARIANT_TO_STYLE[variant] : undefined) ?? 'borderless';
    const resolvedControlSize = controlSize ?? LEGACY_SIZE_TO_CONTROL[size] ?? 'regular';

    return (
        <NeoButton
            image={icon}
            style={resolvedStyle}
            controlSize={resolvedControlSize}
            borderShape={rounded ? 'circle' : 'roundedRectangle'}
            tooltip={tooltip}
            onPress={() => emitter.emit(`fld_files_${field_name}`, { action: 'add', source: source })}
            {...rest}
        />
    );
}
