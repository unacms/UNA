import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useRef, useEffect, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Modal } from "app/design/controls";
import { useBottomSheetData } from 'app/context/bottomsheet';
import CheckBox from 'app/ui/atoms/checkbox';

export default function (props) {
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const { setBottomSheetData } = useBottomSheetData();
    const [isModal, setIsModal] = useState(false);

    const setFormValue = (value) => {
        value = value.filter(item => item);
        field.onChange(value);
        setIsModal(false)
    }
    const removeValue = (valueToRemove) => {
        const newValue = field.value.filter(item => item !== valueToRemove);
        field.onChange(newValue);
    }

    const dataFlat = [...props.values.system, ...props.values.context].flatMap(item =>
        item.subitems ? [item, ...item.subitems] : item
    );

    const showSelect = (val) => {
        /*setBottomSheetData({ title: 'Choose labels', showClose: props.onShowModal ? false : true, content: <ChkList values={dataFlat} selectedValues={field.value} setFormValue={setFormValue}></ChkList> });
        if (props.onShowModal){
            props.onShowModal(false);
        }*/
        setIsModal(true);
    }

    let styles = "justify-start pr-4";
    if (props.align == 'right')
        styles += 'justify-end pl-4';

    return (
        <>
            <Modal
                title='Choose labels'
                onVisible={isModal}
                onClose={() => setIsModal(false)}
                transparent={true}
                headerBorder={true}
                scrollable={true}
            >
               
                    <ChkList values={dataFlat} selectedValues={field.value} setFormValue={setFormValue}></ChkList>


            </Modal>
            <Field {...props}>
                <View className='w-full justify-between '>
                    <View className={styles + ' w-full flex-auto  items-center flex-row flex-wrap'}>
                        {props.align == 'right' && <Button
                            startDecorator="Plus"
                            variant="text"
                            size="base"
                            onPress={() => showSelect()}
                        />}
                        {!!field.value && field.value.map((item, index) => (
                            <View className='mr-2 mt-1' key={'label' + index}>
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
                        {props.align != 'right' && <Button
                            startDecorator="Hash"
                            variant="outline"
                            size="sm"
                            title='Tags'
                            onPress={() => showSelect()}
                        />}
                    </View>
                </View>
            </Field>
        </>
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
                    <Row className='items-center my-1 px-2 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20' key={'chk' + index}>
                        <CheckBox
                            value={item2.value}
                            status={value2.includes(item2.value) ? 'checked' : 'unchecked'}
                            onPress={() => { addValue2(item2.value); }}
                            title={item2.value}
                        />
                       {/* <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.value}</Text>*/}
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
