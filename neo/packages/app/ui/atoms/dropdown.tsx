import { PickerStyledRef, PickerStyledIos } from 'app/design/controls'
import { Picker, type PickerItemProps } from '@react-native-picker/picker';
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'app/design/theme';
import { Modal } from 'app/design/controls'
import { View } from 'app/design/view';
import { Platform } from 'react-native'
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export type DropdownValue = NonNullable<PickerItemProps['value']>;

/** Option objects are read through `labelField` / `valueField`. */
type DropdownItem = Record<string, any>;

type DropdownProps = {
    data: DropdownItem[];
    labelField: string;
    valueField: string;
    value?: DropdownValue | { key?: DropdownValue; value?: DropdownValue } | null;
    onChange: (value: DropdownValue) => void;
    /** Focus the native picker when it becomes true. */
    open?: boolean;
    disabled?: boolean;
    size?: 'small' | 'regular' | 'large';
    /** Accessible name (`aria-label` on the web <select>, accessibilityLabel / button name on native). */
    accessibilityLabel?: string;
};

const toScalar = (val: unknown): DropdownValue => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
        const option = val as { key?: unknown; value?: unknown };
        return String(option.key ?? option.value ?? '');
    }
    return val as DropdownValue;
};

export default function Dropdown(props: DropdownProps) {
    const { t } = useTranslation();
    const pickerRef = useRef<{ focus: () => void } | null>(null);

    const [selectedVal, setSelectedVal] = useState(toScalar(props.value));
    const { colors } = useTheme();
    const isShow = Platform.OS == 'ios'

    function handleChange(itemValue: DropdownValue, itemIndex?: number) {
        setSelectedVal(toScalar(itemValue))
        props.onChange(itemValue);
        if (isShow)
            setShowImage(false);
    }
    let selectedText = '';
    props.data.forEach(function (item) {
        if (item[props.valueField] == selectedVal)
            selectedText = item[props.labelField];
    });

    const [showImage, setShowImage] = useState(false)

    useEffect(() => {
        if (props.open) pickerRef.current?.focus();
    }, [props.open]);

    useEffect(() => {
        const scalar = toScalar(props.value);
        if (scalar != selectedVal){
            setSelectedVal(scalar);
        }
    }, [props.value]);


    if (!isShow){
        return (
            <PickerStyledRef
            ref={pickerRef}
            style={Platform.OS === 'web' ? undefined : { color: colors.default }}
            disabled={props?.disabled}
            {...(props.accessibilityLabel
                ? (Platform.OS === 'web' ? { 'aria-label': props.accessibilityLabel } : { accessibilityLabel: props.accessibilityLabel })
                : {})}
            size={props.size}
           
                selectedValue={selectedVal}
                onValueChange={(itemValue: DropdownValue, itemIndex?: number) =>
                handleChange(itemValue, itemIndex)
            }>
                {props.data.map((item, index) => (
                    <Picker.Item key={'item-' + index} label={item[props.labelField]} value={toScalar(item[props.valueField])} />
                ))}
            </PickerStyledRef>
        );
    }
    else{
        return ( <View>
            <Button title={selectedText} alt={props.accessibilityLabel} disabled={props.disabled} onPress={() => setShowImage(true)} />
            <Modal title={t('Title')} onVisible={showImage} onClose={() => setShowImage(false)}>
                <PickerStyledIos itemStyle={{fontSize:16, color:colors.default }}
                    size={props.size}
                    selectedValue={selectedVal}
                    onValueChange={(itemValue: DropdownValue, itemIndex?: number) =>
                    handleChange(itemValue, itemIndex)
                }>
                    {props.data.map((item, index) => (
                        <Picker.Item key={'item-' + index} label={item[props.labelField]} value={toScalar(item[props.valueField])} />
                    ))}
                </PickerStyledIos>
            </Modal>
        </View>
        );
    }
}