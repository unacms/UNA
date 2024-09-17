import RadioButton from 'app/ui/atoms/radiobutton';
import { Row, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useState } from 'react';

export default function ({ values, selectedValue, setValue }) {
    const [value, setValue2] = useState(selectedValue)
    return values.map((item2, index) => {
        return (
            <Row key={`rb-${index}`} className='items-center'>
                {item2.value ? <>
                    <RadioButton
                        value={item2.value}
                        status={value.toString() === item2.value.toString() ? 'checked' : 'unchecked'}
                        onPress={() => { setValue2(item2.value); setValue(item2.value) }}
                        title={item2.label}
                    />
                   {/*<Pressable  onPress={() => { setValue2(item2.value); setValue(item2.value) }}><Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.label}</Text></Pressable>*/}
                </> : <Text className="text-neutral-700 dark:text-neutral-200  text-sm font-medium mt-4">{item2.label}</Text>}
            </Row>
        )
    });
}