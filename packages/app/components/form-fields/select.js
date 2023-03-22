import React, { useState } from 'react';
import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Dropdown } from 'app/design/controls'

export default function FormFieldSelect(props) {

    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value;
    const [value, setValue] = useState(defaultValue)
    
    const { field } = useController({ name, rules, defaultValue });

    setTimeout(() => {
        formContext.setValue(props.name, value)
    }, 100);

    let values = [];
    if (!Array.isArray(props.values)){
        values = Object.keys(props.values).map(function (key) {
            return {label: props.values[key], value: key}
        }); 
    }
    if (Array.isArray(props.values)){
        values = props.values.map(function (key) {
            return key.value ? {label: key.value, value: key.key} : null
        }); 
        values = values.filter(Boolean);
    }

    return (
        <Field {...props}>
            <Dropdown 
                labelField="label"
                valueField="value"
                onChange={item => {
                    setValue(item.value);
                }}
                value={value}
                data={values}
            />
        </Field>
    );
}
