import { components } from 'app/components/registry';
import { componentsMapDefault } from 'app/components/form-fields/_map';
import { strToObj } from 'app/lib/util/object';
import { FILES_FIELD_MIRRORS, resolveFormFieldType } from 'app/lib/form/form-helpers';

/**
 * Initial (untouched) RHF value of each core form field type, built from the
 * UNA input. One source of truth for both sides:
 *   - Form sets them as the form's default values as soon as the form data
 *     arrives, before code-split fields (next/dynamic) have even loaded, so
 *     `isDirty` never depends on when a field mounts;
 *   - field components take their `defaultValue` from the same function, so
 *     whatever a field writes on mount equals the default and is not a change.
 *
 * A type is covered only while the registry still renders the core component
 * for it. Types not covered here (fork overrides, input_set, *_translatable,
 * custom, …) keep their own defaults and are baselined when they mount
 * (useFieldController).
 */

type Input = Record<string, any>;
type InitialValues = Record<string, any>;

/** Fields that mirror `props.value` into the form (useFormField with syncValue). */
export const syncedInitialValue = (value: any) => (value === undefined ? '' : value);

/** Fields that keep their own value after mount (useFormField with syncValue: false). */
export const ownInitialValue = (value: any) => (value ? value : '');

/** UNA may send `null`, a scalar, or `{ value, currency }`. Form submits a scalar string. */
export function normalizePriceValue(value: any) {
    if (value == null || value === '') return '';
    if (typeof value === 'object') {
        const amount = value.value;
        if (amount == null || amount === '') return '';
        return String(amount);
    }
    return String(value);
}

export function switcherInitialValue(input: Input) {
    return input.checked ? 1 : 0;
}

export function stringArrayInitialValue(value: any) {
    return Array.isArray(value) ? value.map(String) : [];
}

export function selectorInitialValue(value: any) {
    if (!value) return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
}

export function doubleRangeInitialValue(input: Input) {
    const { value, attrs } = input;
    return typeof value === 'string' && value !== '' ? value : `${attrs?.min}-${attrs?.max}`;
}

export function datetimeInitialValue(input: Input) {
    const withTime = input.type === 'datetime';
    let value = input.value ?? '';
    if ((value == '0000-00-00 00:00:00Z' || value == '') && input.required == true) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        value = date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
    }
    return withTime ? value : String(value).substring(0, 10);
}

/** `list` rows: saved non-empty rows, or one empty row of `params.fields`. */
export function listInitialRows(input: Input): Record<string, string>[] {
    const params = strToObj(input.params) || {};
    const createEmpty = () =>
        Object.fromEntries((params.fields || []).map((f: any) => [f.name, '']));
    return input.value
        ? (strToObj(input.value) || []).filter((row: any) =>
              Object.values(row).some((val) => val !== '')
          )
        : [createEmpty()];
}

type MultiFieldRow = { id: number; value: any };

/** `multi_field` rows: saved values with their ids, or `minCount` new rows (negative ids). */
export function multiFieldInitialRows(input: Input): MultiFieldRow[] {
    if (input.value_ids) {
        return input.value_ids.map((id: number, index: number) => ({ id, value: input.value[index] }));
    }
    const now = Date.now();
    return Array.from({ length: input.minCount || 2 }, (_, i) => ({ id: -(now + i), value: '' }));
}

/** Form values of `multi_field` rows: `name` holds the values, `name_ids` the saved ids. */
export function multiFieldFormValues(name: string, rows: MultiFieldRow[]) {
    return {
        [name]: rows.map((row) => row.value).join(','),
        [name + '_ids']: rows.filter((row) => row.id >= 0).map((row) => row.id).join(','),
    };
}

/** Comma-separated ids of uploaded files (tiles still uploading have no file_id). */
export function filesFieldValue(images: any[]) {
    return images
        .filter((item) => item.file_id !== undefined)
        .map((item) => item.file_id)
        .join(',');
}

export const LOCATION_SUFFIX_FIELDS = [
    ['_country', 'country'],
    ['_state', 'state'],
    ['_city', 'city'],
    ['_zip', 'zip'],
    ['_lat', 'lat'],
    ['_lng', 'lng'],
    ['_street', 'street'],
    ['_street_number', 'street_number'],
] as const;

