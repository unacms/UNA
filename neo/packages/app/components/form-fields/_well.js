import { View } from 'app/design/view'
import { appSetting, cn } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs')

/**
 * Input-height surface for fields made of buttons instead of a text box
 * (labels, selector, visibility, attachments, members). Same fill, outline,
 * radius and height as text inputs of the same `size` (default
 * `theme.inputs.default_size`); `theme.inputs.well` insets the small (36px)
 * buttons from `wellButtonProps`.
 */
export default function FieldWell({ className, size, children }) {
    const wellSize = size || inputSettings.default_size || 'regular'
    return (
        <View
            className={cn(
                'w-full flex-row flex-wrap items-center bg-card shadow-input-outline dark:shadow-input-outline-deep',
                inputSettings.well?.[wellSize] ?? 'p-1 gap-1',
                inputSettings.rounded?.default ?? 'rounded-xl',
                inputSettings.surface_size?.[wellSize] ?? 'min-h-11',
                className
            )}
        >
            {children}
        </View>
    )
}
