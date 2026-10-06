import { components, coreFormFields } from 'app/components/registry';
import { FILES_FIELD_MIRRORS, resolveFormFieldType } from 'app/lib/form/form-helpers';
import {
    datetimeInitialValue,
    doubleRangeInitialValue,
    filesFieldValue,
    listInitialRows,
    locationFormValues,
    locationStringOf,
    multiFieldFormValues,
    multiFieldInitialRows,
    normalizePriceValue,
    ownInitialValue,
    selectorInitialValue,
    stringArrayInitialValue,
    switcherInitialValue,
    syncedInitialValue,
} from 'app/lib/form/field-initial-values';

/**
 * Form's default values, from the per-type initial values in
 * field-initial-values. Kept apart from those helpers because the field
 * components import them, and this part pulls in form-helpers and the
 * registry, which lead back to the fields (a require cycle).
 */

type Input = Record<string, any>;
type InitialValues = Record<string, any>;

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
        if (!getValues || registered !== (coreFormFields as any)[type]) continue;
        const fieldValues = getValues(input);
        Object.assign(type === 'files' ? mirrors : values, fieldValues);
    }
    return { ...values, ...mirrors };
}