export function locationStringOf(place: any) {
    if (!place || typeof place !== 'object') return '';
    return place.location_string || place.formattedAddress || '';
}

/** Form values a place writes: the address (`syncName`) and the `_country`, `_lat`, … parts. */
export function locationFormValues(name: string, place: any, syncName: boolean) {
    const values: InitialValues = {};
    if (syncName) values[name] = locationStringOf(place);
    LOCATION_SUFFIX_FIELDS.forEach(([suffix, key]) => {
        values[name + suffix] = place?.[key] ?? '';
    });
    return values;
}

function locationInitialValues(input: Input, syncName: boolean) {
    const { name, value } = input;
    const base = { [name]: ownInitialValue(value) };
    if (!locationStringOf(value)) return base;
    return { ...base, ...locationFormValues(name, value, syncName) };
}

const single = (fn: (input: Input) => any) => (input: Input) => ({ [input.name]: fn(input) });
const synced = single((input) => syncedInitialValue(input.value));
const own = single((input) => ownInitialValue(input.value));

const INITIAL_VALUES_BY_TYPE: Record<string, (input: Input) => InitialValues> = {
    text: synced,
    password: synced,
    hidden: synced,
    submit: synced,
    button: synced,
    phone: synced,
    value: synced,
    select: synced,
    radio_set: synced,
    suggestion: synced,
    visibility: synced,
    initial_members: synced,
    labels: synced,
    mood: synced,
    embed: synced,
    polls: own,
    textarea: (input) =>
        // Rich text (html 1-3) goes through the editor engines: no props.value sync.
        ({ [input.name]: [1, 2, 3].includes(Number(input.html)) ? ownInitialValue(input.value) : syncedInitialValue(input.value) }),
    editor: (input) =>
        ({ [input.name]: [1, 2, 3].includes(Number(input.html)) ? ownInitialValue(input.value) : syncedInitialValue(input.value) }),
    textarea_markdown: single((input) => input.value ?? ''),
    markdown: single((input) => input.value ?? ''),
    switcher: single(switcherInitialValue),
    checkbox: single(switcherInitialValue),
    price: single((input) => normalizePriceValue(input.value)),
    checkbox_set: single((input) => stringArrayInitialValue(input.value)),
    selector: single((input) => selectorInitialValue(input.value)),
    select_multiple: single((input) => selectorInitialValue(input.value)),
    doublerange: single(doubleRangeInitialValue),
    datetime: single(datetimeInitialValue),
    datepicker: single(datetimeInitialValue),
    list: single((input) => JSON.stringify(listInitialRows(input))),
    multi_field: (input) => multiFieldFormValues(input.name, multiFieldInitialRows(input)),
    location: (input) => locationInitialValues(input, true),
    location_radius: (input) => locationInitialValues(input, false),
    files: (input) => {
        const images = input.values_src;
        const ids = images ? filesFieldValue(images) : '';
        const mirror = images && FILES_FIELD_MIRRORS[input.name];
        return mirror ? { [input.name]: ids, [mirror]: ids } : { [input.name]: ids };
    },
};

/**
 * Initial values of every core field in `inputs` (UNA inputs map after Form's
 * processing). Files mirrors (`covers` → `thumb`) win over the mirrored input,
 * as the files field writes them on mount.
 */
export function getFormInitialValues(inputs: Record<string, Input> | null | undefined): InitialValues {
    if (!inputs) return {};
    const values: InitialValues = {};
    const mirrors: InitialValues = {};
    for (const input of Object.values(inputs)) {
        if (!input?.name) continue;
        const type = resolveFormFieldType(input);
        const getValues = INITIAL_VALUES_BY_TYPE[type];
        const registered = (components as any)['form-field'][type];
        if (!getValues || registered !== (componentsMapDefault as any)[type]) continue;
        const fieldValues = getValues(input);
        Object.assign(type === 'files' ? mirrors : values, fieldValues);
    }
    return { ...values, ...mirrors };
}
