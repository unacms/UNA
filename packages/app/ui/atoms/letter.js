import { View } from 'app/design/view'
import { getRandomColor } from 'app/lib/util';
import { Text } from 'app/design/typography'

export default function ({title}) {
    const letter = title ? title.substr(0, 1) : ''
    return (
        <View className={'items-center opacity-80 justify-center rounded-full h-16 w-16 md:h-24 md:w-24 xl:h-32 xl:w-32 bg-' + getRandomColor(title) + '-500 uppercase'}>
            <Text className={' text-4xl xl:text-5xl font-bold opacity-80 text-white '}>{letter}</Text>
        </View>
    );
}
