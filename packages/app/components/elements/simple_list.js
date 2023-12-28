import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Time from 'app/ui/atoms/time';

export default function ElementSimpleList({data}) {
    const keys = Object.keys(data[0]);

    const renderData = (data) => {
        if (Number.isInteger(data) && data > 1000000000 ){
            return <Time ts={data} format="datetime"></Time>
        }
        else{
            return <Text>{data}</Text>
        }
    }

    const renderItem = (item, index, view) => {
        return (
            <View key={index} className={ (view == 'row' ? 'flex-row gap-x-4':'') + ' mb-4'}>
                <Text className='font-medium'>{item[0]}: </Text>
                <Row>
                    {renderData(item[1])}
                    {
                        item[2] && <>
                            <Text className='text-xs'> - </Text>
                            {renderData(item[2])}
                        </>
                    }
                </Row>
            </View>
        );
    };

    return (
        <View>
            {data.map((item, index) => {
                if (Array.isArray(item[keys[0]])){
                    return item.map((item1, index1) => renderItem(item1, index + '-' + index1, 'row'));
                }
                else{
                    return renderItem(Object.values(item), index);
                }
            })}
        </View>
    );
}