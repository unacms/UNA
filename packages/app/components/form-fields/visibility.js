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

    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(false);
    const [isModalSub, setIsModalSub] = useState(false);
    const [subValues, setSubValues] = useState(false);
    const visibility = formContext.watch(props.name)


    const setValueF = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val)
        }
        if (val != 8 && val != 9 && val != 6) {
            setIsModal(false);
        }
        else {
            setIsModalSub(val);
        }
    }

    const setSub = (val) => {
        setSubValues(val);
        setIsModalSub(false);
    }

    const size = props.size || 'xs';
    const maxLength = props.maxLength ?? 20;

    let values = getVisibilityValues(props.values);

    const showSelect = (val) => {
        setIsModal(true);
    }

    const setVisibility = () => {
        setIsModal(false);
        formContext.setValue(name + '_items', subValues);
    }


    let valuesSub;
    let values_friends = props.values_friends;
    values_friends = values_friends.map(item => ({
        key: item.key,
        value: item.value.display_name
    }));
    let valuesFriends = props.values_friends ? getVisibilityValues(values_friends) : [];


    const valuesRelationship = props.values_relationship ? getVisibilityValues(props.values_relationship) : [];
    const valuesMemberships = props.values_memberships ? getVisibilityValues(props.values_memberships) : [];

    if (valuesFriends.length == 0) {
        values = values.filter(item => item.value != '6');
    }
    if (valuesRelationship.length == 0) {
        values = values.filter(item => item.value != '8');
    }
    if (valuesMemberships.length == 0) {
        values = values.filter(item => item.value != '9');
    }


    
    if (isModalSub == 6) {
        valuesSub = valuesFriends;
    }
    if (isModalSub == 8) {
        valuesSub = valuesRelationship;
    }
    if (isModalSub == 9) {
        valuesSub = valuesMemberships;
    }

    const selectedItem = values.find(item => item.value == isModalSub);

    const header = <Row className={` w-full items-center justify-:px-4 :pt-4`}>
        <View className='flex-auto absolute left-0 right-0'>
            <Text className='text-neutral-800 dark:text-neutral-200 text-2xl font-bold tracking-tight text-center '>{selectedItem?.label}</Text>
        </View>
        <View >
            <Button variant='secondary' size='base' rounded startDecorator='ArrowLeft' onPress={() => { console.log(111); setIsModalSub(false) }} />
        </View>
    </Row>

    const ModalCnt = <Modal
        title={isModalSub ? header : 'Choose audience'}
        onVisible={isModal}
        {...(!isModalSub && { onClose: () => { setIsModal(false) } })}
        transparent={true}
        headerBorder={true}
        scrollable={true}
    >
        {isModalSub ? (
            <ChkList values={valuesSub} setValue={setSub} selectedValue={''} />
        ) :
            (
                <>
                    <RbList values={values} setValue={setValueF} selectedValue={field.value}   />
                    <Button title="Apply" size="sm" variant="primary" onPress={setVisibility} />
                </>
            )
        }
    </Modal>


    if (props.format == 'nofield') {
        const v = values.find(item => item.value == field.value)?.label || values[0].label;
        return <>
            {ModalCnt}
            <Button
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