import { View } from 'app/design/view'
import { getRandomColor } from 'app/lib/util';
import { Text } from 'app/design/typography'

export default function ({title}) {
    const letter = title ? title.substr(0, 1) : ''
    return (
        <View className={'items-center justify-center rounded-full h-16 w-16 xl:h-24 xl:w-24 bg-' + getRandomColor(title) + '-500 uppercase'}>
            <Text className={' text-xl xl:text-3xl  font-bold  text-white '}>{letter}</Text>
        </View>
    );
}
