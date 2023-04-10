import { PickerStyled } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { useTheme } from '@react-navigation/native';

//settings https://www.npmjs.com/package/@react-native-picker/picker#mode
export default function Dropdown(props) {

    const [selectedVal, setSelectedVal] = useState(props.value);
    const { colors } = useTheme();

    function handleChange(itemValue, itemIndex) {
        setSelectedVal(itemValue)
        props.onChange(itemValue);
    }

    const customPickerStyles = StyleSheet.create({
        inputIOS: {
          fontSize: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: 'green',
          borderRadius: 8,
          color: 's',
          paddingRight: 30, // to ensure the text is never behind the icon
        }
    }
    );

    return (
        <Picker style={{backgroundColor:'#ffffff'}} itemStyle={{fontSize:14, height:40, backgroundColor:'#ffffff', borderRadius:0 }}
            selectedValue={selectedVal}
            onValueChange={(itemValue, itemIndex) =>
            handleChange(itemValue, itemIndex)
        }>
            {props.data.map((item, index) => (
                <Picker.Item key={'item-' + item[props.valueField]} label={item[props.labelField]} value={item[props.valueField]} />
            ))}
        </Picker>
    );
}
