import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox'
import { isValidElement, type ReactNode } from 'react'
import { appSetting, cn } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon'

const checkboxTheme = appSetting('theme', 'checkbox')

type CheckboxProps = {
    title?: ReactNode
    onPress?: () => void
    status?: 'checked' | 'unchecked' | string
    value?: unknown
    /** Icon name for `<Icon>` or a ready element. */
    icon?: string | ReactNode
    margin?: string
    isBackground?: boolean
    /** Compact control for dense UI (grids) — no full-width row chrome. */
    compact?: boolean
}

function CheckboxMark({ selected, indicatorClass }: { selected: boolean; indicatorClass: string }) {
    return (
        <View className={cn(indicatorClass, 'overflow-hidden')} pointerEvents="none">
            <CheckboxPrimitive.Root
                checked={selected}
                // Display only: presses go to the parent Pressable (pointerEvents="none" above).
                onCheckedChange={() => {}}
                className="h-full w-full items-center justify-center"
            >
                <CheckboxPrimitive.Indicator className="items-center justify-center">
                    <View className={checkboxTheme['u-controls-checkbox-indicator-active']} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </View>
    )
}

export default function Checkbox({
    title,
    onPress,
    status,
    value,
    icon,
    margin = ' my-0 ',
    isBackground = true,
    compact = false,
}: CheckboxProps) {
    const selected = status === 'checked'
    const resolvedIcon = typeof icon === 'string'
        ? <Icon icon={icon} width={24} height={24} />
        : isValidElement(icon)
            ? icon
            : null
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
            className={`${resolvedIcon ? 'flex-row gap-x-3' : 'flex-row-reverse'} ${isBackground ? checkboxTheme['u-controls-checkbox-container-bg'] : ''} ${margin} ${checkboxTheme['u-controls-checkbox-container']}`}
        >
            {!!resolvedIcon && <View className="w-8">{resolvedIcon}</View>}
            <View className="flex-auto">
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
            </View>

            {/* Visual square — toggled by the Pressable container above */}
            <CheckboxMark selected={selected} indicatorClass={indicatorClass} />
        </Pressable>
    )
}
