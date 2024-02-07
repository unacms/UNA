import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html';
import { stripTags } from 'app/lib/util';

export default function ElementLang({data}) {

    //<Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{stripTags(data.title)}</Text>
    return (
        <View className='py-2 px-4 lg:px-3 xl:px-4 duration-300 '>
            <Html data={data.content} />
        </View>
    );
}
