import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'app/design/controls'
import { View, Row, Pressable } from 'app/design/view'

export default function FormFieldMultiField(props) {
    const name = props.name;
    const minCount = props.minCount || 2;
    const transformedArray = props.value_ids ? props.value_ids.map((id, index) => ({
        id,
        value: props.value[index]
    })) : makeArray(minCount);

    const [values, setValues] = useState(transformedArray);
    const formContext = useFormContext();

    useEffect(() => {
        const idsString = values.filter(item => item.id >= 0).map(item => item.id).join(',');
        const valuesString = values.map(item => item.value).join(',');
        formContext.setValue(name + '_ids', idsString);
        formContext.setValue(name, valuesString);

    }, [props.name, values]);


    function makeArray(N) {
        const t0 = Date.now();
        return Array.from({ length: N }, (_, i) => ({
            id: -(t0 + i),
            value: ''
        }));
    }

    const addNew = () => {
        setValues(prev => [...prev, { 'id': -Date.now(), value: '' }]);
    };

    const deleteValue = (id) => {
        setValues(prev => prev.filter(item => item.id !== id));
    };

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className='gap-y-2 sm:gap-y-3 w-full'>
                {values.map((value, index) => {
                    return (
                        <Row key={`vls${index}`} >
                            <Input
                                name={props.name}
                                onChangeText={(text) => {
                                    setValues(prevValues =>
                                        prevValues.map(item =>
                                            item.id === value.id ? { ...item, value: text } : item
                                        )
                                    );
                                }}
                                value={value.value}

                            />

                            {index >= minCount && <View className='pl-2'><Button variant="secondary" onPress={() => deleteValue(value.id)} size="lg" startDecorator="X" /></View>}
                            {index == minCount - 1 && <View className='pl-2'><Button variant="secondary" onPress={addNew} size="lg" startDecorator="Plus" /></View>}

                        </Row>
                    )
                })}
            </View>

        </Field>
    );
}
