import DropDownPicker from 'react-native-dropdown-picker';
import React, {  useState } from 'react';
import { Platform} from 'react-native'

import { View} from 'app/design/view'

export default function ElementPicker(props) {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(props.value);

    const handleSelect =  async (val) => {
        let v = val();
        props.onSelect(v)
        setValue(v)
    }
    return (
        <View className='absolute'>
            <DropDownPicker className=" m-0 p-0" dropDownDirection="BOTTOM" bottomOffset={100}
                items={props.items}
                open={open}
                value={value}
                setOpen={setOpen}
                setValue={handleSelect}
                style={{
                    borderWidth: 0, 
                    minHeight: 30, 
                    borderRadius: 0,  
                }}
        />
      </View>
  )
}
