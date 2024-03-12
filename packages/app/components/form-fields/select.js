import { useState, useEffect } from 'react';
import Field, {getValidationRules} from './_field';
import { useFormContext, useController } from 'react-hook-form';
import Dropdown from 'app/ui/atoms/dropdown'

export default function (props) {
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

    const values = getVisibilityValues(props.values);

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

export function getVisibilityValues(valuesIn){
    let values = [];
    if (!Array.isArray(valuesIn)){
        values = Object.keys(valuesIn).map(function (key) {
            
            if (typeof valuesIn[key] == 'string')
                return {label: valuesIn[key], value: key}
            else{
                return {label: valuesIn[key].value, value: valuesIn[key].key}
            }
                
        }); 
    }
    if (Array.isArray(valuesIn)){
        values = valuesIn.map(function (key) {
            if (typeof key == 'string'){
                return {label: key, value: key};
            }
            else{
                return key.value ? {label: key.value, value: key.key} : null
            }
            
        }); 
        values = values.filter(Boolean);
    }
    return values;
}
