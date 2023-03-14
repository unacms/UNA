import React, { useState } from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'
import { useController, useFormContext, ControllerProps, UseControllerProps } from 'react-hook-form';
import { Hidden , Select } from 'app/design/controls'
import { View } from 'app/design/view';



export default function FormFieldSelect(props) {

    let values = Array.isArray(props.values)? props.values : Object.keys(props.values).map((k) => props.values[k]);

    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = values[0];
    const [value, setValue] = useState(defaultValue)
    
    const { field } = useController({ name, rules, defaultValue });

    setTimeout(() => {
        formContext.setValue(props.name, value)
    }, 100);
    
    return (
        <Field {...props}>
            <Select defaultButtonText={ props.defaultButtonText ? props.defaultButtonText: "Please select" }
                data={values}
                onSelect={(selectedItem, index) => {
                    setValue(selectedItem);
                    props.handleChange
                }}
            />
            <Hidden 
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                defaultValue={defaultValue}
            />
        </Field>
    );
}
