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

function UnitWrapper({ children }) {
    return (
         <CardList padding="p-1">
            {children ? children : (
                <>
                    <View className="relative  bg-muted aspect-video rounded-xl w-full"></View>
                    <View className=" p-1.5 flex-auto justify-between gap-1.5">
                        <View className=" h-5 w-3/4 bg-muted rounded-full"></View>
                        <View className=" h-5 w-1/2 bg-muted rounded-full"></View>
                    </View>
                </>
            )}
        </CardList>
    )
}

export default function Unit(props) {
    const data = props.data;
    const redirectdRef = useRef();
    const { t } = useTranslation();

    
    if (data?.skeleton){
        return <UnitWrapper/>
    }


    const handleClick = (event, sUrl) => {
        event.preventDefault();
        redirectdRef.current.redirect(sUrl);
    };


    const friendsLabel = data.followers_count > 0 ? tp("intrested", data?.followers_count) : ''
    const friendsLabel1 = data.members_count > 0 ? tp("going", data?.followers_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    return (

        <UnitWrapper padding="p-1">
            <Redirect ref={redirectdRef} />
            <Link className="web:group" href={data.url}>
                <View className="flex-row sm:flex-col">
                    <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center bg-neutral-500/20">
                        <Image
                            {...data.cover}
                            alt={data.title}
                            view="cover"
                            className="absolute u-cover rounded-xl"
                            sizes='auto'
                        />
                    </View>
                    <View className="flex-col p-3  flex-auto items-between justify-between ">
                        <View>
                            <Text
                                numberOfLines={1}
                                className=" text-lg leading-tight tracking-tight font-bold text-secondary-foreground web:group-hover:text-foreground "
                            >
                                {data.title}
                            </Text>
                            <Row className="items-center h-6 my-3">


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

                                <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                    {data.visibility != "3" ? (
                                        <>Private</>
                                    ) : (
                                        <>Public</>
                                    )}
                                </Text>
                            </Row>

                            <Row className='mb-3 w-full bg-primary/30 px-2 py-1 rounded-md justify-between'>

                                {data.date_start && (
                                    <Text className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase font-semibold tracking-tight overflow-hidden  rounded-md flex-none items-center">
                                        {formatDateInterval(data.date_start, data.date_end, t)}
                                    </Text>

                                )}


                            </Row>
                        </View>
                        <View className="flex-row  sm:flex-col  w-full">
                            {oMenuItemPrimary}
                            {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                        </View>
                    </View>
                </View>
            </Link>
        </UnitWrapper>

    );
}
