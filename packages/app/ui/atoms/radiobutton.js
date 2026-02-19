
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { appSetting } from 'app/lib/util';
const checkboxTheme = appSetting('theme', 'checkbox');

export default function ({ title, info, onPress, status, value, disabled, icon, rb_obly }) {

    const selected = status == 'checked';
    if (rb_obly)
        return <View className=' h-5 w-5 rounded-full border-2 border-border bg-transparent web:group-hover:border-secondary-foreground justify-center items-center m-1'>
            {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </View>
    return (
        <Pressable disabled={disabled} onPress={onPress} className={`flex-row gap-x-3 ${checkboxTheme['u-controls-checkbox-container']} ${checkboxTheme['u-controls-checkbox-container-bg']} ${disabled ? '' : ' web:hover:bg-background'} `}>
            {!!icon && <View className={checkboxTheme['u-controls-checkbox-icon']}>{icon}</View>}
            <View className='flex-auto '>
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
                {info && <Text className={checkboxTheme['u-controls-checkbox-text2']}>{info}</Text>}
            </View>
            <CheckboxPrimitive.Root
                checked={selected}
                onCheckedChange={onPress}
                className={checkboxTheme['u-controls-radiobutton-indicator']}
            >
                <CheckboxPrimitive.Indicator>
                    <View className={checkboxTheme['u-controls-radiobutton-indicator-active']} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </Pressable>
    );
}