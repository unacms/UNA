import { useState } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { NeoButton, Modal, Hidden } from 'app/design/controls'
import { getVisibilityValues } from './select';
import { visibilityById } from 'app/lib/util';
import RbList from 'app/ui/molecules/form-controls/radio-list';
import ChkList from 'app/ui/molecules/form-controls/checkbox-list';
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile/profile';
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { useFormField } from 'app/lib/form/use-form-field';
import { wellButtonProps } from 'app/lib/form/form-helpers';
import FieldWell from './_well';

const SUB_TYPES = new Set([6, 8, 9]);
const needsSub = (val) => SUB_TYPES.has(Number(val));
const sameId = (a, b) => String(a) === String(b);

function formatOverflow(labels, max = 3) {
    if (labels.length <= max) return labels.join(', ');
    return `${labels.slice(0, max).join(', ')} ${i18n.t('+ {{count}} more', { count: labels.length - max })}`;
}

function OwnerAvatar({ owner, displaySize = '3xs', displayType = 'unit_wo_info', ...rest }) {
    if (!owner) return null;
    return (
        <Profile
            {...owner}
            displayType={displayType}
            displaySize={displaySize}
            showLinks={false}
            {...rest}
        />
    );
}

function friendOptions(values) {
    return (values || []).map((item) => ({
        value: item.key,
        label: item.value?.display_name,
        icon: (
            <Profile
                {...item.value}
                displayType="unit_wo_info"
                displaySize="sm"
            />
        ),
    }));
}

