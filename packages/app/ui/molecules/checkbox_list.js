import CheckBox from 'app/ui/atoms/checkbox';
import { Row, View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useState } from 'react';
import { Button, Modal } from "app/design/controls";

export default function ({ values, selectedValue, setValue }) {
    const [value2, setValue2] = useState(selectedValue);
    console.log("value2value2", value2)
    const addValue2 = (value) => {
        const selectedValues = value2.includes(value)
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }

    return (
        <View>
            {
                values.map((item2, index) => {
                    return (
                        <Row key={`rb-${index}`} className='items-center'>
                            {item2.value ? <>
                                <CheckBox
                                    value={item2.value}
                                    status={value2.includes(item2.value) ? 'checked' : 'unchecked'}
                                    onPress={() => { addValue2(item2.value);  }}
                                    title={item2.label}
                                />
                            </> : <Text className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mt-4 mb-2">{item2.label}</Text>}
                        </Row>
                    )
                })
            }
            <View className='mt-3'>
            <Button
                variant="primary"
                size="base"
                title="Apply"
                onPress={() => setValue(value2)
                }
            />
            </View>
        </View >
    )
}