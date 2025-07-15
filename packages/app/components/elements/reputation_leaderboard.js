import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'
import { Svg, Path } from 'react-native-svg'

export default function ReputationLeaderboard({ data }) {
    const getPositionColors = (index) => {
        switch (index) {
            case 0: return 'bg-yellow-500'; // Gold for 1st place
            case 1: return 'bg-gray-400 dark:bg-gray-600'; // Silver for 2nd place
            case 2: return 'bg-amber-600'; // Bronze for 3rd place
            default: return 'bg-transparent border border-gray-300 dark:border-gray-600';
        }
    };

    const getStarColor = (index) => {
        switch (index) {
            case 0: return '#EAB308'; // Gold
            case 1: return '#9CA3AF'; // Silver
            case 2: return '#D97706'; // Bronze
            default: return 'transparent';
        }
    };

    const getTextColor = (index) => {
        return index < 3 ? 'text-white' : 'text-gray-600 dark:text-gray-400';
    };

    const StarIcon = ({ color, size = 28 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color}>
            <Path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </Svg>
    );

    return (
        <View className="items-center w-full">
                {data.profiles.map((item, index) => (
                    <Row className={`w-full justify-between items-center ${index != 0 && 'mt-3'}`} key={index}>
                        <Row className="items-center">
                            <View className="w-7 h-7 items-center justify-center mr-3 relative">
                                {index < 3 ? (
                                    <>
                                        <StarIcon color={getStarColor(index)} size={28} />
                                        <Text className={`${getTextColor(index)} text-xs font-bold absolute`}>{index + 1}</Text>
                                    </>
                                ) : (
                                    <View className={`w-6 h-6 rounded-full ${getPositionColors(index)} items-center justify-center`}>
                                        <Text className={`${getTextColor(index)} text-xs font-bold`}>{index + 1}</Text>
                                    </View>
                                )}
                            </View>
                            <Profile
                                {...item.unit}
                                displayType="unit"
                                displaySize="base"
                            />
                        </Row>
                        <Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.sign}{item.points}</Text>
                    </Row>
                ))}
        </View>
    )
}
