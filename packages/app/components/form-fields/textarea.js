import Field, {getValidationRules} from './_field';
import FormFieldMent from './textareaMent';
import { useController,useFormContext } from 'react-hook-form';
import { InputMulti, Input } from 'app/design/controls'
import { useState, useEffect } from 'react';

export default function FormFieldText(props) {
    
    const rules = getValidationRules(props);
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const formContext = useFormContext();
    const accessibility = props.caption.length > 0 ? props.caption : 'text';
    
    let input = <InputMulti
        multiline
        
        numberOfLines={4}
        name={props.name}
        placeholder = {props.placeholder}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
        aria-label={accessibility}
    />
    if (props.autoheight)
        input = <Input
            multiline
            
            style={{height: height}}
            numberOfLines={props.numLines ? props.numLines : 4}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? 70 : e.nativeEvent.contentSize.height < 42 ? 42 : e.nativeEvent.contentSize.height)}
            name={props.name}
            placeholder = {props.placeholder}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
          
        />

    if (props.html == 2 || props.html == 3){
        input =  <FormFieldMent  {...props} />;
    }    


    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            {input}
        </Field>
    );
}
