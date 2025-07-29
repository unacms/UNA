import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useEffect , useCallback, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Modal } from "app/design/controls";
import CheckBox from 'app/ui/atoms/checkbox';
import emitter from 'app/context/emitter';
import { LabelButton } from 'app/lib/form-helpers'

function ChkList({ values, value2, addValue2 }) {
    return (
        <>
            {values.map((item2, index) => (
                <Pressable key={`lbl-${index}`} onPress={() => addValue2(item2.value)}>
                    <Row className='items-center my-1 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/40 active:bg-primary/20 ' key={'chk' + index}>
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
    const variant = props.variant || 'text';
    const size = props.size || 'sm';
    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(!!props.isShow);
    const [value2, setValue2] = useState(field.value)

    useEffect(() => {
        const subscription = emitter.addListener(`fld_labels_${name}`, (data) => {
            console.log('fld_polls', data);
            if (data.action == 'add') {
                setIsModal(true)
            }

        })

        return () => {
            subscription.remove()
        }
    }, [])


    const addValue2 = (value) => {
        const selectedValues = value2.includes(value)
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }

    const setFormValue = useCallback(
        (value) => {
            if (value){
                const filteredValue = value.filter(item => item);
                field.onChange(filteredValue);
            }
            
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

    const styles = props.align === 'right' ? 'justify-end pl-4' : 'justify-start ';

    const header = <Row className=' w-full justify-between items-center'>
        <View><Button onPress={() => { setIsModal(null) }} variant='secondary' rounded startDecorator="ArrowLeft" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-neutral-800 dark:text-neutral-200 text-xl font-bold">{'Choose ' + props.caption}</Text></View>
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
                    <View className={styles + ' w-full flex-auto items-center flex-row flex-wrap '}>
                        {(!props.hide_button && props.align != 'right') && <LabelButton
                            variant={variant}
                            size={size}
                            title='Tags'
                            rounded={false}
                            icon="Plus"
                            field_name={name}
                        />}
                        {!!field.value && field.value.map((item, index) => (
                            <View className='pr-2 justify-center items-center' key={`lbl-${index}`}>
                                <Button
                                    endDecorator="X"
                                    variant={variant}
                                    size={size}
                                    title={item}
                                    onPress={removeValue(item)}
                                />
                            </View>
                        )
                        )}
                        {(!props.hide_button && props.align == 'right') && <LabelButton
                            variant={variant}
                            size={size}
                            rounded={false}
                            icon="Plus"
                            title='Tags'
                            field_name={name}
                        />}
                    </View>
                </View>
            </Field>
        </>
    );
}



