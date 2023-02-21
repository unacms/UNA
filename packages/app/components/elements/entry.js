import { View } from 'app/design/view';
import Image from '../atoms/image';
import Html from '../atoms/html';
import { Text, H1 } from 'app/design/typography';

export default function ElementEntry({data}) {
    return (
        <View className=" relative sm:my-0 bg-white  dark:bg-gray-900 ">
            {(data.image) && <Image {...data.image} alt={data.title} priority className=" mt-4 " />}  
            <View className="mx-4 mb-4">
                <H1 className="font-bold tracking-tight  text-gray-900 dark:text-gray-50 ">{data.title}</H1>
                <Html data={data.text} />
            </View>
        </View>
    );
}
