//import CheckBox from '@react-native-community/checkbox';
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'

export default function CheckBox2({title, onPress, status, value, margin="my-2"}){
    const { colors } = Theme();
    const selected = status == 'checked';
    return (
        <Pressable onPress={onPress} className={'flex-row items-center ' + margin}>
            <View className='h-5 w-5 rounded-sm border-2 border-bdrinput dark:border-bdrinput-d justify-center items-center mr-2'>
                {selected ? <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors.checkbox }} /> : null}
            </View>
            <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{title}</Text>
        </Pressable>
    );
}