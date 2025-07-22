import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time';

export default function ReputationHistory({ data }) {
    return (
        <View className='w-full gap-y-1'>
            {data.map((item, index) => (
                <Row className='gap-x-2 items-center justify-center ' key={index}>
                    <View className='w-1/5 '><Time stylesName= "text-base text-neutral-800 dark:text-neutral-200" ts={item.date} format="datetime"></Time></View>
                    <View className='w-3/5'><Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.unit} {item.action}</Text></View>
                    <View className='w-1/5 items-end'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points}</Text></View>
                </Row>
            ))}</View>
    )
}
