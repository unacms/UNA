import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useRef, useEffect, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import CheckBox from 'app/ui/atoms/checkbox';
import { Button } from "app/design/controls";
import { BottomSheetData } from 'app/context/bottomsheet';
import RadioButton from 'app/ui/atoms/radiobutton';

export default function(props) {

    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);

    const setFormValue = (value) => {
        value = value.filter(item => item);
        field.onChange(value);
        setBottomSheetData(false);
    }
    const removeValue = (valueToRemove) => {
        const newValue = field.value.filter(item => item !== valueToRemove);
        field.onChange(newValue);
    }

    const dataFlat = [...props.values.system, ...props.values.context].flatMap(item =>
        item.subitems ? [item, ...item.subitems] : item
    );

    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose labels', showClose: true, content: <ChkList values={dataFlat} selectedValues={field.value} setFormValue={setFormValue}></ChkList> });
    }
    //Selected: ' + field.value.length 
    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className='w-full '>
                <Row className='gap-x-2  justify-end items-center flex-row flex-wrap'>
                    <View className='my-1'><Button
                        title={'Select ...'}
                        startDecorator="Plus"
                        variant="default"
                        size="sm"
                        onPress={() => showSelect()}
                    /></View>
                    {!!field.value && field.value.map((item, index) => (
                        <View className='my-1' key={'label' + index}>
                            <Button
                                endDecorator="X"
                                variant={"outline"}
                                size="sm"
                                title={item}
                                onPress={() => removeValue(item)}
                            />
                        </View>
                    )
                    )}
                </Row>
            </View>
        </Field>
    );
}

function ChkList({ values, selectedValues, setFormValue }) {
    const [value2, setValue2] = useState(selectedValues)

    const addValue2 = (value) => {
        const selectedValues = value2.includes(value)
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }
/*
<CheckBox
                        value={value2.includes(item2.value)}
                        onValueChange={() => addValue2(item2.value)}
                    />*/
    return (
        <>
            {values.map((item2, index) => (
                <Row className='items-center' key={'chk' + index}>
                    
                    <RadioButton
                        value={item2.value}
                        status={value2.includes(item2.value) ? 'checked' : 'unchecked'}
                        onPress={() => { addValue2(item2.value); }}
                    />
                    <Pressable onPress={() => addValue2(item2.value)}><Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.value}</Text></Pressable>
                </Row>
            ))}
            <View className='pt-2'>
                <Button
                    title='Save'
                    variant="outline"
                    size="sm"
                    onPress={() => setFormValue(value2)}
                />
            </View>
        </>
    );
}
