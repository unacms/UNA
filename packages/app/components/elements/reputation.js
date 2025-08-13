import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import { Icon } from 'app/ui/atoms/icon'
import { Svg, Path } from 'react-native-svg'
import { Button, Modal } from 'app/design/controls'
import { useState, useEffect } from 'react'
import { fetcher } from 'app/lib/fetcher'
import Tabs from 'app/ui/molecules/tabs'
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableHeaderText,
    TableCellText,
} from 'app/ui/molecules/table'
import Badge from 'app/ui/molecules/badge'
import { useLayoutSettings } from 'app/context/layout-settings';
import { cd } from 'app/lib/util'
import { Loading } from 'app/loading'

export function ReputationActions({ data }) {
    return (
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead className="flex-[3]">
                        <TableHeaderText>Action</TableHeaderText>
                    </TableHead>
                    <TableHead className="flex-1 justify-center">
                        <TableHeaderText>Points (active)</TableHeaderText>
                    </TableHead>
                    <TableHead className="flex-1 justify-center">
                        <TableHeaderText>Points (passive)</TableHeaderText>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell className="flex-[3]">
                            <TableCellText>
                                {item.unit} {item.action}
                            </TableCellText>
                        </TableCell>
                        <TableCell className="flex-1 justify-center">
                            <TableCellText className="font-medium">
                                {item.points_active}
                            </TableCellText>
                        </TableCell>
                        <TableCell className="flex-1 justify-center">
                            <TableCellText className="font-medium">
                                {item.points_passive}
                            </TableCellText>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function ReputationSummary({ data }) {
    if (data.mode === 'simple') {
        return <ReputationSummarySimple data={data} />
    }
    return (
        <View className="flex-auto">
            <ReputationSummarySimple data={data} />
        </View>
    )
}

export function ReputationWidget({ data }) {
    const [tabsData, setTabsData] = useState(data.tabs)
    useEffect(() => {
        const fetchAllTabs = async () => {
            try {
                const results = await Promise.all(
                    data.tabs.map(async ({ url, title, data }, index) => {
                        const loadedData =
                            data ?? (await fetcher(url))?.data?.[0]?.data ?? []
                        return {
                            title: title,
                            data: loadedData,
                            index,
                            url,
                        }
                    })
                )
                setTabsData(results)
            } catch (error) {
                console.error('Error loading data:', error)
            }
        }

        fetchAllTabs()
    }, [])

    const preparedTabs = tabsData.map((item) => ({
        ...item,
        key: item.url,
        content: item.url.includes('leaderboard') ? (
            item.data ? <ReputationLeaderboard data={item.data} /> : <View className='h-12'><Loading /></View>
        ) : (
            item.data ? <ReputationSummary data={item.data} /> : <View className='h-12'><Loading /></View>
        ),
    }))

    return <Tabs tabs={preparedTabs} size="sm" activeTab={tabsData[0].url} />
}

function ReputationSummarySimple({ data }) {
    const { density } = useLayoutSettings();
    const [isModal, setIsModal] = useState(false)
    const [isModal2, setIsModal2] = useState(false)
    return (
        <View className={`w-full ${cd('gap-md')}`}>
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
            <View className={`flex-auto flex-row ${cd('gap-md')} w-full items-center`}>
                <View className={` ${cd('p-xs', density)} border-4 border-border rounded-full`}>
                    <Profile
                        {...data.author_data}
                        displayType="unit_wo_info"
                        displaySize="2xl"
                    />
                    <View className="absolute -bottom-1 -end-1">
                        <Badge className={`rounded-full ${cd('p-xs')} h-9 w-9 items-center justify-center border-card font-mono tabular-nums`} variant="secondary">
                        {data.levels && data.levels.length > 0 && data.levels[0].icon && (
                            <Icon icon={data.levels[0].icon} size={24}  />
                        )}
                        </Badge>
                    </View>
                </View>
                <View className={`flex-auto ${cd('gap-xs')} justify-center`}>
                    <Text className="font-bold text-2xl text-foreground">
                        {data.author_data.display_name}
                    </Text>
                    {data.levels.map((item, index) => (
                            <View key={index} className={`flex-row ${cd('gap-sm')} flex-auto items-center`}>
                                
                                <Badge variant="secondary" data={{text:item.title, icon:item.icon}} />
                               
                                <View className="flex-auto justify-end flex-row">
                                    <Button
                                        variant="text"
                                        rounded
                                        size="sm"
                                        startDecorator="ListPlus"
                                        onPress={() => setIsModal2(true)}
                                    />
                                      
                                </View>
                            </View>
                            
                        ))}
                    <View className={`flex-row ${cd('gap-sm')} flex-auto justify-between items-center`}>
                      
                        <View className={`flex-row items-end ${cd('gap-sm')}`}>
                            <Text className="text-3xl font-bold text-foreground">
                                {data.points || 0}
                            </Text>
                            <Text className="text-lg text-muted-foreground">
                                points
                            </Text>
                        </View>
                        <Button
                                            variant="text"
                                            rounded
                                            size="sm"
                                            startDecorator="Info"
                                            onPress={() => setIsModal(true)}
                                        />
                    </View>
                   
                </View>
            </View>
          
        </View>
    )
}

export function ReputationLeaderboard({ data }) {
    const getPositionColors = (index) => {
        switch (index) {
            case 0:
                return 'bg-yellow-500' // Gold for 1st place
            case 1:
                return 'bg-gray-400 dark:bg-gray-600' // Silver for 2nd place
            case 2:
                return 'bg-amber-600' // Bronze for 3rd place
            default:
                return 'bg-transparent border border-gray-300 dark:border-gray-600'
        }
    }

    const getStarColor = (index) => {
        switch (index) {
            case 0:
                return '#EAB308' // Gold
            case 1:
                return '#9CA3AF' // Silver
            case 2:
                return '#D97706' // Bronze
            default:
                return 'transparent'
        }
    }

    const getTextColor = (index) => {
        return index < 3 ? 'text-white' : 'text-gray-600 dark:text-gray-400'
    }

    const StarIcon = ({ color, size = 28 }) => (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            stroke={color}
        >
            <Path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </Svg>
    )

    return (
        <View className={`items-center w-full flex-col ${cd('gap-sm')} ${cd('px-sm')} max-w-xl mx-auto`}>
            {data.profiles.map((item, index) => (
                <Row
                    className={`w-full flex-wrap justify-between items-center ${
                        index != 0 && 'mt-3'
                    }`}
                    key={index}
                >
                    <Row className={`items-center ${cd('gap-sm')}`}>
                        <View className="w-7 h-7 items-center justify-center relative">
                            {index < 3 ? (
                                <>
                                    <StarIcon
                                        color={getStarColor(index)}
                                        size={28}
                                    />
                                    <Text
                                        className={`${getTextColor(
                                            index
                                        )} text-xs font-bold absolute`}
                                    >
                                        {index + 1}
                                    </Text>
                                </>
                            ) : (
                                <View
                                    className={`w-6 h-6 rounded-full ${getPositionColors(
                                        index
                                    )} items-center justify-center`}
                                >
                                    <Text
                                        className={`${getTextColor(
                                            index
                                        )} text-sm font-bold`}
                                    >
                                        {index + 1}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Profile
                            {...item.unit}
                            displayType="unit"
                            displaySize="base"
                        />
                    </Row>
                    <Text className=" text-base font-bold text-muted-foreground">
                        {item.sign}
                        {item.points}
                    </Text>
                </Row>
            ))}
        </View>
    )
}

export function ReputationHistory({ data }) {
    return (
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead className="flex-1">
                        <TableHeaderText>Date</TableHeaderText>
                    </TableHead>
                    <TableHead className="flex-[3]">
                        <TableHeaderText>Action</TableHeaderText>
                    </TableHead>
                    <TableHead className="flex-1 ">
                        <TableHeaderText>Points</TableHeaderText>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell className="flex-1 ">
                            <Time
                                stylesName=""
                                ts={item.date}
                                format="datetime"
                            />
                        </TableCell>
                        <TableCell className="flex-[3]">
                            <TableCellText>
                                {item.unit} {item.action}
                            </TableCellText>
                        </TableCell>
                        <TableCell className="flex-1 ">
                            <TableCellText className="font-medium">
                                {item.points}
                            </TableCellText>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function ReputationLevels({ data }) {
    return (
        <Table className="w-full">
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index} className="border-b-0">
                        <TableCell className="flex-auto">
                            <Row className="gap-x-2 items-center">
                                <Icon icon={item.icon} size={24} />
                                <TableCellText>{item.title}</TableCellText>
                            </Row>
                        </TableCell>
                        <TableCell className="flex-none">
                            <TableCellText className="text-muted-foreground font-bold">
                                {item.points_in}
                            </TableCellText>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
