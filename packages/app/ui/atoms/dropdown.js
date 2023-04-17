import { PickerStyled } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react'
import { useTheme } from '@react-navigation/native';
import { Modal } from 'app/design/controls'
import { Input } from 'app/design/controls'
import { View,Pressable } from 'app/design/view'
import { Platform } from 'react-native'
//settings https://www.npmjs.com/package/@react-native-picker/picker#mode
export default function Dropdown(props) {

    const [showImage, setShowImage] = useState(false)
    const [selectedVal, setSelectedVal] = useState(props.value? props.value : '');
    const { colors } = useTheme();
    const isShow = Platform.OS == 'ios'

    function handleChange(itemValue, itemIndex) {
        setSelectedVal(itemValue)
        props.onChange(itemValue);
        if (!isShow)
            setShowImage(false);
    }
    let selectedText = '';
    props.data.forEach(function (item) {

        if (item[props.valueField] == selectedVal)
            selectedText = item[props.labelField];
    });


    if (!isShow){
        return (
            <PickerStyled style={{backgroundColor:colors.fieldBackground}} itemStyle={{fontSize:14, height:40, backgroundColor:colors.fieldBackground, borderRadius:0 }}
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
            <Pressable onPress={() => setShowImage(true)}><Input 
                editable = {false}
                name={props.name}
                value={selectedText} 
            /></Pressable>
            <Modal id={'dropdown'} onVisible={showImage} onClose={() => {setShowImage(null)}}>
                <PickerStyled style={{backgroundColor:colors.fieldBackground}} itemStyle={{fontSize:14, backgroundColor:colors.fieldBackground,  }}
                    selectedValue={selectedVal}
                    onValueChange={(itemValue, itemIndex) =>
                    handleChange(itemValue, itemIndex)
                }>
                    {props.data.map((item, index) => (
                        <Picker.Item key={'item-' + item[props.valueField]} label={item[props.labelField]} value={item[props.valueField]} />
                    ))}
                </PickerStyled>
            </Modal>
        </View>
        );
    }
}
