import { useRef, useMemo, memo } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { CardList } from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next'
import Letter from 'app/ui/atoms/letter'
import { getUnitMenuItems } from 'app/functions'
import { Platform } from 'react-native'

const ProfilesListCnt = memo(({ data }) => (
    <ProfilesList data={data} showEmpty={false} maxCount={3} displaySize="2xs" />
))

function ImageSection({ data, imageSizes }) {
    const isWeb = Platform.OS == 'web'
    return (
        <View
            className={` ${isWeb && 'h-28 sm:h-auto'} aspect-square sm:w-full rounded-xl overflow-hidden items-center bg-muted justify-center`}
        >
            <Image
                src={data?.image?.src}
                alt={data.title}
                view="cover"
                className="absolute u-cover rounded-xl"
                sizes='auto'
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

    const { oMenuItemPrimary, oMenuItemSecondary, oMenuItemDelete } = useMemo(() => {
        return getUnitMenuItems(
            props.unitType,
            data,
            handleClick,
            t,
            props.module,
        )
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
        <CardList padding="p-1.5 mb-px sm:m-1.5" className="rounded-none @sm:rounded-2xl shadow-sm  ">
            <Redirect ref={redirectdRef} />
            <Link className="web:group " href={data.url}>
                <View className="flex-row sm:flex-col p-1.5 sm:p-0 sm:h-full">
                    <ImageSection data={data} />
                    {!!oMenuItemDelete && <View className="absolute right-1 top-1">{oMenuItemDelete}</View>}
                    <View className="flex-col pl-4 my-auto sm:p-2 justify-between flex-auto ">
                        <View className="gap-1 p-0.5">
                            <Text
                                numberOfLines={1}
                                className=" text-base leading-6 font-semibold text-foreground"
                            >
                                {data.title}
                            </Text>

                            <Row className="items-center gap-1.5 h-6 ">
                                <ProfilesListCnt
                                    data={
                                        isFollowers
                                            ? data.followers_list
                                            : data.mutual_friends_count > 0
                                                ? data.mutual_friends_list
                                                : data.friends_list
                                    }
                                />

                                <Text className="truncate text-sm tracking-tight flex-auto text-secondary-foreground">
                                    {isFollowers
                                        ? data?.followers_count +
                                        ' followers'
                                        : friendsLabel}
                                </Text>
                            </Row>
                        </View>
                        <View className="flex-row sm:flex-col pt-2 gap-2 ">
                            <View className="w-full">
                                {oMenuItemPrimary}
                            </View>
                            {!!oMenuItemSecondary && (
                                <View
                                    className={`w-full ${!!oMenuItemPrimary && ''
                                        }`}
                                >
                                    {oMenuItemSecondary}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Link>
        </CardList>
    )
}

