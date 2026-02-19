import CheckBox from 'app/ui/atoms/checkbox';
import { Row, View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useState } from 'react';
import { Button, Modal } from "app/design/controls";
import RadioButton from 'app/ui/atoms/radiobutton';

export default function ({ values, selectedValue, setValue, multi = true }) {
    const [value2, setValue2] = useState(selectedValue);
    const addValue2 = (value) => {
        const selectedValues = value2.includes(value) ? value2.filter(item => item !== value) : multi ?[...value2, value] : [value];
        setValue2(selectedValues);
    }

    const Control = multi ? CheckBox : RadioButton
    return (
        <View>
            {
                values?.map((item2, index) => {
                    return (
                        <Row key={`rb-${index}`} className='items-center'>
                            {item2.value || item2.value === 0 ? <>
                                <Control
                                    value={item2?.value}
                                    status={value2.includes(item2?.value) ? 'checked' : 'unchecked'}
                                    onPress={() => { addValue2(item2?.value);  }}
                                    title={item2?.label}
                                    icon={item2?.icon}
                                />
                            </> : <Text className="text-label-secondary  text-sm font-semibold mt-4 mb-2">{item2.label}</Text>}
                        </Row>
                    )
                })
            }
                        <View className='flex-row justify-end pt-3 mt-3 border-t border-border/60 '>

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