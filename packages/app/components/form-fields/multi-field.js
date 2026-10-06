import Field from './_field';
import { useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useEffect, useState } from 'react';
import { NeoButton } from 'app/design/controls'
import { useTranslation } from 'react-i18next';
import { View, Row } from 'app/design/view';
import { multiFieldFormValues, multiFieldInitialRows } from 'app/lib/form/field-initial-values';

export default function FormFieldMultiField(props) {
    const { t } = useTranslation();
    const name = props.name;
    const minCount = props.minCount || 2;

    const [values, setValues] = useState(() => multiFieldInitialRows(props));
    const formContext = useFormContext();

    useEffect(() => {
        // Rows start equal to the form default — write user edits only.
        Object.entries(multiFieldFormValues(name, values)).forEach(([key, val]) => {
            if (formContext.getValues(key) !== val) formContext.setValue(key, val);
        });
    }, [props.name, values]);

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

                            {index >= minCount && <View className='pl-2'><NeoButton onPress={() => deleteValue(value.id)} controlSize="large" image="X" accessibilityLabel={t('Remove')} /></View>}
                            {index == minCount - 1 && <View className='pl-2'><NeoButton onPress={addNew} controlSize="large" image="Plus" accessibilityLabel={t('Add')} /></View>}

                        </Row>
                    )
                })}
            </View>

        </Field>
    );
}
