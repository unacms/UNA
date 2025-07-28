
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import * as CheckboxPrimitive from '@rn-primitives/checkbox';

export default function ({ title, info, onPress, status, value, disabled, icon, rb_obly }) {

    const selected = status == 'checked';
    if (rb_obly)
        return <View className=' h-5 w-5 rounded-full border-2 border-neutral-500 bg-transparent justify-center items-center m-1'>
            {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </View>
    return (
        <Pressable disabled={disabled} onPress={onPress} className={`flex-row gap-x-3 u-cn-chk-cnt u-cn-chk-cnt-bg ${disabled ? '' : ' hover:bg-neutral-100 dark:hover:bg-neutral-800'} `}>
            {!!icon && <View className="u-cn-chk-cnt-icon">{icon}</View>}
            <View className='flex-auto '>
                <Text className="u-cn-chk-cnt-txt">{title}</Text>
                {info && <Text className="u-cn-chk-cnt-txt2">{info}</Text>}
            </View>
            <CheckboxPrimitive.Root
                checked={selected}
                onCheckedChange={onPress}
                className='u-cn-rd-cnt-ind'
            >
                <CheckboxPrimitive.Indicator>
                    <View className={`u-cn-rd-cnt-ind-act`} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </Pressable>
    );
}