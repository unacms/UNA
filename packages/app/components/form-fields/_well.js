import { View } from 'app/design/view'
import { appSetting, cn } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs')

/**
 * Input-height surface for fields made of buttons instead of a text box
 * (labels, selector, visibility, attachments). Same fill, outline, radius and
 * height as text inputs; `p-1` fits `small` (36px) buttons from
 * `wellButtonProps` into the 44px well with a 4px inset.
 */
export default function FieldWell({ className, children }) {
    return (
        <View
            className={cn(
                'w-full flex-row flex-wrap items-center gap-1 p-1 bg-input/50 shadow-input-outline dark:shadow-input-outline-deep',
                inputSettings.rounded?.default ?? 'rounded-xl',
                inputSettings.surface_size?.regular ?? 'min-h-11',
                className
            )}
        >
            {children}
        </View>
    )
}
