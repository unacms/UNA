import { useState, useMemo, useRef } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, FeedbackHaptics, tp, t } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import Letter from 'app/ui/atoms/letter'
import { callFn } from 'app/lib/functions/call';

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();
    const { cardData } = useCardData();
    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };
    
    const friendsLabel =
        data.mutual_friends_count > 0
            ? tp("mutual_friends", data?.mutual_friends_count, false)
            : tp("friends", data?.friends_count, false);

    if (
        !!cardData?.hidden &&
        props.unitType == "person_friends_recommendations"
    )
        return;

        const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
            return callFn("getUnitMenuItems", [props.unitType, data, handleClick, t, props.module]);
        }, [props.unitType, data, handleClick, t]);
        

    return (
        <>
            <Redirect ref={redirectdRef} />
            <Card margin="sm:mx-2 mb-2 " rounded="rounded-2xl">
                <Link className="group " href={data.url}>
                    <View className="flex-row sm:flex-col p-1">
                        <View className="aspect-square w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center">
                            <Image
                                src={data?.image?.src}
                                alt={data.title}
                                view="cover"
                                className="absolute u-cover rounded-xl"
                                sizes={imageSizes}
                            />
                            {!data?.cover?.src && <Letter title={data.title}/>}
                        </View>
                        <View className="flex-col p-3  flex-auto items-between justify-between ">
                            <View>
                                <Text
                                    numberOfLines={1}
                                    className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                                >
                                    {data.title}
                                </Text>
                                <Row className="items-center h-6 my-3">
                                    {props.unitType == "person_followers" ||
                                        props.unitType == "person_following" ||
                                        props.unitType ==
                                        "person_following_recommendations" ? (
                                        <>
                                            <View className="mr-2">
                                                <ProfilesList
                                                    data={data.followers_list}
                                                    showEmpty={false}
                                                    maxCount={3}
                                                    displaySize="xs"
                                                />
                                            </View>
                                            <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {data?.followers_count +
                                                    " followers"}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <View className="mr-2 h-6">
                                                {data.mutual_friends_count > 0 ? (
                                                    <ProfilesList
                                                        data={
                                                            data.mutual_friends_list
                                                        }
                                                        showEmpty={false}
                                                        maxCount={3}
                                                        displaySize="xs"
                                                    />
                                                ) : (
                                                    <ProfilesList
                                                        data={data.friends_list}
                                                        showEmpty={false}
                                                        maxCount={3}
                                                        displaySize="xs"
                                                    />
                                                )}

                                            </View>
                                            {
                                                <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                    {friendsLabel}
                                                </Text>
                                            }
                                        </>
                                    )}
                                </Row>
                            </View>
                            <View className="flex-row gap-x-2 sm:flex-col  w-full  justify-end">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2'}`}>{oMenuItemSecondary}</View>}
                                </View>
                        </View>
                    </View>
                </Link>
            </Card>
        </>
    );
}
