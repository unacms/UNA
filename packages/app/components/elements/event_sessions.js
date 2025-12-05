import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper'
export default function ElementEventSessions({ data, blockWrapperProps }) {
    const keys = Object.keys(data[0]);
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View>
            {data.map((item, index) => (
                <View key={index} className='mb-4'>
                    <Text className='font-medium'>{item[keys[0]]}</Text>
                    <Text>{item[keys[1]]}</Text>
                </View>
            ))}
        </View>
        </BlockWrapper>
    );
}
