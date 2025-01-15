import { useState, useEffect, useContext } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext, useController } from 'react-hook-form';
import { Button, Modal } from 'app/design/controls'
import { getVisibilityValues } from './select';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { truncateString } from 'app/lib/util';
import RbList from 'app/ui/molecules/radio_list';
import { View } from 'app/design/view'
export default function (props) {

    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const defaultValue = props?.value ? props.value : '';
    const [value, setValue] = useState(defaultValue)
    const { setBottomSheetData } = useBottomSheetData();
    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(false);

    const setValueF = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val)
        }
        setIsModal(false);
    }

    const size = props.size || 'xs';
    const maxLength = props.maxLength ?? 20;

    let values = getVisibilityValues(props.values);
    values = values.filter(item => item.value != '6' && item.value != '8');
    const showSelect = (val) => {
        setIsModal(true);
    }

    const ModalCnt = <Modal
        title='Choose audience'
        onVisible={isModal}
        onClose={() => setIsModal(false)}
        transparent={true}
        headerBorder={true}
        scrollable={true}
    >
        <RbList values={values} setValue={setValueF} selectedValue={field.value} />

    </Modal>

    if (props.format == 'nofield') {
        const v = values.find(item => item.value == field.value)?.label || values[0].label;
        return <>{ModalCnt}<Button
            title={maxLength > 0 ? truncateString(v, maxLength) : v}
            startDecorator="Globe"
            variant="outline"

            size={size}
            onPress={() => showSelect()}
        /></>
    }

    return (
        <>
            {ModalCnt}
            <Field {...props} error2={formContext.formState.errors[name]}>
                <Button
                    title={values.find(item => item.value == field.value)?.label || values[0].label}
                    startDecorator="Globe"
                    variant="outline"
                    size="base"
                    onPress={() => showSelect()}
                />
            </Field>
        </>
    );
}