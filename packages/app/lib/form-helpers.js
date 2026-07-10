
import { Platform } from 'react-native';
import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'
import { Button, NeoButton } from "app/design/controls";
import emitter from 'app/context/emitter';

const isWeb = Platform.OS === 'web';
const dirtyFormInstances = new Set();

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

/** True when the server response means the form flow is finished (close modal, refresh parent). */
export function isFormResponseComplete(responseData) {
    if (responseData == null) return true;

    if (Array.isArray(responseData)) {
        if (responseData.length === 0) return true;
        if (responseData.some((item) => item?.reload)) return true;
        return !responseData.some((item) => item?.type === 'form');
    }

    if (typeof responseData === 'object') {
        if (responseData.reload) return true;
        if (responseData.type === 'form') return false;
        return true;
    }

    return true;
}

export function getFormFieldByData(inputData, handleSubmit, format, externalProps) {

    if (!inputData)
        return <></>;
    const InputType = getComponent('form-field', String(inputData.type));
    if (!InputType)
        return <Text>Unsupported field type: {JSON.stringify(inputData)}</Text>
    const fallbackKey = inputData.name || inputData.key || `${inputData.type}_${inputData.caption || 'field'}`;
    return <InputType key={fallbackKey} {...inputData} format={format} handleSubmit={handleSubmit} {...externalProps} />;

}

export function getHiddenFields(inputs, handleSubmit) {
    return Object.keys(inputs)
        .map((key) => {
            if (inputs[key].type === "hidden") {
                return getFormFieldByData(inputs[key], handleSubmit, 'nofield');
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
