import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting, clearLinks } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';

export default function ElementEventSessions({data}) {
    return (
        <View>
            {data.map((item, index) => (
                <View key={index} className='mb-4'>
                    <Text className='font-medium'>{item.title}</Text>
                    <Text>{item.date_time}</Text>
                </View>
            ))}
        </View>
    );
}
