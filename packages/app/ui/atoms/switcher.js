import * as SwitchPrimitive from '@rn-primitives/switch';

export default function Switch({ value, onValueChange, size = 'base' }) {
    return (
        <SwitchPrimitive.Root
            checked={value}
            onCheckedChange={onValueChange}
            className={`u-controls-switcher-track u-controls-switcher-track-${size} ${value ? 'u-controls-switcher-track-active-col' : 'u-controls-switcher-track-col'}`}
        >
            <SwitchPrimitive.Thumb
                className={`u-controls-switcher-thumb u-controls-switcher-thumb-${size} ${value ? `u-controls-switcher-thumb-active-${size}` : 'translate-x-0'}`}
            />
        </SwitchPrimitive.Root>

    );
};
