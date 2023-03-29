import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1, H2 } from 'app/design/typography';
import Time from '../../ui/atoms/time';

export default function ElementEntityInfo({data}) {

    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];

        if (a.type){
            return <Row key={a.name}><Text className='font-bold'>{a.caption}: </Text>{getValue(a)}</Row>
        }
        else{
            return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
        }
    }); 

    return (
        <View className="relative p-4 sm:my-0 bg-neocard dark:bg-neocard-dark border-t border-neoborder/30 dark:border-neoborder-dark/30 sm:border-x w-full mx-auto max-w-5xl">
            <H2>Info</H2>
            {inputs}
        </View>
    );

    function getValue(a)
    {
        switch (a.type) {
            case 'datetime':
                return <Time ts={a.value}></Time>
                break;
            case 'select':
                return <Text>{a.values[a.value]}</Text>
                break;
            default:
                return <Text>{a.value}</Text>
        }
    }
}
