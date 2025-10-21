import Field from './_field';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useState, useMemo, useCallback, useContext } from 'react';
import { useController } from 'react-hook-form';
import { Button, Input, Modal } from "app/design/controls";
import CheckBox from 'app/ui/atoms/checkbox';
import RadioButton from 'app/ui/atoms/radiobutton';
import { Text } from 'app/design/typography';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs');

function ChkList({ values, value2, addValue2, isMultiple }) {
    const [inputValue, setInputValue] = useState('');

    const filteredValues = useMemo(() => {
        return inputValue
            ? values.filter(item => item.value.toLowerCase().includes(inputValue.toLowerCase()))
            : values;
    }, [inputValue, values]);

    const Cnt = isMultiple ? CheckBox : RadioButton;
    const { t } = useTranslation();
    return (
        <View className='flex-1'>
            {
                values.length > 10 && (<View className='pb-2'>
                    <Input name="search" placeholder={t('Search...')} defaultValue={inputValue}
                        onChangeText={(value) => {
                            setInputValue(value)
                        }}
                    />
                </View>)
            }

            {filteredValues.map((item2, index) => {
                const key = item2.key;
                return (
                    <Pressable key={`lbl-${index}`} onPress={() => addValue2(item2.value)}>
                           <Row className='items-center my-1 border border-bdr dark:border-bdr-d rounded-lg' key={'chk' + index}>
                            <Cnt
                                value={key}
                                status={value2.includes(key) ? 'checked' : 'unchecked'}
                                onPress={() => { addValue2(key); }}
                                title={item2.value}
                            />
                        </Row>
                    </Pressable>
                )
            })}
        </View>
    );
}


export default function (props) {
    const [isModal, setIsModal] = useState(false);
    const rules = {};
    const isMultiple = props.origtype == 'select' ? false : true;
    const defaultValue = props?.value ? (Array.isArray(props.value) ? props.value.map(String) : [props.value.toString()]) : '';
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const [value2, setValue2] = useState(field.value)

    const variant = props.variant || 'default';
    const size = props.size || 'base';

    const addValue2 = useCallback(
        (value) => {
            const selectedValues = value2.includes(value)
                ? (isMultiple ? value2.filter(item => item !== value) : [value])
                : (isMultiple ? [...value2, value] : [value]);

            setValue2(selectedValues);
        },
        [value2, isMultiple]
    );

    const setFormValue = useCallback(
        (value) => {
            const filteredValue = value.filter(item => item);
            field.onChange(filteredValue);
            setIsModal(false);
        },
        [field]
    );
    const removeValue = useCallback(
        (valueToRemove) => {
            return () => {
                const newValue = field.value.filter(item => item !== valueToRemove);
                setValue2(newValue);
                field.onChange(newValue);
            };
        },
        [field, setValue2]
    );

    const showSelect = useCallback(
        () => {
            setIsModal(true);
        },
        []
    );

    const valuesList = useMemo(() => {
        return Array.isArray(props.values)
            ? props.values.map(obj => ({
                ...obj,
                key: obj.key !== undefined ? String(obj.key) : String(obj.value),
            }))
            : Object.entries(props.values).map(([key, value]) => ({
                key: String(key),
                value,
            }));
    }, [props.values]);

    const header = <Row className=' w-full justify-between items-center'>
        <View><Button onPress={() => { setIsModal(null) }} variant='outline' rounded startDecorator="X" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">{'Choose ' + props.caption}</Text></View>
        <View >
            <Button
                startDecorator="Check"
                variant="primary"
                size="base"
                rounded
                onPress={() => setFormValue(value2)}
            />
        </View>
    </Row>

    const ModalCnt = <Modal
        title={header}
        onVisible={isModal}
        transparent={true}
        headerBorder={true}
        scrollable={true}
    >
        <View className='flex-1'>
            <ChkList isMultiple={isMultiple} values={valuesList} value2={value2} addValue2={addValue2} />
        </View>
    </Modal>

    return (
        <>
            {ModalCnt}
            <Field {...props}>
                <View className={`w-full justify-between min-h-12 px-3 ${inputSettings.ring}`}>
                    <View className={`${props.align === 'right' ? 'justify-end pl-4' : 'justify-start pr-4'} w-full flex-auto items-center flex-row flex-wrap`}>
                        {props.align == 'right' && <Button
                            startDecorator="Plus"
                            variant={variant}
                            size={size}
                            onPress={showSelect}
                        />}
                        {field.value?.length > 0 && valuesList.filter(item => field.value.includes(item.key)).map((item, index) => (
                            <View className='m-0.5' key={'label' + index}>
                                <Button
                                    endDecorator="X"
                                    variant={variant}
                                    size={size}
                                    title={item.value}
                                    onPress={removeValue(item.key)}
                                />
                            </View>
                        )
                        )}
                        {props.align != 'right' && <Button
                            startDecorator="Plus"
                            variant={variant}
                            size={size}
                            title='Add'
                            onPress={showSelect}
                        />}
                    </View>
                </View>
            </Field></>
    );
}

