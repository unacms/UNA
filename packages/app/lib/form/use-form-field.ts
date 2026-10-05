import { useCallback, useEffect, useState } from 'react';
import { get, useController, useFormContext } from 'react-hook-form';
import { useGoogleAutocomplete } from '@appandflow/react-native-google-autocomplete';
import { getValidationRules, getFormFieldDomId, getFormFieldErrorDomId } from 'app/components/form-fields/_field';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { useNativeReturnKeyNav } from 'app/context/form-focus-chain';

export const PLACEHOLDER_TEXT_COLOR = '#6b7280';

const EMPTY_RULES = {};
const adaptiveEnabled = Boolean(appSetting('forms', 'adaptive_labels'));

/**
 * Shared RHF wiring for UNA form fields.
 *
 * @param {object} props UNA input JSON (name, value, caption, placeholder, attrs, …)
 * @param {object} [options]
 * @param {*} [options.defaultValue] Override RHF default (price, checkbox-set, …)
 * @param {object} [options.rules] RHF rules; defaults to {}
 * @param {boolean} [options.syncValue=true] Mirror `props.value` into RHF when it changes
 */
export type FormFieldOptions = {
    /** Initial value when `props.value` is empty. */
    defaultValue?: any;
    /** react-hook-form rules; defaults to {}. */
    rules?: Record<string, any>;
    /** Mirror `props.value` into the form when it changes (default true). */
    syncValue?: boolean;
    /** Native return key: `true` always, `false` never, default only for single-line inputs. */
    returnKey?: boolean;
};

/** Forms whose initial values Form has already captured (its one-shot baseline reset). */
const baselinedForms = new WeakSet<object>();

export function markFormBaseline(control: object) {
    baselinedForms.add(control);
}

/**
 * useController for UNA fields. Field components are code-split (next/dynamic),
 * so a field can mount after Form captured its initial values. Such a field
 * takes its current value as its default — otherwise its own mount-time sync
 * (list JSON, files ids, …) compares against `undefined` and the untouched form
 * trips the unsaved-changes close guard. Call before the field's own effects.
 */
