import Field, {getValidationRules} from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useEffect, useRef } from 'react';

export default function FormFieldText(props) {
    const inputRef = useRef(null);

    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const rules = getValidationRules(props);
    
    const formContext = useFormContext();
    
    const { field } = useController({ name, rules, defaultValue });
    
    useEffect(() => {
        if (props.value !== undefined)
           formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    useEffect(() => {
        if (inputRef.current && props.autoFocus) {
            inputRef.current.focus();
    }
    }, []);

    if (props.use_caption_as_placeholder)
        props.placeholder = props.caption;

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Input 
                 ref={inputRef}
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
