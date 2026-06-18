import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox'
import { appSetting } from 'app/lib/util'

const checkboxTheme = appSetting('theme', 'checkbox')

export default function CheckBox2({ title, onPress, status, value, icon, margin = ' my-0 ', isBackground = true }) {
    const selected = status === 'checked'

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            className={`${icon ? 'flex-row gap-x-3' : 'flex-row-reverse'} ${isBackground ? checkboxTheme['u-controls-checkbox-container-bg'] : ''} ${margin} ${checkboxTheme['u-controls-checkbox-container']}`}
        >
            {!!icon && <View className="w-8">{icon}</View>}
            <View className="flex-auto">
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
            </View>

            {/* Visual square — toggled by the Pressable container above */}
            <View className={checkboxTheme['u-controls-checkbox-indicator']} pointerEvents="none">
                <CheckboxPrimitive.Root
                    checked={selected}
                    style={{ width: '100%', height: '100%' }}
                >
                    <CheckboxPrimitive.Indicator>
                        <View className={checkboxTheme['u-controls-checkbox-indicator-active']} />
                    </CheckboxPrimitive.Indicator>
                </CheckboxPrimitive.Root>
            </View>
        </Pressable>
    )
}