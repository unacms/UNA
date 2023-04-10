import React from 'react';
import Field from './_field';
import { useController, useFormContext, ControllerProps, UseControllerProps } from 'react-hook-form';
import { Hidden } from 'app/design/controls'

export default function FormFieldHidden(props) {
    
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name ? props.name : '';
    let defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });
    
    return (
        <Hidden 
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
        />
    );
}