export default function FormFieldVisibility(props) {
    const { setValue } = useFormContext();
    const { name, field } = useFormField(props, {
        rules: getValidationRules(props),
    });

    const { t } = useTranslation();
    const [isModal, setIsModal] = useState(false);
    const [subKind, setSubKind] = useState(null);
    const [subValues, setSubValues] = useState(
        props?.subvalue ? props.subvalue.split(",").map(value => parseInt(value, 10)) : []
    );

    const handleValueChange = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val)
        }
        if (val != field.value) setSubValues([]);
        if (needsSub(val)) setSubKind(Number(val));
        else setIsModal(false);
    }

    const handleSubValueChange = (val) => {
        setSubValues(val);
        setSubKind(null);
    }

    const applyVisibility = () => {
        setIsModal(false);
        setValue(name + '_items', subValues);
    }

    const openModal = () => setIsModal(true);

    const subOptionsMap = {
        6: friendOptions(props.values_friends),
        8: getVisibilityValues(props.values_relations || []),
        9: getVisibilityValues(props.values_memberships || []),
    };
    const subOptions = subOptionsMap[Number(field.value)] || [];
    const selectedSubLabels = subOptions
        .filter(item => subValues.some(v => sameId(v, item.value)))
        .map(item => item.label);
    const subLabelDisplay = formatOverflow(selectedSubLabels);

    const filteredValues = getVisibilityValues(props.values)
        .filter((item) => {
            if (item.value === '' || item.value == null) return false;
            if (Number(item.value) === 6 && !props.values_friends) return false;
            if (Number(item.value) === 8 && !props.values_relations) return false;
            if (Number(item.value) === 9 && !props.values_memberships) return false;
            return true;
        })
        .map((item) => {
            const visibilityIcon = visibilityById(item.value, t);
            const isCurrentSub = needsSub(field.value) && sameId(item.value, field.value);
            return {
                ...item,
                info: isCurrentSub ? subLabelDisplay : item.info,
                label: visibilityIcon?.text || item.label,
                icon: visibilityIcon?.icon ? (
                    <View className="h-6 w-6 overflow-hidden">
                        <Icon icon={visibilityIcon.icon} width={24} height={24} />
                    </View>
                ) : null,
            };
        });

    const selectedItem = filteredValues.find(item => sameId(item.value, subKind));
    const empty = (
        <Text className="text-muted-foreground text-center py-6 px-4">
            {t('Nothing to show')}
        </Text>
    );

    const modalHeader = (
        <Row className="w-full items-center">
            <View className="flex-auto absolute left-0 right-0">
                <Text className="text-secondary-foreground text-2xl font-bold tracking-tight text-center">{selectedItem?.label}</Text>
            </View>
            <View>
                <NeoButton style="glass" controlSize="regular" borderShape="circle" image="ArrowLeft" accessibilityLabel={t('Back')} onPress={() => setSubKind(null)} />
            </View>
        </Row>
    );

    const modalContent = subKind ? (
        subOptions.length === 0 ? empty : (
            <ChkList values={subOptions} setValue={handleSubValueChange} selectedValue={subValues} />
        )
    ) : filteredValues.length === 0 ? empty : (
        <>
            <RbList values={filteredValues} setValue={handleValueChange} selectedValue={field.value} />
            <View className="flex-row justify-end pt-3 mt-3 border-t border-border/60 ">
                <NeoButton
                    style="borderedProminent"
                    label={t('Done')}
                    disabled={needsSub(field.value) && selectedSubLabels.length == 0}
                    onPress={applyVisibility}
                />
            </View>
        </>
    );

    const modalElement = (
        <Modal
            title={subKind ? modalHeader : t('Choose audience')}
            onVisible={isModal}
            onClose={!subKind ? () => setIsModal(false) : undefined}
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
                {props.renderTrigger?.({
                    onPress: undefined,
                    displayText: props.owner_info?.display_name || '',
                    icon: props.owner_info ? <OwnerAvatar owner={props.owner_info} displaySize="3xs" /> : null,
                })}
                <Hidden
                    name={name}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={props.value}
                />
                {!!props.owner_info && !props.renderTrigger && (
                    <Row className="h-5.5 items-center text-muted-foreground web:group-hover:text-secondary-foreground web:duration-300">
                        <View className="flex-none mb-auto">
                            <OwnerAvatar owner={props.owner_info} displaySize="2xs" />
                        </View>
                        <View className="px-1 flex-auto">
                            <OwnerAvatar
                                owner={props.owner_info}
                                displayType="unit_wo_image"
                                displaySize="sm"
                                showInfo={false}
                            />
                        </View>
                    </Row>
                )}
            </>
        )
    }

    const visibilityData = visibilityById(field.value, t);
    const ownerName = props.owner_info?.display_name || '';
    const ownerIcon = props.owner_info ? <OwnerAvatar owner={props.owner_info} displaySize="3xs" /> : null;
    const icon = visibilityData ? visibilityData.icon : (ownerIcon || 'Globe');
    const selectedOption = filteredValues.find(item => sameId(item.value, field.value));
    const displayText = selectedSubLabels.length > 0
        ? formatOverflow(selectedSubLabels)
        : visibilityData?.text || selectedOption?.label || ownerName || t('Choose audience');

    let trigger;
    if (props.format == 'nofield' && props.noContainer) {
        trigger = props.renderTrigger
            ? props.renderTrigger({ onPress: openModal, displayText, icon })
            : (
                <NeoButton
                    label={displayText}
                    image={icon}
                    style={props.style || 'bordered'}
                    controlSize={props.controlSize || 'mini'}
                    borderShape={props.borderShape || 'capsule'}
                    onPress={openModal}
                />
            );
        return (
            <>
                {modalElement}
                {props.addElement}
                {trigger}
            </>
        );
    }

    if (props.format == 'nofield') {
        return (
            <>
                {modalElement}
                <Pressable onPress={openModal}>
                    {props.addElement}
                    <Row className="flex-none mr-auto gap-x-0.5 px-1 py-1 rounded-lg items-center text-muted-foreground web:group-hover:text-secondary-foreground h-6 web:duration-300">
                        <Icon icon={icon} width={16} height={16} className="text-muted-foreground" />
                        <Text className="leading-5.5 ml-1 whitespace-nowrap text-ellipsis overflow-hidden tracking-tight text-muted-foreground web:group-hover:text-secondary-foreground font-medium text-sm native:text-sm">{displayText}</Text>
                        <Icon icon="ChevronDown" width={16} height={16} className="text-muted-foreground" />
                    </Row>
                </Pressable>
            </>
        );
    }

    return (
        <>
            {modalElement}
            <Field {...props}>
                <FieldWell>
                    <NeoButton
                        {...wellButtonProps()}
                        label={displayText}
                        image={visibilityData?.icon || 'Globe'}
                        onPress={openModal}
                    />
                </FieldWell>
            </Field>
        </>
    );
}
