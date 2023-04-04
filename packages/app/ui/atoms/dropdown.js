import { PickerStyled } from 'app/design/controls'
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react'

//settings https://www.npmjs.com/package/@react-native-picker/picker#mode
export default function Dropdown(props) {

    const [selectedVal, setSelectedVal] = useState(props.value);

    function handleChange(itemValue, itemIndex) {
        setSelectedVal(itemValue)
        props.onChange(itemValue);
    }

    return (
        <PickerStyled
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
