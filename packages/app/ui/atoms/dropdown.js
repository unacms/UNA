import { PickerStyledRef, PickerStyledIos } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState, useRef, useEffect } from 'react'
import { Theme } from 'app/design/theme';
import { Modal } from 'app/design/controls'
import { View, Pressable } from 'app/design/view'
import { Platform } from 'react-native'
import { Button } from 'app/design/controls';

const toScalar = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return String(val?.key ?? val?.value ?? '');
    return val;
};

export default function Dropdown(props) {
    const pickerRef = useRef();

    const [selectedVal, setSelectedVal] = useState(toScalar(props.value));
    const { colors } = Theme();
    const isShow = Platform.OS == 'ios'

    function handleChange(itemValue, itemIndex) {
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

    if (props.open && pickerRef.current){
        pickerRef.current.focus();
    }

    useEffect(() => {
        const scalar = toScalar(props.value);
        if (scalar != selectedVal){
            setSelectedVal(scalar);
        }
    }, [props.value]);


    if (!isShow){
        return (
            <PickerStyledRef className={Platform.OS == 'web' ? ' h-10' : 'h-16'} style={{ borderRadius:10, color:colors.default  }}
                selectedValue={selectedVal}
                onValueChange={(itemValue, itemIndex) =>
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
            <Button title={selectedText} onPress={() => setShowImage(true)} />
            <Modal title="Title" id={'dropdown'} onVisible={showImage} onClose={() => setShowImage(false)}>
                <PickerStyledIos itemStyle={{fontSize:16, color:colors.default }}
                    selectedValue={selectedVal}
                    onValueChange={(itemValue, itemIndex) =>
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