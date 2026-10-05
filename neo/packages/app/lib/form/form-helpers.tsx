
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { components } from 'app/components/registry';
import { NeoButton } from "app/design/controls/neo-button/neo-button";
import { useTranslation } from 'react-i18next';
import emitter, { EVENTS } from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { useFormInstanceId } from 'app/context/form-instance';
import { fetcher } from 'app/lib/fetcher';

/**
 * Optimistic inline field update via UNA request_url + field name.
 * Used by entity_info / entity_text editable fields.
 */
export function useEditableRequest({ initialValue, requestUrl, fieldName, toParam = (v: any) => v }: {
    initialValue: any
    requestUrl: string
    fieldName: string
    /** Map the edited value to the request param (identity by default). */
    toParam?: (value: any) => any
}) {
    const [value, setValue] = useState(initialValue)
    const valueRef = useRef(value)
    valueRef.current = value

    const commit = useCallback(async (nextValue: any) => {
        const prevValue = valueRef.current
        // Skip no-op saves (e.g. blur/outside click without edits, or double-fire).
        // Compare the serialized param so Date objects for the same calendar
        // day (local midnight vs UTC-parsed instant) are treated as equal.
        if (String(toParam(nextValue) ?? '') === String(toParam(prevValue) ?? '')) return true
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

/** Pending file uploads per form instance — Set of ids so 2 starts / 1 end stays disabled. */
const pendingUploadsByForm = new Map();

function uploadFormKey(formName: string, formInstanceId: string | null | undefined) {
    return `${formName || ''}:${formInstanceId ?? ''}`;
}

export function formHasPendingUploads(formName: string, formInstanceId: string | null | undefined) {
    const set = pendingUploadsByForm.get(uploadFormKey(formName, formInstanceId));
    return !!(set && set.size > 0);
}

export function trackFormUploadStart(formName: string, formInstanceId: string | null | undefined, hash: string) {
    if (!formName || hash == null || hash === '') return;
    const key = uploadFormKey(formName, formInstanceId);
    if (!pendingUploadsByForm.has(key)) pendingUploadsByForm.set(key, new Set());
    pendingUploadsByForm.get(key).add(hash);
    emitter.emit(EVENTS.form(formName), {
        action: 'upload_start',
        formInstanceId,
        hash,
    });
}

export function trackFormUploadEnd(formName: string, formInstanceId: string | null | undefined, hash: string) {
    if (!formName || hash == null || hash === '') return;
    // Clear this upload id from every instance key — ImagePicker remounts can
    // change useId while the same in-flight uploadId is still finishing.
    const prefix = `${formName}:`;
    for (const [k, set] of [...pendingUploadsByForm.entries()]) {
        if (!k.startsWith(prefix)) continue;
        set.delete(hash);
        if (set.size === 0) pendingUploadsByForm.delete(k);
    }
    emitter.emit(EVENTS.form(formName), {
        action: 'upload_end',
        formInstanceId,
        hash,
    });
}

/** Drop all in-flight upload markers for a form instance (cancel / unmount). */
export function clearFormPendingUploads(formName: string, formInstanceId: string | null | undefined) {
    if (!formName) return;
    const key = uploadFormKey(formName, formInstanceId);
    if (!pendingUploadsByForm.has(key)) return;
    pendingUploadsByForm.delete(key);
    emitter.emit(EVENTS.form(formName), {
        action: 'upload_clear',
        formInstanceId,
    });
}

/** True while this form instance has in-flight file uploads. */
export function useFormUploading(formName: string) {
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
        const subscription = emitter.addListener(EVENTS.form(formName), (data: any) => {
            if (data.action === 'upload_start') {
                // Starts are instance-scoped; ignore other forms' mounts.
                if (formInstanceId != null && data.formInstanceId !== formInstanceId) return;
            } else if (
                data.action !== 'upload_end' &&
                data.action !== 'upload_clear'
            ) {
                return;
            }
            // upload_end/clear: always re-check — remount may have a new useId
            // while the finishing upload still carries the previous instance id.
            setUploading(formHasPendingUploads(formName, formInstanceId));
        });
        return () => subscription.remove();
    }, [formName, formInstanceId]);

    return uploading;
}

/** Track dirty state per mounted form instance (used by Modal close guard on web). */
export function updateFormDirtyState(formInstanceId: string | null | undefined, isDirty: boolean) {
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
export function isFormUnsavedCloseGuardSkipped(formName: string) {
    if (!formName) return false;
    const skipped = appSetting('forms', 'skip_unsaved_close_guard');
    return Array.isArray(skipped) && skipped.includes(formName);
}

export const UNSAVED_FORM_CONFIRM_REQUEST = EVENTS.unsavedFormConfirm;

const DEFAULT_DISCARD_MESSAGE = 'You have unsaved changes. Close without saving?';

let pendingConfirmPromise: Promise<boolean> | null = null;

// Close buttons of open modals, topmost last: on desktop the discard confirm is a
// popover anchored to it, whatever asked to close (✕, Escape, backdrop, back, link).
const discardAnchors: Array<() => Element | null> = [];

/** Register a modal close button as the discard-confirm anchor; returns unregister. */
export function pushDiscardConfirmAnchor(getAnchor: () => Element | null) {
    discardAnchors.push(getAnchor);
    return () => {
        const index = discardAnchors.lastIndexOf(getAnchor);
        if (index !== -1) discardAnchors.splice(index, 1);
    };
}

function topDiscardConfirmAnchor() {
    for (const getAnchor of [...discardAnchors].reverse()) {
        const anchor = getAnchor();
        if (anchor?.isConnected) return anchor;
    }
    return null;
}

/** Returns true when close should proceed. On web, shows Confirm if any form is dirty. */
export function requestDiscardUnsavedFormChanges(message?: string) {
    if (!isWeb || !isAnyFormDirty()) return Promise.resolve(true);
    if (pendingConfirmPromise) return pendingConfirmPromise;

    pendingConfirmPromise = new Promise((resolve) => {
        emitter.emit(UNSAVED_FORM_CONFIRM_REQUEST, {
            message: message ?? DEFAULT_DISCARD_MESSAGE,
            anchor: topDiscardConfirmAnchor(),
            settle: (proceed: boolean) => {
                pendingConfirmPromise = null;
                if (proceed) {
                    // Drop state kept outside RHF too (files kept across remounts).
                    emitter.emit(EVENTS.unsavedFormDiscard, { formInstanceIds: [...dirtyFormInstances] });
                }
                resolve(proceed);
            },
        });
    });

    return pendingConfirmPromise;
}

/** @deprecated Use requestDiscardUnsavedFormChanges (async). */
export const confirmDiscardUnsavedFormChanges = requestDiscardUnsavedFormChanges;

export function normalizeFormResponseData(data: any) {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    return [data];
}

/** Item types that still need client handling (keep form open / set formBundle.extra). */
const FORM_RESPONSE_ACTIONABLE_TYPES = new Set(['form', 'redirect', 'msg']);

/** True when the server response means the form flow is finished (close modal, refresh parent). */
export function isFormResponseComplete(responseData: any) {
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

/** True when UNA re-renders the form with field validation errors (submit rejected). */
export function formResponseHasFieldErrors(responseData: any): boolean {
    const formItem = normalizeFormResponseData(responseData).find((item) => item?.type === 'form');
    return Object.values(formItem?.data?.inputs || {}).some((input: any) => {
        const err = input?.error;
        if (!err) return false;
        if (Array.isArray(err)) return !!String(err[0] || '').trim();
        return !!String(err).trim();
    });
}

/** Hidden inputs the files field mirrors its ids into (`covers` → `thumb`, `videos` → `video`). */
export const FILES_FIELD_MIRRORS: Record<string, string> = { covers: 'thumb', videos: 'video' };

/** UNA often sends phones as `type: "text"` with a name containing "phone". */
export function resolveFormFieldType(inputData: any) {
    const type = String(inputData.type ?? '');
    if (type === 'text' && String(inputData.name || '').includes('phone')) {
        return 'phone';
    }
    return type;
}

export function getFormFieldByData(inputData: any, handleSubmit: () => void, format: string, externalProps: any, uniqueKey: string) {

    if (!inputData)
        return null;
    // Prefer the inputs-map key: UNA reuses names like `block_end_field` for multiple fields.
    // Keep key AFTER {...inputData} — UNA field objects often include a non-unique `key`
    // that would otherwise overwrite the stable list key and warn in FormAds / maps.
    const type = resolveFormFieldType(inputData);
    const fallbackKey = uniqueKey || inputData.key || inputData.name || `${type}_${inputData.caption || 'field'}`;
    const InputType = (components as any)['form-field'][type];
    if (!InputType){
        return <UnsupportedFormField key={fallbackKey} />;
    }
    return <InputType {...inputData} format={format} handleSubmit={handleSubmit} {...externalProps} type={type} key={fallbackKey} />;

}

export function getHiddenFields(inputs: any, handleSubmit: () => void) {
    return Object.keys(inputs)
        .map((key) => {
            if (inputs[key].type === "hidden") {
                return getFormFieldByData(inputs[key], handleSubmit, 'nofield', undefined, key);
            }
            return null;
        })
        .filter((element) => element !== null);
}


const LEGACY_SIZE_TO_CONTROL: Record<string, string> = {
    xs: 'mini',
    sm: 'small',
    base: 'regular',
    md: 'regular',
    lg: 'large',
};

const LEGACY_VARIANT_TO_STYLE: Record<string, string> = {
    text: 'borderless',
    link: 'borderless',
    secondary: 'bordered',
    outline: 'bordered',
    default: 'bordered',
};

function resolveLegacyNeoButton({
    size,
    variant,
    style: neoStyle,
    controlSize,
    borderShape,
    rounded = true,
    fallbackStyle = 'borderless',
}: { size: any; variant: any; style: any; controlSize: any; borderShape: any; rounded?: any; fallbackStyle?: any }) {
    return {
        style: neoStyle ?? (variant ? LEGACY_VARIANT_TO_STYLE[variant] : undefined) ?? fallbackStyle,
        controlSize: controlSize ?? LEGACY_SIZE_TO_CONTROL[size] ?? 'regular',
        borderShape: borderShape ?? (rounded ? 'circle' : 'roundedRectangle'),
    };
}

/**
 * NeoButton props for triggers and value chips inside a FieldWell (labels,
 * selector, visibility): one style and size so they line up in the well.
 * Legacy `variant` / `size` still map (e.g. embedded `text` → borderless).
 */
export function wellButtonProps({ variant, size }: { variant?: any; size?: any } = {}) {
    return resolveLegacyNeoButton({
        variant,
        size: size ?? 'sm',
        style: undefined,
        controlSize: undefined,
        borderShape: undefined,
        rounded: false,
        fallbackStyle: 'bordered',
    });
}

export function PollButton({
    field_name,
    size = 'sm',
    variant = 'secondary',
    style: neoStyle,
    controlSize,
    borderShape,
    icon = "ChartBarBig",
    rounded = true,
    ...rest
}: { field_name: any; size?: any; variant?: any; style?: any; controlSize?: any; borderShape?: any; icon?: any; rounded?: any; [key: string]: any }) {
    const { t } = useTranslation();
    const resolved = resolveLegacyNeoButton({
        size, variant, style: neoStyle, controlSize, borderShape, rounded,
        fallbackStyle: 'bordered',
    });

    return (
        <NeoButton
            image={icon}
            style={resolved.style}
            controlSize={resolved.controlSize}
            borderShape={resolved.borderShape}
            tooltip={t('Add Polls')}
            onPress={() => emitter.emit(EVENTS.fieldPolls(field_name), { action: 'add' })}
            {...rest}
        />
    );
}

export function LabelButton({
    field_name,
    size = 'sm',
    variant = 'secondary',
    style: neoStyle,
    controlSize,
    borderShape,
    icon = "Hash",
    title,
    rounded = true,
    ...rest
}: { field_name: any; size?: any; variant?: any; style?: any; controlSize?: any; borderShape?: any; icon?: any; title?: any; rounded?: any; [key: string]: any }) {
    const { t } = useTranslation();
    const resolved = resolveLegacyNeoButton({
        size, variant, style: neoStyle, controlSize, borderShape, rounded,
        fallbackStyle: 'bordered',
    });

    return (
        <NeoButton
            image={icon}
            label={title}
            style={resolved.style}
            controlSize={resolved.controlSize}
            borderShape={resolved.borderShape}
            tooltip={t('Add Labels')}
            onPress={() => emitter.emit(EVENTS.fieldLabels(field_name), { action: 'add' })}
            {...rest}
        />
    );
}

export function FileButton({
    field_name,
    size = 'sm',
    variant,
    style: neoStyle,
    controlSize,
    borderShape,
    icon = "Image",
    rounded = true,
    tooltip,
    source = 'library',
    ...rest
}: { field_name: any; size?: any; variant?: any; style?: any; controlSize?: any; borderShape?: any; icon?: any; rounded?: any; tooltip?: any; source?: any; [key: string]: any }) {
    const { t } = useTranslation();
    const resolved = resolveLegacyNeoButton({
        size, variant, style: neoStyle, controlSize, borderShape, rounded,
        fallbackStyle: 'borderless',
    });

    return (
        <NeoButton
            image={icon}
            style={resolved.style}
            controlSize={resolved.controlSize}
            borderShape={resolved.borderShape}
            tooltip={tooltip ?? t('Add Files')}
            onPress={() => emitter.emit(EVENTS.fieldFiles(field_name), { action: 'add', source: source })}
            {...rest}
        />
    );
}
