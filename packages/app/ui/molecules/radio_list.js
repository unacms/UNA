import RadioButton from 'app/ui/atoms/radiobutton';

import { Text } from 'app/design/typography'
import { useState } from 'react';
import { FlatList } from 'react-native';

export default function ({ values, selectedValue, setValue }) {
    const [value, setValue2] = useState(selectedValue)
        return <FlatList
        data={values}

        renderItem={({ item }) => (
            item.value ? <>
                <RadioButton
                    value={item.value}
                    status={value.toString() === item.value.toString() ? 'checked' : 'unchecked'}
                    onPress={() => { setValue2(item.value); setValue(item.value) }}
                    title={item.label}
                    info={item.info}
                    icon={item.icon}
                />
            </> : <Text className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mt-4 mb-2">{item.label}</Text>
        )}
    />

}