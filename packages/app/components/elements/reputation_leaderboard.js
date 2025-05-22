import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'

export default function ReputationLeaderboard({ data }) {
    return (
        <View className="items-center w-full">
                {data.profiles.map((item, index) => (
                    <Row className={`w-full justify-between items-center ${index != 0 && 'mt-3'}`} key={index}>
                        <Profile
                            {...item.unit}
                            displayType="unit"
                            displaySize="base"
                        />
                        <Text className="text-base text-neutral-800 dark:text-neutral-200">{item.sign}{item.points}</Text>
                    </Row>
                ))}
        </View>
    )
}
