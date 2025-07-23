import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile'
import { Icon } from 'app/ui/atoms/icon'
import { Svg, Path } from 'react-native-svg'
import { Button, Modal } from 'app/design/controls';
import { useState, useEffect } from "react";
import { fetcher } from 'app/lib/fetcher';


export function ReputationActions({ data }) {
    return (
        <View className='w-full gap-y-1'>
            <Row className=' items-center justify-center '>
                <View className='w-3/5 '><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">Action</Text></View>
                <View className='w-1/5  items-center'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">
                    Points (active)</Text></View>
                <View className='w-1/5  items-center'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">Points (passive)</Text></View>
            </Row>
            {data.map((item, index) => (
                <Row className=' items-center justify-center ' key={index}>
                    <View className='w-3/5 '><Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.unit} {item.action}</Text></View>
                    <View className='w-1/5 items-center'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points_active}</Text></View>
                    <View className='w-1/5 items-center'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points_passive}</Text></View>
                </Row>
            ))}</View>
    )
}

export function ReputationSummary({ data }) {
    if (data.mode === 'simple') {
        return <ReputationSummarySimple data={data} />
    }
    return (
        <Row className='w-full  items-center gap-x-8 justify-center'>
            <View>
                <ReputationSummarySimple data={data} />
            </View>
            <View>
                <ReputationLevels data={data.levels_list} />
            </View>
        </Row>
    )
}

export function ReputationWidget({ data }) {
    const [tabsData, setTabsData] = useState([]);
    const tabs = [
        { url: '/api.php?r=bx_reputation/get_block_summary', title: 'Summary', type: ReputationSummary },
        { url: '/api.php?r=bx_reputation/get_block_leaderboard&params[]=0', title: 'Leaderboard', type: ReputationLeaderboard },
        { url: '/api.php?r=bx_reputation/get_block_leaderboard&params[]=7', title: 'Leaderboard', type: ReputationLeaderboard },
        { url: '/api.php?r=bx_reputation/get_block_leaderboard&params[]=30', title: 'Leaderboard', type: ReputationLeaderboard },
    ];

    useEffect(() => {
        const fetchAllTabs = async () => {
            try {
                const results = await Promise.all(
                    tabs.map(async ({ url, title, type }, index) => {
                        const res = await fetcher(url);
                        return {
                            title,
                            type,
                            data: res?.data?.[0]?.data,
                            index: index,
                            selected: index === 0
                        };
                    })
                );
                setTabsData(results);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };

        fetchAllTabs();
    }, []);

    if (tabsData) {
        return (<View className={`w-full `}>
            <Row className='gap-x-2 mb-3'>
                {tabsData.map((item, index) => (<Button 
                    size="sm" 
                    rounded
                    variant={item.selected ? 'primary' : 'secondary'}
                    pressed={item.selected} title={item.title} key={index} onPress={() => {
                        setTabsData((prev) =>
                            prev.map((tab, i) => ({
                                ...tab,
                                selected: i === index, 
                            }))
                        );
                    }} />
                ))}
            </Row>
            {tabsData.map((item, index) => (
                <View key={index} className={`w-full ${item.selected ? ' ' : 'hidden'} `}>
                    <item.type data={item.data} />
                </View>))}
        </View>

        )
    }
}

function ReputationSummarySimple({ data }) {
    const [isModal, setIsModal] = useState(false);
    return (
        <View className="items-center gap-y-2">
            <Modal scrollable={true} title="Score rules" onVisible={isModal} outerClickClose={true} onClose={() => setIsModal(false)}>
                <View className='lg:min-w-md w-full'>
                    <ReputationActions data={data.actions_list} />
                </View>
            </Modal>
            <Profile
                {...data.author_data}
                displayType="unit_wo_info"
                displaySize="2xl"
            />
            <Text className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{data.author_data.display_name}</Text>
            <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200 py-2">{data.points || 0} points</Text>
            {data.levels.map((item, index) => (
                <Row className='gap-x-2 items-center justify-center' key={index}>
                    <Icon icon={item.icon} size={24} />
                    <Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                    <Button startDecorator="Info" onPress={() => setIsModal(true)} />
                </Row>
            ))}
        </View>
    )
}

export function ReputationLeaderboard({ data }) {
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

export function ReputationHistory({ data }) {
    return (
        <View className='w-full gap-y-1'>
            {data.map((item, index) => (
                <Row className='gap-x-2 items-center justify-center ' key={index}>
                    <View className='w-1/5 '><Time stylesName="text-base text-neutral-800 dark:text-neutral-200" ts={item.date} format="datetime"></Time></View>
                    <View className='w-3/5'><Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.unit} {item.action}</Text></View>
                    <View className='w-1/5 items-end'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points}</Text></View>
                </Row>
            ))}</View>
    )
}

export function ReputationLevels({ data }) {
    return (
        <View className='w-full gap-y-1'>
            {data.map((item, index) => (
                <Row className=' items-center  gap-x-4 ' key={index}>
                    <Row className='w-4/5 gap-x-2 items-center'>
                        <Icon icon={item.icon} size={24} />
                        <Text className=" text-base text-neutral-800 dark:text-neutral-200">{item.title}</Text></Row>

                    <View className='w-1/5 items-end'><Text className=" text-base text-neutral-800 font-medium dark:text-neutral-200">{item.points_in}</Text></View>
                </Row>
            ))}
        </View>
    )
}
