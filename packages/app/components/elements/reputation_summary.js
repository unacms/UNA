import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'

export default function ReputationSummary({ data }) {
    return (
        <View className="items-center">
            <Profile
                {...data.author_data}
                displayType="unit_wo_info"
                displaySize="2xl"
            />
            <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200">{data.author_data.display_name}</Text>
            <View className="items-center mt-4">
                {data.levels.map((item, index) => (
                    <Text className="text-base text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                ))}
            </View>
        </View>
    )
}
