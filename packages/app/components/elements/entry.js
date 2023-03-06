import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography';

export default function ElementEntry({data}) {
    return (
        <View className="flex-1 relative sm:my-0 bg-card  dark:bg-card-dark sm:border-x  border-bordercolor/10 dark:border-bordercolor-dark/10 w-full mx-auto max-w-5xl">
            {(data.image) && <Image {...data.image} alt={data.title} priority className=" mt-4 " />}  
            <View className="mx-4 mb-4">
                <H1 className="font-bold tracking-tight  text-neo-900 dark:text-neo-50 ">{data.title}</H1>
                <Html data={data.text} />
            </View>
        </View>
    );
}
