import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useState, useEffect, useCallback } from 'react';
import CheckBox from 'app/ui/atoms/checkbox';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util';

const themeSettings = appSetting('theme', 'checkbox_set');

export default function FormFieldCheckboxSet(props) {
    const formContext = useFormContext();
    
    const rules = {};
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });

    const df = Array.isArray(props.value) ? props.value.map(String): [];
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
            <View className={`${props.view !='column' ? 'flex-row justity-center' : 'items-start'}  ${themeSettings.container} flex-wrap`}>
            {values.map((item2, index) => {
                const status = value.includes(String(item2.id)) ? 'checked' : 'unchecked';
                return (
                    <Row className='items-center flex-wrap w-full' key={'chk' + index}>
                        <CheckBox
                            value={value.includes(String(item2.id))}
                            status={status}
                            onPress={() => setSelection(item2.id)}
                            title={item2.label}
                        />
                    </Row>
                )
            })}
            </View>
        </Field>
    );
}
