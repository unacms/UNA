import { useState, useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { FeedbackHaptics, tp, formatDateInterval } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { CardList } from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import { getUnitMenuItems } from 'app/functions';
import { Skeleton } from 'app/ui/atoms/skeleton';

export default function Unit(props) {
    const data = props.data;
    const redirectdRef = useRef();
    const { t } = useTranslation();

    const handleClick = (event, sUrl) => {
        event.preventDefault();
        redirectdRef.current.redirect(sUrl);
    };


    const friendsLabel = data.followers_count > 0 ? tp("intrested", data?.followers_count) : ''
    const friendsLabel1 = data.members_count > 0 ? tp("going", data?.followers_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    const isSkeleton = data?.skeleton;

    return (
        <CardList padding="p-1">
            <Redirect ref={redirectdRef} />
            <Link className="web:group" href={data.url}>
                <View className="flex-row sm:flex-col">
                    <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-lg overflow-hidden items-center justify-center bg-neutral-500/20">
                        <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                            <Image
                                {...data.cover}
                                alt={data.title}
                                view="cover"
                                className="absolute u-cover rounded-xl"
                                sizes='auto'
                            />
                        </Skeleton>
                    </View>
                    <View className="flex-col p-3  flex-auto items-between justify-between ">
                        <View>
                            <Skeleton visible={isSkeleton} className="h-3 w-1/2">
                                {data.date_start && (
                                    <Text className="text-muted-foreground text-xs uppercase font-semibold tracking-tight mb-1">
                                        {formatDateInterval(data.date_start, data.date_end, t)}
                                    </Text>

                                )}
                            </Skeleton>
                            <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                                <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">
                                    {data.title}
                                </Text>
                            </Skeleton>
                            <Row className="items-center h-6 my-3 justify-between">
                                <Skeleton preset='profile-list' visible={isSkeleton}>
                                    <View className="mr-2  h-6">
                                        <ProfilesList
                                            data={
                                                data.followers_list
                                            }
                                            showEmpty={false}
                                            maxCount={3}
                                            displaySize="xs"
                                        />

                                    </View>
                                    {
                                        <><Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                            {friendsLabel}
                                        </Text>
                                            {friendsLabel == '' && <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {friendsLabel1}
                                            </Text>
                                            }
                                        </>
                                    }
                                </Skeleton>
                                <Skeleton visible={isSkeleton} className="h-6 w-1/3">
                                    <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                        {data.visibility != "3" ? (
                                            <>Private</>
                                        ) : (
                                            <>Public</>
                                        )}
                                    </Text>
                                </Skeleton>
                            </Row>
                        </View>
                        <View className="flex-row  sm:flex-col gap-2 w-full">
                            <Skeleton className='h-9 w-full' rounded='rounded-lg' visible={isSkeleton}>
                                {oMenuItemPrimary}
                                {!!oMenuItemSecondary && (
                                    <View>{oMenuItemSecondary}</View>
                                )}
                            </Skeleton>
                        </View>
                    </View>
                </View>
            </Link>
        </CardList>
    );
}
