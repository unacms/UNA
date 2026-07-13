import { useState, useEffect } from 'react';
import Field, {getValidationRules} from './_field';
import { useFormContext, useController } from 'react-hook-form';
import Dropdown from 'app/ui/atoms/dropdown'
import { Row } from 'app/design/view'
import { Button } from 'app/design/controls'

export default function (props) {
    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    let defaultValue = props?.value ? props.value : '';
    const [value, setValue] = useState(defaultValue)
    
    const { field } = useController({ name, rules, defaultValue });


    useEffect(() => {
        if (value != field.value){
           
            field.onChange(value);
        }
    }, [value]);

    useEffect(() => {
        if (value != field.value){
            setValue(field.value);
        }
    }, [field.value]);

    const setValueF = (val) =>
    {
        setValue(val);
        if (props.onChange){
            props.onChange(val)
        }
    }

    const values = getVisibilityValues(props.values);

    if (props.mode == 'buttons'){
        return (
            <Field {...props} error2={formContext.formState.errors[name]}>
            <Row className='gap-x-2'>
                {values.map(item =>{
                    return <Button key={item.value} variant="outline" pressed={field.value==item.value} title={item.label} onPress={() =>{setValueF(item.value)}}/>   
                })}
            </Row>
            </Field>
        );
    }

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
           <Dropdown 
                disabled={props?.attrs?.readonly == 'readonly' || props?.attrs?.disabled == 'disabled' || props.type == "value"}
                
                labelField="label"
                valueField="value"
                onChange={setValueF}
                value={value}
                data={values}
                size={props.size}
            />
        </Field>
    );
}

export function getVisibilityValues(valuesIn){
    if (valuesIn == null) {
        return [];
    }

    let values = [];
    if (!Array.isArray(valuesIn)){
        values = Object.keys(valuesIn).map(function (key) {
            
            if (typeof valuesIn[key] == 'string')
                return {label: valuesIn[key], value: key}
            else{
                return {label: valuesIn[key].value, value: valuesIn[key].key,  icon: valuesIn[key].icon}
            }
                
        }); 
    }
    if (Array.isArray(valuesIn)){
        values = valuesIn.map(function (key) {
            if (typeof key == 'string'){
                return {label: key, value: key};
            }
            else{
                return key.value ? {label: key.value, value: key.key, icon: key.icon} : null
            }
            
        }); 
        values = values.filter(Boolean);
    }
    
    return values;
}
