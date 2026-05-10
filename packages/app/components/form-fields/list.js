import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'app/design/controls'
import { View, Row, Pressable } from 'app/design/view'
import { strToObj } from 'app/lib/util';


export default function FormFieldMultiField(props) {

    const name = props.name;
    const params = strToObj(props.params) || {};

    const minCount = params.minCount || 1;
    const maxCount = params.maxCount || 10;

    const createEmpty = () => {
        const keys = (params.fields || []).map(f => f.name);
        return keys.reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
    }

    const initedValue = props.value ? (strToObj(props.value) || []).filter(obj =>
        Object.values(obj).some(val => val !== '')
    ) : [createEmpty()];

    const [values, setValues] = useState(initedValue);
    const formContext = useFormContext();

    useEffect(() => {
        formContext.setValue(name, JSON.stringify(values));
    }, [props.name, values]);


    const addNew = () => {
        setValues(prev => [...prev, createEmpty()]);
    };

    const deleteValue = (index) => {
        setValues(prev => {
            const newValues = [...prev];
            newValues.splice(index, 1);
            return newValues;
        });
    };

    const setValues2 = (index, name, value) => {
        setValues(prev => {
            const newValues = [...prev];
            const updatedItem = { ...newValues[index], [name]: value };
            newValues[index] = updatedItem;
            return newValues;
        });
    };

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className='gap-y-2 sm:gap-y-3 w-full'>
                {values.map((value, index) => {
                    return (
                        <Row key={`vls${index}`} className='gap-x-2' >
                            {(params.fields || []).map((fld, index2) => {

                                return (<Input
                                    key={`fld-${fld.name}`}
                                    placeholder={fld.title}
                                    value={values[index]?.[fld.name]}
                                    onChangeText={(text) => {
                                        setValues2(index, fld.name, text);
                                    }}

                                />)
                            })}
                            {index >= minCount && <View><Button variant="secondary" onPress={() => deleteValue(index)} size="lg" startDecorator="X" /></View>}
                            {(index == 0 && values.length <maxCount ) && <View><Button variant="secondary" onPress={addNew} size="lg" startDecorator="Plus" /></View>}
                          
                        </Row>
                    )
                })}
            </View>

        </Field>
    );
}
