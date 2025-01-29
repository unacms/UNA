
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'

export default function ({ title, info, onPress, status, value }) {
    const { colors } = Theme();
    const selected = status == 'checked';
    return (
        <Pressable onPress={onPress} className='flex-row gap-x-[8px] items-center p-[8px] rounded-lg w-full hover:bg-bgritem dark:hover:bg-bgritem-d'>
            <View className=' h-[20px] w-[20px] rounded-full border-[2px] border-neutral-500 bg-transparent justify-center items-center m-[4px]'>
                {selected ? <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: colors.checkbox }} /> : null}
            </View>
            <View>
                <Text className=" text-neutral-800 dark:text-neutral-200 text-[16px] leading-[22px] font-medium">{title}</Text>
                {info && <Text className="text-neutral-600 dark:text-neutral-400 text-[14px] leading-[20px]">{info}</Text>}
            </View>
        </Pressable>
    );
}