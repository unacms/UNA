
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'

export default function ({ title, info, onPress, status, value, disabled, icon, rb_obly }) {
    const { colors } = Theme();
    const selected = status == 'checked';
    if (rb_obly)
        return <View className=' h-[20px] w-[20px] rounded-full border-[2px] border-neutral-500 bg-transparent justify-center items-center m-[4px]'>
        {selected ? <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: colors.checkbox }} /> : null}
    </View>
    return (
        <Pressable disabled={disabled} onPress={onPress} className={`flex-row gap-x-3 items-center py-2.5 px-3 active:bg-neutral-200 dark:active:bg-neutral-700 rounded-[12px] w-full ${disabled ? '' : ' hover:bg-neutral-100 dark:hover:bg-neutral-800'} `}>
            { !!icon && <View className=" "><View className="text-neutral-600 dark:text-neutral-400 my-auto h-[24px] w-[24px]">{icon}</View></View>}
            
            <View className='flex-auto '>
                <Text className=" text-neutral-800 dark:text-neutral-200 text-[16px] leading-[22px] font-medium">{title}</Text>
                {info && <Text className="text-neutral-600 dark:text-neutral-400 text-[14px] leading-[20px]">{info}</Text>}
            </View>
            <View className=' h-[20px] w-[20px] rounded-full border-[2px] border-neutral-500 bg-transparent justify-center items-center m-[4px]'>
                {selected ? <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: colors.checkbox }} /> : null}
            </View>
        </Pressable>
    );
}