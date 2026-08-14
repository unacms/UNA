import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useEffect , useCallback } from 'react';
import { Button, Modal } from "app/design/controls";
import ChkList from 'app/ui/molecules/form-controls/checkbox-list';
import emitter from 'app/context/emitter';
import { LabelButton } from 'app/lib/form-helpers'
import { useFormField } from 'app/lib/hooks/use-form-field';
import { appSetting } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs');

export default function FormFieldLabels(props) {
    const { name, field } = useFormField(props);
    const isEmbedded = !!props.noPadding;
    const variant = props.variant || (isEmbedded ? 'text' : 'default');
    const size = props.size || 'sm';
    const [isModal, setIsModal] = useState(!!props.isShow);
    const [value2, setValue2] = useState(() => Array.isArray(field.value) ? field.value : []);

    useEffect(() => {
        const subscription = emitter.addListener(`fld_labels_${name}`, (data) => {
            if (data.action == 'add') {
                setIsModal(true)
            }

        })

        return () => {
            subscription.remove()
        }
    }, [])

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

    const styles = props.align === 'right' ? 'justify-end' : 'justify-start';
    const surfaceClass = isEmbedded
        ? `${styles} w-full flex-auto items-center flex-row flex-wrap`
        : `${styles} bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg w-full items-center flex-row flex-wrap p-2 gap-1 ${inputSettings.surface_size?.regular ?? 'min-h-10'}`;

    const header = <Row className=' w-full justify-between items-center'>
        <View><Button onPress={() => { setIsModal(null) }} variant='secondary' rounded startDecorator="ArrowLeft" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-secondary-foreground  text-xl font-bold">{'Choose ' + props.caption}</Text></View>
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
                <ChkList values={dataFlat} selectedValue={value2} setValue={setValue2} showApply={false} />
            </Modal>
            <Field {...props}>
                <View className={surfaceClass}>
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
            </Field>
        </>
    );
}



