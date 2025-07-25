import * as SwitchPrimitive from '@rn-primitives/switch';

export default function Switch({ value, onValueChange, size = 'base' }) {
    return (
        <SwitchPrimitive.Root
            checked={value}
            onCheckedChange={onValueChange}
            className={`u-cn-sw-trk u-cn-sw-trk-${size} ${value ? 'u-cn-sw-trk-col-act' : 'u-cn-sw-trk-col'}`}
        >
            <SwitchPrimitive.Thumb
                className={`u-cn-sw-tmb u-cn-sw-tmb-${size} ${value ? `u-cn-sw-tmb-act-${size}` : 'translate-x-0'}`}
            />
        </SwitchPrimitive.Root>

    );
};
