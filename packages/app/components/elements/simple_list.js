import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Time from 'app/ui/atoms/time';

export default function ElementSimpleList({data}) {
    const keys = Object.keys(data[0]);
    console.log(keys);
    return (
        <View>
            {data.map((item, index) => (
                <View key={index} className='mb-4'>
                    <Text className='font-medium'>{item[keys[0]]}</Text>
                    <Row>
                        <Time ts={item[keys[1]]} format="datetime"></Time>
                        <Text> - </Text>
                        <Time ts={item[keys[2]]} format="datetime"></Time>
                    </Row>
                </View>
            ))}
        </View>
    );
}
