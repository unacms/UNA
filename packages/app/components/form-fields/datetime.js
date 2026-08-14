import Field, { getValidationRules } from './_field';
import DatePicker from 'app/ui/atoms/date-picker'
import { useFormField } from 'app/lib/hooks/use-form-field';

export default function FormFieldDatetime({ name, value = '', type, ...props }) {
    const withTime = type === 'datetime';
    let defaultValue = value;
    if ((defaultValue == '0000-00-00 00:00:00Z' || defaultValue == '') && props.required == true) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        defaultValue = date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
    }
    if (!withTime) {
        defaultValue = defaultValue.substring(0, 10);
    }

    const { field } = useFormField(
        { name, value, type, ...props },
        {
            defaultValue,
            rules: getValidationRules({ type, ...props }),
            syncValue: false,
        }
    );

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
            <DatePicker value={field.value} type={type} name={name} onChange={setParamValue} />
        </Field>
    );
}
