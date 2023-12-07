import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html';
import { stripTags } from 'app/lib/util';

export default function ElementLang({data}) {

    //<Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{stripTags(data.title)}</Text>
    return (
        <View className='p-2 lg:p-3 xl:p-4 duration-300 '>
            <Html data={data.content} />
        </View>
    );
}
