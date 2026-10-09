import Field, { getValidationRules } from './_field';
import DatePicker from 'app/ui/atoms/date-picker'
import { useFormField } from 'app/lib/form/use-form-field';
import { datetimeInitialValue } from 'app/lib/form/field-initial-values';

export default function FormFieldDatetime({ name, value = '', type, ...props }) {
    const defaultValue = datetimeInitialValue({ value, type, required: props.required });

    const { field } = useFormField(
        { name, value, type, ...props },
        {
            defaultValue,
            rules: getValidationRules({ type, ...props }),
            syncValue: false,
        }
    );

    // UNA passes the lower bound as the input's `min` attr (unix ts or date string)
    const min = props?.attrs?.min;
    let minDate = min ? new Date(/^\d+$/.test(String(min)) ? Number(min) * 1000 : String(min).replace(' ', 'T')) : undefined;
    if (minDate && isNaN(minDate)) minDate = undefined;

    const setParamValue = (next) => {
        const date = new Date(next * 1000);
        if (props?.db?.pass == 'Date' || props?.db?.pass == 'DateTs') {
            field.onChange(
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            );
            return;
        }
        field.onChange(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00Z`
        );
    };

    return (
        <Field {...props} name={name} type={type}>
            <DatePicker value={field.value} type={type} name={name} minDate={minDate} disabled={!!props?.attrs?.disabled} onChange={setParamValue} />
        </Field>
    );
}
