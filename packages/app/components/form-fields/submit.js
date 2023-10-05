import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'

export default function FormFieldSubmit(props) {
    
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value;
    
    const { field } = useController({ name, rules, defaultValue });
    return (
        <Field  {...props}>
            <Button
                title={!props.icon_only ? props.value : ''}
                variant={!!props.variant ? props.variant : 'primary'} 
                fullWidth
                onPress={props.handleSubmit}
                startDecorator={props.icon}
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