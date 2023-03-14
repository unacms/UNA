import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'
import { useController, useFormContext, ControllerProps, UseControllerProps } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import {Controller} from 'react-hook-form';
import { View } from 'app/design/view';

export default function FormFieldSubmit(props) {
    
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value;
    
    const { field } = useController({ name, rules, defaultValue });
    
    return (
        <Field {...props}>
            <Button
                title={!props.rounded ? props.value : ''}
                variant='primary' fullWidth
                onPress={props.handleSubmit}
                startDecorator={props.icon}
                rounded={props.rounded}
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