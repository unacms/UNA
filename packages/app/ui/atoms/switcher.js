import * as SwitchPrimitive from '@rn-primitives/switch';
import { appSetting } from 'app/lib/util'
const switcherTheme = appSetting('theme', 'switcher');

export default function Switch({ value, onValueChange, size = 'base' }) {
    return (
        <SwitchPrimitive.Root
            checked={value}
            onCheckedChange={onValueChange}
            className={` ${switcherTheme['u-controls-switcher-track']} ${switcherTheme['u-controls-switcher-track-'+size]} ${switcherTheme['u-controls-switcher-track-col']} ${value ? switcherTheme['u-controls-switcher-track-active-col'] : ''  }`}
        >
            <SwitchPrimitive.Thumb
                className={`${switcherTheme['u-controls-switcher-thumb']} ${switcherTheme['u-controls-switcher-thumb-'+size]} ${value ? switcherTheme['u-controls-switcher-thumb-active-'+size] : 'translate-x-0'}
 `}
            />
        </SwitchPrimitive.Root>

    );
};