export function useFieldController(params: Parameters<typeof useController>[0]) {
    const controller = useController(params);
    const { control, resetField, getValues } = useFormContext();
    const { name } = params;

    useEffect(() => {
        if (!name || !baselinedForms.has(control)) return;
        if (get(control._defaultValues, name) !== undefined) return;
        resetField(name, { defaultValue: getValues(name), keepError: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [control, name]);

    return controller;
}

export function useFormField(props: any, options: FormFieldOptions = {}) {
    const { setValue, getValues } = useFormContext();
    const name = props.name || '';
    const value = props.value;
    const defaultValue =
        options.defaultValue !== undefined
            ? options.defaultValue
            : value
              ? value
              : '';
    const rules = options.rules ?? EMPTY_RULES;
    const syncValue = options.syncValue !== false;

    const { field } = useFieldController({ name, rules, defaultValue });
    const { onBlur: fieldOnBlur } = field;

    const isAdaptiveLabel =
        !!props.use_caption_as_placeholder && adaptiveEnabled && !!props.caption;
    const placeholder = isAdaptiveLabel
        ? ''
        : props.use_caption_as_placeholder
          ? props.caption
          : props.placeholder;
    const readOnly =
        props?.attrs?.readonly == 'readonly' ||
        props?.attrs?.disabled == 'disabled';

    const [focused, setFocused] = useState(false);
    const onFocus = useCallback(() => setFocused(true), []);
    const onBlur = useCallback(
        (event: any) => {
            setFocused(false);
            // RHF's onBlur takes no args; the event is passed as before (ignored).
            (fieldOnBlur as (event?: unknown) => void)(event);
        },
        [fieldOnBlur]
    );

    useEffect(() => {
        if (!syncValue || value === undefined) return;
        if (getValues(name) === value) return;
        setValue(name, value);
    }, [syncValue, name, value, getValues, setValue]);

    const skipReturnKey =
        options.returnKey === false ||
        props.type === 'value' ||
        (options.returnKey !== true &&
            props.type !== 'text' &&
            props.type !== 'password');
    const { inputRef, returnKeyProps } = useNativeReturnKeyNav(
        skipReturnKey ? null : name,
        props.handleSubmit
    );

    const fieldErrorText = Array.isArray(props.error) ? props.error[0] : props.error;
    const invalid = !!fieldErrorText;

    return {
        name,
        field,
        placeholder,
        readOnly,
        placeholderTextColor: PLACEHOLDER_TEXT_COLOR,
        isAdaptiveLabel,
        focused,
        onFocus,
        onBlur,
        inputRef,
        returnKeyProps,
        inputId: getFormFieldDomId(name),
        errorId: invalid ? getFormFieldErrorDomId(name) : undefined,
        invalid,
    };
}

/**
 * RHF wiring for rich-text editors (tentap / enriched).
 * `syncValue` stays off: engines push normalized HTML themselves and re-baseline
 * the first emission so an untouched form is not dirty.
 */
export function useEditorFormField(props: any) {
    return useFormField(props, {
        rules: getValidationRules(props),
        returnKey: false,
        syncValue: false,
    });
}

const GOOGLE_AUTOCOMPLETE_OPTIONS = {
    language: 'en',
    debounce: 300,
    proxyUrl: '/api.php?goo=list&',
};

const SUFFIX_FIELDS = [
    ['_country', 'country'],
    ['_state', 'state'],
    ['_city', 'city'],
    ['_zip', 'zip'],
    ['_lat', 'lat'],
    ['_lng', 'lng'],
    ['_street', 'street'],
    ['_street_number', 'street_number'],
];

const EMPTY_LOCATION = {
    location_string: '',
    lat: '',
    lng: '',
    street: '',
    street_number: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
};

function locationStringOf(place: any) {
    if (!place || typeof place !== 'object') return '';
    return place.location_string || place.formattedAddress || '';
}

function toOnChangePayload(place: any) {
    const locationString = locationStringOf(place);
    return {
        location_string: locationString,
        lat: place.lat,
        lng: place.lng,
        street: place.street,
        street_number: place.street_number,
        city: place.city,
        state: place.state,
        country: place.country,
        zipCode: place.zip,
    };
}

/**
 * Shared Google Places + RHF suffix wiring for location / location_radius fields.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {object} [options.value]
 * @param {function} [options.onChange]
 * @param {boolean} [options.syncName=true] Write the formatted address to `name`
 * @param {string[]} [options.extraSuffixes] Extra RHF keys to unregister on clear (`_rad`)
 */
export function useLocationField({
    name,
    value,
    onChange,
    syncName = true,
    extraSuffixes = [],
}: { name: string; value: any; onChange: any; syncName?: any; extraSuffixes?: any }) {
    const [selectionMade, setSelectionMade] = useState(false);
    const formContext = useFormContext();
    const defaultValue = value ? value : '';
    const { field } = useFieldController({ name, rules: {}, defaultValue });
    const {
        locationResults,
        searchError,
        term,
        setTerm,
        clearSearch,
    } = useGoogleAutocomplete('', GOOGLE_AUTOCOMPLETE_OPTIONS);

    const incoming = locationStringOf(value);

    const applyPlace = useCallback((place: any) => {
        const locationString = locationStringOf(place);
        if (syncName) formContext?.setValue(name, locationString);
        SUFFIX_FIELDS.forEach(([suffix, key]) => {
            formContext?.setValue(name + suffix, place[key!]);
        });
        onChange?.(toOnChangePayload(place));
        setTerm(locationString);
    }, [formContext, name, onChange, setTerm, syncName]);

    useEffect(() => {
        if (!incoming) return;
        applyPlace(value);
        setSelectionMade(true);
    }, [incoming]);

    useEffect(() => {
        if (incoming || field.value) return;
        setTerm('');
        SUFFIX_FIELDS.forEach(([suffix]) => {
            formContext?.unregister(name + suffix);
        });
        extraSuffixes.forEach((suffix: string) => {
            formContext?.unregister(name + suffix);
        });
        onChange?.(EMPTY_LOCATION);
    }, [field.value]);

    const onSelect = async (placeId: number | string) => {
        try {
            const res = await fetcher(`/api.php?goo=place&place_id=${placeId}`);
            applyPlace(res);
            setSelectionMade(true);
        } catch (err) {
            console.warn('Error fetching details:', err);
        }
        clearSearch();
    };

    const onChangeText = (text: string) => {
        setTerm(text);
        setSelectionMade(false);
    };

    const setRadius = (radius: number) => {
        formContext?.setValue(name + '_rad', radius);
    };

    return {
        term,
        searchError,
        locationResults,
        selectionMade,
        onChangeText,
        onSelect,
        setRadius,
    };
}
