import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html';
import { stripTags } from 'app/lib/util';

export default function ElementLang({data}) {

    //<Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{stripTags(data.title)}</Text>
    return (
        <View className='p-4 lg:p-0'>
            <Html data={data.content} />
        </View>
    );
}
