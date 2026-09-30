import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile/profile'
import { Icon } from 'app/ui/atoms/icon'
import { Svg, Path } from 'react-native-svg'
import { Button, Modal } from 'app/design/controls'
import { useState, useCallback, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useFetch, fetchQueryOptions } from 'app/lib/hooks/use-fetch'
import Tabs from 'app/ui/molecules/tabs/tabs'
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableHeaderText,
    TableCellText,
} from 'app/ui/molecules/page/table'
import Badge from 'app/ui/molecules/profile/badge'
import { Loading } from 'app/customization/loading'
import { renderForm } from 'app/components/elements/form'
import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

export function ReputationActions({ data, blockWrapperProps }) {
    return (
        <BlockWrapper {...blockWrapperProps}>
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="flex-3">
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
                            <TableCell className="flex-3">
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
        </BlockWrapper >
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
    // Tabs without inline `data` load their own; each shows <Loading /> until then.
    const tabQueries = useQueries({
        queries: data.tabs.map((tab) => fetchQueryOptions(tab.data ? null : tab.url)),
    })
    const tabsData = data.tabs.map(({ url, title, data: inline }, index) => ({
        title,
        url,
        index,
        data: inline ?? (tabQueries[index]?.isSuccess ? (tabQueries[index].data?.data?.[0]?.data ?? []) : undefined),
    }))

    // Reorder tabs: leaderboard tabs first, then "You" (summary) tab last
    const reorderedTabs = useMemo(() => {
        const leaderboardTabs = tabsData.filter((item) =>
            item.url.includes('leaderboard')
        )
        const summaryTabs = tabsData.filter(
            (item) => !item.url.includes('leaderboard')
        )
        return [...leaderboardTabs, ...summaryTabs]
    }, [tabsData])

    const preparedTabs = reorderedTabs.map((item) => ({
        ...item,
        key: item.url,
        content: item.url.includes('leaderboard') ? (
            item.data ? (
                <ReputationLeaderboard data={item.data} />
            ) : (
                <View className="h-12">
                    <Loading />
                </View>
            )
        ) : item.data ? (
            <ReputationSummary data={item.data} />
        ) : (
            <View className="h-12">
                <Loading />
            </View>
        ),
    }))

    return (
        <Tabs
            equalWidth
            tabs={preparedTabs}
            size="sm"
            activeTab={reorderedTabs[0]?.url}
        />
    )
}

function ReputationSummarySimple({ data }) {
    const { t } = useTranslation()
    const [isModal, setIsModal] = useState(false)
    const [isModal2, setIsModal2] = useState(false)
    return (
        <View className="w-full">
            <Modal
                scrollable
                title={t('Score rules')}
                onVisible={isModal}
                onClose={() => setIsModal(false)}
            >
                <View className="w-full lg:min-w-md">
                    <ReputationActions data={data.actions_list} />
                </View>
            </Modal>
            <Modal
                scrollable
                title={t('Levels')}
                onVisible={isModal2}
                onClose={() => setIsModal2(false)}
            >
                <View className="w-full lg:min-w-md">
                    <ReputationLevels data={data.levels_list} />
                </View>
            </Modal>
            <View className="flex-auto flex-row gap-3 p-4 w-full ">
                <Profile
                    {...data.author_data}
                    displayType="unit_wo_info"
                    displaySize="xl"
                />

                <View className="flex-auto gap-0.5 justify-center">
                    <Text className="font-semibold text-lg text-foreground">
                        {data.author_data.display_name}
                    </Text>
                    {data.levels.map((item, index) => (
                        <View
                            key={index}
                            className="flex-row gap-3 items-center"
                        >
                            <Badge
                                variant="secondary"
                                data={{ text: item.title, icon: item.icon }}
                            />

                            <Button
                                variant="text"
                                rounded
                                size="xs"
                                startDecorator="ListPlus"
                                onPress={() => setIsModal2(true)}
                            />
                            <Button
                                variant="text"
                                rounded
                                size="xs"
                                startDecorator="Info"
                                onPress={() => setIsModal(true)}
                            />
                        </View>
                    ))}
                </View>
            </View>
            <View className="flex-row gap-3 flex-auto flex-wrap px-2">
                <View className="flex-1   border border-border/60 rounded-xl px-4 py-3">
                    <Text className="text-sm text-muted-foreground mb-1">
                        Total
                    </Text>
                    <Text className="text-2xl font-bold text-foreground">
                        {data.points || 0}
                    </Text>
                </View>
                <View className="flex-1  border border-border/60 rounded-xl px-4 py-3">
                    <Text className="text-sm text-muted-foreground mb-1">
                        7 Days
                    </Text>
                    <Text className="text-2xl font-bold text-foreground">
                        {data.points_7d || 0}
                    </Text>
                </View>
                <View className="flex-1   border border-border/60 rounded-xl px-4 py-3">
                    <Text className="text-sm text-muted-foreground mb-1">
                        30 Days
                    </Text>
                    <Text className="text-2xl font-bold text-foreground">
                        {data.points_30d || 0}
                    </Text>
                </View>
            </View>
        </View>
    )
}

const getPositionColors = (index) => {
    switch (index) {
        case 1:
            return 'bg-yellow-500' // Gold for 1st place
        case 2:
            return 'bg-secondary-foreground' // Silver for 2nd place
        case 3:
            return 'bg-amber-600' // Bronze for 3rd place
        default:
            return 'bg-transparent border border-border/60'
    }
}

const getStarColor = (index) => {
    switch (index) {
        case 1:
            return '#EAB308' // Gold
        case 2:
            return '#9CA3AF' // Silver
        case 3:
            return '#D97706' // Bronze
        default:
            return 'transparent'
    }
}

const getTextColor = (index) => {
    return index <= 3 ? 'text-white' : 'text-muted-foreground'
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

export function ReputationLeaderboard({ data }) {
    const { t } = useTranslation()
    const formProps = data?.filter_form
        ? { ...data?.filter_form, layout: 'hor', name: 'reputaion_filter_form' }
        : null
    if (formProps?.data?.inputs?.days) {
        formProps.data.inputs.days.mode = 'buttons'
        formProps.data.inputs.days.caption = ''
    }
    if (formProps?.data?.inputs?.username) {
        formProps.data.inputs.username.placeholder = t('Search by name')
        formProps.data.inputs.username.caption = ''
    }

    // Filtered list: the latest search wins even if an older response lands later;
    // the previous result stays on screen while the next one loads.
    const [searchUrl, setSearchUrl] = useState(null)
    const { data: searchResponse } = useFetch(searchUrl, { keepPreviousData: true })
    const profilesList = (searchUrl && searchResponse?.data?.profiles) || data.profiles

    const onFormChange = useCallback((values) => {
        const transformedValues = Object.fromEntries(
            Object.entries(values).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join(',') : value,
            ])
        )
        setSearchUrl(data?.request_url + JSON.stringify(transformedValues))
    }, [])

    const searchForm = useMemo(
        () => formProps ? renderForm(formProps, onFormChange) : null,
        [formProps, onFormChange]
    )

    return (
        <>
            {!!searchForm && (
                <View className="mb-8 max-w-xl mx-auto w-full">
                    {searchForm}
                </View>
            )}
            <View className="items-center w-full flex-col gap-3 p-3 max-w-xl mx-auto">
                {profilesList.map((item, index) => (
                    <Row
                        className="w-full justify-between items-center "
                        key={index}
                    >
                        <Row className="items-center gap-2 ">
                            {item.position > 0 && (
                                <View className="w-7 h-7 items-center justify-center relative">
                                    {item.position <= 3 ? (
                                        <>
                                            <StarIcon
                                                color={getStarColor(
                                                    item.position
                                                )}
                                                size={28}
                                            />
                                            <Text
                                                className={`${getTextColor(
                                                    item.position
                                                )} text-xs font-bold absolute`}
                                            >
                                                {item.position}
                                            </Text>
                                        </>
                                    ) : (
                                        <View
                                            className={`w-6 h-6 rounded-full ${getPositionColors(
                                                item.position
                                            )} items-center justify-center`}
                                        >
                                            <Text
                                                className={`${getTextColor(
                                                    item.position
                                                )} text-sm font-bold absolute`}
                                            >
                                                {item.position}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                           
                                <Row className="items-center gap-2">
                            <Profile
                                {...item.unit}
                                displayType="unit_wo_info"
                                displaySize="sm"
                            />
                            <Text className="text-sm text-muted-foreground">
                              {item.unit.display_name}
                            </Text>
                            </Row>
                           
                        </Row>
                        <View>
                        <Text className=" text-base font-bold text-muted-foreground">
                            {item.sign}
                            {item.points}
                        </Text>
                        </View>
                    </Row>
                ))}
            </View>
        </>
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
                    <TableHead className="flex-3">
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
                        <TableCell className="flex-3">
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
