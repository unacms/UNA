import Field, {getValidationRules} from './_field';

import { useController, useFormContext } from 'react-hook-form';
import Calendar from 'app/ui/atoms/calendar'

export default function ({ name, value = '', type, ...props }) {
    const formContext = useFormContext();
    const rules = getValidationRules(props);

    if (value == '0000-00-00 00:00:00Z' || value == '')
        value = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z';

    const { field } = useController({ name, rules, defaultValue: value });

    const setParamValue = (value) => {
        const date = new Date(value*1000);
        if (props?.db?.pass == 'Date')
            field.onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
        else
            field.onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00Z`);
    }

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Calendar value={field.value} type={type} name={name} onChange={(value) => { setParamValue(value)}}/>
        </Field>
    );
}
