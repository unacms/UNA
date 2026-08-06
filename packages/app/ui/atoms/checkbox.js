import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox'
import { appSetting, cn } from 'app/lib/util'

const checkboxTheme = appSetting('theme', 'checkbox')

function CheckboxMark({ selected, indicatorClass }) {
    return (
        <View className={cn(indicatorClass, 'overflow-hidden')} pointerEvents="none">
            <CheckboxPrimitive.Root
                checked={selected}
                className="h-full w-full items-center justify-center"
            >
                <CheckboxPrimitive.Indicator className="items-center justify-center">
                    <View className={checkboxTheme['u-controls-checkbox-indicator-active']} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </View>
    )
}

export default function CheckBox2({
    title,
    onPress,
    status,
    value,
    icon,
    margin = ' my-0 ',
    isBackground = true,
    /** Compact control for dense UI (grids) — no full-width row chrome. */
    compact = false,
}) {
    const selected = status === 'checked'
    const indicatorClass = cn(
        checkboxTheme['u-controls-checkbox-indicator'],
        checkboxTheme['u-controls-checkbox-indicator-border']
    )

    if (compact) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                className="items-center justify-center shrink-0 p-0.5"
            >
                <CheckboxMark selected={selected} indicatorClass={indicatorClass} />
            </Pressable>
        )
    }

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
            <CheckboxMark selected={selected} indicatorClass={indicatorClass} />
        </Pressable>
    )
}
