import { strToObj } from 'app/lib/util/object';

/**
 * Initial (untouched) RHF value of each core form field type, built from the
 * UNA input (Form collects them in form-initial-values). One source of truth
 * for both sides:
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
    // value may come as a unix timestamp - convert it to the 'YYYY-MM-DD HH:MM:SSZ' string the picker expects
    if (typeof value === 'number' || /^\d+$/.test(String(value))) {
        const ts = Number(value);
        if (ts > 0) {
            const date = new Date(ts * 1000);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            value = date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
        } else {
            value = '';
        }
    }
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
