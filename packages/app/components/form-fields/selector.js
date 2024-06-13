import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useState, useRef, useEffect, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import CheckBox from 'app/ui/atoms/checkbox';
import { Button, Input } from "app/design/controls";
import { BottomSheetData } from 'app/context/bottomsheet';
import RadioButton from 'app/ui/atoms/radiobutton';

export default function (props) {

    const rules = {};
    const defaultValue = props.value ? props.value.map(Number) : '';
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

    const dataFlat = props.values.map(obj => ({ ...obj, key: Number(obj.key) }));

    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose', showClose: true, content: <ChkList values={dataFlat} selectedValues={field.value} setFormValue={setFormValue} /> });
    }

    let styles = "justify-start pr-4";
    if (props.align == 'right')
        styles += 'justify-end pl-4';
    console.log("field.valuefield.value", field.value, dataFlat.filter(item => field.value.includes(item.key)))
    return (
        <Field {...props}>
            <View className='w-full justify-between '>
                <View className={styles + ' w-full flex-auto  items-center flex-row flex-wrap my-2'}>
                    {props.align == 'right' && <Button
                        startDecorator="Plus"
                        variant="text"
                        size="base"
                        onPress={() => showSelect()}
                    />}
                    {!!field.value && dataFlat.filter(item => field.value.includes(item.key)).map((item, index) => (
                        <View className='m-1' key={'label' + index}>
                            <Button
                                endDecorator="X"
                                variant={"outline"}
                                size="sm"
                                title={item.value}
                                onPress={() => removeValue(item.key)}
                            />
                        </View>
                    )
                    )}
                    {props.align != 'right' && <Button
                        startDecorator="Plus"
                        variant="text"
                        size="sm"
                        title='Add'
                        onPress={() => showSelect()}
                    />}
                </View>
            </View>
        </Field>
    );
}

function ChkList({ values, selectedValues, setFormValue }) {
    const [value2, setValue2] = useState(selectedValues)
    const [inputValue, setInputValue] = useState('');
    const addValue2 = (value) => {
        const selectedValues = value2.includes(value)
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }

    let filtred = values;
    if (inputValue)
        filtred = values.filter(item => item.value.toLowerCase().includes(inputValue.toLowerCase()));
    return (
        <View className='px-2'>
            {
                values.length > 10 && (<View className='py-2'>
                    <Input name="search" placeholder={'Search...'} defaultValue={inputValue}
                        onChangeText={(value) => {
                            setInputValue(value)
                        }}
                    />
                </View>)
            }
            <ScrollView className='h-72'>
                {filtred.map((item2, index) => (
                    <Pressable key={`lbl-${index}`} onPress={() => addValue2(item2.value)}>
                        <Row className='items-center my-1 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20' key={'chk' + index}>
                            <RadioButton
                                value={item2.key}
                                status={value2.includes(item2.key) ? 'checked' : 'unchecked'}
                                onPress={() => { addValue2(item2.key); }}
                            />
                            <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.value}</Text>
                        </Row>
                    </Pressable>
                ))}

            </ScrollView>
            <View className='pb-2 justify-end items-start'>
                <Button
                    title='Save'
                    variant="default"
                    size="base"
                    onPress={() => setFormValue(value2)}
                />
            </View>
        </View>
    );
}
