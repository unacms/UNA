import { View } from 'app/design/view';
import Image from '../atoms/image';
import Html from '../atoms/html';
import { Text, H1 } from 'app/design/typography';

export default function ElementEntry({data}) {
    return (
        <View className="p-4 relative sm:my-0 sm:mx-4   sm:border-x border-gray-300/80  bg-white  dark:bg-gray-900  dark:border-gray-800/50">
            {(data.image) && <Image {...data.image} alt={data.title} priority className="w-full aspect-video sm:rounded-lg mb-4" />}  
            <H1 className=" font-bold tracking-tight  text-gray-900 dark:text-gray-50 ">{data.title}</H1>
            <Html data={data.text} />
        </View>
    );
}
