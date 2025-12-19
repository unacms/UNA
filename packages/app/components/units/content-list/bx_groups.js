import { useState, useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, FeedbackHaptics, tp, t } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Card, CardList } from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import { getUnitMenuItems } from 'app/functions';

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();

    const handleClick = (event, sUrl) => {
        event.preventDefault();
        redirectdRef.current.redirect(sUrl);
    };

    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    switch (props.unitType) {
        case 'search':
            return getBase();
        case 'list':
            return getList();
        default:
            return getBase();
    }


    function getList() {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <CardList padding="p-1" className='mb-2'>
                    <Link className="group " href={data.url}>
                        
                            <View className="aspect-square w-1/3 rounded-xl overflow-hidden items-center justify-center bg-neutral-500/20">
                                <Image
                                    {...data.cover}
                                    alt={data.title}
                                    view="cover"
                                    className="absolute u-cover rounded-xl"
                                    sizes={imageSizes}
                                />

                            </View>
                            <View className="flex-col p-2  flex-auto items-between justify-between ">
                                <View>
                                    <Text
                                        numberOfLines={1}
                                        className=" text-base leading-tight tracking-tight font-bold text-secondary-foreground group-hover:text-foreground "
                                    >
                                        {data.title}
                                    </Text>
                                    <Row className="items-center ">


                                        <View className="mr-2 h-5">
                                            <ProfilesList
                                                data={
                                                    data.members_list
                                                }
                                                showEmpty={false}
                                                maxCount={3}
                                                displaySize="xs"
                                            />

                                        </View>
                                        {
                                            <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {friendsLabel}
                                            </Text>
                                        }

                                        <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                            {data.visibility != "3" ? t('Private') : t('Public')}
                                        </Text>
                                    </Row>
                                </View>
                                <View className="flex-row  sm:flex-col  w-full">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                                </View>
                            </View>
                       
                    </Link>
                </CardList>
            </>
        );
    }

    function getBase() {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <Link className="group" href={data.url}>
                <Card padding="p-1" className='flex-auto'>
                    
                            <View className="relative bg-muted aspect-video overflow-hidden rounded-xl w-full">
                                <Image
                                    {...data.cover}
                                    alt={data.title}
                                    view="cover"
                                    className="absolute u-cover"
                                    sizes={imageSizes}
                                />

                            </View>
                            <View className="flex-col h-32 p-2 flex-auto justify-between">
                                <View className="">
                                    <Text
                                        numberOfLines={2}
                                        className=" text-base leading-tight tracking-tight font-bold text-secondary-foreground group-hover:text-foreground "
                                    >
                                        {data.title}
                                    </Text>
                                    <Row className="items-center h-6 pt-3">


                                        <View className="mr-2 h-5">
                                            <ProfilesList
                                                data={
                                                    data.members_list
                                                }
                                                showEmpty={false}
                                                maxCount={3}
                                                displaySize="xs"
                                            />

                                        </View>
                                        {
                                            <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {friendsLabel}
                                            </Text>
                                        }

                                        <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                            {data.visibility != "3" ? t('Private') : t('Public')}
                                        </Text>
                                    </Row>
                                </View>
                                <View className="flex-row  sm:flex-col  w-full">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                                </View>
                            </View>
                    
                </Card></Link>
            </>
        );
    }
}