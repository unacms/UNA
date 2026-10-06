import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useEffect , useCallback } from 'react';
import { Modal, NeoButton } from "app/design/controls";
import ChkList from 'app/ui/molecules/form-controls/checkbox-list';
import emitter, { EVENTS } from 'app/context/emitter';
import { LabelButton, wellButtonProps } from 'app/lib/form/form-helpers'
import FieldWell from './_well'
import { useFormField } from 'app/lib/form/use-form-field';
import { useTranslation } from 'react-i18next'

export default function FormFieldLabels(props) {
    const { t } = useTranslation();
    const { name, field } = useFormField(props);
    const isEmbedded = !!props.noPadding;
    const variant = props.variant || (isEmbedded ? 'text' : 'default');
    const size = props.size || 'sm';
    const [isModal, setIsModal] = useState(!!props.isShow);
    const [value2, setValue2] = useState(() => Array.isArray(field.value) ? field.value : []);

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.fieldLabels(name), (data) => {
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
    const buttonProps = wellButtonProps({ variant, size });
    const addButton = !props.hide_button && (
        <LabelButton {...buttonProps} title={t('Tags')} icon="Plus" field_name={name} />
    );
    const content = (
        <>
            {props.align != 'right' && addButton}
            {!!field.value && field.value.map((item, index) => (
                <NeoButton
                    key={`lbl-${index}`}
                    {...buttonProps}
                    label={item}
                    image="X"
                    imagePlacement="trailing"
                    onPress={removeValue(item)}
                />
            ))}
            {props.align == 'right' && addButton}
        </>
    );

    const header = <Row className=' w-full justify-between items-center'>
        <View><NeoButton style="glass" controlSize="regular" borderShape="circle" image="ArrowLeft" accessibilityLabel={t('Back')} onPress={() => { setIsModal(null) }} /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-secondary-foreground  text-xl font-bold">{'Choose ' + props.caption}</Text></View>
        <View >
            <NeoButton
                style="glassProminent"
                controlSize="regular"
                borderShape="circle"
                image="Check"
                accessibilityLabel={t('Done')}
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
                {isEmbedded
                    ? <View className={`${styles} w-full flex-auto items-center flex-row flex-wrap gap-1`}>{content}</View>
                    : <FieldWell className={styles}>{content}</FieldWell>}
            </Field>
        </>
    );
}



