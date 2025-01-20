import { useState, useEffect, useContext } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext, useController } from 'react-hook-form';
import { Button, Modal } from 'app/design/controls'
import { getVisibilityValues } from './select';
import { truncateString } from 'app/lib/util';
import RbList from 'app/ui/molecules/radio_list';
import ChkList from 'app/ui/molecules/checkbox_list';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function (props) {

    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const defaultValue = props?.value ? props.value : '';
    const size = props.size || 'xs';
    const maxLength = props.maxLength ?? 20;

    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(false);
    const [isModalSub, setIsModalSub] = useState(false);
    const [subValues, setSubValues] = useState(props?.subvalue ? props.subvalue.split(","): []);

    const handleValueChange = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val)
        }
        if ([6, 8, 9].includes(val)) {
            setSubValues([])
            setIsModalSub(val);
        }
        else {
            setIsModal(false);
        }
    }

    const handleSubValueChange = (val) => {
        setSubValues(val);
        setIsModalSub(false);
    }

    const applyVisibility = () => {
        setIsModal(false);
        formContext.setValue(name + '_items', subValues);
    }

    const handleShowModal = () => {
        setIsModal(true);
    }

    const prepareValuesFriends = (values) => {
        return values.map(item => ({
            key: item.key,
            value: item.value.display_name
        }));
    };

    const filteredValues = getVisibilityValues(props.values).filter(item => {
        if (item.value == '6' && !props.values_friends) return false;
        if (item.value == '8' && !props.values_relations) return false;
        if (item.value == '9' && !props.values_memberships) return false;
        return true;
    });

    const values_friends = props.values_friends ? prepareValuesFriends(props.values_friends) : null;

    const subOptionsMap = {
        6: getVisibilityValues(values_friends || []),
        8: getVisibilityValues(props.values_relations || []),
        9: getVisibilityValues(props.values_memberships || []),
    };

    const subOptions = subOptionsMap[field.value] || [];

    const selectedSubLabels = subOptions.filter(item => subValues.includes(item.value)).map(item => item.label);

    const subLabelDisplay = selectedSubLabels.length > 3 ? `${selectedSubLabels.slice(0, 3).join(', ')} + ${selectedSubLabels.length - 3} more` : selectedSubLabels.join(', ');

    filteredValues.forEach(item => {
        if (item.value === field.value && [6, 8, 9].includes(field.value)) {
            item.info = subLabelDisplay;
        }
    });

    const selectedItem = filteredValues.find(item => item.value == isModalSub);

    const modalHeader = <Row className={` w-full items-center justify-:px-4 :pt-4`}>
        <View className='flex-auto absolute left-0 right-0'>
            <Text className='text-neutral-800 dark:text-neutral-200 text-2xl font-bold tracking-tight text-center '>{selectedItem?.label}</Text>
        </View>
        <View >
            <Button variant='secondary' size='base' rounded startDecorator='ArrowLeft' onPress={() => { setIsModalSub(false) }} />
        </View>
    </Row>

    const modalContent = isModalSub ? (
        <ChkList values={subOptions} setValue={handleSubValueChange} selectedValue={subValues} />
    ) : (
        <>
            <RbList values={filteredValues} setValue={handleValueChange} selectedValue={field.value} />
            <Button title="Apply" size="sm" variant="primary" onPress={applyVisibility} />
        </>
    );

    const modalElement = (
        <Modal
            title={isModalSub ? modalHeader : 'Choose audience'}
            onVisible={isModal}
            onClose={!isModalSub ? () => setIsModal(false) : undefined}
            transparent
            headerBorder
            scrollable
        >
            {modalContent}
        </Modal>
    );

    if (props.format == 'nofield') {
        const v = filteredValues.find(item => item.value == field.value)?.label || filteredValues[0].label;
        return <>
            {modalElement}
            <Button
                title={maxLength > 0 ? truncateString(v, maxLength) : v}
                startDecorator="Globe"
                variant="outline"
                size={size}
                onPress={() => handleShowModal()}
            /></>
    }

    return (
        <>
            {modalElement}
            <Field {...props} error2={formContext.formState.errors[name]}>
                <Button
                    title={values.find(item => item.value == field.value)?.label || values[0].label}
                    startDecorator="Globe"
                    variant="outline"
                    size="base"
                    onPress={() => handleShowModal()}
                />
            </Field>
        </>
    );
}