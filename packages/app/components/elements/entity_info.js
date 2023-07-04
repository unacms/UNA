import { View, Row } from 'app/design/view';
import { Text, H2 } from 'app/design/typography';
import Time from '../../ui/atoms/time';

export default function ElementEntityInfo({data}) {

    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];

        if (a.type){
            return <Row key={a.name}><Text className='font-bold  text-neutral-800 dark:text-neutral-200'>{a.caption}: </Text>{getValue(a)}</Row>
        }
        else{
            return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
        }
    }); 

    return (
        <View className="">
            <View className='mx-4 mb-4 mt-4  text-neutral-800 dark:text-neutral-200'>
                <H2 className=' text-neutral-800 dark:text-neutral-200'>Info</H2>
                {inputs}
            </View>
        </View>
    );

    function getValue(a)
    {
        switch (a.type) {
            case 'datetime':
                return <Time ts={a.value}></Time>
                break;
            case 'select':
                return <Text className=' text-neutral-800 dark:text-neutral-200'>{a.values[a.value]}</Text>
                break;
            default:
                return <Text className=' text-neutral-800 dark:text-neutral-200'>{a.value}</Text>
        }
    }
}
