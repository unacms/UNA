import { useState, useEffect } from 'react';
import Field, {getValidationRules} from './_field';
import { useFormContext, useController } from 'react-hook-form';
import Dropdown from 'app/ui/atoms/dropdown'

export default function FormFieldSelect(props) {
    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    let defaultValue = props?.value ? props.value : '';
    const [value, setValue] = useState(defaultValue)
    
    const { field } = useController({ name, rules, defaultValue });

    useEffect(() => {
        if (value != field.value)
            field.onChange(value);
    }, [value]);

    const setValueF = (val) =>
    {
        setValue(val);
        if (props.onChange){
            props.onChange(val)
        }
    }

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
            if (typeof key == 'string'){
                return {label: key, value: key};
            }
            else{
                return key.value ? {label: key.value, value: key.key} : null
            }
            
        }); 
        values = values.filter(Boolean);
    }

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
           <Dropdown 
                labelField="label"
                valueField="value"
                onChange={setValueF}
                value={value}
                data={values}
            />
        </Field>
    );
}
