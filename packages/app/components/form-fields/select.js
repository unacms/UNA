import React, { useState } from 'react';
import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import Dropdown from 'app/ui/atoms/dropdown'

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
            if (typeof props.values[key] == 'string')
                return {label: props.values[key], value: key}
            else{
                return {label: props.values[key].value, value: props.values[key].key}
            }
                
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
                onChange={setValue}
                value={value}
                data={values}
            />
        </Field>
    );
}
