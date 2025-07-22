import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'

export default function ReputationLeaderboard({ data }) {
    console.log("data", data)
    return (
        <View className='w-full gap-y-1'>
            {data.map((item, index) => (
                <Row className='gap-x-2 items-center ' key={index}>
                    <Row className='w-4/5 gap-x-2 items-center'>
                        <Icon icon={item.icon} size={24} />
                        <Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.title}</Text></Row>

                    <View className='w-1/5 items-end'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points_in}</Text></View>
                </Row>
            ))}
        </View>
    )
}
