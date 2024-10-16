import { View } from 'app/design/view'
import { getRandomColor } from 'app/lib/util';
import { Text } from 'app/design/typography'

export default function ({ value, bgColor="bg-white/30", progressColor="bg-white" }) {

    return (
        <View className={`${bgColor} h-2 w-full rounded`}>
            <View className={`${progressColor} h-2 w-[${value}%] rounded`} />
        </View>
    );
}
