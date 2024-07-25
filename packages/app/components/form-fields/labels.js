import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useRef, useEffect, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import CheckBox from 'app/ui/atoms/checkbox';
import { Button } from "app/design/controls";
import { useBottomSheetData } from 'app/context/bottomsheet';
import RadioButton from 'app/ui/atoms/radiobutton';

export default function (props) {
    console.log("propsprops", props)
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const { setBottomSheetData } = useBottomSheetData();

    const setFormValue = (value) => {
        value = value.filter(item => item);
        field.onChange(value);
        setBottomSheetData(false);
        if (props.onShowModal){
            props.onShowModal(true);
        }
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
        if (props.onShowModal){
            props.onShowModal(false);
        }
    }

    let styles = "justify-start pr-4";
    if (props.align == 'right') 
        styles += 'justify-end pl-4';

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
                    {!!field.value && field.value.map((item, index) => (
                        <View className='m-1' key={'label' + index}>
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
                    {props.align !='right' && <Button
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
                <Pressable key={`lbl-${index}`} onPress={() => addValue2(item2.value)}>
                    <Row className='items-center my-1 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20' key={'chk' + index}>
                        <RadioButton
                            value={item2.value}
                            status={value2.includes(item2.value) ? 'checked' : 'unchecked'}
                            onPress={() => { addValue2(item2.value); }}
                        />
                        <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.value}</Text>
                    </Row>
                </Pressable>
            ))}
            <View className='pt-2'>
                <Button
                    title='Save'
                    variant="default"
                    size="base"
                    onPress={() => setFormValue(value2)}
                />
            </View>
        </>
    );
}
