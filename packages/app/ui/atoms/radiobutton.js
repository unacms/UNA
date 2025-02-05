
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'

export default function ({ title, info, onPress, status, value, disabled, icon }) {
    const { colors } = Theme();
    const selected = status == 'checked';
    return (
        <Pressable disabled={disabled} onPress={onPress} className={`flex-row gap-x-[12px] items-center py-[8px] px-[12px] rounded-lg w-full ${disabled ? '': 'hover:bg-bgritem dark:hover:bg-bgritem-d'} `}>
            { !!icon && <View className=" "><Text className=" text-neutral-600 dark:text-neutral-400 my-auto h-[32px] w-[32px]">{icon}</Text></View>}
            
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