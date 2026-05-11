import { appSetting } from 'app/lib/util'
import { Pressable, View } from 'app/design/view'

const switcherTheme = appSetting('theme', 'switcher') || {};
const theme = (key, fallback) => switcherTheme[key] || fallback;

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
            className={`${theme('u-controls-switcher-track', 'flex-row items-center rounded-full shrink-0')} ${theme('u-controls-switcher-track-' + size, size === 'sm' ? 'h-5 w-8 p-0.5' : 'h-6 w-12 p-0.5')} ${value ? theme('u-controls-switcher-track-active-col', 'bg-primary') : theme('u-controls-switcher-track-col', 'bg-muted')} ${disabled ? theme('u-controls-switcher-track-disabled', 'opacity-50') : ''}`}
        >
            <View
                className={`${theme('u-controls-switcher-thumb', 'rounded-full bg-white web:transition-transform web:duration-200')} ${theme('u-controls-switcher-thumb-' + size, size === 'sm' ? 'h-3 w-3 shadow-xs' : 'h-5 w-7 shadow-xs')} ${value ? theme('u-controls-switcher-thumb-active-' + size, 'translate-x-4') : 'translate-x-0'}
 `}
            />
        </Pressable>

    );
};
