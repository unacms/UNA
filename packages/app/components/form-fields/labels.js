import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useEffect , useCallback, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Modal } from "app/design/controls";
import CheckBox from 'app/ui/atoms/checkbox';

function ChkList({ values, value2, addValue2 }) {
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
                    </Row>
                </Pressable>
            ))}
        </>
    );
}

export default function (props) {
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(props.isShow);
    const [value2, setValue2] = useState(field.value)
console.log("----", isModal, props.isShow)
    useEffect(() => {
        setIsModal(props.isShow)
    }, [props.isShow]);

    const addValue2 = (value) => {
        const selectedValues = value2.includes(value)
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }

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
                field.onChange(newValue);
                setValue2(newValue);
            };
        },
        [field, setValue2]
    );

    const dataFlat = [...props.values.system, ...props.values.context].flatMap(item =>
        item.subitems ? [item, ...item.subitems] : item
    );

    const showSelect = useCallback(
        () => {
            setIsModal(true);
        },
        []
    );

    const styles = props.align === 'right' ? 'justify-end pl-4' : 'justify-start pr-4';

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

    return (
        <>
            <Modal
                title={header}
                onVisible={isModal}
                transparent={true}
                headerBorder={true}
                scrollable={true}
            >
                <ChkList values={dataFlat} value2={value2} addValue2={addValue2} />
            </Modal>
            <Field {...props}>
                <View className='w-full justify-between '>
                    <View className={styles + ' w-full flex-auto  items-center flex-row flex-wrap'}>
                        {props.align == 'right' && <Button
                            startDecorator="Plus"
                            variant="text"
                            size="base"
                            onPress={showSelect}
                        />}
                        {!!field.value && field.value.map((item, index) => (
                            <View className='mr-2' key={'label' + index}>
                                <Button
                                    endDecorator="X"
                                    variant={"outline"}
                                    size="sm"
                                    title={item}
                                    onPress={removeValue(item)}
                                />
                            </View>
                        )
                        )}
                        {props.align != 'right' && !props.listOnly && <Button
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

