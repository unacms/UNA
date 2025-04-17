import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'

const themeSettings = appSetting('theme', 'checkbox');

export default function CheckBox2({title, onPress, status, value , icon, margin=" my-0 ", isBackground = true}) {
    const bgStyles =' active:bg-neutral-200 dark:active:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 '
    const selected = status == 'checked';
    return (
        <Pressable onPress={onPress} className={` ${icon ? 'flex-row gap-x-[12px]': 'flex-row-reverse'} ${isBackground ? bgStyles: ''} ${margin} items-center py-[8px] px-[12px] rounded-lg w-full`}>
             { !!icon && <View className="w-8">{icon}</View>}
            
            <View className="flex-auto"><Text className={themeSettings.text}>{title}</Text></View>
            <View className={selected ? themeSettings.container_selected : themeSettings.container}>
                {selected ? <View className={`${themeSettings.selected} items-center justify-center`} >{themeSettings.selected_icon ? <Icon icon={themeSettings.selected_icon}/> : null}</View> : null}
            </View>
        </Pressable>
    );
}