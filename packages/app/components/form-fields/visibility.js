import { useState } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext, useController } from 'react-hook-form';
import { Button, Modal, Hidden } from 'app/design/controls'
import { getVisibilityValues } from './select';
import { visibilityById } from 'app/lib/util';
import RbList from 'app/ui/molecules/radio_list';
import ChkList from 'app/ui/molecules/checkbox_list';
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile';
import { useTheme } from 'app/design/theme';
import { useTranslation } from 'react-i18next'

export default function (props) {
    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const defaultValue = props?.value ? props.value : '';
    const size = props.size || 'xs';
    const maxLength = props.maxLength ?? 20;
    const { t } = useTranslation();

    const { field } = useController({ name, rules, defaultValue });
    const [isModal, setIsModal] = useState(false);
    const [isModalSub, setIsModalSub] = useState(false);

    const [subValues, setSubValues] = useState(
        props?.subvalue ? props.subvalue.split(",").map(value => parseInt(value, 10)) : []
    );


    const { colors } = useTheme();

    const handleValueChange = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val)
        }
        if (val != field.value)
            setSubValues([])
        if ([6, 8, 9].includes(val)) {
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
            value: item.value.display_name,
            icon: <Profile
                {...item.value}
                displayType="unit_wo_info"
                displaySize="sm"
            />
        }));
    };

    const filteredValues = getVisibilityValues(props.values).filter(item => {
        if (item.value == '6' && !props.values_friends) return false;
        if (item.value == '8' && !props.values_relations) return false;
        if (item.value == '9' && !props.values_memberships) return false;
        if (item.value == '') return false;
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

    console.log("selectedSubLabels", selectedSubLabels)
    filteredValues.forEach(item => {
        if (parseInt(item.value, 10) === parseInt(field.value, 10) && [6, 8, 9].includes(parseInt(field.value, 10))) {
            item.info = subLabelDisplay;
        }
        const visibilityIcon = visibilityById(item.value, t);
        item.label = visibilityIcon?.text || item.label;
        item.icon = visibilityIcon?.icon ? <View className="h-6 w-6 overflow-hidden">
            <Icon
                icon={visibilityIcon?.icon}
                width={24}
                height={24}
            />
        </View> : <></>
    });

    const selectedItem = filteredValues.find(item => item.value == isModalSub);

    const modalHeader = <Row className={` w-full items-center justify-:px-4 :pt-4`}>
        <View className='flex-auto absolute left-0 right-0'>
            <Text className='text-secondary-foreground  text-2xl font-bold tracking-tight text-center '>{selectedItem?.label}</Text>
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
            <View className='flex-row justify-end pt-3 mt-3 border-t border-border/60 '>
                <Button 
                    title="Done" 
                    size="base" 
                    variant="primary" 
                    disabled = {[6, 8, 9].includes(parseInt(field.value, 10)) && selectedSubLabels.length == 0}
                    onPress={applyVisibility} 
                    />
            </View>
        </>
    );

    const modalElement = (
        <Modal
            title={isModalSub ? modalHeader : t('Choose audience')}
            onVisible={isModal}
            onClose={!isModalSub ? () => setIsModal(false) : undefined}
            transparent
            headerBorder
            scrollable
        >
            {modalContent}
        </Modal>
    );
    if (props.origtype == 'hidden') {
        return (
            <>
                {props.addElement}
                <Hidden
                    name={name}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={props.value}
                />
                {!!props.owner_info && <Row className=" h-5.5 items-center text-muted-foreground web:group-hover:text-secondary-foreground     web:duration-300">
                    <View className='flex-none mb-auto'>
                        <Profile
                            {...props.owner_info}
                            displayType="unit_wo_info"
                            displaySize="2xs"
                        />
                    </View>
                    <View className='px-1  flex-auto'>
                        <Profile
                            {...props.owner_info}
                            displayType="unit_wo_image"
                            displaySize="sm"
                            showInfo={false}
                            showLinks={false}
                        />
                    </View>
                </Row>}
            </>
        )
    }
    const visibilityData = visibilityById(field.value, t);
    const icon = visibilityData ? visibilityData.icon : 'Globe'

    const v = filteredValues.find(item => item.value == field.value);
    const text = visibilityData ? visibilityData.text : ''
    const displayText = selectedSubLabels.length > 0
        ? selectedSubLabels.slice(0, 3).join(', ') + (selectedSubLabels.length > 3 ? ' + ' + (selectedSubLabels.length - 3) + ' more' : '')
        : text || v?.label || t('Choose audience');

    if (props.format == 'nofield') {
        if (props.noContainer) {
            return (<>
                {modalElement}
                {props.addElement}
                <Button
                    title={displayText}
                    startDecorator={icon}
                    endDecorator="ChevronsUpDown"
                    variant={props.variant || 'secondary'}
                    size={props.size || 'sm'}
                    onPress={() => handleShowModal()}
                />
            </>);
        }
        return (<>
            {modalElement}
            <Pressable onPress={() => handleShowModal()}>
                {props.addElement}
                <Row className="  flex-none mr-auto gap-x-0.5 px-1 py-1 rounded-lg items-center text-muted-foreground  web:group-hover:text-secondary-foreground   h-6   web:duration-300">
                    <Icon
                        icon={icon}
                        width={16}
                        height={16}
                        className={"text-muted-foreground"}
                    />
                    <Text className=" leading-5.5 ml-1 whitespace-nowrap text-ellipsis overflow-hidden tracking-tight text-muted-foreground web:group-hover:text-secondary-foreground   font-medium text-sm native:text-sm ">{displayText}</Text>
                    <Icon
                        icon="ChevronDown"
                        width={16}
                        height={16}
                        className={"text-muted-foreground"}
                    />
                </Row>
            </Pressable>
        </>);
    }

    return (
        <>
            {modalElement}
            <Field {...props} error2={formContext.formState.errors[name]}>
                <View className=' bg-input border border-border/60 rounded-xl w-full flex-auto items-center flex-row flex-wrap p-1.5 gap-1 min-h-12'>
                    <Button
                        title={displayText}
                        startDecorator="Globe"
                        variant="default"
                        size="sm"
                        className='my-auto'
                        onPress={() => handleShowModal()}
                    />
                </View>
            </Field>
        </>
    );
}