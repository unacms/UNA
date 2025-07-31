import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { appSetting } from 'app/lib/util'
const checkboxTheme = appSetting('theme', 'checkbox');

export default function CheckBox2({ title, onPress, status, value, icon, margin = " my-0 ", isBackground = true }) {
    const selected = status == 'checked';
    return (

        <View className={`${icon ? 'flex-row gap-x-3' : 'flex-row-reverse'} ${isBackground ? checkboxTheme['u-controls-checkbox-container-bg'] : ''} ${margin} ${checkboxTheme['u-controls-checkbox-container']}`}>
            {!!icon && <View className="w-8">{icon}</View>}
            <View className="flex-auto">
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
            </View>
            <CheckboxPrimitive.Root
                checked={selected}
                onCheckedChange={onPress}
                className={checkboxTheme['u-controls-checkbox-indicator']}
            >
                <CheckboxPrimitive.Indicator>
                    <View className={checkboxTheme['u-controls-checkbox-indicator-active']} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </View>
    );
}