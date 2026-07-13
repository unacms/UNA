import { appSetting } from 'app/lib/util'
import { Pressable, View } from 'app/design/view'

const switcherTheme = appSetting('theme', 'switcher');

/** Legacy aliases → small | regular | large */
const SWITCH_SIZE_ALIASES = {
    sm: 'small',
    base: 'regular',
    lg: 'large',
    default: 'regular',
};

export function resolveControlSize(size) {
    if (!size) return 'regular';
    return SWITCH_SIZE_ALIASES[size] ?? size;
}

export default function Switch({ value, disabled, onValueChange, size = 'regular' }) {
    const resolvedSize = resolveControlSize(size);
    const trackSize =
        switcherTheme[`u-controls-switcher-track-${resolvedSize}`]
        ?? switcherTheme['u-controls-switcher-track-regular'];
    const thumbSize =
        switcherTheme[`u-controls-switcher-thumb-${resolvedSize}`]
        ?? switcherTheme['u-controls-switcher-thumb-regular'];
    const thumbActive =
        switcherTheme[`u-controls-switcher-thumb-active-${resolvedSize}`]
        ?? switcherTheme['u-controls-switcher-thumb-active-regular'];
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
            className={`${switcherTheme['u-controls-switcher-track']} ${trackSize} ${value ? switcherTheme['u-controls-switcher-track-active-col'] : switcherTheme['u-controls-switcher-track-col']} ${disabled ? switcherTheme['u-controls-switcher-track-disabled'] : ''}`}
        >
            <View
                className={`${switcherTheme['u-controls-switcher-thumb']} ${thumbSize} ${value ? thumbActive : ''}`}
            />
        </Pressable>
    );
}
