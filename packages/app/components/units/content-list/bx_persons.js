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
import { getUnitMenuItems } from 'app/customization/functions'
import { Platform } from 'react-native'
import { Skeleton } from 'app/ui/atoms/skeleton';

const ProfilesListCnt = memo(({ data }) => (
    <ProfilesList data={data} showEmpty={false} maxCount={3} displaySize="2xs" />
))

function ImageSection({ data }) {
    const isWeb = Platform.OS == 'web'
    return (
        <View
            className={` ${isWeb && 'h-28 sm:h-auto'} aspect-square sm:w-full rounded-lg overflow-hidden items-center bg-muted justify-center`}
        >
            <Image
                src={data?.image?.src}
                alt={data.title}
                view="cover"
                className="absolute u-cover rounded-xl"
                sizes='auto'
            />
            {!data?.image?.src && (
                <Letter title={data?.fullname} id={data?.author_data?.id} />
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

    const isSkeleton = data?.skeleton;

    return (
        <CardList className="sm:border border-border/60" padding="p-1">
            <Redirect ref={redirectdRef} />
            <Link className="web:group " href={data.url}>
                <View className="flex-row sm:flex-col gap-1">
                    <Skeleton className="h-28 sm:h-auto aspect-square sm:w-full" rounded='rounded-lg' visible={isSkeleton}>
                        <ImageSection data={data} />
                    </Skeleton>

                    {!!oMenuItemDelete && <View className="absolute right-1 top-1">{oMenuItemDelete}</View>}
                    <View className="flex-col p-2 justify-between gap-2 flex-auto ">
                        <View className="gap-2 h-12">
                            <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                                <Text numberOfLines={1} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-5 font-semibold">
                                    {data.title}
                                </Text>
                            </Skeleton>
                            <Row className="items-center gap-1 h-5">
                                <Skeleton preset='profile-list' visible={isSkeleton}>
                                    <><ProfilesListCnt
                                        data={
                                            isFollowers
                                                ? data.followers_list
                                                : data.mutual_friends_count > 0
                                                    ? data.mutual_friends_list
                                                    : data.friends_list
                                        }
                                    /><Text className="truncate text-sm  tracking-tight flex-auto text-secondary-foreground">
                                            {isFollowers
                                                ? data?.followers_count +
                                                ' followers'
                                                : friendsLabel}
                                        </Text></>
                                </Skeleton>
                            </Row>
                        </View>
                        <View className="flex-row sm:flex-col gap-2">
                            <View className="w-full">
                                <Skeleton className='h-9 w-full' rounded='rounded-lg' visible={isSkeleton}>
                                    {oMenuItemPrimary}
                                </Skeleton>
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