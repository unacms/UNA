import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'

const themeSettings = appSetting('theme', 'checkbox');

export default function CheckBox2({title, onPress, status, value, margin="my-2"}){
    const { colors } = Theme();
    const selected = status == 'checked';
    return (
        <Pressable onPress={onPress} className={'flex-row items-center ' + margin}>
            <View className={selected ? themeSettings.container_selected : themeSettings.container}>
                {selected ? <View className={`${themeSettings.selected} items-center justify-center`} >{themeSettings.selected_icon ? <Icon icon={themeSettings.selected_icon}/> : null}</View> : null}
            </View>
            <Text className={themeSettings.text}>{title}</Text>
        </Pressable>
    );
}