import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'

export default function ReputationSummary({ data }) {
    return (
        <View className="items-center gap-y-2">
            <Profile
                {...data.author_data}
                displayType="unit_wo_info"
                displaySize="2xl"
            />
            <Text className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{data.author_data.display_name}</Text>
            <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200 py-2">{data.points || 0} points</Text>
            {data.levels.map((item, index) => (
                <Row className='gap-x-2 items-center justify-center' key={index}>
                    <Icon icon={item.icon} size={24}  />
                    <Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                </Row>
            ))}
        </View>
    )
}
