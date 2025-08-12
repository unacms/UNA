import { PickerStyledRef, PickerStyledIos } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState, useRef } from 'react'
import { Theme } from 'app/design/theme';
import { Modal } from 'app/design/controls'
import { View, Pressable } from 'app/design/view'
import { Platform } from 'react-native'
import { Button } from 'app/design/controls';
//settings https://www.npmjs.com/package/@react-native-picker/picker#mode

export default function Dropdown(props) {
    const pickerRef = useRef();

    const [showImage, setShowImage] = useState(false)
    const [selectedVal, setSelectedVal] = useState(props.value? props.value : '');
    const { colors } = Theme();
    const isShow = Platform.OS == 'ios'

    function handleChange(itemValue, itemIndex) {
        setSelectedVal(itemValue)
        props.onChange(itemValue);
        if (isShow)
            setShowImage(false);
    }
    let selectedText = '';
    props.data.forEach(function (item) {

        if (item[props.valueField] == selectedVal)
            selectedText = item[props.labelField];
    });

    if (props.open && pickerRef.current){
        pickerRef.current.focus();
    }


    if (!isShow){
        return (
            <PickerStyledRef className={Platform.OS == 'web' ? ' h-10' : 'h-16'} style={{ borderRadius:10, color:colors.default  }}
                selectedValue={selectedVal}
                onValueChange={(itemValue, itemIndex) =>
                handleChange(itemValue, itemIndex)
            }>
                {props.data.map((item, index) => (
                    <Picker.Item key={'item-' + index} label={item[props.labelField]} value={item[props.valueField]} />
                ))}
            </PickerStyledRef>
        );
    }
    else{
        return ( <View>
            <Button title={selectedText} onPress={() => setShowImage(true)} />
            <Modal title="Title" id={'dropdown'} onVisible={showImage} outerClickClose={false} onClose={() => setShowImage(false)}>
                <PickerStyledIos itemStyle={{fontSize:16, color:colors.default }}
                    selectedValue={selectedVal}
                    onValueChange={(itemValue, itemIndex) =>
                    handleChange(itemValue, itemIndex)
                }>
                    {props.data.map((item, index) => (
                        <Picker.Item key={'item-' + index} label={item[props.labelField]} value={item[props.valueField]} />
                    ))}
                </PickerStyledIos>
            </Modal>
        </View>
        );
    }
}
