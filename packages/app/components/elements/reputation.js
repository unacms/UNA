import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile'
import { Icon } from 'app/ui/atoms/icon'
import { Svg, Path } from 'react-native-svg'
import { Button, Modal } from 'app/design/controls';
import { useState, useEffect } from "react";
import { fetcher } from 'app/lib/fetcher';
import Tabs from 'app/ui/molecules/tabs'

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
        <Row className='w-full max-w-xl mx-auto items-center justify-center'>
            <View className='flex-auto'>
                <ReputationSummarySimple data={data} />
            </View>
        </Row>
    )
}

export function ReputationWidget({ data }) {
    const [tabsData, setTabsData] = useState(data.tabs);
    useEffect(() => {
        const fetchAllTabs = async () => {
            try {
                const results = await Promise.all(
                    data.tabs.map(async ({ url, title, data }, index) => {
                        const loadedData = data ?? (await fetcher(url))?.data?.[0]?.data ?? [];
                        return {
                            title,
                            data: loadedData,
                            index,
                            url,
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

    const preparedTabs = tabsData.map((item) => ({
        ...item,
        key: item.url,
        content: item.url.includes('leaderboard') ? <ReputationLeaderboard data={item.data} /> : <ReputationSummary data={item.data} />
    }));

    return <Tabs tabs={preparedTabs} activeTab={tabsData[0].url} />;

}



function ReputationSummarySimple({ data }) {
    const [isModal, setIsModal] = useState(false);
    const [isModal2, setIsModal2] = useState(false);
    return (
        <View className="w-full gap-y-2 p-md rounded-2xl shadow-sm border border-border min-w-40 max-w-sm items-center">
            <Modal
                scrollable
                title="Score rules"
                onVisible={isModal}
                outerClickClose
                onClose={() => setIsModal(false)}
            >
                <View className="w-full lg:min-w-md">
                    <ReputationActions data={data.actions_list} />
                </View>
            </Modal>
             <Modal
                scrollable
                title="Levels"
                onVisible={isModal2}
                outerClickClose
                onClose={() => setIsModal2(false)}
            >
                <View className="w-full lg:min-w-md">
                   <ReputationLevels data={data.levels_list} />
                </View>
            </Modal>
            <Profile
                {...data.author_data}
                displayType="unit_wo_info"
                displaySize="2xl"
            />
            <Text className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{data.author_data.display_name}</Text>
            <Text className="text-sm text-muted-foreground ">{data.points || 0} points</Text>
            <View className='flex-auto absolute right-1 top-1'>
                <Button variant='link' rounded size='sm' startDecorator="Info" onPress={() => setIsModal(true)} />
            </View>
            <View className='flex-auto absolute left-1 top-1'>
                <Button variant='link' rounded size='sm' startDecorator="Plus" onPress={() => setIsModal2(true)} />
            </View>

            {data.levels.map((item, index) => (
                <Row className='gap-x-2 items-center justify-center' key={index}>
                        <Icon icon={item.icon} size={20} />
                        <Text className=" text-sm text-foreground">{item.title}</Text>
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
        <View className="items-center w-full flex-col gap-sm px-sm max-w-xl mx-auto">
            {data.profiles.map((item, index) => (
                <Row className={`w-full flex-wrap justify-between items-center ${index != 0 && 'mt-3'}`} key={index}>
                    <Row className="items-center gap-sm">
                        <View className="w-7 h-7 items-center justify-center relative">
                            {index < 3 ? (
                                <>
                                    <StarIcon color={getStarColor(index)} size={28} />
                                    <Text className={`${getTextColor(index)} text-xs font-bold absolute`}>{index + 1}</Text>
                                </>
                            ) : (
                                <View className={`w-6 h-6 rounded-full ${getPositionColors(index)} items-center justify-center`}>
                                    <Text className={`${getTextColor(index)} text-sm font-bold`}>{index + 1}</Text>
                                </View>
                            )}
                        </View>
                        <Profile
                            {...item.unit}
                            displayType="unit"
                            displaySize="base"
                        />
                    </Row>
                    <Text className=" text-base font-bold text-muted-foreground">{item.sign}{item.points}</Text>
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
        <View className='w-full gap-lg p-lg rounded-r-lg bg-muted items-center h-full  flex-auto'>
            {data.map((item, index) => (
                <Row className=' justify-between gap-md w-full' key={index}>
                    <Row className=' gap-x-2 flex-auto'>
                        <Icon icon={item.icon} size={24} />
                        <Text className=" text-sm leading-6 text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                        </Row>

                    <Text className=" text-base text-muted-foreground font-bold">{item.points_in}</Text>
                </Row>
            ))}
        </View>
    )
}
