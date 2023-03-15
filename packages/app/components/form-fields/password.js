import React from 'react';
import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'


export default function FormFieldPassword(props) {
    let formContext = useFormContext();
    let { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });

    return (
        <Field {...props}>
            <Input 
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={field.value}
        />
        </Field>
    );
}
