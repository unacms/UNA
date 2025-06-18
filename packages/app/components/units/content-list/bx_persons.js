import { useState, useContext, useRef, useMemo, memo } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next'
import Letter from 'app/ui/atoms/letter'
import { callFn } from 'app/lib/functions/call'
import { Platform } from 'react-native'

const ProfilesListCnt = memo(({ data }) => (
    <ProfilesList data={data} showEmpty={false} maxCount={3} displaySize="xs" />
))

function ImageSection({ data, imageSizes }) {
    const isWeb = Platform.OS == 'web'
    return (
        <View
            className={` ${
                isWeb && 'h-32 sm:h-auto'
            } aspect-square sm:w-full rounded-xl overflow-hidden items-center bg-bgritem dark:bg-bgritem-d justify-center`}
        >
            <Image
                src={data?.image?.src}
                alt={data.title}
                view="cover"
                className="absolute u-cover rounded-xl"
                sizes={imageSizes}
            />
            {!data?.image?.src && (
                <Letter title={data.fullname} id={data.author_data.id} />
            )}
        </View>
    )
}

export default function Unit(props) {
    const { t } = useTranslation()
    const data = props.data
    const imageSizes = getImageSizes()
    const redirectdRef = useRef()
    const { cardData } = useCardData()

    const friendsLabel =
        data.mutual_friends_count > 0
            ? tp('mutual_friends', data?.mutual_friends_count, false)
            : tp('friends', data?.friends_count, false)

    const handleClick = (event, sUrl) => {
        event.preventDefault()
        redirectdRef.current.redirect(sUrl)
    }

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return callFn('getUnitMenuItems', [
            props.unitType,
            data,
            handleClick,
            t,
            props.module,
        ])
    }, [props.unitType, data, handleClick, t])

    const isFollowers =
        props.unitType == 'person_followers' ||
        props.unitType == 'person_following' ||
        props.unitType == 'person_following_recommendations'
            ? true
            : false

    if (cardData?.hidden && props.unitType == 'person_friends_recommendations')
        return

    return (
        <>
            <Redirect ref={redirectdRef} />
            <Card
                margin="sm:mx-[6px] sm:mt-[12px]"
                border="border-b sm:border border-bdrcard dark:border-bdrcard-d  "
                rounded=" sm:rounded-2xl "
            >
                <Link className="group " href={data.url}>
                    <View
                        className={`flex-row sm:flex-col p-3 sm:p-1  sm:h-full`}
                    >
                        <ImageSection data={data} imageSizes={imageSizes} />
                        <View className="flex-col pl-[16px] my-auto sm:pt-[8px] sm:p-[4px] flex-auto ">
                            <View className="gap-y-[12px] h-[56px]">
                                <Text
                                    numberOfLines={1}
                                    className=" text-[16px] tracking-tight tracking-tight font-semibold text-neutral-800 dark:text-neutral-200"
                                >
                                    {data.title}
                                </Text>

                                <Row className="items-center gap-x-1 ">
                                    <ProfilesListCnt
                                        data={
                                            isFollowers
                                                ? data.followers_list
                                                : data.mutual_friends_count > 0
                                                ? data.mutual_friends_list
                                                : data.friends_list
                                        }
                                    />

                                    <Text className="truncate text-[14px] tracking-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                        {isFollowers
                                            ? data?.followers_count +
                                              ' followers'
                                            : friendsLabel}
                                    </Text>
                                </Row>
                            </View>
                            <View className="flex-row sm:flex-col pt-3">
                                <View className="w-1/2 sm:w-full pr-2 sm:pr-0">
                                    {oMenuItemPrimary}
                                </View>
                                {!!oMenuItemSecondary && (
                                    <View
                                        className={`w-1/2 sm:w-auto ${
                                            !!oMenuItemPrimary && 'sm:mt-2'
                                        }`}
                                    >
                                        {oMenuItemSecondary}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </Link>
            </Card>
        </>
    )
}
