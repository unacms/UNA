import { useController, useFormContext } from 'react-hook-form';
import { Hidden } from 'app/design/controls'
import { useEffect } from 'react';

export default function FormFieldHidden(props) {
    
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name ? props.name : '';
    let defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });

      useEffect(() => {
            if (props.value !== undefined)
               formContext.setValue(props.name, props.value)
        }, [props.name, props.value]);
    
    return (
        <><Hidden 
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={String(field.value)}
        /></>
    );
}
