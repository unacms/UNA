import { useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Card, CardList } from 'app/ui/molecules/card'
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
    const { t } = useTranslation();
    const data = props.data;
    const redirectdRef = useRef();

    if (data?.skeleton) {
        return <UnitWrapper />
    }

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
            return getBase();
        default:
            return getBase();
    }

    function getBase() {
        return (
            <UnitWrapper>
                <Redirect ref={redirectdRef} />
                <Link className="web:group" href={data.url}>
                    <View className="relative bg-muted aspect-video overflow-hidden rounded-lg w-full">
                        <Image
                            {...data.cover}
                            alt={data.title}
                            view="cover"
                            className="absolute u-cover"
                            sizes='auto'
                        />

                    </View>
                    <View className="flex-col flex-auto justify-between">
                        <View className="">
                        <Text numberOfLines={2} className="text-card-foreground tracking-tight px-2 pt-2 web:hover:text-foreground web:hover:underline leading-tight font-semibold">

                                {data.title}
                            </Text>
                            <Row className="items-center ">


                                
                                    <ProfilesList
                                        data={
                                            data.members_list
                                        }
                                        showEmpty={false}
                                        maxCount={3}
                                        displaySize="xs"
                                    />

                                
                                {
                                    <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                        {friendsLabel}
                                    </Text>
                                }

                                <Text className=" bg-primary/10  rounded-md m-2  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                    {data.visibility != "3" ? t('Private') : t('Public')}
                                </Text>
                            </Row>
                        </View>
                        <View className="flex-row p-2 sm:flex-col  w-full">
                            {oMenuItemPrimary}
                            {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                        </View>
                    </View>
                </Link>
            </UnitWrapper>
        );
    }
}