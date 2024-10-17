import { View } from 'app/design/view'
import { getRandomColor } from 'app/lib/util';
import { Text } from 'app/design/typography'

export default function ({ value, bgColor="bg-white/30", progressColor="bg-white" }) {
// TODO CHECK W/17%
    return (
        <View className={`${bgColor} h-2 w-full rounded`}>
            <View style={{width: `${value}%`}} className={`${progressColor} h-2 rounded`} />
        </View>
    );
}
