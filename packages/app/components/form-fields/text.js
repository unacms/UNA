import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useState, useEffect, useCallback } from 'react';

export default function FormFieldText(props) {
    
    let formContext = useFormContext();
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });
    
    useEffect(() => {
        if (props.value !== undefined)
           formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    if (props.use_caption_as_placeholder)
        props.placeholder = props.caption;

    return (
        <Field {...props}>
            <Input 
                name={props.name}
                placeholder = {props.placeholder}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
                aria-label={props.caption}
                
        />
        </Field>
    );
}
