import RadioButton from 'app/ui/atoms/radiobutton';

import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { useState } from 'react';

/**
 * Plain rows, not a FlatList: callers show the list inside a scrolling Modal (audience, country,
 * callback menus), and a VirtualizedList nested in a same-direction ScrollView can't virtualize
 * and makes React Native log an error.
 */
export default function RadioList({ values, selectedValue, setValue }) {
    const [value, setValue2] = useState(selectedValue)
    return (
        <View>
            {(values || []).map((item) => (
                item.value ? (
                    <RadioButton
                        key={`value-${item.value}`}
                        value={item.value}
                        status={String(value) === String(item.value) ? 'checked' : 'unchecked'}
                        onPress={() => { setValue2(item.value); setValue(item.value) }}
                        title={item.label}
                        info={item.info}
                        icon={item.icon}
                    />
                ) : (
                    <Text key={`header-${item.label}`} className="text-secondary-foreground  text-sm font-semibold mt-4 mb-2">{item.label}</Text>
                )
            ))}
        </View>
    );
}
