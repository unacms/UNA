import { PickerStyled,PickerStyledIos } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react'
import { Theme } from 'app/design/theme';
import { Modal } from 'app/design/controls'
import { Input } from 'app/design/controls'
import { View,Pressable } from 'app/design/view'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls';
//settings https://www.npmjs.com/package/@react-native-picker/picker#mode
export default function Dropdown(props) {

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


    if (!isShow){
        return (
            <PickerStyled  itemStyle={{fontSize:14, height:40, backgroundColor:colors.fieldBackground, borderRadius:0 }}
                selectedValue={selectedVal}
                onValueChange={(itemValue, itemIndex) =>
                handleChange(itemValue, itemIndex)
            }>
                {props.data.map((item, index) => (
                    <Picker.Item key={'item-' + item[props.valueField]} label={item[props.labelField]} value={item[props.valueField]} />
                ))}
            </PickerStyled>
        );
    }
    else{
        return ( <View>
            <Button title={selectedText} onPress={() => setShowImage(true)} />
            <Modal id={'dropdown'} onVisible={showImage} outerClickClose={false} onClose={() => setShowImage(false)}>
                <PickerStyledIos itemStyle={{fontSize:14, backgroundColor:colors.fieldBackground, color:colors.default }}
                    selectedValue={selectedVal}
                    onValueChange={(itemValue, itemIndex) =>
                    handleChange(itemValue, itemIndex)
                }>
                    {props.data.map((item, index) => (
                        <Picker.Item key={'item-' + item[props.valueField]} label={item[props.labelField]} value={item[props.valueField]} />
                    ))}
                </PickerStyledIos>
            </Modal>
        </View>
        );
    }
}
