import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useState, useEffect, useCallback } from 'react';
import CheckBox from 'app/ui/atoms/checkbox';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'

export default function FormFieldCheckboxSet(props) {
    

    let formContext = useFormContext();
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });

    let df = Array.isArray(props.value) ? props.value.map(String): [];
    const [value, setValue] = useState(df)

    useEffect(() => {
        formContext.setValue(props.name, value)
    }, [props.name, value]);

    const setSelection = (val) => {
        if (value.includes(String(val))){
            const newValue = value.filter(item => item !== String(val));
            setValue(newValue);
        }
        else{
            setValue(prevValue => [...prevValue, String(val)]);
        }
    }

    const values = Array.isArray(props.values) ? props.values.map(obj => ({id: obj.key, label: obj.value})) : Object.entries(props.values).map(([key, value]) => ({id: key, label: value}));
    
    return (
        <Field {...props}>
            <Row className='gap-x-2 items-center'>
            {values.map((item2, index) => {
                const status = value.includes(String(item2.id)) ? 'checked' : 'unchecked';
                return (
                    <Row className='gap-x-2 items-center' key={'chk' + index}>
                        <CheckBox
                            value={value.includes(String(item2.id))}
                            status={status}
                            onPress={() => setSelection(item2.id)}
                            title={item2.label}
                        />
                    </Row>
                )
            })}
            </Row>
        </Field>
    );
}
