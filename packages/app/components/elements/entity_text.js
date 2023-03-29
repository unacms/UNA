import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography';

export default function ElementEntityText({data}) {
    return (
        <View className="relative sm:my-0 bg-card  dark:bg-card-dark sm:border-x  border-neoborder/30 dark:border-neoborder-dark/30 w-full mx-auto max-w-5xl">
            {(data.image) && <View className="w-full aspect-[3/1] mb-4"><Image {...data.image} alt={data.title} priority className=" mt-4 u-cover" view="cover"   /></View>}  
            <View className="mx-4 mb-4">
                <H1 className="font-bold tracking-tight  text-neogray-900 dark:text-neogray-50 ">{data.title}</H1>
                <Html data={data.text} />
            </View>
        </View>
    );
}
