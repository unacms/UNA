import { appSetting } from 'app/lib/util'
import { Pressable, View } from 'app/design/view'

const switcherTheme = appSetting('theme', 'switcher');

export default function Switch({ value, disabled, onValueChange, size = 'base' }) {
    const nextValue = !value;

    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: !!value, disabled: !!disabled }}
            aria-checked={!!value}
            aria-disabled={!!disabled}
            disabled={disabled}
            onPress={() => {
                if (!disabled) onValueChange?.(nextValue);
            }}
            className={`${switcherTheme['u-controls-switcher-track']} ${switcherTheme['u-controls-switcher-track-' + size]} ${value ? switcherTheme['u-controls-switcher-track-active-col'] : switcherTheme['u-controls-switcher-track-col']} ${disabled ? switcherTheme['u-controls-switcher-track-disabled'] : ''}`}
        >
            <View
                className={`${switcherTheme['u-controls-switcher-thumb']} ${switcherTheme['u-controls-switcher-thumb-' + size]} ${value ? switcherTheme['u-controls-switcher-thumb-active-' + size] : ''}`}
            />
        </Pressable>
    );
}
